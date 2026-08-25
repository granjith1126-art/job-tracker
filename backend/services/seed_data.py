import json
import os
from database import SessionLocal, JobDB, CodingProblemDB, MockTestDB
from services.seed_coding_and_tests import seed as seed_coding_and_tests

def seed_database():
    db = SessionLocal()
    try:
        # Seed jobs from demo_jobs.json if empty
        if db.query(JobDB).count() == 0:
            json_path = os.path.join(os.path.dirname(__file__), "..", "demo_jobs.json")
            if os.path.exists(json_path):
                with open(json_path, "r", encoding="utf-8") as jf:
                    jobs_data = json.load(jf)
                for item in jobs_data:
                    job = JobDB(
                        title=item["title"],
                        company=item["company"],
                        location=item["location"],
                        required_skills=json.dumps(item["required_skills"]),
                        salary=item["salary"],
                        job_type=item["job_type"],
                        experience_level=item["experience_level"],
                        description=item["description"],
                        logo_type=item["logo_type"],
                        match_score=item.get("match_score", 85)
                    )
                    db.add(job)
                db.commit()
                print(f"Seeded {len(jobs_data)} jobs.")

        # Seed coding problems and mock tests
        seed_coding_and_tests()

    except Exception as e:
        print(f"Error during seeding: {e}")
    finally:
        db.close()