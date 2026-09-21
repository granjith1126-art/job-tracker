import os
from typing import Dict, Any, Optional
from dotenv import load_dotenv

# Ensure .env is loaded
load_dotenv()

# Base URLs
API_BASE_URL = os.environ.get("API_BASE_URL", "http://127.0.0.1:8000").rstrip("/")
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:5174").rstrip("/")

def get_oauth_credentials(provider: str) -> Dict[str, str]:
    """Returns the client ID and secret for a provider dynamically from environment."""
    p = provider.lower()
    if p == "github":
        return {
            "client_id": os.environ.get("GITHUB_CLIENT_ID", "").strip(),
            "client_secret": os.environ.get("GITHUB_CLIENT_SECRET", "").strip(),
        }
    elif p in ("google", "youtube"):
        return {
            "client_id": os.environ.get("GOOGLE_CLIENT_ID", "").strip(),
            "client_secret": os.environ.get("GOOGLE_CLIENT_SECRET", "").strip(),
            "youtube_api_key": os.environ.get("YOUTUBE_API_KEY", "").strip(),
        }
    elif p == "instagram":
        return {
            "client_id": (os.environ.get("META_CLIENT_ID") or os.environ.get("META_APP_ID") or "").strip(),
            "client_secret": (os.environ.get("META_CLIENT_SECRET") or os.environ.get("META_APP_SECRET") or "").strip(),
        }
    return {"client_id": "", "client_secret": ""}

def is_provider_configured(provider: str) -> bool:
    """Checks whether the provider has non-empty credentials configured."""
    p = provider.lower()
    creds = get_oauth_credentials(p)
    if p in ("google", "youtube"):
        cid = creds.get("client_id", "").strip()
        # Reject empty and dummy placeholder names like "jobtracker"
        if not cid or cid.lower() in ("jobtracker", "your_google_client_id", "your_client_id_here"):
            return False
        return True
    return bool(creds.get("client_id") and creds.get("client_secret"))

def get_oauth_redirect_uri(provider: str) -> str:
    """
    Returns the centralized redirect URI for a provider.
    Priority:
    1. Provider-specific env var (e.g. GITHUB_REDIRECT_URI, GOOGLE_REDIRECT_URI, INSTAGRAM_REDIRECT_URI)
    2. Default standard backend callback endpoint: {API_BASE_URL}/api/career-radar/{provider}/callback
    """
    p = provider.lower()
    env_keys = {
        "github": "GITHUB_REDIRECT_URI",
        "google": "GOOGLE_REDIRECT_URI",
        "youtube": "GOOGLE_REDIRECT_URI",
        "instagram": "INSTAGRAM_REDIRECT_URI",
    }
    custom = os.environ.get(env_keys.get(p, ""))
    if custom and custom.strip():
        return custom.strip()
    
    # Standard direct backend redirect URI (Google canonical is google/callback)
    normalized_provider = "google" if p in ("google", "youtube") else p
    return f"{API_BASE_URL}/api/career-radar/{normalized_provider}/callback"

def get_frontend_return_url(provider: str, status: str = "success", message: str = "") -> str:
    """Returns the frontend URL to redirect users after OAuth callback completion."""
    import urllib.parse
    f_url = os.environ.get("FRONTEND_URL", FRONTEND_URL).rstrip("/")
    params = {
        "tab": "career-radar",
        "provider": provider,
        "status": status
    }
    if message:
        params["msg"] = message
        params["message"] = message
    return f"{f_url}/?{urllib.parse.urlencode(params)}"
