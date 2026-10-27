import json
from datetime import datetime, timedelta
from sqlalchemy import create_engine, Column, Integer, String, Float, Text, DateTime, ForeignKey, Boolean, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship

DATABASE_URL = "sqlite:///./careerai.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class UserDB(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    profile = relationship("UserProfileDB", back_populates="user", uselist=False, cascade="all, delete-orphan")
    applications = relationship("JobApplicationDB", back_populates="user", cascade="all, delete-orphan")
    activities = relationship("ActivityDB", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("NotificationDB", back_populates="user", cascade="all, delete-orphan")
    submissions = relationship("CodingSubmissionDB", back_populates="user", cascade="all, delete-orphan")
    mock_attempts = relationship("MockTestAttemptDB", back_populates="user", cascade="all, delete-orphan")
    interview_sessions = relationship("InterviewSessionDB", back_populates="user", cascade="all, delete-orphan")
    connected_accounts = relationship("ConnectedAccountDB", back_populates="user", cascade="all, delete-orphan")
    career_signals = relationship("CareerInterestSignalDB", back_populates="user", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

class UserProfileDB(Base):
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, index=True, nullable=True)
    name = Column(String, default="")
    email = Column(String, default="")
    phone = Column(String, default="")
    location = Column(String, default="")
    avatar_url = Column(Text, default="")
    education = Column(String, default="")
    university = Column(String, default="")
    cgpa = Column(Float, default=0.0)
    graduation_year = Column(Integer, default=2025)
    skills = Column(Text, default="[]")  # JSON string list
    interests = Column(Text, default="[]")  # JSON string list
    target_role = Column(String, default="Machine Learning Engineer")
    experience_years = Column(Float, default=0.0)
    experience_summary = Column(Text, default="")
    bio = Column(Text, default="")
    updated_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("UserDB", back_populates="profile")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "name": self.name,
            "email": self.email,
            "phone": self.phone,
            "location": self.location,
            "avatar_url": self.avatar_url or "",
            "education": self.education,
            "university": self.university,
            "cgpa": self.cgpa,
            "graduation_year": self.graduation_year,
            "skills": json.loads(self.skills) if self.skills else [],
            "interests": json.loads(self.interests) if self.interests else [],
            "target_role": self.target_role,
            "experience_years": self.experience_years,
            "experience_summary": self.experience_summary,
            "bio": self.bio,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }

class NotificationDB(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text, default="")
    icon_type = Column(String, default="bell")  # bell, file, user, zap, briefcase, check, code, target, camera
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("UserDB", back_populates="notifications")

    def to_dict(self):
        now = datetime.utcnow()
        diff = (now - self.created_at).total_seconds() if self.created_at else 0
        if diff < 60:
            time_ago = "Just now"
        elif diff < 3600:
            mins = int(diff // 60)
            time_ago = f"{mins}m ago"
        elif diff < 86400:
            hrs = int(diff // 3600)
            time_ago = f"{hrs}h ago"
        else:
            days = int(diff // 86400)
            time_ago = f"{days}d ago"

        return {
            "id": self.id,
            "user_id": self.user_id,
            "title": self.title,
            "message": self.message,
            "icon_type": self.icon_type,
            "is_read": self.is_read,
            "time_ago": time_ago,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class JobDB(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    company = Column(String, index=True)
    location = Column(String)
    required_skills = Column(Text)  # JSON string
    salary = Column(String)
    job_type = Column(String, default="Full-time")
    experience_level = Column(String, default="Entry / Mid")
    description = Column(Text)
    logo_type = Column(String, default="default")
    match_score = Column(Integer, default=85)
    source = Column(String, default="Job Dataset")  # "Job Dataset", "RemoteOK", "Jobicy", "Arbeitnow", etc.
    url = Column(Text, default="")
    is_live = Column(Boolean, default=False)
    posted_at = Column(String, default="")
    remote = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "company": self.company,
            "location": self.location,
            "required_skills": json.loads(self.required_skills) if self.required_skills else [],
            "salary": self.salary,
            "job_type": self.job_type,
            "experience_level": self.experience_level,
            "description": self.description,
            "logo_type": self.logo_type,
            "match_score": self.match_score,
            "source": self.source or "Job Dataset",
            "url": self.url or "",
            "is_live": bool(self.is_live),
            "posted_at": self.posted_at or "",
            "remote": bool(self.remote)
        }

class JobApplicationDB(Base):
    __tablename__ = "job_applications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=True)
    job_id = Column(Integer, nullable=True)
    role = Column(String, nullable=False)
    company = Column(String, nullable=False)
    location = Column(String, default="Remote")
    salary = Column(String, default="Competitive")
    status = Column(String, default="Applied")  # Applied, Interview, Offer
    date_applied = Column(String)
    applied_at = Column(DateTime, default=datetime.utcnow, nullable=True)
    expires_at = Column(DateTime, nullable=True, index=True)
    url = Column(Text, default="")
    notes = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("UserDB", back_populates="applications")

    def to_dict(self):
        now = datetime.utcnow()
        days_remaining = None
        if self.expires_at:
            delta = self.expires_at - now
            days_remaining = max(0, delta.days)

        return {
            "id": self.id,
            "user_id": self.user_id,
            "job_id": self.job_id,
            "role": self.role,
            "company": self.company,
            "location": self.location,
            "salary": self.salary,
            "status": self.status,
            "date_applied": self.date_applied,
            "applied_at": self.applied_at.isoformat() if self.applied_at else (self.created_at.isoformat() if self.created_at else None),
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            "days_remaining": days_remaining,
            "url": self.url or "",
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

class ActivityDB(Base):
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=True)
    title = Column(String, nullable=False)
    icon_type = Column(String, default="file")
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("UserDB", back_populates="activities")

    def to_dict(self):
        # Format human friendly relative time
        now = datetime.utcnow()
        diff = (now - self.created_at).total_seconds() if self.created_at else 0
        if diff < 60:
            time_ago = "Just now"
        elif diff < 3600:
            mins = int(diff // 60)
            time_ago = f"{mins}m ago"
        elif diff < 86400:
            hrs = int(diff // 3600)
            time_ago = f"{hrs}h ago"
        else:
            days = int(diff // 86400)
            time_ago = f"{days}d ago"

        return {
            "id": self.id,
            "user_id": self.user_id,
            "title": self.title,
            "time_ago": time_ago,
            "icon_type": self.icon_type,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

class ResumeRecordDB(Base):
    __tablename__ = "resume_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    filename = Column(String, nullable=False)
    raw_text = Column(Text, default="")
    extracted_data = Column(Text, default="{}")  # JSON string
    uploaded_at = Column(DateTime, default=datetime.utcnow)

class CodingProblemDB(Base):
    __tablename__ = "coding_problems"

    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String, unique=True, index=True, nullable=False)
    title = Column(String, nullable=False)
    difficulty = Column(String, default="Easy")  # Easy, Medium, Hard
    category = Column(String, default="Algorithms")
    tags = Column(Text, default="[]")  # JSON array
    description = Column(Text, nullable=False)
    input_format = Column(Text, default="")
    output_format = Column(Text, default="")
    constraints = Column(Text, default="[]")  # JSON array
    examples = Column(Text, default="[]")  # JSON array of {input, output, explanation}
    starter_code = Column(Text, default="{}")  # JSON {python, javascript, java, cpp}
    test_cases = Column(Text, default="[]")  # JSON array of {input, expected_output, hidden}

    def to_dict(self):
        return {
            "id": self.id,
            "slug": self.slug,
            "title": self.title,
            "difficulty": self.difficulty,
            "category": self.category,
            "tags": json.loads(self.tags) if self.tags else [],
            "description": self.description,
            "input_format": self.input_format,
            "output_format": self.output_format,
            "constraints": json.loads(self.constraints) if self.constraints else [],
            "examples": json.loads(self.examples) if self.examples else [],
            "starter_code": json.loads(self.starter_code) if self.starter_code else {},
        }

class CodingSubmissionDB(Base):
    __tablename__ = "coding_submissions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    problem_id = Column(Integer, ForeignKey("coding_problems.id"), index=True, nullable=False)
    code = Column(Text, nullable=False)
    language = Column(String, default="python")
    status = Column(String, default="Accepted")  # Accepted, Wrong Answer, Runtime Error, Time Limit Exceeded
    test_cases_passed = Column(Integer, default=0)
    total_test_cases = Column(Integer, default=0)
    runtime_ms = Column(Integer, default=0)
    memory_kb = Column(Integer, default=0)
    output_logs = Column(Text, default="")
    submitted_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("UserDB", back_populates="submissions")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "problem_id": self.problem_id,
            "code": self.code,
            "language": self.language,
            "status": self.status,
            "test_cases_passed": self.test_cases_passed,
            "total_test_cases": self.total_test_cases,
            "runtime_ms": self.runtime_ms,
            "submitted_at": self.submitted_at.isoformat() if self.submitted_at else None
        }

class MockTestDB(Base):
    __tablename__ = "mock_tests"

    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String, unique=True, index=True, nullable=False)
    title = Column(String, nullable=False)
    category = Column(String, nullable=False)
    difficulty = Column(String, default="Medium")
    duration_minutes = Column(Integer, default=30)
    description = Column(Text, default="")
    questions = Column(Text, default="[]")  # JSON array of questions

    def to_dict(self):
        q_list = json.loads(self.questions) if self.questions else []
        return {
            "id": self.id,
            "slug": self.slug,
            "title": self.title,
            "category": self.category,
            "difficulty": self.difficulty,
            "duration_minutes": self.duration_minutes,
            "description": self.description,
            "total_questions": len(q_list),
            "questions": [
                {
                    "id": q.get("id"),
                    "question": q.get("question"),
                    "options": q.get("options", []),
                    "category": q.get("category", "")
                } for q in q_list
            ]
        }

class MockTestAttemptDB(Base):
    __tablename__ = "mock_test_attempts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    test_id = Column(Integer, ForeignKey("mock_tests.id"), index=True, nullable=False)
    score_percentage = Column(Float, default=0.0)
    total_questions = Column(Integer, default=0)
    correct_answers = Column(Integer, default=0)
    answers = Column(Text, default="{}")  # JSON map of question_id -> chosen option index
    time_spent_seconds = Column(Integer, default=0)
    completed_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("UserDB", back_populates="mock_attempts")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "test_id": self.test_id,
            "score_percentage": self.score_percentage,
            "total_questions": self.total_questions,
            "correct_answers": self.correct_answers,
            "answers": json.loads(self.answers) if self.answers else {},
            "time_spent_seconds": self.time_spent_seconds,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None
        }

class InterviewSessionDB(Base):
    __tablename__ = "interview_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    target_role = Column(String, nullable=False, default="Software Engineer")
    interview_type = Column(String, default="Technical")  # HR, Behavioral, Technical, Coding, System Design, Mixed
    difficulty = Column(String, default="Medium")  # Easy, Medium, Hard
    experience_level = Column(String, default="Junior")  # Fresher, Junior, Mid-Level, Senior
    overall_score = Column(Float, default=0.0)
    technical_score = Column(Float, default=0.0)
    communication_score = Column(Float, default=0.0)
    problem_solving_score = Column(Float, default=0.0)
    answer_quality_score = Column(Float, default=0.0)
    role_readiness_score = Column(Float, default=0.0)
    strengths = Column(Text, default="[]")  # JSON list
    weaknesses = Column(Text, default="[]")  # JSON list
    good_questions = Column(Text, default="[]")  # JSON list of strings
    improvement_questions = Column(Text, default="[]")  # JSON list of strings
    topics_to_study = Column(Text, default="[]")  # JSON list of strings
    recommended_next = Column(String, default="")
    status = Column(String, default="in_progress")  # in_progress, completed, abandoned
    duration_seconds = Column(Integer, default=0)
    total_questions = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    user = relationship("UserDB", back_populates="interview_sessions")
    turns = relationship("InterviewTurnDB", back_populates="session", cascade="all, delete-orphan", order_by="InterviewTurnDB.turn_index")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "target_role": self.target_role,
            "interview_type": self.interview_type,
            "difficulty": self.difficulty,
            "experience_level": self.experience_level,
            "overall_score": self.overall_score,
            "technical_score": self.technical_score,
            "communication_score": self.communication_score,
            "problem_solving_score": self.problem_solving_score,
            "answer_quality_score": self.answer_quality_score,
            "role_readiness_score": self.role_readiness_score,
            "strengths": json.loads(self.strengths) if self.strengths else [],
            "weaknesses": json.loads(self.weaknesses) if self.weaknesses else [],
            "good_questions": json.loads(self.good_questions) if self.good_questions else [],
            "improvement_questions": json.loads(self.improvement_questions) if self.improvement_questions else [],
            "topics_to_study": json.loads(self.topics_to_study) if self.topics_to_study else [],
            "recommended_next": self.recommended_next or "",
            "status": self.status,
            "duration_seconds": self.duration_seconds,
            "total_questions": self.total_questions or len(self.turns),
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "turns": [turn.to_dict() for turn in self.turns] if self.turns else []
        }

class InterviewTurnDB(Base):
    __tablename__ = "interview_turns"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("interview_sessions.id"), index=True, nullable=False)
    turn_index = Column(Integer, nullable=False, default=1)
    ai_question = Column(Text, nullable=False)
    user_answer = Column(Text, default="")
    feedback = Column(Text, default="")
    evaluation_scores = Column(Text, default="{}")  # JSON {technical, communication, problem_solving, relevance, clarity}
    created_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("InterviewSessionDB", back_populates="turns")

    def to_dict(self):
        return {
            "id": self.id,
            "session_id": self.session_id,
            "turn_index": self.turn_index,
            "ai_question": self.ai_question,
            "user_answer": self.user_answer or "",
            "feedback": self.feedback or "",
            "evaluation_scores": json.loads(self.evaluation_scores) if self.evaluation_scores else {},
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

from sqlalchemy import text


class ConnectedAccountDB(Base):
    __tablename__ = "connected_accounts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    provider = Column(String, index=True, nullable=False)  # github, google, youtube, instagram
    provider_user_id = Column(String, default="")
    display_name = Column(String, default="")
    username = Column(String, default="")
    profile_url = Column(String, default="")
    avatar_url = Column(String, default="")
    account_type = Column(String, default="personal")
    scopes = Column(Text, default="[]")  # JSON list
    access_token_encrypted = Column(Text, nullable=True)  # Fernet encrypted
    refresh_token_encrypted = Column(Text, nullable=True)  # Fernet encrypted
    token_expires_at = Column(DateTime, nullable=True)
    connected_at = Column(DateTime, default=datetime.utcnow)
    last_synced_at = Column(DateTime, nullable=True)
    sync_status = Column(String, default="connected")  # connected, synced, error, rate_limited
    error_message = Column(Text, default="")

    user = relationship("UserDB", back_populates="connected_accounts")

    def to_safe_dict(self):
        """Returns public safe information without exposing tokens or secrets."""
        return {
            "id": self.id,
            "provider": self.provider,
            "provider_user_id": self.provider_user_id,
            "display_name": self.display_name,
            "username": self.username,
            "profile_url": self.profile_url,
            "avatar_url": self.avatar_url or "",
            "account_type": self.account_type,
            "scopes": json.loads(self.scopes) if self.scopes else [],
            "connected_at": self.connected_at.isoformat() if self.connected_at else None,
            "last_synced_at": self.last_synced_at.isoformat() if self.last_synced_at else None,
            "sync_status": self.sync_status,
            "error_message": self.error_message or ""
        }

class CareerInterestSignalDB(Base):
    __tablename__ = "career_interest_signals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    provider = Column(String, index=True, nullable=False)
    signal_type = Column(String, nullable=False)  # programming_language, technology, topic
    signal_value = Column(String, nullable=False)
    strength = Column(Float, default=0.5)
    confidence = Column(Float, default=0.8)
    source_reference = Column(Text, default="")
    observed_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("UserDB", back_populates="career_signals")

    def to_dict(self):
        return {
            "id": self.id,
            "provider": self.provider,
            "signal_type": self.signal_type,
            "signal_value": self.signal_value,
            "strength": self.strength,
            "confidence": self.confidence,
            "source_reference": self.source_reference,
            "observed_at": self.observed_at.isoformat() if self.observed_at else None
        }

def init_db():
    Base.metadata.create_all(bind=engine)
    # Safe SQLite column migrations for existing databases
    with engine.connect() as conn:
        migrations = [
            "ALTER TABLE user_profiles ADD COLUMN avatar_url TEXT DEFAULT ''",
            "ALTER TABLE connected_accounts ADD COLUMN avatar_url TEXT DEFAULT ''",
            "ALTER TABLE jobs ADD COLUMN source TEXT DEFAULT 'Job Dataset'",
            "ALTER TABLE jobs ADD COLUMN url TEXT DEFAULT ''",
            "ALTER TABLE jobs ADD COLUMN is_live BOOLEAN DEFAULT 0",
            "ALTER TABLE jobs ADD COLUMN posted_at TEXT DEFAULT ''",
            "ALTER TABLE jobs ADD COLUMN remote BOOLEAN DEFAULT 0",
            "ALTER TABLE jobs ADD COLUMN created_at DATETIME",
            "ALTER TABLE job_applications ADD COLUMN applied_at DATETIME",
            "ALTER TABLE job_applications ADD COLUMN expires_at DATETIME",
            "ALTER TABLE job_applications ADD COLUMN url TEXT DEFAULT ''"
        ]
        for sql in migrations:
            try:
                conn.execute(text(sql))
                conn.commit()
            except Exception:
                pass

        # Backfill policy for existing applications without expiration timestamps:
        # 1. Backfill applied_at = COALESCE(created_at, CURRENT_TIMESTAMP)
        # 2. Backfill expires_at = datetime(applied_at, '+30 days')
        try:
            conn.execute(text("""
                UPDATE job_applications
                SET applied_at = COALESCE(created_at, CURRENT_TIMESTAMP)
                WHERE applied_at IS NULL
            """))
            conn.execute(text("""
                UPDATE job_applications
                SET expires_at = datetime(applied_at, '+30 days')
                WHERE expires_at IS NULL
            """))
            conn.commit()
        except Exception:
            pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()