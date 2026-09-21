import os
import httpx
import logging
from typing import List, Dict, Any
from .base import BaseJobConnector

logger = logging.getLogger(__name__)

class JoobleConnector(BaseJobConnector):
    """
    Jooble Job API Connector
    Requires environment variable: JOOBLE_API_KEY
    """
    def __init__(self):
        super().__init__(name="Jooble", source_type="api")
        self.api_key = os.getenv("JOOBLE_API_KEY", "")

    def is_configured(self) -> bool:
        return bool(self.api_key and not self.api_key.startswith("your_"))

    def fetch_jobs(self, query: str = "developer", location: str = "") -> List[Dict[str, Any]]:
        if not self.is_configured():
            return []
        jobs = []
        try:
            url = f"https://jooble.org/api/{self.api_key}"
            payload = {"keywords": query or "software engineer", "location": location or "Remote"}
            with httpx.Client(timeout=10.0) as client:
                res = client.post(url, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    for item in data.get("jobs", []):
                        title = item.get("title", "").strip()
                        company = item.get("company", "").strip()
                        desc = self.clean_html(item.get("snippet", ""))
                        jobs.append(self.normalize_job(
                            title=title,
                            company=company,
                            location=item.get("location", "Remote"),
                            salary=item.get("salary") or "Competitive",
                            description=desc,
                            skills=["Software Engineering", "APIs"],
                            source_job_id=str(item.get("id", "")),
                            source_url=item.get("link", ""),
                            posted_at=item.get("updated", "").split("T")[0] if item.get("updated") else "Recently",
                            status="active"
                        ))
        except Exception as e:
            logger.warning(f"Jooble fetch failed: {e}")
        return jobs
