import httpx
import logging
from typing import List, Dict, Any
from .base import BaseJobConnector

logger = logging.getLogger(__name__)

class ArbeitnowConnector(BaseJobConnector):
    def __init__(self):
        super().__init__(name="Arbeitnow", source_type="public_api")

    def is_configured(self) -> bool:
        return True  # Open Public API

    def fetch_jobs(self, query: str = "", location: str = "") -> List[Dict[str, Any]]:
        jobs = []
        try:
            with httpx.Client(timeout=12.0) as client:
                res = client.get("https://www.arbeitnow.com/api/job-board-api")
                if res.status_code == 200:
                    data = res.json()
                    items = data.get("data", [])
                    for item in items[:25]:
                        title = item.get("title", "").strip()
                        company = item.get("company_name", "").strip()
                        if not title or not company:
                            continue
                        desc = self.clean_html(item.get("description", ""))
                        tags = item.get("tags", []) or ["Engineering", "Cloud"]

                        jobs.append(self.normalize_job(
                            title=title,
                            company=company,
                            location=item.get("location", "Remote / Europe"),
                            remote=bool(item.get("remote")),
                            salary="Competitive (EUR / USD)",
                            description=desc,
                            skills=tags[:8],
                            job_type=item.get("job_types", ["Full-time"])[0] if item.get("job_types") else "Full-time",
                            source_job_id=str(item.get("slug", "")),
                            source_url=item.get("url", ""),
                            posted_at="Recently",
                            status="active"
                        ))
        except Exception as e:
            logger.warning(f"Arbeitnow connector fetch failed: {e}")
        return jobs
