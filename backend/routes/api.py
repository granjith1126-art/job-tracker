import json
from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, Query, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import (
    get_db, UserDB, UserProfileDB, JobDB, JobApplicationDB, ActivityDB, NotificationDB,
    ResumeRecordDB, CodingProblemDB, CodingSubmissionDB, MockTestDB, MockTestAttemptDB
)
from services.auth import (
    hash_password, verify_password, create_access_token,
    get_current_user, get_optional_user
)
from services.catalogs import SKILLS_CATALOG, CAREER_ROLES_CATALOG
from services.resume_parser import parse_resume
from services.recommendation_engine import (
    calculate_career_predictions,
    calculate_skill_gap,
    calculate_job_match
)
from services.code_executor import execute_python_code

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

    # Dynamic predictions
    predictions = calculate_career_predictions(skills, exp_years, interests, profile.education if profile else "")
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
    gap_info = calculate_skill_gap(target_role_id, skills)

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

    predictions = calculate_career_predictions(skills, exp_years, interests, profile.education if profile else "")
    return {
        "top_match_role": predictions[0]["title"] if predictions else "Software Engineer",
        "top_match_percentage": predictions[0]["match"] if predictions else 50,
        "predictions": predictions
    }

@router.get("/career/skill-gap")
def get_skill_gap(role: str = Query(default="software-engineer"), user: UserDB = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(UserProfileDB).filter(UserProfileDB.user_id == user.id).first()
    skills = json.loads(profile.skills) if (profile and profile.skills) else []
    return calculate_skill_gap(role, skills)

# -------------------------------------------------------------
# JOBS & APPLICATIONS (DATASET + USER ISOLATED)
# -------------------------------------------------------------
@router.get("/jobs")
def get_jobs(
    search: Optional[str] = None,
    location: Optional[str] = None,
    job_type: Optional[str] = None,
    user: Optional[UserDB] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    user_skills = []
    if user:
        profile = db.query(UserProfileDB).filter(UserProfileDB.user_id == user.id).first()
        if profile and profile.skills:
            user_skills = json.loads(profile.skills)

    query = db.query(JobDB)
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

    jobs = query.all()
    results = []
    for j in jobs:
        j_dict = j.to_dict()
        j_dict["match_score"] = calculate_job_match(j_dict["required_skills"], user_skills)
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
