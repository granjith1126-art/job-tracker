import json
from datetime import datetime
from sqlalchemy import create_engine, Column, Integer, String, Float, Text, DateTime, ForeignKey, Boolean
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
            "match_score": self.match_score
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
    status = Column(String, default="Applied")  # Applied, Interview, Offer, Rejected
    date_applied = Column(String)
    notes = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("UserDB", back_populates="applications")

    def to_dict(self):
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

from sqlalchemy import text

def init_db():
    Base.metadata.create_all(bind=engine)
    # Safe SQLite column migrations
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE user_profiles ADD COLUMN avatar_url TEXT DEFAULT ''"))
            conn.commit()
        except Exception:
            pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()