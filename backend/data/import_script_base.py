import json
import csv
import re
from sqlalchemy import create_engine, Column, Integer, String, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "sqlite:///./careerai.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class JobDB(Base):
    __tablename__ = "jobs"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    company = Column(String, index=True)
    location = Column(String)
    required_skills = Column(Text)
    salary = Column(String)
    job_type = Column(String, default="Full-time")
    experience_level = Column(String, default="Entry / Mid")
    description = Column(Text)
    logo_type = Column(String, default="default")
    match_score = Column(Integer, default=85)

Base.metadata.create_all(bind=engine)

SKILL_PATTERNS = [
    "Python", "SQL", "Machine Learning", "Deep Learning", "Data Analysis", "Statistics",
    "Pandas", "NumPy", "Scikit-learn", "TensorFlow", "PyTorch", "Tableau", "Power BI",
    "AWS", "Azure", "GCP", "Google Cloud", "BigQuery", "Snowflake", "Spark", "PySpark",
    "Kafka", "Airflow", "Databricks", "Hadoop", "Hive", "Docker", "Kubernetes", "Linux",
    "Java", "C++", "C#", "C", "Golang", "Go", "JavaScript", "TypeScript", "React", "Angular",
    "Node.js", "NodeJS", "HTML", "CSS", "PHP", "Laravel", "Flutter", "Android", "iOS",
    "Ruby", "Ruby on Rails", "Salesforce", "Apex", "LWC", "Visualforce", "Vlocity",
    "Shopify", "Liquid", "PL/SQL", "Oracle", "PostgreSQL", "MySQL", "MongoDB", "NoSQL",
    "SSIS", "SSRS", "Informatica", "ETL", "ELT", "Data Engineering", "Data Modeling",
    "Unity", "WebGL", "OpenGL", "Three.js", "Solidity", "Blockchain", "Smart Contracts",
    "Terraform", "CI/CD", "Git", "Jira", "Selenium", "DevOps", "Cybersecurity", "REST API",
    "NetSuite", "MarkLogic", "ServiceNow", "AEM", "Elasticsearch", "Liferay"
]

def extract_skills(text, title=""):
    combined = f"{title} {text}".lower()
    found = []
    for skill in SKILL_PATTERNS:
        pattern = r'\b' + re.escape(skill.lower()) + r'\b'
        if re.search(pattern, combined):
            norm_skill = skill
            if skill in ["NodeJS", "Node.js"]:
                norm_skill = "Node.js"
            elif skill in ["Go", "Golang"]:
                norm_skill = "Golang"
            elif skill in ["GCP", "Google Cloud"]:
                norm_skill = "GCP"
            if norm_skill not in found:
                found.append(norm_skill)
    return found[:8] if found else ["Python", "SQL", "Data Analysis"]

def clean_title(title):
    t = title.strip()
    t = re.sub(r'\(Remote\)\s*-\s*\$[\d,]+/year\s*USD', '', t, flags=re.IGNORECASE)
    t = re.sub(r'-\s*\$[\d,]+/year\s*USD', '', t, flags=re.IGNORECASE)
    t = re.sub(r'-\s*WFH', '', t, flags=re.IGNORECASE)
    t = re.sub(r',\s*Trilogy', '', t, flags=re.IGNORECASE)
    t = re.sub(r'\(Looking for only Immediate Joiners\)', '', t, flags=re.IGNORECASE)
    t = re.sub(r'\(Immediate Joiner.*?\)', '', t, flags=re.IGNORECASE)
    t = re.sub(r'\(Experienced\)', '', t, flags=re.IGNORECASE)
    t = re.sub(r'\[.*?\]', '', t)
    t = re.sub(r'HCL Hiring \|\|', '', t, flags=re.IGNORECASE)
    t = re.sub(r'TCS Hiring for', '', t, flags=re.IGNORECASE)
    t = re.sub(r'Hiring-', '', t, flags=re.IGNORECASE)
    t = re.sub(r'#.*', '', t)
    t = t.strip(' ,-"\'')
    return t if t else title.strip()

def clean_salary(title, details):
    m_usd = re.search(r'\$([\d,]+)/year\s*USD', f"{title} {details}", re.IGNORECASE)
    if m_usd:
        return f"${m_usd.group(1)}/yr USD"
    m_lpa = re.search(r'(\d+[\s\-\–\.]*\d*\s*LPA)', f"{title} {details}", re.IGNORECASE)
    if m_lpa:
        return f"₹{m_lpa.group(1).upper()}"
    m_inr = re.search(r'₹([\d,]+(?:\.\d+)?)\s*(?:per month|/month)', f"{title} {details}", re.IGNORECASE)
    if m_inr:
        return f"₹{m_inr.group(1)}/mo"
    return "Competitive"

def clean_location(loc, work_type=""):
    loc = (loc or "").strip().strip('"')
    if not loc or loc.lower() in ["india", ""]:
        return "Remote, India" if "remote" in (work_type or "").lower() else "Bangalore, India"
    loc = loc.replace(", India", "")
    parts = [p.strip() for p in loc.split(",") if p.strip()]
    if len(parts) >= 2:
        return f"{parts[0]}, India"
    elif len(parts) == 1:
        return f"{parts[0]}, India"
    return loc

def get_logo_type(company):
    c = company.lower()
    if "google" in c: return "google"
    if "microsoft" in c: return "microsoft"
    if "amazon" in c: return "amazon"
    if "crossover" in c or "trilogy" in c: return "crossover"
    if "tata" in c or "tcs" in c: return "tcs"
    if "uplers" in c: return "uplers"
    if "deloitte" in c: return "deloitte"
    if "wipro" in c: return "wipro"
    if "ltimindtree" in c or "larsen" in c or "lti" in c: return "lti"
    if "hcl" in c: return "hcl"
    if "infosys" in c: return "infosys"
    if "airtel" in c: return "airtel"
    return "default"