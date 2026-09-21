import os
import re
from typing import Dict, Any, List, Optional, Tuple
import httpx

from services.oauth_config import get_oauth_credentials, is_provider_configured

# Comprehensive technology topic taxonomy for normalizing official YouTube metadata
TECH_TAXONOMY = {
    # Programming Languages
    "python": ("Python", "programming_language"),
    "javascript": ("JavaScript", "programming_language"),
    "typescript": ("TypeScript", "programming_language"),
    "java": ("Java", "programming_language"),
    "c++": ("C++", "programming_language"),
    "golang": ("Go", "programming_language"),
    "rust": ("Rust", "programming_language"),
    "c#": ("C#", "programming_language"),
    "kotlin": ("Kotlin", "programming_language"),
    "swift": ("Swift", "programming_language"),
    "sql": ("SQL", "programming_language"),
    "ruby": ("Ruby", "programming_language"),
    "php": ("PHP", "programming_language"),
    
    # Frameworks & Libraries
    "react": ("React", "technology"),
    "reactjs": ("React", "technology"),
    "next.js": ("Next.js", "technology"),
    "nextjs": ("Next.js", "technology"),
    "node.js": ("Node.js", "technology"),
    "nodejs": ("Node.js", "technology"),
    "fastapi": ("FastAPI", "technology"),
    "django": ("Django", "technology"),
    "flask": ("Flask", "technology"),
    "spring boot": ("Spring Boot", "technology"),
    "vue": ("Vue.js", "technology"),
    "angular": ("Angular", "technology"),
    "tailwind": ("Tailwind CSS", "technology"),

    # AI & Machine Learning
    "machine learning": ("Machine Learning", "topic"),
    "deep learning": ("Deep Learning", "topic"),
    "artificial intelligence": ("Artificial Intelligence", "topic"),
    "generative ai": ("Generative AI", "topic"),
    "genai": ("Generative AI", "topic"),
    "llm": ("LLMs", "topic"),
    "llms": ("LLMs", "topic"),
    "nlp": ("Natural Language Processing", "topic"),
    "computer vision": ("Computer Vision", "topic"),
    "pytorch": ("PyTorch", "technology"),
    "tensorflow": ("TensorFlow", "technology"),
    "scikit-learn": ("Scikit-Learn", "technology"),
    "langchain": ("LangChain", "technology"),

    # Cloud & DevOps
    "aws": ("AWS", "technology"),
    "amazon web services": ("AWS", "technology"),
    "azure": ("Azure", "technology"),
    "google cloud": ("Google Cloud", "technology"),
    "gcp": ("Google Cloud", "technology"),
    "docker": ("Docker", "technology"),
    "kubernetes": ("Kubernetes", "technology"),
    "k8s": ("Kubernetes", "technology"),
    "devops": ("DevOps", "topic"),
    "ci/cd": ("CI/CD", "technology"),
    "terraform": ("Terraform", "technology"),
    "linux": ("Linux", "technology"),

    # Data Engineering & Analytics
    "data science": ("Data Science", "topic"),
    "data engineering": ("Data Engineering", "topic"),
    "data analytics": ("Data Analytics", "topic"),
    "big data": ("Big Data", "topic"),
    "spark": ("Apache Spark", "technology"),
    "kafka": ("Apache Kafka", "technology"),
    "snowflake": ("Snowflake", "technology"),
    "postgresql": ("PostgreSQL", "technology"),
    "mongodb": ("MongoDB", "technology"),

    # Systems, Hardware & Core CS
    "system design": ("System Design", "topic"),
    "data structures": ("Data Structures & Algorithms", "topic"),
    "algorithms": ("Data Structures & Algorithms", "topic"),
    "cybersecurity": ("Cybersecurity", "topic"),
    "cyber security": ("Cybersecurity", "topic"),
    "ethical hacking": ("Cybersecurity", "topic"),
    "networking": ("Networking", "topic"),
    "embedded systems": ("Embedded Systems", "topic"),
    "iot": ("IoT", "topic"),
    "vlsi": ("VLSI", "topic"),
    "electronics": ("Electronics", "topic")
}

class YouTubeDataService:
    """
    Official YouTube Data API v3 integration service.
    Queries authorized YouTube read-only endpoints (subscriptions, user channel, playlists)
    and extracts verified technical career-interest signals.
    Never scrapes and never claims access to private watch history.
    """
    def __init__(self):
        self.api_key = os.environ.get("YOUTUBE_API_KEY", "").strip()

    def sync_signals(self, user_id: int, access_token: str) -> List[Dict[str, Any]]:
        """
        Synchronizes available official YouTube signals for the authenticated user.
        Uses access_token for user subscriptions, channel, and playlists.
        Uses server-side API key for metadata enrichment where supported.
        """
        if not access_token:
            raise ValueError("Google authorization token missing. Please reconnect your account.")

        headers = {
            "Authorization": f"Bearer {access_token}",
            "Accept": "application/json"
        }

        # Collected metadata items: list of tuples (source_name, source_type, title, description)
        collected_items = []

        with httpx.Client(timeout=14.0) as client:
            # 1. Fetch authorized user channel subscriptions (up to 50 channels)
            try:
                sub_url = "https://www.googleapis.com/youtube/v3/subscriptions?part=snippet&mine=true&maxResults=50"
                resp = client.get(sub_url, headers=headers)
                if resp.status_code == 200:
                    for item in resp.json().get("items", []):
                        snip = item.get("snippet", {})
                        title = snip.get("title", "")
                        desc = snip.get("description", "")
                        if title:
                            collected_items.append(("Subscription", title, desc))
                elif resp.status_code == 401:
                    raise ValueError("Google authorization expired. Please reconnect.")
                elif resp.status_code == 403:
                    data = resp.json()
                    err = data.get("error", {})
                    reasons = [e.get("reason") for e in err.get("errors", [])]
                    if "quotaExceeded" in reasons or "rateLimitExceeded" in reasons:
                        raise ValueError("YouTube API quota exceeded. Try again later.")
                    # For private subscriptions or missing permission: continue gracefully
            except ValueError:
                raise
            except Exception as e:
                # Non-fatal network error on subscriptions, continue to playlists
                pass

            # 2. Fetch user's own channel details and topic categories (if exists)
            try:
                ch_url = "https://www.googleapis.com/youtube/v3/channels?part=snippet,topicDetails&mine=true"
                resp = client.get(ch_url, headers=headers)
                if resp.status_code == 200:
                    for item in resp.json().get("items", []):
                        snip = item.get("snippet", {})
                        title = snip.get("title", "")
                        desc = snip.get("description", "")
                        topics = item.get("topicDetails", {}).get("topicCategories", [])
                        topic_text = " ".join(t.split("/")[-1].replace("_", " ") for t in topics)
                        if title or topic_text:
                            collected_items.append(("Channel", title, f"{desc} {topic_text}"))
            except Exception:
                pass

            # 3. Fetch user's public playlists
            try:
                pl_url = "https://www.googleapis.com/youtube/v3/playlists?part=snippet&mine=true&maxResults=25"
                resp = client.get(pl_url, headers=headers)
                if resp.status_code == 200:
                    for item in resp.json().get("items", []):
                        snip = item.get("snippet", {})
                        title = snip.get("title", "")
                        desc = snip.get("description", "")
                        if title:
                            collected_items.append(("Playlist", title, desc))
            except Exception:
                pass

        if not collected_items:
            # Truthful: No supported or public data was returned
            return []

        return self.parse_metadata_signals(collected_items)

    def parse_metadata_signals(self, collected_items: List[Tuple[str, str, str]]) -> List[Dict[str, Any]]:
        """
        Parses collected YouTube metadata items (item_type, title, description)
        against the technical taxonomy, returning verified career-interest signals.
        """
        if not collected_items:
            return []

        # 4. Analyze collected metadata against tech taxonomy
        # Track counts and sample references per detected canonical skill
        detected_topics: Dict[str, Dict[str, Any]] = {}

        for item_type, title, desc in collected_items:
            combined_text = f" {title} {desc} ".lower()
            # Clean punctuation for exact word boundary matching
            cleaned_text = re.sub(r"[^a-z0-9+#./\s-]", " ", combined_text)

            for kw, (canonical, sig_type) in TECH_TAXONOMY.items():
                pattern = r"(?:^|[\s,.\-_/])" + re.escape(kw) + r"(?:$|[\s,.\-_/])"
                in_title = bool(re.search(pattern, title.lower()))
                in_desc = bool(re.search(pattern, cleaned_text))

                if in_title or in_desc:
                    if canonical not in detected_topics:
                        detected_topics[canonical] = {
                            "signal_type": sig_type,
                            "occurrences": 0,
                            "title_hits": 0,
                            "sources": []
                        }

                    detected_topics[canonical]["occurrences"] += 1
                    if in_title:
                        detected_topics[canonical]["title_hits"] += 1
                    
                    # Store distinct sample reference
                    ref_name = title.strip()
                    if ref_name and len(detected_topics[canonical]["sources"]) < 3:
                        if ref_name not in detected_topics[canonical]["sources"]:
                            detected_topics[canonical]["sources"].append(ref_name)

        signals = []
        total_items = max(len(collected_items), 1)

        for canonical, data in detected_topics.items():
            occ = data["occurrences"]
            th = data["title_hits"]
            sources = data["sources"]
            sig_type = data["signal_type"]

            # Dynamic strength calculation:
            # Base strength: 0.45, bonus for title hit, bonus for repeated occurrences
            freq_ratio = min(1.0, occ / total_items)
            strength = round(min(0.95, 0.45 + (freq_ratio * 0.30) + (min(th, 3) * 0.08)), 2)

            # Confidence based on multiple occurrences and direct channel title relevance
            confidence = round(min(0.92, 0.70 + (min(occ, 4) * 0.05)), 2)

            sample_sources_str = ", ".join(f"'{s}'" for s in sources[:2])
            ref_text = f"YouTube: Subscribed to / created {occ} technical item(s) focused on {canonical} ({sample_sources_str})"

            signals.append({
                "signal_type": sig_type,
                "signal_value": canonical,
                "strength": strength,
                "confidence": confidence,
                "source_reference": ref_text
            })

        # Sort signals by strength descending
        signals.sort(key=lambda s: s["strength"], reverse=True)
        return signals
