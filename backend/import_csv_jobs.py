import csv
import json
import re
from database import SessionLocal, JobDB, Base, engine

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
    "Terraform", "CI/CD", "Git", "Jira", "Selenium", "DevOps", "Cybersecurity", "REST API"
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

def clean_salary(title, details, raw_salary=""):
    if raw_salary and raw_salary.strip():
        return raw_salary.strip()
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

def import_jobs_from_csv(csv_path):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    with open(csv_path, 'r', encoding='utf-8', errors='replace') as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    print(f"Total rows read from CSV: {len(rows)}")

    seen_keys = set()
    cleaned_jobs = []

    for idx, row in enumerate(rows):
        raw_title = row.get("job") or row.get("title") or ""
        company = (row.get("company_name") or row.get("company") or "").strip()
        raw_loc = row.get("location") or ""
        work_type = row.get("work_type") or ""
        full_time_remote = row.get("full_time_remote") or ""
        job_details = row.get("job_details") or row.get("description") or ""

        if not raw_title or not company:
            continue

        title = clean_title(raw_title)
        location = clean_location(raw_loc, work_type)
        salary = clean_salary(raw_title, job_details)
        skills = extract_skills(job_details, title)
        logo_type = get_logo_type(company)
        
        dedup_key = (title.lower(), company.lower(), location.lower())
        if dedup_key in seen_keys:
            continue
        seen_keys.add(dedup_key)

        exp_level = "Mid-Senior level" if "mid-senior" in full_time_remote.lower() else (
            "Entry level" if "entry" in full_time_remote.lower() or "internship" in full_time_remote.lower() else "Associate / Mid"
        )
        
        job_type = "Contract" if "contract" in full_time_remote.lower() or "contract" in work_type.lower() else (
            "Internship" if "internship" in full_time_remote.lower() or "intern" in title.lower() else "Full-time"
        )

        job_obj = {
            "title": title,
            "company": company,
            "location": location,
            "required_skills": skills,
            "salary": salary,
            "job_type": job_type,
            "experience_level": exp_level,
            "description": job_details.strip() or f"{title} position at {company}.",
            "logo_type": logo_type,
            "match_score": 85
        }
        cleaned_jobs.append(job_obj)

    print(f"Cleaned and deduplicated jobs: {len(cleaned_jobs)}")

    # Clear and insert into JobDB
    db.query(JobDB).delete()
    for j in cleaned_jobs:
        db_job = JobDB(
            title=j["title"],
            company=j["company"],
            location=j["location"],
            required_skills=json.dumps(j["required_skills"]),
            salary=j["salary"],
            job_type=j["job_type"],
            experience_level=j["experience_level"],
            description=j["description"],
            logo_type=j["logo_type"],
            match_score=j["match_score"]
        )
        db.add(db_job)
    
    db.commit()
    print(f"Successfully inserted {len(cleaned_jobs)} jobs into SQLite database!")

    with open("demo_jobs.json", "w", encoding="utf-8") as f:
        json.dump(cleaned_jobs, f, indent=2)
    print("Saved to demo_jobs.json")

    db.close()

if __name__ == "__main__":
    import sys
    csv_file = sys.argv[1] if len(sys.argv) > 1 else "data/uploaded_jobs.csv"
    import_jobs_from_csv(csv_file)