import json
from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, Query, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import (
    get_db, UserDB, UserProfileDB, JobDB, JobApplicationDB, ActivityDB, NotificationDB,
    ResumeRecordDB, CodingProblemDB, CodingSubmissionDB, MockTestDB, MockTestAttemptDB,
    InterviewSessionDB, InterviewTurnDB, ConnectedAccountDB, CareerInterestSignalDB
)
from services.auth import (
    hash_password, verify_password, create_access_token,
    get_current_user, get_optional_user
)
import io
from fastapi.responses import StreamingResponse, Response
from services.catalogs import SKILLS_CATALOG, CAREER_ROLES_CATALOG
from services.location_data import INDIAN_STATES_DATA, get_indian_states, is_in_india, matches_indian_state
from services.ai_service import ai_service
from services.resume_parser import parse_resume
from services.recommendation_engine import (
    calculate_career_predictions,
    calculate_skill_gap,
    calculate_job_match,
    calculate_job_match_details
)
from services.code_executor import execute_python_code
from services.interview_service import (
    generate_first_question,
    evaluate_and_generate_next_turn,
    generate_final_interview_report
)
from services.live_jobs_service import sync_live_jobs, get_connectors_status

router = APIRouter()

# Helper: Log real user activity
def log_user_activity(db: Session, user_id: int, title: str, icon_type: str = "file"):
    act = ActivityDB(
        user_id=user_id,
        title=title,
        icon_type=icon_type,
        created_at=datetime.utcnow()
    )
    db.add(act)
    db.commit()

# Helper: Create real user notification
def send_user_notification(db: Session, user_id: int, title: str, message: str = "", icon_type: str = "bell"):
    notif = NotificationDB(
        user_id=user_id,
        title=title,
        message=message,
        icon_type=icon_type,
        is_read=False,
        created_at=datetime.utcnow()
    )
    db.add(notif)
    db.commit()

# Helper: Calculate profile strength
def compute_profile_strength(profile: UserProfileDB) -> int:
    score = 20  # Base registration score
    if profile.name: score += 10
    if profile.education and profile.education != "Not detected": score += 15
    if profile.university and profile.university != "Not detected": score += 10
    if profile.cgpa and profile.cgpa > 0: score += 10
    skills = json.loads(profile.skills) if profile.skills else []
    if len(skills) >= 3: score += 15
    if len(skills) >= 6: score += 10
    interests = json.loads(profile.interests) if profile.interests else []
    if len(interests) >= 1: score += 10
    return min(score, 100)

# -------------------------------------------------------------
# AUTH SCHEMAS & ENDPOINTS
# -------------------------------------------------------------
class RegisterSchema(BaseModel):
    username: str
    email: str
    password: str

class LoginSchema(BaseModel):
    username: str
    password: str

@router.post("/auth/register")
def register_user(data: RegisterSchema, db: Session = Depends(get_db)):
    if db.query(UserDB).filter((UserDB.username == data.username) | (UserDB.email == data.email)).first():
        raise HTTPException(status_code=400, detail="Username or email already exists.")

    hashed = hash_password(data.password)
    user = UserDB(
        username=data.username,
        email=data.email,
        hashed_password=hashed
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Initialize clean, empty profile for user
    profile = UserProfileDB(
        user_id=user.id,
        name=data.username,
        email=data.email,
        education="",
        university="",
        cgpa=0.0,
        skills="[]",
        interests="[]",
        target_role="Machine Learning Engineer"
    )
    db.add(profile)

    # Initial activity
    log_user_activity(db, user.id, f"Created CareerAI account as {user.username}", icon_type="user")
    
    token = create_access_token(user.id, user.username, user.email)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user.to_dict(),
        "profile": profile.to_dict()
    }

@router.post("/auth/login")
def login_user(data: LoginSchema, db: Session = Depends(get_db)):
    user = db.query(UserDB).filter(
        (UserDB.username == data.username) | (UserDB.email == data.username)
    ).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid username/email or password.")

    profile = db.query(UserProfileDB).filter(UserProfileDB.user_id == user.id).first()
    if not profile:
        profile = UserProfileDB(user_id=user.id, name=user.username, email=user.email)
        db.add(profile)
        db.commit()
        db.refresh(profile)

    token = create_access_token(user.id, user.username, user.email)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user.to_dict(),
        "profile": profile.to_dict()
    }

@router.get("/auth/me")
def get_current_user_profile(user: UserDB = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(UserProfileDB).filter(UserProfileDB.user_id == user.id).first()
    return {
        "user": user.to_dict(),
        "profile": profile.to_dict() if profile else {}
    }

# -------------------------------------------------------------
# CATALOGS
# -------------------------------------------------------------
@router.get("/catalog/skills")
def get_skills_catalog():
    return SKILLS_CATALOG

@router.get("/catalog/roles")
def get_roles_catalog():
    return CAREER_ROLES_CATALOG

@router.get("/catalog/indian-states")
def get_indian_states_catalog():
    return {
        "country": "India",
        "states": get_indian_states()
    }

# -------------------------------------------------------------
# USER PROFILE & SKILLS/INTERESTS MANAGEMENT
# -------------------------------------------------------------
class ProfileUpdateSchema(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    education: Optional[str] = None
    university: Optional[str] = None
    cgpa: Optional[float] = None
    graduation_year: Optional[int] = None
    target_role: Optional[str] = None
    skills: Optional[List[str]] = None
    interests: Optional[List[str]] = None
    experience_years: Optional[float] = None
    experience_summary: Optional[str] = None
    bio: Optional[str] = None

class SkillActionSchema(BaseModel):
    skill: str

class InterestActionSchema(BaseModel):
    interest: str

@router.get("/profile")
def get_profile(user: UserDB = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(UserProfileDB).filter(UserProfileDB.user_id == user.id).first()
    if not profile:
        profile = UserProfileDB(user_id=user.id, name=user.username, email=user.email)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    
    p_dict = profile.to_dict()
    p_dict["profile_strength"] = compute_profile_strength(profile)
    return p_dict

@router.put("/profile")
def update_profile(data: ProfileUpdateSchema, user: UserDB = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(UserProfileDB).filter(UserProfileDB.user_id == user.id).first()
    if not profile:
        profile = UserProfileDB(user_id=user.id)
        db.add(profile)

    if data.name is not None: profile.name = data.name
    if data.email is not None: profile.email = data.email
    if data.phone is not None: profile.phone = data.phone
    if data.location is not None: profile.location = data.location
    if data.education is not None: profile.education = data.education
    if data.university is not None: profile.university = data.university
    if data.cgpa is not None: profile.cgpa = data.cgpa
    if data.graduation_year is not None: profile.graduation_year = data.graduation_year
    if data.target_role is not None: profile.target_role = data.target_role
    if data.skills is not None: profile.skills = json.dumps(list(dict.fromkeys(data.skills)))
    if data.interests is not None: profile.interests = json.dumps(list(dict.fromkeys(data.interests)))
    if data.experience_years is not None: profile.experience_years = data.experience_years
    if data.experience_summary is not None: profile.experience_summary = data.experience_summary
    if data.bio is not None: profile.bio = data.bio

    profile.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(profile)

    log_user_activity(db, user.id, "Profile details updated", icon_type="user")
    send_user_notification(db, user.id, "Profile Updated", "Your profile credentials and target role were saved successfully.", icon_type="user")
    p_dict = profile.to_dict()
    p_dict["profile_strength"] = compute_profile_strength(profile)
    return p_dict

from fastapi import Request

@router.post("/profile/photo")
async def upload_profile_photo(
    request: Request,
    user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(UserProfileDB).filter(UserProfileDB.user_id == user.id).first()
    if not profile:
        profile = UserProfileDB(user_id=user.id)
        db.add(profile)

    photo_url = ""
    content_type = request.headers.get("content-type", "")

    if "application/json" in content_type:
        try:
            body = await request.json()
            photo_url = body.get("photo_data", "")
        except Exception:
            photo_url = ""
    else:
        try:
            form = await request.form()
            if "file" in form and hasattr(form["file"], "read"):
                file = form["file"]
                import base64
                contents = await file.read()
                b64 = base64.b64encode(contents).decode("utf-8")
                c_type = getattr(file, "content_type", None) or "image/png"
                photo_url = f"data:{c_type};base64,{b64}"
            elif "photo_data" in form:
                photo_url = str(form["photo_data"])
        except Exception:
            photo_url = ""

    if not photo_url:
        raise HTTPException(status_code=400, detail="No photo provided. Upload an image file or base64 data.")

    profile.avatar_url = photo_url
    profile.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(profile)

    log_user_activity(db, user.id, "Updated profile photo", icon_type="user")
    send_user_notification(db, user.id, "Profile Photo Updated", "Your profile photo is now visible across the application.", icon_type="user")

    p_dict = profile.to_dict()
    p_dict["profile_strength"] = compute_profile_strength(profile)
    return p_dict

@router.delete("/profile/photo")
def delete_profile_photo(user: UserDB = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(UserProfileDB).filter(UserProfileDB.user_id == user.id).first()
    if profile:
        profile.avatar_url = ""
        profile.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(profile)
        log_user_activity(db, user.id, "Removed profile photo", icon_type="user")
        send_user_notification(db, user.id, "Profile Photo Removed", "Your profile photo was reset to default initials avatar.", icon_type="user")

    p_dict = profile.to_dict() if profile else {}
    p_dict["profile_strength"] = compute_profile_strength(profile) if profile else 20
    return p_dict

@router.post("/profile/skills/add")
def add_skill_to_profile(data: SkillActionSchema, user: UserDB = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(UserProfileDB).filter(UserProfileDB.user_id == user.id).first()
    if not profile:
        profile = UserProfileDB(user_id=user.id)
        db.add(profile)

    current_skills = json.loads(profile.skills) if profile.skills else []
    if data.skill not in current_skills:
        current_skills.append(data.skill)
        profile.skills = json.dumps(current_skills)
        profile.updated_at = datetime.utcnow()
        db.commit()
        log_user_activity(db, user.id, f"Added {data.skill} to technical skills", icon_type="zap")
        send_user_notification(db, user.id, "Skill Added", f"Added {data.skill} to your technical skill matrix.", icon_type="zap")

    p_dict = profile.to_dict()
    p_dict["profile_strength"] = compute_profile_strength(profile)
    return p_dict

@router.post("/profile/skills/remove")
def remove_skill_from_profile(data: SkillActionSchema, user: UserDB = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(UserProfileDB).filter(UserProfileDB.user_id == user.id).first()
    if profile:
        current_skills = json.loads(profile.skills) if profile.skills else []
        if data.skill in current_skills:
            current_skills.remove(data.skill)
            profile.skills = json.dumps(current_skills)
            profile.updated_at = datetime.utcnow()
            db.commit()
            log_user_activity(db, user.id, f"Removed {data.skill} from technical skills", icon_type="zap")
            send_user_notification(db, user.id, "Skill Removed", f"Removed {data.skill} from your skills profile.", icon_type="zap")

    p_dict = profile.to_dict() if profile else {}
    p_dict["profile_strength"] = compute_profile_strength(profile)
    return p_dict

@router.post("/profile/interests/add")
def add_interest_to_profile(data: InterestActionSchema, user: UserDB = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(UserProfileDB).filter(UserProfileDB.user_id == user.id).first()
    if not profile:
        profile = UserProfileDB(user_id=user.id)
        db.add(profile)

    current_int = json.loads(profile.interests) if profile.interests else []
    if data.interest not in current_int:
        current_int.append(data.interest)
        profile.interests = json.dumps(current_int)
        profile.updated_at = datetime.utcnow()
        db.commit()
        log_user_activity(db, user.id, f"Added {data.interest} to career interests", icon_type="target")
        send_user_notification(db, user.id, "Career Interest Added", f"Added {data.interest} to your career preferences.", icon_type="target")

    p_dict = profile.to_dict()
    p_dict["profile_strength"] = compute_profile_strength(profile)
    return p_dict

@router.post("/profile/interests/remove")
def remove_interest_from_profile(data: InterestActionSchema, user: UserDB = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(UserProfileDB).filter(UserProfileDB.user_id == user.id).first()
    if profile:
        current_int = json.loads(profile.interests) if profile.interests else []
        if data.interest in current_int:
            current_int.remove(data.interest)
            profile.interests = json.dumps(current_int)
            profile.updated_at = datetime.utcnow()
            db.commit()
            log_user_activity(db, user.id, f"Removed {data.interest} from career interests", icon_type="target")
            send_user_notification(db, user.id, "Career Interest Removed", f"Removed {data.interest} from your preferences.", icon_type="target")

    p_dict = profile.to_dict() if profile else {}
    p_dict["profile_strength"] = compute_profile_strength(profile)
    return p_dict

# -------------------------------------------------------------
# DASHBOARD STATS & DYNAMIC ACTIVITY
# -------------------------------------------------------------
@router.get("/dashboard/stats")
def get_dashboard_stats(user: UserDB = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(UserProfileDB).filter(UserProfileDB.user_id == user.id).first()
    skills = json.loads(profile.skills) if (profile and profile.skills) else []
    interests = json.loads(profile.interests) if (profile and profile.interests) else []
    exp_years = profile.experience_years if profile else 0.0

    # Augment skills and interests with detected signals from Career Radar (Google, YouTube, GitHub)
    radar_signals = db.query(CareerInterestSignalDB).filter(CareerInterestSignalDB.user_id == user.id).all()
    signal_values = [s.signal_value for s in radar_signals if s.signal_value]
    effective_skills = list(dict.fromkeys(skills + signal_values))
    effective_interests = list(dict.fromkeys(interests + signal_values))

    # Dynamic predictions
    predictions = calculate_career_predictions(effective_skills, exp_years, effective_interests, profile.education if profile else "")
    top_pred = predictions[0] if predictions else None
    secondary = predictions[1:3] if len(predictions) > 1 else []

    # Application counts for this user
    apps = db.query(JobApplicationDB).filter(JobApplicationDB.user_id == user.id).all()
    total_apps = len(apps)
    in_progress = sum(1 for a in apps if a.status in ["Applied", "Interview", "Shortlisted"])

    # Recent activities for this user
    activities = db.query(ActivityDB).filter(
        ActivityDB.user_id == user.id
    ).order_by(ActivityDB.created_at.desc()).limit(10).all()

    # Skill match score for top target role
    target_role_id = profile.target_role if (profile and profile.target_role) else "ml-engineer"
    gap_info = calculate_skill_gap(target_role_id, effective_skills)

    return {
        "profile_strength": compute_profile_strength(profile) if profile else 20,
        "predicted_career": top_pred["title"] if top_pred else "Software Engineer",
        "predicted_match": top_pred["match"] if top_pred else 50,
        "skill_match_overall": gap_info["readiness_score"],
        "total_applications": total_apps,
        "in_progress_applications": in_progress,
        "top_career": top_pred,
        "secondary_careers": secondary,
        "recent_activities": [a.to_dict() for a in activities]
    }

# -------------------------------------------------------------
# RESUME ANALYZER (GENUINE PARSING)
# -------------------------------------------------------------
@router.post("/resume/upload")
async def upload_resume(file: UploadFile = File(...), user: UserDB = Depends(get_current_user), db: Session = Depends(get_db)):
    contents = await file.read()
    parsed = parse_resume(contents, file.filename)

    # Save to ResumeRecordDB
    rec = ResumeRecordDB(
        user_id=user.id,
        filename=file.filename,
        raw_text=parsed["raw_text"],
        extracted_data=json.dumps({
            "skills": parsed["skills"],
            "education": parsed["education"],
            "university": parsed["university"],
            "cgpa": parsed["cgpa"],
            "graduation_year": parsed["graduation_year"],
            "experience_years": parsed["experience_years"]
        })
    )
    db.add(rec)

    # Update profile
    profile = db.query(UserProfileDB).filter(UserProfileDB.user_id == user.id).first()
    if profile:
        current_skills = json.loads(profile.skills) if profile.skills else []
        # Merge new extracted skills with existing
        merged_skills = list(dict.fromkeys(current_skills + parsed["skills"]))
        profile.skills = json.dumps(merged_skills)
        profile.experience_summary = parsed["experience_summary"]
        profile.experience_years = parsed["experience_years"]
        if parsed.get("education") and parsed["education"] != "Not detected":
            profile.education = parsed["education"]
        if parsed.get("university") and parsed["university"] != "Not detected":
            profile.university = parsed["university"]
        if parsed.get("cgpa") and parsed["cgpa"] > 0:
            profile.cgpa = parsed["cgpa"]
        if parsed.get("graduation_year"):
            profile.graduation_year = parsed["graduation_year"]
        profile.updated_at = datetime.utcnow()

    log_user_activity(db, user.id, f"Resume analyzed ({file.filename})", icon_type="file")
    send_user_notification(
        db, user.id,
        "Resume Analyzed & Synced",
        f"Parsed {file.filename} with {len(parsed['skills'])} skills detected.",
        icon_type="file"
    )
    db.commit()

    return {
        "filename": file.filename,
        "extracted_skills": parsed["skills"],
        "education": parsed["education"],
        "university": parsed["university"],
        "cgpa": parsed["cgpa"],
        "graduation_year": parsed["graduation_year"],
        "experience_years": parsed["experience_years"],
        "experience_summary": parsed["experience_summary"]
    }

# -------------------------------------------------------------
# CAREER PREDICTIONS & SKILL GAP
# -------------------------------------------------------------
@router.get("/career/predictions")
def get_career_predictions(user: UserDB = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(UserProfileDB).filter(UserProfileDB.user_id == user.id).first()
    skills = json.loads(profile.skills) if (profile and profile.skills) else []
    interests = json.loads(profile.interests) if (profile and profile.interests) else []
    exp_years = profile.experience_years if profile else 0.0

    radar_signals = db.query(CareerInterestSignalDB).filter(CareerInterestSignalDB.user_id == user.id).all()
    signal_values = [s.signal_value for s in radar_signals if s.signal_value]
    effective_skills = list(dict.fromkeys(skills + signal_values))
    effective_interests = list(dict.fromkeys(interests + signal_values))

    predictions = calculate_career_predictions(effective_skills, exp_years, effective_interests, profile.education if profile else "")
    return {
        "top_match_role": predictions[0]["title"] if predictions else "Software Engineer",
        "top_match_percentage": predictions[0]["match"] if predictions else 50,
        "predictions": predictions
    }

@router.get("/career/skill-gap")
def get_skill_gap(role: str = Query(default="software-engineer"), user: UserDB = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(UserProfileDB).filter(UserProfileDB.user_id == user.id).first()
    skills = json.loads(profile.skills) if (profile and profile.skills) else []

    radar_signals = db.query(CareerInterestSignalDB).filter(CareerInterestSignalDB.user_id == user.id).all()
    signal_values = [s.signal_value for s in radar_signals if s.signal_value]
    effective_skills = list(dict.fromkeys(skills + signal_values))

    return calculate_skill_gap(role, effective_skills)

# -------------------------------------------------------------
# JOBS & APPLICATIONS (DATASET + USER ISOLATED + LIVE SOURCES)
# -------------------------------------------------------------
@router.get("/jobs/connectors")
def get_job_connectors():
    """Returns real-time status of all active job connectors."""
    return {
        "connectors": get_connectors_status()
    }

@router.post("/jobs/sync-live")
def sync_live_job_listings(user: Optional[UserDB] = Depends(get_optional_user), db: Session = Depends(get_db)):
    result = sync_live_jobs()
    if user and result.get("status") == "success" and result.get("new_jobs_added", 0) > 0:
        log_user_activity(db, user.id, f"Synced {result['new_jobs_added']} live jobs", icon_type="briefcase")
        send_user_notification(db, user.id, "Live Jobs Synced", f"Fetched {result['new_jobs_added']} fresh listings from live job feeds.", icon_type="briefcase")
    return result

@router.get("/jobs")
def get_jobs(
    search: Optional[str] = None,
    location: Optional[str] = None,
    country: Optional[str] = "India",
    state: Optional[str] = None,
    job_type: Optional[str] = None,
    source: Optional[str] = None,
    remote_only: Optional[bool] = None,
    user: Optional[UserDB] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    user_skills = []
    if user:
        profile = db.query(UserProfileDB).filter(UserProfileDB.user_id == user.id).first()
        if profile and profile.skills:
            user_skills = json.loads(profile.skills)

        radar_signals = db.query(CareerInterestSignalDB).filter(CareerInterestSignalDB.user_id == user.id).all()
        for s in radar_signals:
            if s.signal_value and s.signal_value not in user_skills:
                user_skills.append(s.signal_value)

    query = db.query(JobDB)

    # 1. Source & Live Filtering:
    # PRODUCTION RULE: Default recommendations prioritize fresh live jobs only.
    # Legacy dumped Kaggle jobs are excluded unless explicitly requested via source="demo" or source="dataset".
    if source in ("demo", "dataset", "Job Dataset", "LinkedIn Dataset"):
        query = query.filter(JobDB.is_live == False)
    elif source and source != "All" and source != "live":
        query = query.filter(JobDB.source.ilike(f"%{source}%"))
    else:
        # Default: Return ONLY live verified jobs (RemoteOK, Jobicy, Arbeitnow, Adzuna, Jooble)
        query = query.filter(JobDB.is_live == True)

    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (JobDB.title.ilike(search_filter)) |
            (JobDB.company.ilike(search_filter)) |
            (JobDB.description.ilike(search_filter)) |
            (JobDB.required_skills.ilike(search_filter))
        )

    if location and location != "All":
        query = query.filter(JobDB.location.ilike(f"%{location}%"))
    if job_type and job_type != "All":
        query = query.filter(JobDB.job_type.ilike(f"%{job_type}%"))
    if remote_only is True:
        query = query.filter(JobDB.remote == True)

    all_candidates = query.all()
    results = []

    target_country = (country or "India").strip().lower()
    target_state = (state or "").strip()

    for j in all_candidates:
        loc_str = j.location or ""

        # Country Filter: Default to India
        if target_country == "india":
            if not is_in_india(loc_str):
                continue

            # State Filter if selected
            if target_state and target_state != "All" and target_state != "All States":
                if not matches_indian_state(loc_str, target_state):
                    continue

        j_dict = j.to_dict()
        match_info = calculate_job_match_details(j_dict["required_skills"], user_skills)
        j_dict["match_score"] = match_info["match_score"]
        j_dict["matched_skills"] = match_info["matched_skills"]
        j_dict["missing_skills"] = match_info["missing_skills"]
        results.append(j_dict)

    # Sort descending by match score
    results.sort(key=lambda x: x["match_score"], reverse=True)
    return results

class ApplicationCreateSchema(BaseModel):
    role: str
    company: str
    job_id: Optional[int] = None
    location: Optional[str] = "Remote"
    salary: Optional[str] = "Competitive"
    status: str = "Applied"
    date_applied: Optional[str] = None
    notes: Optional[str] = ""

class ApplicationStatusUpdateSchema(BaseModel):
    status: str

@router.get("/applications")
def get_applications(user: UserDB = Depends(get_current_user), db: Session = Depends(get_db)):
    apps = db.query(JobApplicationDB).filter(JobApplicationDB.user_id == user.id).order_by(JobApplicationDB.created_at.desc()).all()
    return [app.to_dict() for app in apps]

@router.post("/applications")
def create_application(data: ApplicationCreateSchema, user: UserDB = Depends(get_current_user), db: Session = Depends(get_db)):
    app = JobApplicationDB(
        user_id=user.id,
        job_id=data.job_id,
        role=data.role,
        company=data.company,
        location=data.location or "Remote",
        salary=data.salary or "Competitive",
        status=data.status,
        date_applied=data.date_applied or datetime.utcnow().strftime("%d %b %Y"),
        notes=data.notes or ""
    )
    db.add(app)
    db.commit()
    db.refresh(app)

    log_user_activity(db, user.id, f"Applied to {data.company} — {data.role}", icon_type="send")
    send_user_notification(db, user.id, "Application Submitted", f"Applied for {data.role} at {data.company}.", icon_type="briefcase")
    return app.to_dict()

@router.put("/applications/{app_id}/status")
def update_application_status(app_id: int, data: ApplicationStatusUpdateSchema, user: UserDB = Depends(get_current_user), db: Session = Depends(get_db)):
    app = db.query(JobApplicationDB).filter(JobApplicationDB.id == app_id, JobApplicationDB.user_id == user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    old_status = app.status
    app.status = data.status
    db.commit()
    db.refresh(app)

    log_user_activity(db, user.id, f"Updated {app.company} application to {data.status}", icon_type="zap")
    send_user_notification(db, user.id, "Application Status Updated", f"{app.company} status changed from {old_status} to {data.status}.", icon_type="check")
    return app.to_dict()

@router.delete("/applications/{app_id}")
def delete_application(app_id: int, user: UserDB = Depends(get_current_user), db: Session = Depends(get_db)):
    app = db.query(JobApplicationDB).filter(JobApplicationDB.id == app_id, JobApplicationDB.user_id == user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    comp = app.company
    db.delete(app)
    db.commit()

    log_user_activity(db, user.id, f"Withdrew application for {comp}", icon_type="trash")
    send_user_notification(db, user.id, "Application Removed", f"Application for {comp} was removed from tracker.", icon_type="trash")
    return {"message": "Application deleted successfully"}

# -------------------------------------------------------------
# LEETCODE-STYLE CODING PRACTICE & SUBMISSIONS
# -------------------------------------------------------------
@router.get("/coding/problems")
def list_coding_problems(
    difficulty: Optional[str] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
    user: Optional[UserDB] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    query = db.query(CodingProblemDB)
    if difficulty and difficulty != "All":
        query = query.filter(CodingProblemDB.difficulty == difficulty)
    if category and category != "All":
        query = query.filter(CodingProblemDB.category == category)
    if search:
        query = query.filter(
            (CodingProblemDB.title.ilike(f"%{search}%")) |
            (CodingProblemDB.tags.ilike(f"%{search}%"))
        )

    problems = query.all()

    # Get user solved / attempted status
    solved_ids = set()
    attempted_ids = set()
    if user:
        subs = db.query(CodingSubmissionDB).filter(CodingSubmissionDB.user_id == user.id).all()
        for s in subs:
            if s.status == "Accepted":
                solved_ids.add(s.problem_id)
            else:
                attempted_ids.add(s.problem_id)

    results = []
    for p in problems:
        status_val = "Solved" if p.id in solved_ids else ("Attempted" if p.id in attempted_ids else "Todo")
        results.append({
            "id": p.id,
            "slug": p.slug,
            "title": p.title,
            "difficulty": p.difficulty,
            "category": p.category,
            "tags": json.loads(p.tags) if p.tags else [],
            "status": status_val
        })
    return results

@router.get("/coding/problems/{slug}")
def get_coding_problem_detail(slug: str, db: Session = Depends(get_db)):
    prob = db.query(CodingProblemDB).filter(CodingProblemDB.slug == slug).first()
    if not prob:
        raise HTTPException(status_code=404, detail="Problem not found")
    return prob.to_dict()

class CodeRunSchema(BaseModel):
    code: str
    language: str = "python"

@router.post("/coding/problems/{slug}/run")
def run_code_preview(slug: str, data: CodeRunSchema, db: Session = Depends(get_db)):
    prob = db.query(CodingProblemDB).filter(CodingProblemDB.slug == slug).first()
    if not prob:
        raise HTTPException(status_code=404, detail="Problem not found")

    test_cases = json.loads(prob.test_cases) if prob.test_cases else []
    visible_cases = [tc for tc in test_cases if not tc.get("hidden", False)]
    if not visible_cases:
        visible_cases = test_cases[:2]

    starter_fn = prob.slug.replace("-", "_")
    starter_codes = json.loads(prob.starter_code) if prob.starter_code else {}
    py_code = starter_codes.get("python", "")
    for line in py_code.split("\n"):
        if line.startswith("def ") and "(" in line:
            starter_fn = line.split("def ")[1].split("(")[0].strip()
            break

    res = execute_python_code(data.code, visible_cases, starter_function=starter_fn)
    return res

@router.post("/coding/problems/{slug}/submit")
def submit_solution(slug: str, data: CodeRunSchema, user: UserDB = Depends(get_current_user), db: Session = Depends(get_db)):
    prob = db.query(CodingProblemDB).filter(CodingProblemDB.slug == slug).first()
    if not prob:
        raise HTTPException(status_code=404, detail="Problem not found")

    test_cases = json.loads(prob.test_cases) if prob.test_cases else []
    starter_codes = json.loads(prob.starter_code) if prob.starter_code else {}
    py_code = starter_codes.get("python", "")
    starter_fn = ""
    for line in py_code.split("\n"):
        if line.startswith("def ") and "(" in line:
            starter_fn = line.split("def ")[1].split("(")[0].strip()
            break

    res = execute_python_code(data.code, test_cases, starter_function=starter_fn)

    # Record submission
    sub = CodingSubmissionDB(
        user_id=user.id,
        problem_id=prob.id,
        code=data.code,
        language=data.language,
        status=res["status"],
        test_cases_passed=res["test_cases_passed"],
        total_test_cases=res["total_test_cases"],
        runtime_ms=res["runtime_ms"],
        output_logs=json.dumps(res["results"])
    )
    db.add(sub)
    db.commit()

    if res["status"] == "Accepted":
        log_user_activity(db, user.id, f"Solved coding problem: {prob.title}", icon_type="code")
        send_user_notification(db, user.id, "Problem Solved! 🎉", f"Passed all {res['total_test_cases']} test cases for {prob.title}.", icon_type="code")
    else:
        log_user_activity(db, user.id, f"Attempted coding problem: {prob.title} ({res['status']})", icon_type="code")

    return res

# -------------------------------------------------------------
# MOCK TESTS & ASSESSMENTS
# -------------------------------------------------------------
@router.get("/mock-tests")
def list_mock_tests(db: Session = Depends(get_db)):
    tests = db.query(MockTestDB).all()
    return [t.to_dict() for t in tests]

@router.get("/mock-tests/{slug}")
def get_mock_test(slug: str, user: UserDB = Depends(get_current_user), db: Session = Depends(get_db)):
    t = db.query(MockTestDB).filter(MockTestDB.slug == slug).first()
    if not t:
        raise HTTPException(status_code=404, detail="Mock test not found")
    return t.to_dict()

class TestSubmitSchema(BaseModel):
    answers: Dict[str, int]
    time_spent_seconds: int = 0

@router.post("/mock-tests/{slug}/submit")
def submit_mock_test(slug: str, data: TestSubmitSchema, user: UserDB = Depends(get_current_user), db: Session = Depends(get_db)):
    test = db.query(MockTestDB).filter(MockTestDB.slug == slug).first()
    if not test:
        raise HTTPException(status_code=404, detail="Mock test not found")

    questions = json.loads(test.questions) if test.questions else []
    total_q = len(questions)
    correct_count = 0
    detailed_review = []

    for q in questions:
        q_id = str(q["id"])
        chosen_opt = data.answers.get(q_id, -1)
        correct_opt = q.get("correct_index", 0)
        is_correct = (chosen_opt == correct_opt)
        if is_correct:
            correct_count += 1

        detailed_review.append({
            "id": q["id"],
            "question": q["question"],
            "options": q["options"],
            "chosen_index": chosen_opt,
            "correct_index": correct_opt,
            "is_correct": is_correct,
            "explanation": q.get("explanation", "")
        })

    score_pct = round((correct_count / total_q * 100), 1) if total_q > 0 else 0.0

    attempt = MockTestAttemptDB(
        user_id=user.id,
        test_id=test.id,
        score_percentage=score_pct,
        total_questions=total_q,
        correct_answers=correct_count,
        answers=json.dumps(data.answers),
        time_spent_seconds=data.time_spent_seconds
    )
    db.add(attempt)
    db.commit()

    log_user_activity(db, user.id, f"Completed {test.title} — {int(score_pct)}%", icon_type="check")
    send_user_notification(db, user.id, "Mock Assessment Completed", f"Scored {score_pct}% in {test.title}.", icon_type="check")

    return {
        "test_title": test.title,
        "score_percentage": score_pct,
        "total_questions": total_q,
        "correct_answers": correct_count,
        "time_spent_seconds": data.time_spent_seconds,
        "detailed_review": detailed_review
    }

# -------------------------------------------------------------
# CODING PROGRESS & PERSONALIZED RECOMMENDATIONS
# -------------------------------------------------------------
@router.get("/coding/progress")
def get_coding_progress(user: UserDB = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(UserProfileDB).filter(UserProfileDB.user_id == user.id).first()
    skills = json.loads(profile.skills) if (profile and profile.skills) else []
    target_role = profile.target_role if (profile and profile.target_role) else "Machine Learning Engineer"

    # User's submissions
    subs = db.query(CodingSubmissionDB).filter(CodingSubmissionDB.user_id == user.id).order_by(CodingSubmissionDB.submitted_at.desc()).all()
    
    solved_problem_ids = set()
    attempted_problem_ids = set()
    for s in subs:
        if s.status == "Accepted":
            solved_problem_ids.add(s.problem_id)
        else:
            attempted_problem_ids.add(s.problem_id)

    # Difficulty breakdown
    all_problems = db.query(CodingProblemDB).all()
    prob_map = {p.id: p for p in all_problems}
    
    easy_solved = sum(1 for pid in solved_problem_ids if prob_map.get(pid) and prob_map[pid].difficulty == "Easy")
    med_solved = sum(1 for pid in solved_problem_ids if prob_map.get(pid) and prob_map[pid].difficulty == "Medium")
    hard_solved = sum(1 for pid in solved_problem_ids if prob_map.get(pid) and prob_map[pid].difficulty == "Hard")

    total_submissions = len(subs)
    accepted_submissions = sum(1 for s in subs if s.status == "Accepted")
    accuracy = round((accepted_submissions / total_submissions * 100), 1) if total_submissions > 0 else 0.0

    # Mock test attempts
    test_attempts = db.query(MockTestAttemptDB).filter(MockTestAttemptDB.user_id == user.id).order_by(MockTestAttemptDB.completed_at.desc()).all()
    avg_test_score = round(sum(a.score_percentage for a in test_attempts) / len(test_attempts), 1) if test_attempts else 0.0

    # Personalized Recommendations based on skills & target role
    gap_info = calculate_skill_gap(target_role, skills)

    recommended_problems = []
    for p in all_problems:
        if p.id not in solved_problem_ids:
            recommended_problems.append({
                "id": p.id,
                "slug": p.slug,
                "title": p.title,
                "difficulty": p.difficulty,
                "category": p.category,
                "reason": f"Strengthens core algorithms for {target_role}"
            })
            if len(recommended_problems) >= 4:
                break

    all_tests = db.query(MockTestDB).all()
    recommended_tests = [
        {
            "id": t.id,
            "slug": t.slug,
            "title": t.title,
            "category": t.category,
            "duration_minutes": t.duration_minutes
        } for t in all_tests[:3]
    ]

    recent_submissions = [
        {
            "id": s.id,
            "problem_title": prob_map[s.problem_id].title if s.problem_id in prob_map else "Problem",
            "language": s.language,
            "status": s.status,
            "runtime_ms": s.runtime_ms,
            "submitted_at": s.submitted_at.strftime("%b %d, %H:%M") if s.submitted_at else "Recently"
        } for s in subs[:6]
    ]

    return {
        "problems_solved": len(solved_problem_ids),
        "problems_attempted": len(attempted_problem_ids),
        "total_problems": len(all_problems),
        "easy_solved": easy_solved,
        "easy_total": sum(1 for p in all_problems if p.difficulty == "Easy"),
        "medium_solved": med_solved,
        "medium_total": sum(1 for p in all_problems if p.difficulty == "Medium"),
        "hard_solved": hard_solved,
        "hard_total": sum(1 for p in all_problems if p.difficulty == "Hard"),
        "accuracy": accuracy,
        "total_submissions": total_submissions,
        "mock_tests_completed": len(test_attempts),
        "average_test_score": avg_test_score,
        "recent_submissions": recent_submissions,
        "recommended_problems": recommended_problems,
        "recommended_tests": recommended_tests
    }

# -------------------------------------------------------------
# NOTIFICATIONS (REAL USER MULTI-TENANT)
# -------------------------------------------------------------
@router.get("/notifications")
def get_user_notifications(user: UserDB = Depends(get_current_user), db: Session = Depends(get_db)):
    notifs = db.query(NotificationDB).filter(
        NotificationDB.user_id == user.id
    ).order_by(NotificationDB.created_at.desc()).limit(20).all()

    unread_count = sum(1 for n in notifs if not n.is_read)
    return {
        "unread_count": unread_count,
        "notifications": [n.to_dict() for n in notifs]
    }

@router.post("/notifications/{notif_id}/read")
def mark_notification_read(notif_id: int, user: UserDB = Depends(get_current_user), db: Session = Depends(get_db)):
    notif = db.query(NotificationDB).filter(
        NotificationDB.id == notif_id,
        NotificationDB.user_id == user.id
    ).first()
    if notif:
        notif.is_read = True
        db.commit()
    return {"status": "ok"}

@router.post("/notifications/read-all")
def mark_all_notifications_read(user: UserDB = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(NotificationDB).filter(
        NotificationDB.user_id == user.id,
        NotificationDB.is_read == False
    ).update({"is_read": True})
    db.commit()
    return {"status": "ok"}

@router.delete("/notifications/clear")
def clear_all_notifications(user: UserDB = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(NotificationDB).filter(
        NotificationDB.user_id == user.id
    ).delete()
    db.commit()
    return {"status": "ok", "message": "All notifications cleared"}

# -------------------------------------------------------------
# AIRA — AI MOCK INTERVIEWER (VOICE + DYNAMIC INTERVIEW)
# -------------------------------------------------------------
class InterviewStartSchema(BaseModel):
    target_role: str = "Software Engineer"
    interview_type: str = "Technical"  # HR, Behavioral, Technical, Coding, System Design, Mixed
    difficulty: str = "Medium"        # Easy, Medium, Hard
    experience_level: str = "Junior"  # Fresher, Junior, Mid-Level, Senior
    interview_length: Optional[str] = "medium"  # 'short', 'medium', 'long', 'open'
    total_questions: Optional[int] = None

class InterviewTurnSubmitSchema(BaseModel):
    user_answer: Optional[str] = ""
    code: Optional[str] = None
    language: Optional[str] = "python"
    test_results: Optional[Dict[str, Any]] = None
    duration_seconds: Optional[int] = 0

class InterviewRunCodeSchema(BaseModel):
    code: str
    language: Optional[str] = "python"
    test_cases: Optional[List[Dict[str, Any]]] = None
    starter_function: Optional[str] = ""

class InterviewFinishSchema(BaseModel):
    duration_seconds: Optional[int] = 0

class TTSSchema(BaseModel):
    text: str

@router.get("/interview/provider-status")
def get_interview_provider_status():
    """Returns safe AI provider status without exposing secrets."""
    return ai_service.get_provider_status()

@router.post("/interview/run-code")
def run_interview_code(
    data: InterviewRunCodeSchema,
    user: UserDB = Depends(get_current_user)
):
    """Safely executes candidate code against test cases during live technical interview."""
    test_cases = data.test_cases or []
    res = execute_python_code(data.code, test_cases, starter_function=data.starter_function or "")
    return res

@router.post("/interview/tts")
def stream_interview_speech(data: TTSSchema):
    """
    Synthesizes and streams high-fidelity natural female speech (MP3) for Aira's voice.
    Falls back gracefully if TTS API is unavailable.
    """
    audio_bytes = ai_service.generate_speech(data.text)
    if not audio_bytes:
        raise HTTPException(status_code=503, detail="TTS service currently unavailable")
    return Response(content=audio_bytes, media_type="audio/mpeg")

@router.post("/interview/start")
def start_interview_session(
    data: InterviewStartSchema,
    user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(UserProfileDB).filter(UserProfileDB.user_id == user.id).first()
    skills = json.loads(profile.skills) if (profile and profile.skills) else []
    exp_years = profile.experience_years if profile else 0.0
    education = profile.education if profile else ""
    user_name = profile.name or user.username

    # Check for parsed resume data to personalize opening
    resume = db.query(ResumeRecordDB).filter(ResumeRecordDB.user_id == user.id).order_by(ResumeRecordDB.id.desc()).first()
    resume_summary = resume.raw_text[:300] if resume and resume.raw_text else ""

    # Retrieve weak skills from skill gap analysis for targeted technical questions
    gap_info = calculate_skill_gap(data.target_role, skills)
    weak_skills = [m["skill"] for m in gap_info.get("matrix", []) if m.get("gap") in ["High", "Medium", "High Gap", "Medium Gap"]]

    # Generate opening question with Aira
    first_question = generate_first_question(
        target_role=data.target_role,
        interview_type=data.interview_type,
        difficulty=data.difficulty,
        experience_level=data.experience_level,
        user_name=user_name,
        user_skills=skills,
        user_education=education,
        experience_years=exp_years,
        weak_skills=weak_skills,
        resume_summary=resume_summary
    )

    # Create session record (open-ended conversation, no fixed question cap)
    session = InterviewSessionDB(
        user_id=user.id,
        target_role=data.target_role,
        interview_type=data.interview_type,
        difficulty=data.difficulty,
        experience_level=data.experience_level,
        total_questions=9999,
        status="in_progress",
        created_at=datetime.utcnow()
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    # Create turn 1
    turn_1 = InterviewTurnDB(
        session_id=session.id,
        turn_index=1,
        ai_question=first_question,
        created_at=datetime.utcnow()
    )
    db.add(turn_1)
    db.commit()
    db.refresh(turn_1)

    log_user_activity(db, user.id, f"Started Aira {data.interview_type} Interview ({data.target_role})", icon_type="target")
    send_user_notification(db, user.id, "Aira Interview Started", f"Mock interview for {data.target_role} ({data.difficulty}) is underway.", icon_type="target")

    s_dict = session.to_dict()
    s_dict["turns"] = [turn_1.to_dict()]
    return s_dict

@router.post("/interview/{session_id}/turn")
def submit_interview_turn(
    session_id: int,
    data: InterviewTurnSubmitSchema,
    user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(InterviewSessionDB).filter(
        InterviewSessionDB.id == session_id,
        InterviewSessionDB.user_id == user.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found")

    profile = db.query(UserProfileDB).filter(UserProfileDB.user_id == user.id).first()
    skills = json.loads(profile.skills) if (profile and profile.skills) else []
    user_name = profile.name or user.username

    # Find the current active turn (the latest turn without an answer)
    current_turn = db.query(InterviewTurnDB).filter(
        InterviewTurnDB.session_id == session.id
    ).order_by(InterviewTurnDB.turn_index.desc()).first()

    if not current_turn:
        raise HTTPException(status_code=400, detail="No active turn found in session")

    # Get turn history
    all_turns = db.query(InterviewTurnDB).filter(
        InterviewTurnDB.session_id == session.id
    ).order_by(InterviewTurnDB.turn_index.asc()).all()

    turn_history_dicts = [t.to_dict() for t in all_turns]

    # Resume context if available
    resume = db.query(ResumeRecordDB).filter(ResumeRecordDB.user_id == user.id).order_by(ResumeRecordDB.id.desc()).first()
    resume_summary = resume.raw_text[:200] if resume and resume.raw_text else ""

    # Calculate skill gap weak areas
    gap_info = calculate_skill_gap(session.target_role, skills)
    weak_skills = [m["skill"] for m in gap_info.get("matrix", []) if m.get("gap") in ["High", "Medium", "High Gap", "Medium Gap"]]

    # Prepare code submission metadata if provided
    code_submission = None
    if data.code:
        code_submission = {
            "code": data.code,
            "language": data.language or "python",
            "status": data.test_results.get("status") if data.test_results else "Submitted",
            "test_cases_passed": data.test_results.get("test_cases_passed", 0) if data.test_results else 0,
            "total_test_cases": data.test_results.get("total_test_cases", 0) if data.test_results else 0,
            "results": data.test_results.get("results", []) if data.test_results else []
        }

    # Evaluate answer and dynamically generate Aira's next spoken response in ONE fast AI call
    eval_result = evaluate_and_generate_next_turn(
        session_info=session.to_dict(),
        turn_history=turn_history_dicts,
        current_answer=data.user_answer or (f"[Code Submission]:\n{data.code}" if data.code else ""),
        user_name=user_name,
        user_skills=skills,
        weak_skills=weak_skills,
        resume_summary=resume_summary,
        code_submission=code_submission
    )

    # Update current turn
    current_turn.user_answer = data.user_answer or (f"[Code Submission in {data.language or 'python'}]" if data.code else "")
    current_turn.feedback = eval_result.get("feedback", "")
    current_turn.evaluation_scores = json.dumps(eval_result.get("scores", {}))
    db.commit()
    db.refresh(current_turn)

    # Purely conversational flow: ends only when explicitly requested (should_end == True)
    is_finished = bool(eval_result.get("should_end", False))
    next_turn = None

    spoken_response = eval_result.get("interviewer_response") or eval_result.get("next_question", "Can you elaborate further on that?")

    if not is_finished:
        next_turn = InterviewTurnDB(
            session_id=session.id,
            turn_index=current_turn.turn_index + 1,
            ai_question=spoken_response,
            created_at=datetime.utcnow()
        )
        db.add(next_turn)
        db.commit()
        db.refresh(next_turn)

    return {
        "session_id": session.id,
        "current_turn": current_turn.to_dict(),
        "next_turn": next_turn.to_dict() if next_turn else None,
        "is_finished": is_finished,
        "interviewer_response": spoken_response,
        "feedback": eval_result.get("feedback", ""),
        "scores": eval_result.get("scores", {}),
        "turn_strength": eval_result.get("turn_strength", ""),
        "turn_improvement": eval_result.get("turn_improvement", ""),
        "topic": eval_result.get("topic", ""),
        "is_coding_challenge": eval_result.get("is_coding_challenge", False),
        "coding_challenge": eval_result.get("coding_challenge")
    }

@router.post("/interview/{session_id}/finish")
def finish_interview_session(
    session_id: int,
    data: InterviewFinishSchema,
    user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(InterviewSessionDB).filter(
        InterviewSessionDB.id == session_id,
        InterviewSessionDB.user_id == user.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found")

    profile = db.query(UserProfileDB).filter(UserProfileDB.user_id == user.id).first()
    skills = json.loads(profile.skills) if (profile and profile.skills) else []
    user_name = profile.name or user.username

    turns = db.query(InterviewTurnDB).filter(
        InterviewTurnDB.session_id == session.id
    ).order_by(InterviewTurnDB.turn_index.asc()).all()

    turns_dicts = [t.to_dict() for t in turns if t.user_answer]

    report = generate_final_interview_report(
        session_info=session.to_dict(),
        turn_history=turns_dicts,
        user_name=user_name,
        user_skills=skills
    )

    session.overall_score = report.get("overall_score", 78.0)
    session.technical_score = report.get("technical_score", 80.0)
    session.communication_score = report.get("communication_score", 75.0)
    session.problem_solving_score = report.get("problem_solving_score", 76.0)
    session.answer_quality_score = report.get("answer_quality_score", 77.0)
    session.role_readiness_score = report.get("role_readiness_score", 78.0)
    session.strengths = json.dumps(report.get("strengths", []))
    session.weaknesses = json.dumps(report.get("weaknesses", []))
    session.good_questions = json.dumps(report.get("good_questions", []))
    session.improvement_questions = json.dumps(report.get("improvement_questions", []))
    session.topics_to_study = json.dumps(report.get("topics_to_study", []))
    session.recommended_next = report.get("recommended_next_step", "") or report.get("recommended_next", "")
    session.status = "completed"
    session.duration_seconds = data.duration_seconds or session.duration_seconds or 300
    session.completed_at = datetime.utcnow()

    db.commit()
    db.refresh(session)

    log_user_activity(db, user.id, f"Completed Aira Interview ({session.target_role}) — {int(session.overall_score)}%", icon_type="check")
    send_user_notification(
        db, user.id,
        "Aira Interview Completed 🎉",
        f"You scored {session.overall_score}% for {session.target_role} ({session.interview_type}).",
        icon_type="check"
    )

    res_dict = session.to_dict()
    res_dict.update({
        "why_technical": report.get("why_technical", ""),
        "why_communication": report.get("why_communication", ""),
        "why_problem_solving": report.get("why_problem_solving", ""),
        "why_clarity": report.get("why_clarity", ""),
        "coding_score": report.get("coding_score", 80),
        "coding_evidence": report.get("coding_evidence", ""),
        "assessed_topics": report.get("assessed_topics", []),
        "unassessed_topics": report.get("unassessed_topics", []),
        "recommended_next_step": report.get("recommended_next_step", "")
    })
    return res_dict

@router.get("/interview/history")
def get_interview_history(user: UserDB = Depends(get_current_user), db: Session = Depends(get_db)):
    sessions = db.query(InterviewSessionDB).filter(
        InterviewSessionDB.user_id == user.id,
        InterviewSessionDB.status == "completed"
    ).order_by(InterviewSessionDB.created_at.desc()).all()

    history_list = []
    scores_progression = []

    for s in reversed(sessions):
        scores_progression.append({
            "date": s.completed_at.strftime("%b %d") if s.completed_at else "Recent",
            "score": s.overall_score,
            "role": s.target_role
        })

    for s in sessions:
        history_list.append(s.to_dict())

    avg_score = round(sum(s.overall_score for s in sessions) / len(sessions), 1) if sessions else 0.0

    return {
        "total_interviews": len(sessions),
        "average_score": avg_score,
        "score_trend": scores_progression,
        "history": history_list
    }

@router.get("/interview/{session_id}")
def get_interview_session_details(session_id: int, user: UserDB = Depends(get_current_user), db: Session = Depends(get_db)):
    session = db.query(InterviewSessionDB).filter(
        InterviewSessionDB.id == session_id,
        InterviewSessionDB.user_id == user.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found")
    return session.to_dict()



# -------------------------------------------------------------
# CAREER RADAR ROUTES
# -------------------------------------------------------------
from database import ConnectedAccountDB, CareerInterestSignalDB
from services.crypto_service import encrypt_token, decrypt_token, generate_oauth_state, verify_oauth_state
from services.integrations import RADAR_CONNECTORS, get_radar_connector
from services.integrations.google import GoogleConnector
from services.career_interest_engine import calculate_career_interests, get_radar_career_recommendations
from services.oauth_config import get_oauth_credentials, is_provider_configured, get_oauth_redirect_uri, get_frontend_return_url
from fastapi.responses import RedirectResponse

class AuthorizeRequestSchema(BaseModel):
    redirect_uri: Optional[str] = None

class CallbackExchangeSchema(BaseModel):
    code: str
    state: str
    redirect_uri: Optional[str] = None

@router.get("/career-radar/providers")
def get_career_radar_providers(user: UserDB = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Returns real configuration and connection status for each provider.
    Never exposes client secrets, access tokens, refresh tokens, or encryption keys.
    """
    accounts = db.query(ConnectedAccountDB).filter(ConnectedAccountDB.user_id == user.id).all()
    acc_map = {}
    for a in accounts:
        prov = a.provider.lower()
        safe = a.to_safe_dict()
        acc_map[prov] = safe
        if prov in ("google", "youtube"):
            acc_map["google"] = safe
            acc_map["youtube"] = safe

    provider_meta = {
        "github": {
            "name": "GitHub",
            "env_vars": ["GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET", "GITHUB_REDIRECT_URI"],
            "dev_portal_url": "https://github.com/settings/developers",
            "portal_name": "GitHub Developer Settings → OAuth Apps",
            "scope_summary": "read:user, user:email, public_repo",
            "instructions": "Add GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET to backend/.env",
            "notes": "Imports public repositories, languages, and project topics. No private code or SSH keys accessed."
        },
        "youtube": {
            "name": "Google / YouTube",
            "env_vars": ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET (Optional with PKCE)", "YOUTUBE_API_KEY (Optional)", "GOOGLE_REDIRECT_URI"],
            "dev_portal_url": "https://console.cloud.google.com/apis/credentials",
            "portal_name": "Google Cloud Console → Credentials → Web application",
            "scope_summary": "openid, email, profile, https://www.googleapis.com/auth/youtube.readonly",
            "instructions": "Add your real GOOGLE_CLIENT_ID (ending with .apps.googleusercontent.com) to backend/.env",
            "notes": "Important: Copy the generated Client ID (ending with .apps.googleusercontent.com), NOT the app name 'jobtracker'. When using PKCE, client secret is not required."
        },
        "google": {
            "name": "Google / YouTube",
            "env_vars": ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET (Optional with PKCE)", "YOUTUBE_API_KEY (Optional)", "GOOGLE_REDIRECT_URI"],
            "dev_portal_url": "https://console.cloud.google.com/apis/credentials",
            "portal_name": "Google Cloud Console → Credentials → Web application",
            "scope_summary": "openid, email, profile, https://www.googleapis.com/auth/youtube.readonly",
            "instructions": "Add your real GOOGLE_CLIENT_ID (ending with .apps.googleusercontent.com) to backend/.env",
            "notes": "Important: Copy the generated Client ID (ending with .apps.googleusercontent.com), NOT the app name 'jobtracker'. When using PKCE, client secret is not required."
        },
        "instagram": {
            "name": "Instagram",
            "env_vars": ["META_CLIENT_ID", "META_CLIENT_SECRET", "INSTAGRAM_REDIRECT_URI"],
            "dev_portal_url": "https://developers.facebook.com/apps",
            "portal_name": "Meta for Developers → Create App → Add 'Instagram' product",
            "scope_summary": "instagram_business_basic",
            "instructions": "Add META_CLIENT_ID and META_CLIENT_SECRET to backend/.env",
            "notes": "Uses official Meta OAuth 2.0 with instagram_business_basic scope. Requires Instagram Creator or Business account. In Development mode, ensure your Instagram account is listed as a Tester under App Roles."
        }
    }

    result = {}
    for prov_key in ["github", "google", "instagram"]:
        connector = get_radar_connector(prov_key)
        is_cfg = connector.is_configured() if connector else False
        is_conn = prov_key in acc_map
        meta = provider_meta.get(prov_key, {})
        
        result[prov_key] = {
            "provider": prov_key,
            "configured": is_cfg,
            "connected": is_conn,
            "name": meta.get("name", prov_key.title()),
            "account": acc_map.get(prov_key),
            "setup_instructions": meta.get("instructions", f"Add {prov_key.upper()} credentials to backend/.env"),
            "setup_details": {
                "env_vars": meta.get("env_vars", []),
                "dev_portal_url": meta.get("dev_portal_url", ""),
                "portal_name": meta.get("portal_name", ""),
                "callback_url": get_oauth_redirect_uri(prov_key),
                "scope_summary": meta.get("scope_summary", ""),
                "notes": meta.get("notes", "")
            }
        }

    return result

@router.get("/career-radar/accounts")
def get_connected_accounts(user: UserDB = Depends(get_current_user), db: Session = Depends(get_db)):
    """Returns connected accounts for user, with configuration status for all providers."""
    accounts = db.query(ConnectedAccountDB).filter(ConnectedAccountDB.user_id == user.id).all()
    acc_map = {}
    for a in accounts:
        prov = a.provider.lower()
        safe = a.to_safe_dict()
        acc_map[prov] = safe
        if prov in ("google", "youtube"):
            acc_map["google"] = safe
            acc_map["youtube"] = safe

    provider_meta = {
        "github": {
            "name": "GitHub",
            "env_vars": ["GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET", "GITHUB_REDIRECT_URI"],
            "dev_portal_url": "https://github.com/settings/developers",
            "portal_name": "GitHub Developer Settings → OAuth Apps",
            "scope_summary": "read:user, user:email, public_repo",
            "notes": "Imports public repositories, languages, and project topics. No private code or SSH keys accessed."
        },
        "google": {
            "name": "Google / YouTube",
            "env_vars": ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET (Optional with PKCE)", "YOUTUBE_API_KEY (Optional)", "GOOGLE_REDIRECT_URI"],
            "dev_portal_url": "https://console.cloud.google.com/apis/credentials",
            "portal_name": "Google Cloud Console → Credentials → Web application",
            "scope_summary": "openid, email, profile, https://www.googleapis.com/auth/youtube.readonly",
            "notes": "Important: Copy the generated Client ID (ending with .apps.googleusercontent.com), NOT the app name 'jobtracker'. Zero watch history is accessed."
        },
        "youtube": {
            "name": "Google / YouTube",
            "env_vars": ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET (Optional with PKCE)", "YOUTUBE_API_KEY (Optional)", "GOOGLE_REDIRECT_URI"],
            "dev_portal_url": "https://console.cloud.google.com/apis/credentials",
            "portal_name": "Google Cloud Console → Credentials → Web application",
            "scope_summary": "openid, email, profile, https://www.googleapis.com/auth/youtube.readonly",
            "notes": "Important: Copy the generated Client ID (ending with .apps.googleusercontent.com), NOT the app name 'jobtracker'. Zero watch history is accessed."
        },
        "instagram": {
            "name": "Instagram",
            "env_vars": ["META_CLIENT_ID", "META_CLIENT_SECRET", "INSTAGRAM_REDIRECT_URI"],
            "dev_portal_url": "https://developers.facebook.com/apps",
            "portal_name": "Meta for Developers → Create App → Add 'Instagram' product",
            "scope_summary": "instagram_business_basic",
            "notes": "Uses official Meta OAuth 2.0 with instagram_business_basic scope. Requires Instagram Creator or Business account. Zero browsing or search history accessed."
        }
    }

    providers_status = []
    for prov_key in ["github", "google", "instagram"]:
        connector = get_radar_connector(prov_key)
        is_cfg = connector.is_configured() if connector else False
        connected = prov_key in acc_map
        meta = provider_meta.get(prov_key, {})
        display_name = meta.get("name", prov_key.title())
        
        if is_cfg:
            help_msg = f"{display_name} credentials configured."
        else:
            if prov_key in ("youtube", "google"):
                help_msg = f"{display_name} integration isn't configured yet. Add GOOGLE_CLIENT_ID to backend environment."
            else:
                help_msg = f"{display_name} integration isn't configured yet. Add client ID and secret to backend environment."

        providers_status.append({
            "provider": prov_key,
            "name": display_name,
            "configured": is_cfg,
            "connected": connected,
            "account": acc_map.get(prov_key),
            "help_message": help_msg,
            "setup_details": {
                "env_vars": meta.get("env_vars", []),
                "dev_portal_url": meta.get("dev_portal_url", ""),
                "portal_name": meta.get("portal_name", ""),
                "callback_url": get_oauth_redirect_uri(prov_key),
                "scope_summary": meta.get("scope_summary", ""),
                "notes": meta.get("notes", "")
            }
        })

    unique_connected_keys = set()
    for a in accounts:
        prov = a.provider.lower()
        if prov in ("google", "youtube"):
            unique_connected_keys.add("google")
        elif prov in ("github", "instagram"):
            unique_connected_keys.add(prov)

    return {
        "providers": providers_status,
        "total_connected": min(len(unique_connected_keys), 3)
    }

# Explicit Google Routes
@router.post("/career-radar/google/connect")
def connect_google_career_radar(
    data: Optional[AuthorizeRequestSchema] = None,
    user: UserDB = Depends(get_current_user)
):
    """Direct connect endpoint for Google + YouTube OAuth 2.0 with PKCE."""
    return authorize_career_radar_provider("google", data=data, user=user)

@router.get("/career-radar/google/callback")
def google_oauth_callback(
    code: Optional[str] = None,
    state: Optional[str] = None,
    error: Optional[str] = None,
    error_description: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Direct browser callback for Google OAuth 2.0."""
    return handle_career_radar_get_callback(
        provider="google",
        code=code,
        state=state,
        error=error,
        error_description=error_description,
        db=db
    )

@router.post("/career-radar/google/sync")
def sync_google_career_radar(
    user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Direct sync endpoint for Google + YouTube."""
    return sync_career_radar_provider("google", user=user, db=db)

@router.delete("/career-radar/google")
def disconnect_google_career_radar(
    user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Direct disconnect endpoint for Google + YouTube."""
    return disconnect_career_radar_provider("google", user=user, db=db)

# Explicit Instagram Routes
@router.post("/career-radar/instagram/connect")
def connect_instagram_career_radar(
    data: Optional[AuthorizeRequestSchema] = None,
    user: UserDB = Depends(get_current_user)
):
    """Direct connect endpoint for Instagram OAuth 2.0 via Meta."""
    return authorize_career_radar_provider("instagram", data=data, user=user)

@router.get("/career-radar/instagram/callback")
def instagram_oauth_callback(
    code: Optional[str] = None,
    state: Optional[str] = None,
    error: Optional[str] = None,
    error_description: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Direct browser callback for Instagram OAuth 2.0."""
    return handle_career_radar_get_callback(
        provider="instagram",
        code=code,
        state=state,
        error=error,
        error_description=error_description,
        db=db
    )

@router.get("/auth/instagram/callback")
def instagram_auth_callback_alias(
    code: Optional[str] = None,
    state: Optional[str] = None,
    error: Optional[str] = None,
    error_description: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Architectural alias route for /api/auth/instagram/callback."""
    return handle_career_radar_get_callback(
        provider="instagram",
        code=code,
        state=state,
        error=error,
        error_description=error_description,
        db=db
    )

@router.post("/career-radar/instagram/sync")
def sync_instagram_career_radar(
    user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Direct sync endpoint for Instagram."""
    return sync_career_radar_provider("instagram", user=user, db=db)

@router.delete("/career-radar/instagram")
def disconnect_instagram_career_radar(
    user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Direct disconnect endpoint for Instagram."""
    return disconnect_career_radar_provider("instagram", user=user, db=db)

@router.post("/career-radar/{provider}/authorize")
def authorize_career_radar_provider(
    provider: str,
    data: Optional[AuthorizeRequestSchema] = None,
    user: UserDB = Depends(get_current_user)
):
    """Generates official OAuth authorization URL with CSRF protection and PKCE when supported."""
    prov_key = provider.lower()
    connector = get_radar_connector(prov_key)
    if not connector:
        raise HTTPException(status_code=400, detail=f"Unsupported provider: {provider}")

    if not connector.is_configured():
        prov_label = "GitHub" if prov_key == "github" else "Instagram" if prov_key == "instagram" else "Google / YouTube" if prov_key in ("youtube", "google") else prov_key.title()
        raise HTTPException(
            status_code=400,
            detail=f"{prov_label} integration is not configured. Please add credentials to backend .env"
        )

    redirect_uri = (data.redirect_uri if data and data.redirect_uri else None) or get_oauth_redirect_uri(prov_key)

    code_challenge = None
    code_verifier = None
    if prov_key in ("google", "youtube"):
        code_verifier, code_challenge = GoogleConnector.generate_pkce()

    state = generate_oauth_state(user.id, prov_key, code_verifier=code_verifier)

    try:
        if prov_key in ("google", "youtube"):
            auth_url = connector.get_authorization_url(user.id, redirect_uri, state, code_challenge=code_challenge)
        else:
            auth_url = connector.get_authorization_url(user.id, redirect_uri, state)

        return {
            "provider": prov_key,
            "authorization_url": auth_url,
            "auth_url": auth_url,
            "state": state
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate authorization URL: {str(e)}")

@router.get("/career-radar/{provider}/callback")
def handle_career_radar_get_callback(
    provider: str,
    code: Optional[str] = None,
    state: Optional[str] = None,
    error: Optional[str] = None,
    error_description: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Direct browser redirect endpoint from OAuth providers.
    Validates HMAC CSRF state, exchanges code for token, saves encrypted token,
    triggers initial sync, and redirects to frontend Career Radar.
    """
    prov_key = provider.lower()
    if error:
        err_msg = error_description or error or "OAuth authorization declined by user"
        return RedirectResponse(get_frontend_return_url(prov_key, status="error", message=err_msg))

    if not code or not state:
        return RedirectResponse(get_frontend_return_url(prov_key, status="error", message="Missing OAuth authorization code or state"))

    # Sanitize code against fragment indicators (common in Instagram OAuth redirects)
    code = code.split("#")[0].strip()

    valid, state_uid, state_prov, code_verifier = verify_oauth_state(state)
    prov_matches = (state_prov == prov_key) or ({state_prov, prov_key} <= {"google", "youtube"})
    if not valid or not state_uid or not prov_matches:
        return RedirectResponse(get_frontend_return_url(prov_key, status="error", message="Invalid or expired OAuth state parameter"))

    user = db.query(UserDB).filter(UserDB.id == state_uid).first()
    if not user:
        return RedirectResponse(get_frontend_return_url(prov_key, status="error", message="User not found for OAuth callback"))

    connector = get_radar_connector(prov_key)
    if not connector:
        return RedirectResponse(get_frontend_return_url(prov_key, status="error", message=f"Unsupported provider: {prov_key}"))

    redirect_uri = get_oauth_redirect_uri(prov_key)
    try:
        if prov_key in ("google", "youtube"):
            exchange_result = connector.handle_callback(code, redirect_uri, code_verifier=code_verifier)
        else:
            exchange_result = connector.handle_callback(code, redirect_uri)
    except Exception as e:
        return RedirectResponse(get_frontend_return_url(prov_key, status="error", message=str(e)))

    access_token = exchange_result.get("access_token")
    refresh_token = exchange_result.get("refresh_token")
    acc_info = exchange_result.get("account_info", {})

    enc_access = encrypt_token(access_token)
    enc_refresh = encrypt_token(refresh_token)

    canonical_prov = "google" if prov_key in ("google", "youtube") else prov_key

    account = db.query(ConnectedAccountDB).filter(
        ConnectedAccountDB.user_id == user.id,
        ConnectedAccountDB.provider.in_(["google", "youtube"]) if canonical_prov == "google" else ConnectedAccountDB.provider == canonical_prov
    ).first()

    if not account:
        account = ConnectedAccountDB(
            user_id=user.id,
            provider=canonical_prov,
            connected_at=datetime.utcnow()
        )
        db.add(account)

    account.provider = canonical_prov
    account.provider_user_id = acc_info.get("provider_user_id", "")
    account.username = acc_info.get("username", "")
    account.display_name = acc_info.get("display_name", "")
    account.profile_url = acc_info.get("profile_url", "")
    account.avatar_url = acc_info.get("avatar_url", "")
    account.account_type = acc_info.get("account_type", "personal")
    account.scopes = json.dumps(exchange_result.get("scopes", []))
    account.access_token_encrypted = enc_access
    account.refresh_token_encrypted = enc_refresh
    account.token_expires_at = exchange_result.get("token_expires_at")
    account.sync_status = "connected"
    account.last_synced_at = datetime.utcnow()
    account.error_message = ""
    db.commit()

    # Initial Signal Sync
    signals_count = 0
    if access_token:
        try:
            raw_signals = connector.sync_signals(user.id, access_token)
            db.query(CareerInterestSignalDB).filter(
                CareerInterestSignalDB.user_id == user.id,
                CareerInterestSignalDB.provider.in_(["google", "youtube"]) if canonical_prov == "google" else CareerInterestSignalDB.provider == canonical_prov
            ).delete()

            for s in raw_signals:
                sig_db = CareerInterestSignalDB(
                    user_id=user.id,
                    provider=canonical_prov,
                    signal_type=s.get("signal_type", "technology"),
                    signal_value=s.get("signal_value", ""),
                    strength=s.get("strength", 0.7),
                    confidence=s.get("confidence", 0.8),
                    source_reference=s.get("source_reference", "")
                )
                db.add(sig_db)
            signals_count = len(raw_signals)
            account.sync_status = "synced"
            db.commit()
        except Exception as e:
            account.sync_status = "partial_sync"
            account.error_message = f"Sync note: {str(e)}"
            db.commit()

    display_prov = "Google / YouTube" if canonical_prov == "google" else canonical_prov.title()
    log_user_activity(db, user.id, f"Connected {display_prov} to Career Radar", icon_type="target")
    send_user_notification(db, user.id, f"{display_prov} Connected 🎉", f"Career Radar imported {signals_count} verified signals from {display_prov}.", icon_type="check")

    return RedirectResponse(get_frontend_return_url(prov_key, status="success", message=f"{display_prov} connected successfully!"))

@router.post("/career-radar/{provider}/callback")
def handle_career_radar_callback(
    provider: str,
    data: CallbackExchangeSchema,
    user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Exchanges code for tokens, verifies CSRF state, and triggers initial sync (API mode)."""
    prov_key = provider.lower()
    connector = get_radar_connector(prov_key)
    if not connector:
        raise HTTPException(status_code=400, detail=f"Unsupported provider: {provider}")

    # Validate CSRF State
    valid, state_uid, state_prov, code_verifier = verify_oauth_state(data.state)
    prov_matches = (state_prov == prov_key) or ({state_prov, prov_key} <= {"google", "youtube"})
    if not valid or state_uid != user.id or not prov_matches:
        raise HTTPException(status_code=400, detail="Invalid or expired OAuth state parameter. Please try connecting again.")

    redirect_uri = data.redirect_uri or get_oauth_redirect_uri(prov_key)
    try:
        if prov_key in ("google", "youtube"):
            exchange_result = connector.handle_callback(data.code, redirect_uri, code_verifier=code_verifier)
        else:
            exchange_result = connector.handle_callback(data.code, redirect_uri)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"OAuth exchange failed: {str(e)}")

    access_token = exchange_result.get("access_token")
    refresh_token = exchange_result.get("refresh_token")
    acc_info = exchange_result.get("account_info", {})

    enc_access = encrypt_token(access_token)
    enc_refresh = encrypt_token(refresh_token)

    canonical_prov = "google" if prov_key in ("google", "youtube") else prov_key

    account = db.query(ConnectedAccountDB).filter(
        ConnectedAccountDB.user_id == user.id,
        ConnectedAccountDB.provider.in_(["google", "youtube"]) if canonical_prov == "google" else ConnectedAccountDB.provider == canonical_prov
    ).first()

    if not account:
        account = ConnectedAccountDB(
            user_id=user.id,
            provider=canonical_prov,
            connected_at=datetime.utcnow()
        )
        db.add(account)

    account.provider = canonical_prov
    account.provider_user_id = acc_info.get("provider_user_id", "")
    account.username = acc_info.get("username", "")
    account.display_name = acc_info.get("display_name", "")
    account.profile_url = acc_info.get("profile_url", "")
    account.avatar_url = acc_info.get("avatar_url", "")
    account.account_type = acc_info.get("account_type", "personal")
    account.scopes = json.dumps(exchange_result.get("scopes", []))
    account.access_token_encrypted = enc_access
    account.refresh_token_encrypted = enc_refresh
    account.token_expires_at = exchange_result.get("token_expires_at")
    account.sync_status = "connected"
    account.last_synced_at = datetime.utcnow()
    account.error_message = ""

    db.commit()
    db.refresh(account)

    # Initial Signal Sync
    signals_count = 0
    if access_token:
        try:
            raw_signals = connector.sync_signals(user.id, access_token)
            db.query(CareerInterestSignalDB).filter(
                CareerInterestSignalDB.user_id == user.id,
                CareerInterestSignalDB.provider.in_(["google", "youtube"]) if canonical_prov == "google" else CareerInterestSignalDB.provider == canonical_prov
            ).delete()

            for s in raw_signals:
                sig_db = CareerInterestSignalDB(
                    user_id=user.id,
                    provider=canonical_prov,
                    signal_type=s.get("signal_type", "technology"),
                    signal_value=s.get("signal_value", ""),
                    strength=s.get("strength", 0.7),
                    confidence=s.get("confidence", 0.8),
                    source_reference=s.get("source_reference", "")
                )
                db.add(sig_db)
            db.commit()
            signals_count = len(raw_signals)
            account.sync_status = "synced"
            db.commit()
        except Exception as e:
            account.sync_status = "partial_sync"
            account.error_message = f"Sync note: {str(e)}"
            db.commit()

    display_prov = "Google / YouTube" if canonical_prov == "google" else canonical_prov.title()
    log_user_activity(db, user.id, f"Connected {display_prov} to Career Radar", icon_type="target")
    send_user_notification(db, user.id, f"{display_prov} Connected 🎉", f"Career Radar imported {signals_count} verified signals from {display_prov}.", icon_type="check")

    return {
        "status": "success",
        "account": account.to_safe_dict(),
        "signals_imported": signals_count
    }

@router.post("/career-radar/{provider}/sync")
def sync_career_radar_provider(
    provider: str,
    user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Manually triggers fresh signal sync for an active connected account."""
    prov_key = provider.lower()
    connector = get_radar_connector(prov_key)
    if not connector:
        raise HTTPException(status_code=400, detail=f"Unsupported provider: {provider}")

    if prov_key in ("google", "youtube"):
        account = db.query(ConnectedAccountDB).filter(
            ConnectedAccountDB.user_id == user.id,
            ConnectedAccountDB.provider.in_(["google", "youtube"])
        ).first()
    else:
        account = db.query(ConnectedAccountDB).filter(
            ConnectedAccountDB.user_id == user.id,
            ConnectedAccountDB.provider == prov_key
        ).first()

    if not account:
        raise HTTPException(status_code=404, detail="Account not connected yet.")

    plain_token = decrypt_token(account.access_token_encrypted)
    if not plain_token:
        account.sync_status = "error"
        account.error_message = "Authentication token expired or unavailable. Please reconnect."
        db.commit()
        raise HTTPException(status_code=401, detail="Token unavailable. Please reconnect your account.")

    canonical_prov = account.provider

    try:
        raw_signals = connector.sync_signals(user.id, plain_token)
        # Clear and refresh signals for this provider only
        if canonical_prov in ("google", "youtube"):
            db.query(CareerInterestSignalDB).filter(
                CareerInterestSignalDB.user_id == user.id,
                CareerInterestSignalDB.provider.in_(["google", "youtube"])
            ).delete()
        else:
            db.query(CareerInterestSignalDB).filter(
                CareerInterestSignalDB.user_id == user.id,
                CareerInterestSignalDB.provider == canonical_prov
            ).delete()

        for s in raw_signals:
            sig_db = CareerInterestSignalDB(
                user_id=user.id,
                provider=canonical_prov,
                signal_type=s.get("signal_type", "technology"),
                signal_value=s.get("signal_value", ""),
                strength=s.get("strength", 0.7),
                confidence=s.get("confidence", 0.8),
                source_reference=s.get("source_reference", "")
            )
            db.add(sig_db)

        account.sync_status = "synced"
        account.last_synced_at = datetime.utcnow()
        account.error_message = ""
        db.commit()

        return {
            "status": "synced",
            "provider": prov_key,
            "signals_count": len(raw_signals),
            "last_synced_at": account.last_synced_at.isoformat()
        }
    except Exception as e:
        account.sync_status = "error"
        account.error_message = str(e)
        db.commit()
        raise HTTPException(status_code=500, detail=f"Sync failed: {str(e)}")

@router.delete("/career-radar/{provider}")
def disconnect_career_radar_provider(
    provider: str,
    user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Disconnects account, revokes token if supported, and deletes provider signals."""
    prov_key = provider.lower()
    connector = get_radar_connector(prov_key)

    if prov_key in ("google", "youtube"):
        account = db.query(ConnectedAccountDB).filter(
            ConnectedAccountDB.user_id == user.id,
            ConnectedAccountDB.provider.in_(["google", "youtube"])
        ).first()
    else:
        account = db.query(ConnectedAccountDB).filter(
            ConnectedAccountDB.user_id == user.id,
            ConnectedAccountDB.provider == prov_key
        ).first()

    if account:
        if connector and account.access_token_encrypted:
            plain_token = decrypt_token(account.access_token_encrypted)
            if plain_token:
                try:
                    connector.disconnect(plain_token)
                except Exception:
                    pass

        db.delete(account)

    if prov_key in ("google", "youtube"):
        db.query(CareerInterestSignalDB).filter(
            CareerInterestSignalDB.user_id == user.id,
            CareerInterestSignalDB.provider.in_(["google", "youtube"])
        ).delete()
    else:
        db.query(CareerInterestSignalDB).filter(
            CareerInterestSignalDB.user_id == user.id,
            CareerInterestSignalDB.provider == prov_key
        ).delete()

    db.commit()
    display_name = "Google / YouTube" if prov_key in ("google", "youtube") else prov_key.title()
    log_user_activity(db, user.id, f"Disconnected {display_name} from Career Radar", icon_type="target")

    return {
        "status": "disconnected",
        "provider": prov_key,
        "message": f"Successfully disconnected {display_name} and removed associated signals."
    }

@router.get("/career-radar/interests")
def get_career_radar_interests(user: UserDB = Depends(get_current_user), db: Session = Depends(get_db)):
    """Computes evidence-grounded career interest profile across all sources."""
    return calculate_career_interests(db, user.id)

@router.get("/career-radar/recommendations")
def get_career_radar_recommendations(user: UserDB = Depends(get_current_user), db: Session = Depends(get_db)):
    """Recommends career roles aligned with Career Radar signals."""
    return get_radar_career_recommendations(db, user.id)
