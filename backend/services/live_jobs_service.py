import json
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional
from database import SessionLocal, JobDB
from services.catalogs import SKILLS_CATALOG
from services.job_connectors import ALL_CONNECTORS

logger = logging.getLogger(__name__)

SKILL_NAMES = [s["name"] for s in SKILLS_CATALOG] + [
    "Python", "SQL", "FastAPI", "React", "Docker", "AWS", "Kubernetes", "TypeScript",
    "Node.js", "JavaScript", "Golang", "Go", "Java", "C++", "C#", "Rust", "PostgreSQL",
    "MongoDB", "Redis", "Kafka", "GraphQL", "Git", "CI/CD", "Linux", "PyTorch",
    "TensorFlow", "Pandas", "Scikit-Learn", "Machine Learning", "System Design"
]

def get_connectors_status() -> List[Dict[str, Any]]:
    """Returns health and authorization status of all job connectors."""
    statuses = []
    for conn in ALL_CONNECTORS:
        configured = conn.is_configured()
        statuses.append({
            "name": conn.name,
            "connected": configured,
            "status": "Connected" if configured else "Not Configured",
            "message": f"{conn.name} feed active." if configured else f"{conn.name} API credentials not configured in environment.",
            "auth_type": conn.source_type
        })
    return statuses

def sync_live_jobs(query: str = "", location: str = "") -> Dict[str, Any]:
    """
    Synchronizes real live job postings across all active connectors,
    deduplicating against existing records and persisting fresh listings.
    """
    db = SessionLocal()
    total_added = 0
    total_updated = 0
    now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")

    try:
        all_raw_jobs = []
        for connector in ALL_CONNECTORS:
            if connector.is_configured():
                try:
                    fetched = connector.fetch_jobs(query=query, location=location)
                    logger.info(f"Connector {connector.name} retrieved {len(fetched)} live jobs.")
                    all_raw_jobs.extend(fetched)
                except Exception as e:
                    logger.warning(f"Error fetching from connector {connector.name}: {e}")

        # Fetch existing live jobs for deduplication
        existing_jobs = db.query(JobDB).filter(JobDB.is_live == True).all()
        existing_signatures = set()
        for ej in existing_jobs:
            sig = f"{ej.company.lower().strip()}||{ej.title.lower().strip()}||{ej.location.lower().strip()}"
            existing_signatures.add(sig)

        seen_in_batch = set()

        for j in all_raw_jobs:
            sig = f"{j['company'].lower().strip()}||{j['title'].lower().strip()}||{j['location'].lower().strip()}"
            if sig in seen_in_batch:
                continue
            seen_in_batch.add(sig)

            if sig in existing_signatures:
                # Update timestamp
                existing_match = db.query(JobDB).filter(
                    JobDB.is_live == True,
                    JobDB.company == j['company'],
                    JobDB.title == j['title']
                ).first()
                if existing_match:
                    existing_match.posted_at = j.get('posted_at') or existing_match.posted_at
                    total_updated += 1
                continue

            # Format and sanitize fields
            job_type_val = j.get("job_type", "Full-time")
            if isinstance(job_type_val, list):
                job_type_val = ", ".join(str(x) for x in job_type_val)

            exp_val = j.get("experience_level", "Mid / Senior")
            if isinstance(exp_val, list):
                exp_val = ", ".join(str(x) for x in exp_val)

            skills_val = j.get("skills", ["Python", "JavaScript"])
            if not isinstance(skills_val, list):
                skills_val = [str(skills_val)]

            # Add new live job
            new_job = JobDB(
                title=str(j["title"]),
                company=str(j["company"]),
                location=str(j.get("location", "Remote")),
                required_skills=json.dumps(skills_val),
                salary=str(j.get("salary", "Competitive")),
                job_type=str(job_type_val or "Full-time"),
                experience_level=str(exp_val or "Mid / Senior"),
                description=str(j.get("description", "")),
                logo_type="default",
                match_score=85,
                source=str(j.get("source", "Live API")),
                url=str(j.get("url", "")),
                is_live=True,
                posted_at=str(j.get("posted_at") or "Recently"),
                remote=bool(j.get("remote")),
                created_at=datetime.utcnow()
            )
            db.add(new_job)
            existing_signatures.add(sig)
            total_added += 1

        db.commit()

        total_live_in_db = db.query(JobDB).filter(JobDB.is_live == True).count()
        total_in_db = db.query(JobDB).count()

        return {
            "status": "success",
            "new_jobs_added": total_added,
            "jobs_updated": total_updated,
            "total_live_jobs": total_live_in_db,
            "total_jobs": total_in_db,
            "last_synced_at": now_str,
            "message": f"Successfully synchronized {total_added} fresh live jobs from active connectors."
        }

    except Exception as e:
        db.rollback()
        logger.error(f"Live job synchronization error: {e}")
        return {
            "status": "error",
            "message": f"Live synchronization error: {str(e)}",
            "new_jobs_added": 0
        }
    finally:
        db.close()
