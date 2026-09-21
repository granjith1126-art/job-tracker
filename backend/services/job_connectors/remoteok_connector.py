import httpx
import logging
from typing import List, Dict, Any
from .base import BaseJobConnector

logger = logging.getLogger(__name__)

class RemoteOKConnector(BaseJobConnector):
    def __init__(self):
        super().__init__(name="RemoteOK", source_type="public_api")

    def is_configured(self) -> bool:
        return True  # Open Public API

    def fetch_jobs(self, query: str = "", location: str = "") -> List[Dict[str, Any]]:
        jobs = []
        try:
            headers = {"User-Agent": "JobTracker/2.0 (CareerAI platform; contact@careerai.local)"}
            with httpx.Client(timeout=12.0, headers=headers) as client:
                res = client.get("https://remoteok.com/api")
                if res.status_code == 200:
                    items = res.json()
                    # First item is metadata/legal info
                    for item in items[1:35]:
                        if not item.get("position") or not item.get("company"):
                            continue
                        title = item.get("position", "").strip()
                        company = item.get("company", "").strip()
                        desc = self.clean_html(item.get("description", ""))
                        tags = [t.title() for t in item.get("tags", [])[:8]] if item.get("tags") else ["Python", "React", "APIs"]

                        sal_min = item.get("salary_min")
                        sal_max = item.get("salary_max")
                        if sal_min and sal_max:
                            salary_str = f"${sal_min:,} - ${sal_max:,}/yr"
                        elif sal_min:
                            salary_str = f"${sal_min:,}+/yr"
                        else:
                            salary_str = "Competitive (USD)"

                        jobs.append(self.normalize_job(
                            title=title,
                            company=company,
                            location=item.get("location") or "Remote (Worldwide)",
                            remote=True,
                            salary=salary_str,
                            description=desc,
                            skills=tags,
                            source_job_id=str(item.get("id", "")),
                            source_url=item.get("url") or f"https://remoteok.com/l/{item.get('id', '')}",
                            posted_at=item.get("date", "").split("T")[0] if item.get("date") else "Recently",
                            status="active"
                        ))
        except Exception as e:
            logger.warning(f"RemoteOK connector fetch failed: {e}")
        return jobs
