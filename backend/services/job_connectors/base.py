from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
import re
from datetime import datetime

class BaseJobConnector(ABC):
    """Abstract base class for all external job feed/API connectors."""

    def __init__(self, name: str, source_type: str = "api"):
        self.name = name
        self.source_type = source_type

    @abstractmethod
    def is_configured(self) -> bool:
        """Checks if API keys or required configurations exist."""
        pass

    @abstractmethod
    def fetch_jobs(self, query: str = "", location: str = "") -> List[Dict[str, Any]]:
        """Fetches and returns normalized job listings."""
        pass

    def normalize_job(
        self,
        title: str,
        company: str,
        location: str = "Remote",
        remote: bool = False,
        salary: str = "Competitive",
        description: str = "",
        skills: Optional[List[str]] = None,
        experience_level: str = "Entry / Mid",
        job_type: str = "Full-time",
        source_job_id: str = "",
        source_url: str = "",
        posted_at: str = "Recently",
        status: str = "active"
    ) -> Dict[str, Any]:
        """Standardizes raw job payloads into the unified JobTracker schema."""
        return {
            "title": (title or "Software Engineer").strip(),
            "company": (company or "Technology Company").strip(),
            "location": (location or "Remote").strip(),
            "remote": bool(remote or "remote" in (location or "").lower() or "remote" in (title or "").lower()),
            "salary": salary or "Competitive",
            "description": description[:2000] if description else f"{title} opportunity at {company}.",
            "skills": skills or ["Python", "JavaScript", "SQL"],
            "experience_level": experience_level or "Entry / Mid",
            "job_type": job_type or "Full-time",
            "source": self.name,
            "source_job_id": str(source_job_id or ""),
            "url": source_url or "",
            "posted_at": posted_at or "Recently",
            "status": status,
            "is_live": True,
            "logo_type": "default"
        }

    def clean_html(self, raw_html: str) -> str:
        if not raw_html:
            return ""
        clean = re.sub(r'<[^>]+>', ' ', raw_html)
        clean = re.sub(r'\s+', ' ', clean)
        return clean.strip()
