import os
import urllib.parse
from typing import Dict, Any, List, Optional
import httpx
from services.integrations.base import CareerDataConnector
from services.oauth_config import get_oauth_credentials, is_provider_configured, get_oauth_redirect_uri

# Modern Meta Instagram endpoints
INSTAGRAM_AUTH_URL = "https://api.instagram.com/oauth/authorize"
INSTAGRAM_TOKEN_URL = "https://api.instagram.com/oauth/access_token"
INSTAGRAM_GRAPH_BASE = "https://graph.instagram.com"

# Technology taxonomy for extracting career signals from user's published post captions & hashtags
INSTAGRAM_TECH_KEYWORDS = {
    "python": ("programming_language", "Python"),
    "javascript": ("programming_language", "JavaScript"),
    "typescript": ("programming_language", "TypeScript"),
    "react": ("framework", "React"),
    "reactjs": ("framework", "React"),
    "nextjs": ("framework", "Next.js"),
    "vue": ("framework", "Vue.js"),
    "nodejs": ("framework", "Node.js"),
    "fastapi": ("framework", "FastAPI"),
    "django": ("framework", "Django"),
    "flutter": ("framework", "Flutter"),
    "docker": ("tool", "Docker"),
    "kubernetes": ("cloud", "Kubernetes"),
    "aws": ("cloud", "AWS"),
    "azure": ("cloud", "Azure"),
    "gcp": ("cloud", "GCP"),
    "machinelearning": ("topic", "Machine Learning"),
    "datascience": ("topic", "Data Science"),
    "deeplearning": ("topic", "Deep Learning"),
    "ai": ("topic", "Artificial Intelligence"),
    "webdev": ("topic", "Web Development"),
    "coding": ("topic", "Software Engineering"),
    "developer": ("topic", "Software Development"),
    "softwareengineer": ("topic", "Software Engineering"),
    "frontend": ("topic", "Frontend Engineering"),
    "backend": ("topic", "Backend Engineering"),
    "fullstack": ("topic", "Full Stack Development"),
    "cybersecurity": ("topic", "Cybersecurity"),
    "devops": ("topic", "DevOps")
}

class InstagramRadarConnector(CareerDataConnector):
    def __init__(self):
        super().__init__("instagram")

    def is_configured(self) -> bool:
        return is_provider_configured("instagram")

    def get_authorization_url(self, user_id: int, redirect_uri: Optional[str], state: str) -> str:
        """
        Generates the official Meta / Instagram OAuth 2.0 authorization URL.
        Uses modern official scope 'instagram_business_basic'.
        """
        if not self.is_configured():
            raise ValueError("Instagram integration is not configured. Set META_CLIENT_ID and META_CLIENT_SECRET in backend/.env.")
        
        creds = get_oauth_credentials("instagram")
        actual_redirect = (redirect_uri or get_oauth_redirect_uri("instagram")).strip()
        params = {
            "client_id": creds["client_id"],
            "redirect_uri": actual_redirect,
            "scope": "instagram_business_basic",
            "response_type": "code",
            "state": state
        }
        return f"{INSTAGRAM_AUTH_URL}?{urllib.parse.urlencode(params)}"

    def handle_callback(self, code: str, redirect_uri: Optional[str]) -> Dict[str, Any]:
        """
        Securely exchanges the authorization code with Meta for an Instagram access token.
        Sanitizes trailing `#_` if appended by Instagram.
        Upgrades to a 60-day long-lived access token when supported.
        """
        if not self.is_configured():
            raise ValueError("Instagram integration is not configured.")
        
        creds = get_oauth_credentials("instagram")
        actual_redirect = (redirect_uri or get_oauth_redirect_uri("instagram")).strip()
        
        # Instagram redirects often append '#_' to the code in URL fragments
        sanitized_code = code.split("#")[0].strip()
        
        payload = {
            "client_id": creds["client_id"],
            "client_secret": creds["client_secret"],
            "grant_type": "authorization_code",
            "redirect_uri": actual_redirect,
            "code": sanitized_code
        }
        
        try:
            with httpx.Client(timeout=15.0) as client:
                resp = client.post(INSTAGRAM_TOKEN_URL, data=payload)
                data = resp.json()
        except Exception as e:
            raise ValueError(f"Failed to communicate with Meta token endpoint: {str(e)}")

        if resp.status_code != 200 or "error_message" in data or "error" in data:
            raw_err = data.get("error_message") or data.get("error_description") or str(data.get("error", "Unknown Meta OAuth error"))
            if "not an authorized test user" in raw_err.lower() or "development" in raw_err.lower():
                raise ValueError("Meta App is in Development mode. Ensure your Instagram account is added as a Tester in the Meta Developer App Roles, or submit the app for Meta App Review.")
            elif "redirect_uri" in raw_err.lower():
                raise ValueError(f"Redirect URI mismatch in Meta App Settings. Expected: {actual_redirect}")
            raise ValueError(f"Meta OAuth error: {raw_err}")

        access_token = data.get("access_token")
        if not access_token:
            raise ValueError("Meta returned a response without an access token.")

        # Attempt to upgrade short-lived token to 60-day long-lived token
        long_lived_token = access_token
        token_expires_at = None
        try:
            with httpx.Client(timeout=10.0) as client:
                ll_resp = client.get(
                    f"{INSTAGRAM_GRAPH_BASE}/access_token",
                    params={
                        "grant_type": "ig_exchange_token",
                        "client_secret": creds["client_secret"],
                        "access_token": access_token
                    }
                )
                if ll_resp.status_code == 200:
                    ll_data = ll_resp.json()
                    long_lived_token = ll_data.get("access_token", access_token)
        except Exception:
            long_lived_token = access_token

        account_info = self.get_account_info(long_lived_token)
        return {
            "access_token": long_lived_token,
            "refresh_token": None,
            "token_expires_at": token_expires_at,
            "scopes": ["instagram_business_basic"],
            "account_info": account_info
        }

    def get_account_info(self, access_token: str) -> Dict[str, Any]:
        """Fetches permitted account profile info from official Instagram Graph API."""
        try:
            with httpx.Client(timeout=10.0) as client:
                resp = client.get(
                    f"{INSTAGRAM_GRAPH_BASE}/v21.0/me",
                    params={
                        "fields": "id,username,account_type,profile_picture_url",
                        "access_token": access_token
                    }
                )
                if resp.status_code != 200:
                    resp = client.get(
                        f"{INSTAGRAM_GRAPH_BASE}/me",
                        params={
                            "fields": "id,username,account_type",
                            "access_token": access_token
                        }
                    )
                user_data = resp.json() if resp.status_code == 200 else {}
        except Exception:
            user_data = {}

        username = user_data.get("username") or "instagram_user"
        return {
            "provider_user_id": str(user_data.get("id", "")),
            "username": username,
            "display_name": f"@{username}",
            "profile_url": f"https://instagram.com/{username}",
            "account_type": (user_data.get("account_type") or "creator").lower(),
            "avatar_url": user_data.get("profile_picture_url") or ""
        }

    def sync_signals(self, user_id: int, access_token: str) -> List[Dict[str, Any]]:
        """
        Parses technical and creative signals ONLY from legitimate published media captions/hashtags.
        TRUTHFULNESS NOTICE:
        Meta does NOT provide browsing history, search history, or watch history.
        We do NOT claim or attempt to access private browsing data.
        """
        signals = []
        try:
            with httpx.Client(timeout=12.0) as client:
                resp = client.get(
                    f"{INSTAGRAM_GRAPH_BASE}/v21.0/me/media",
                    params={
                        "fields": "id,caption,media_type,timestamp",
                        "limit": "25",
                        "access_token": access_token
                    }
                )
                if resp.status_code == 200:
                    media_items = resp.json().get("data", [])
                    detected_counts = {}

                    for item in media_items:
                        caption = (item.get("caption") or "").lower()
                        for keyword, (sig_type, canonical_name) in INSTAGRAM_TECH_KEYWORDS.items():
                            if f"#{keyword}" in caption or f" {keyword} " in f" {caption} ":
                                if canonical_name not in detected_counts:
                                    detected_counts[canonical_name] = {
                                        "sig_type": sig_type,
                                        "count": 0
                                    }
                                detected_counts[canonical_name]["count"] += 1

                    for name, info in detected_counts.items():
                        strength = min(0.95, 0.65 + (info["count"] * 0.10))
                        signals.append({
                            "signal_type": info["sig_type"],
                            "signal_value": name,
                            "strength": round(strength, 2),
                            "confidence": 0.80,
                            "source_reference": f"Instagram: Published portfolio post tagged #{name.lower()}"
                        })
        except Exception:
            pass

        return signals

    def disconnect(self, access_token: str) -> bool:
        """Disconnect cleanup handler."""
        return True
