import os
import httpx
import logging
from typing import List, Dict, Any
from .base import BaseJobConnector

logger = logging.getLogger(__name__)

class AdzunaConnector(BaseJobConnector):
    """
    Adzuna API Connector
    Requires environment variables: ADZUNA_APP_ID, ADZUNA_APP_KEY
    """
    def __init__(self):
        super().__init__(name="Adzuna", source_type="api")
        self.app_id = os.getenv("ADZUNA_APP_ID", "")
        self.app_key = os.getenv("ADZUNA_APP_KEY", "")

    def is_configured(self) -> bool:
        return bool(self.app_id and self.app_key and not self.app_id.startswith("your_"))

    def fetch_jobs(self, query: str = "software engineer", location: str = "in") -> List[Dict[str, Any]]:
        if not self.is_configured():
            return []
        jobs = []
        try:
            country = "in" if location.lower() in ["in", "india", "bangalore", "hyderabad"] else "us"
            url = f"https://api.adzuna.com/v1/api/jobs/{country}/search/1"
            params = {
                "app_id": self.app_id,
                "app_key": self.app_key,
                "what": query or "software developer",
                "results_per_page": 20
            }
            with httpx.Client(timeout=10.0) as client:
                res = client.get(url, params=params)
                if res.status_code == 200:
                    data = res.json()
                    for item in data.get("results", []):
                        title = item.get("title", "").strip()
                        company = item.get("company", {}).get("display_name", "").strip()
                        desc = self.clean_html(item.get("description", ""))
                        sal_min = item.get("salary_min")
                        sal_max = item.get("salary_max")
                        salary_str = f"${sal_min:,.0f} - ${sal_max:,.0f}" if sal_min and sal_max else "Competitive"

                        jobs.append(self.normalize_job(
                            title=title,
                            company=company,
                            location=item.get("location", {}).get("display_name", "India"),
                            salary=salary_str,
                            description=desc,
                            skills=["Python", "Java", "SQL", "Cloud"],
                            source_job_id=str(item.get("id", "")),
                            source_url=item.get("redirect_url", ""),
                            posted_at=item.get("created", "").split("T")[0] if item.get("created") else "Recently",
                            status="active"
                        ))
        except Exception as e:
            logger.warning(f"Adzuna fetch failed: {e}")
        return jobs
