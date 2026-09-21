import httpx
import logging
from typing import List, Dict, Any
from .base import BaseJobConnector

logger = logging.getLogger(__name__)

class JobicyConnector(BaseJobConnector):
    def __init__(self):
        super().__init__(name="Jobicy", source_type="public_api")

    def is_configured(self) -> bool:
        return True  # Open Public API

    def fetch_jobs(self, query: str = "", location: str = "") -> List[Dict[str, Any]]:
        jobs = []
        try:
            with httpx.Client(timeout=12.0) as client:
                res = client.get("https://jobicy.com/api/v2/remote-jobs?count=25&tag=engineering")
                if res.status_code == 200:
                    data = res.json()
                    items = data.get("jobs", [])
                    for item in items:
                        title = item.get("jobTitle", "").strip()
                        company = item.get("companyName", "").strip()
                        if not title or not company:
                            continue
                        desc = self.clean_html(item.get("jobDescription", ""))
                        skills = [s.strip() for s in item.get("jobIndustry", []) if s.strip()] or ["Full Stack", "Software Architecture"]
                        
                        sal_min = item.get("annualSalaryMin")
                        sal_max = item.get("annualSalaryMax")
                        currency = item.get("salaryCurrency", "USD")
                        if sal_min and sal_max:
                            salary_str = f"{currency} {sal_min:,} - {sal_max:,}/yr"
                        else:
                            salary_str = "Competitive (Tech)"

                        jobs.append(self.normalize_job(
                            title=title,
                            company=company,
                            location=item.get("jobGeo", "Remote"),
                            remote=True,
                            salary=salary_str,
                            description=desc,
                            skills=skills,
                            experience_level=item.get("jobLevel", "Mid-Level"),
                            job_type=item.get("jobType", "Full-time"),
                            source_job_id=str(item.get("id", "")),
                            source_url=item.get("url", ""),
                            posted_at=item.get("pubDate", "").split(" ")[0] if item.get("pubDate") else "Recently",
                            status="active"
                        ))
        except Exception as e:
            logger.warning(f"Jobicy connector fetch failed: {e}")
        return jobs
