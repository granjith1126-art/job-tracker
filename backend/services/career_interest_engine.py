import json
from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from database import UserDB, UserProfileDB, ResumeRecordDB, ConnectedAccountDB, CareerInterestSignalDB
from services.catalogs import CAREER_ROLES_CATALOG

CANONICAL_ALIASES = {
    "ml": "Machine Learning",
    "machine-learning": "Machine Learning",
    "deep learning": "Deep Learning",
    "deep-learning": "Deep Learning",
    "ai": "Artificial Intelligence",
    "genai": "Generative AI",
    "llm": "LLMs",
    "llms": "LLMs",
    "nlp": "Natural Language Processing",
    "cv": "Computer Vision",
    "tf": "TensorFlow",
    "tensorflow": "TensorFlow",
    "pytorch": "PyTorch",
    "scikit-learn": "Scikit-Learn",
    "sklearn": "Scikit-Learn",
    "react": "React",
    "reactjs": "React",
    "react.js": "React",
    "nextjs": "Next.js",
    "next.js": "Next.js",
    "node": "Node.js",
    "nodejs": "Node.js",
    "fastapi": "FastAPI",
    "fast-api": "FastAPI",
    "django": "Django",
    "flask": "Flask",
    "postgres": "PostgreSQL",
    "postgresql": "PostgreSQL",
    "mongo": "MongoDB",
    "mongodb": "MongoDB",
    "k8s": "Kubernetes",
    "kubernetes": "Kubernetes",
    "aws": "AWS",
    "docker": "Docker",
    "golang": "Go",
    "python": "Python",
    "javascript": "JavaScript",
    "typescript": "TypeScript",
    "sql": "SQL"
}

CAREER_DOMAINS = [
    {
        "id": "ai-ml",
        "name": "AI & Machine Learning",
        "keywords": ["machine learning", "deep learning", "artificial intelligence", "pytorch", "tensorflow", "nlp", "llms", "scikit-learn", "generative ai"],
        "target_roles": ["Machine Learning Engineer", "AI Engineer", "Data Scientist"]
    },
    {
        "id": "backend",
        "name": "Backend Engineering",
        "keywords": ["python", "fastapi", "django", "node.js", "postgresql", "sql", "apis", "rest", "docker", "databases", "system design", "go"],
        "target_roles": ["Backend Developer", "Software Engineer"]
    },
    {
        "id": "data-engineering",
        "name": "Data Engineering",
        "keywords": ["data engineering", "spark", "kafka", "etl", "airflow", "sql", "pandas", "snowflake", "bigquery", "data warehousing"],
        "target_roles": ["Data Engineer", "Data Scientist"]
    },
    {
        "id": "cloud-devops",
        "name": "Cloud & DevOps",
        "keywords": ["cloud", "devops", "docker", "kubernetes", "aws", "ci/cd", "linux", "infrastructure", "terraform"],
        "target_roles": ["DevOps Engineer", "Cloud Architect"]
    },
    {
        "id": "frontend-fullstack",
        "name": "Frontend & Full Stack",
        "keywords": ["react", "javascript", "typescript", "next.js", "html", "css", "tailwind css", "frontend", "full stack", "redux"],
        "target_roles": ["Frontend Developer", "Full Stack Developer"]
    }
]

def normalize_skill_name(raw_name: str) -> str:
    cleaned = raw_name.strip().lower()
    return CANONICAL_ALIASES.get(cleaned, raw_name.strip().title())

def calculate_career_interests(db: Session, user_id: int) -> Dict[str, Any]:
    profile = db.query(UserProfileDB).filter(UserProfileDB.user_id == user_id).first()
    resume = db.query(ResumeRecordDB).filter(ResumeRecordDB.user_id == user_id).order_by(ResumeRecordDB.id.desc()).first()
    signals = db.query(CareerInterestSignalDB).filter(CareerInterestSignalDB.user_id == user_id).all()
    accounts = db.query(ConnectedAccountDB).filter(ConnectedAccountDB.user_id == user_id).all()

    profile_skills = json.loads(profile.skills) if (profile and profile.skills) else []
    resume_skills = []
    if resume and resume.extracted_data:
        try:
            r_data = json.loads(resume.extracted_data)
            resume_skills = r_data.get("skills", []) if isinstance(r_data, dict) else []
        except Exception:
            resume_skills = []

    all_evidence = []
    # Profile Evidence
    for s in profile_skills:
        all_evidence.append({
            "source": "Profile",
            "type": "verified_skill",
            "value": normalize_skill_name(s),
            "weight": 0.8
        })

    # Resume Evidence
    for s in resume_skills:
        all_evidence.append({
            "source": "Resume",
            "type": "extracted_skill",
            "value": normalize_skill_name(s),
            "weight": 1.0
        })

    # External Provider Signals
    for sig in signals:
        all_evidence.append({
            "source": sig.provider.title(),
            "type": sig.signal_type,
            "value": normalize_skill_name(sig.signal_value),
            "weight": sig.strength * (1.2 if sig.provider == "github" else 0.9),
            "ref": sig.source_reference
        })

    # Calculate domain scores and evidence
    domain_results = []
    for domain in CAREER_DOMAINS:
        kw_set = set(k.lower() for k in domain["keywords"])
        matching_items = []
        source_set = set()

        for ev in all_evidence:
            val_lower = ev["value"].lower()
            if any(kw in val_lower or val_lower in kw for kw in kw_set):
                matching_items.append(ev)
                source_set.add(ev["source"])

        # Deterministic explainable formula:
        if matching_items:
            total_weight = sum(item["weight"] for item in matching_items)
            # Scaling formula
            score = min(96, round(35 + (total_weight * 7.5)))
            conf_score = min(0.96, round(0.55 + (len(source_set) * 0.12) + (len(matching_items) * 0.03), 2))
        else:
            score = 15
            conf_score = 0.30

        evidence_bullets = []
        for src in source_set:
            src_items = [it for it in matching_items if it["source"] == src]
            sample_techs = ", ".join(list(dict.fromkeys(it["value"] for it in src_items))[:3])
            evidence_bullets.append(f"✓ {src}: Demonstrated {sample_techs}")

        domain_results.append({
            "domain_id": domain["id"],
            "domain_name": domain["name"],
            "score": score,
            "confidence": conf_score,
            "confidence_label": "High Confidence" if conf_score >= 0.75 else "Medium Confidence" if conf_score >= 0.5 else "Initial Signal",
            "evidence": evidence_bullets if evidence_bullets else ["No specific projects or skills logged yet for this domain."],
            "sources": list(source_set) if source_set else ["Platform Benchmark"],
            "target_roles": domain["target_roles"]
        })

    # Sort domains by score descending
    domain_results.sort(key=lambda x: x["score"], reverse=True)

    return {
        "user_id": user_id,
        "career_interests": domain_results,
        "top_career_domain": domain_results[0]["domain_name"] if domain_results else "Software Engineering",
        "total_connected_accounts": len(accounts),
        "total_signals_detected": len(signals),
        "updated_at": datetime.utcnow().isoformat()
    }

def get_radar_career_recommendations(db: Session, user_id: int) -> List[Dict[str, Any]]:
    interests_data = calculate_career_interests(db, user_id)
    domains = interests_data["career_interests"]
    top_domain = domains[0] if domains else None

    profile = db.query(UserProfileDB).filter(UserProfileDB.user_id == user_id).first()
    user_skills_set = set(s.lower() for s in (json.loads(profile.skills) if (profile and profile.skills) else []))

    recs = []
    for role in CAREER_ROLES_CATALOG:
        # Match against domain
        matching_domain = next((d for d in domains if any(role["title"].lower() in tr.lower() for tr in d["target_roles"])), None)
        domain_score = matching_domain["score"] if matching_domain else 50
        
        core_skills = role["core_skills"]
        matched = [s for s in core_skills if s.lower() in user_skills_set]
        missing = [s for s in core_skills if s.lower() not in user_skills_set]

        fit_score = min(98, round(domain_score * 0.6 + (len(matched) / max(len(core_skills), 1)) * 40))

        recs.append({
            "id": role["id"],
            "title": role["title"],
            "category": role["category"],
            "fit_score": fit_score,
            "confidence": matching_domain["confidence_label"] if matching_domain else "Medium Confidence",
            "why_this_fits": f"High interest signal detected in {matching_domain['domain_name'] if matching_domain else 'Software Engineering'} with matching skills in {', '.join(matched[:3]) or 'core foundations'}.",
            "evidence": matching_domain["evidence"] if matching_domain else ["Based on skills alignment"],
            "missing_skills": missing[:4],
            "recommended_next_action": f"Practice {missing[0]} on Coding Workspace" if missing else "Run a targeted Aira Mock Interview"
        })

    recs.sort(key=lambda x: x["fit_score"], reverse=True)
    return recs
