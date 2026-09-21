import os
import secrets
import hashlib
import base64
import urllib.parse
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional, Tuple
import httpx

from services.integrations.base import CareerDataConnector
from services.oauth_config import get_oauth_credentials, is_provider_configured, get_oauth_redirect_uri

class GoogleConnector(CareerDataConnector):
    """
    Official Google OAuth 2.0 Integration.
    Supports modern RFC 7636 PKCE (Proof Key for Code Exchange) with S256.
    Does NOT require a client secret for modern Web applications / public clients.
    """
    def __init__(self):
        super().__init__("google")

    def is_configured(self) -> bool:
        """Returns True if GOOGLE_CLIENT_ID is configured. Client secret is optional."""
        return is_provider_configured("google")

    @staticmethod
    def generate_pkce() -> Tuple[str, str]:
        """
        Generates RFC 7636 PKCE code_verifier and code_challenge (S256).
        Verifier: 64 random url-safe bytes (~86 characters).
        Challenge: base64url(sha256(verifier)) with no padding.
        """
        code_verifier = secrets.token_urlsafe(64)
        digest = hashlib.sha256(code_verifier.encode("ascii")).digest()
        code_challenge = base64.urlsafe_b64encode(digest).decode("ascii").rstrip("=")
        return code_verifier, code_challenge

    def get_authorization_url(
        self,
        user_id: int,
        redirect_uri: Optional[str],
        state: str,
        code_challenge: Optional[str] = None
    ) -> str:
        """
        Generates official Google OAuth 2.0 authorization URL.
        Includes minimal required scopes: openid, email, profile, youtube.readonly.
        """
        if not self.is_configured():
            raise ValueError(
                "Google OAuth is not configured. Please add your real GOOGLE_CLIENT_ID "
                "(ending with .apps.googleusercontent.com) to backend/.env."
            )

        creds = get_oauth_credentials("google")
        client_id = creds["client_id"].strip()
        if client_id.lower() == "jobtracker" or not (".googleusercontent.com" in client_id):
            raise ValueError(
                f"Invalid GOOGLE_CLIENT_ID '{client_id}'. "
                "'jobtracker' is the name of your app, not your Google OAuth Client ID. "
                "A Google OAuth Client ID ends with '.apps.googleusercontent.com'. "
                "Please copy the generated Client ID from Google Cloud Console → APIs & Services → Credentials."
            )

        actual_redirect = (redirect_uri or get_oauth_redirect_uri("google")).strip()

        params = {
            "client_id": client_id,
            "redirect_uri": actual_redirect,
            "response_type": "code",
            "scope": "openid email profile https://www.googleapis.com/auth/youtube.readonly",
            "access_type": "offline",
            "prompt": "consent",
            "state": state
        }

        if code_challenge:
            params["code_challenge"] = code_challenge
            params["code_challenge_method"] = "S256"

        return f"https://accounts.google.com/o/oauth2/v2/auth?{urllib.parse.urlencode(params)}"

    def handle_callback(
        self,
        code: str,
        redirect_uri: Optional[str],
        code_verifier: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Exchanges Google authorization code for access and refresh tokens.
        Supports both PKCE (no client secret) and standard confidential client (with client secret).
        """
        if not self.is_configured():
            raise ValueError("Google OAuth is not configured.")

        creds = get_oauth_credentials("google")
        actual_redirect = (redirect_uri or get_oauth_redirect_uri("google")).strip()

        token_url = "https://oauth2.googleapis.com/token"
        payload = {
            "client_id": creds["client_id"],
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": actual_redirect
        }

        if code_verifier:
            payload["code_verifier"] = code_verifier

        # Include client_secret only if present in environment
        if creds.get("client_secret"):
            payload["client_secret"] = creds["client_secret"]

        with httpx.Client(timeout=14.0) as client:
            resp = client.post(token_url, data=payload)
            data = resp.json()

        if "error" in data or resp.status_code >= 400:
            err_desc = data.get("error_description") or data.get("error") or f"HTTP status {resp.status_code}"
            raise ValueError(f"Google OAuth token exchange error: {err_desc}")

        access_token = data.get("access_token")
        refresh_token = data.get("refresh_token")
        expires_in = data.get("expires_in")
        scope = data.get("scope", "")

        token_expires_at = None
        if expires_in:
            try:
                token_expires_at = datetime.utcnow() + timedelta(seconds=int(expires_in))
            except Exception:
                pass

        account_info = self.get_account_info(access_token)

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_expires_at": token_expires_at,
            "scopes": scope.split(" ") if scope else ["openid", "email", "profile", "https://www.googleapis.com/auth/youtube.readonly"],
            "account_info": account_info
        }

    def refresh_access_token(self, refresh_token: str) -> Dict[str, Any]:
        """Refreshes an expired Google access token using the stored refresh token."""
        if not refresh_token:
            raise ValueError("Missing refresh token for Google OAuth refresh.")

        creds = get_oauth_credentials("google")
        token_url = "https://oauth2.googleapis.com/token"
        payload = {
            "client_id": creds["client_id"],
            "refresh_token": refresh_token,
            "grant_type": "refresh_token"
        }
        if creds.get("client_secret"):
            payload["client_secret"] = creds["client_secret"]

        with httpx.Client(timeout=12.0) as client:
            resp = client.post(token_url, data=payload)
            data = resp.json()

        if "error" in data or resp.status_code >= 400:
            err_desc = data.get("error_description") or data.get("error") or f"HTTP status {resp.status_code}"
            raise ValueError(f"Failed to refresh Google token: {err_desc}")

        access_token = data.get("access_token")
        expires_in = data.get("expires_in")
        token_expires_at = None
        if expires_in:
            try:
                token_expires_at = datetime.utcnow() + timedelta(seconds=int(expires_in))
            except Exception:
                pass

        return {
            "access_token": access_token,
            "token_expires_at": token_expires_at
        }

    def get_account_info(self, access_token: str) -> Dict[str, Any]:
        """Fetches basic authenticated Google user profile without requesting private data."""
        headers = {"Authorization": f"Bearer {access_token}"}
        with httpx.Client(timeout=10.0) as client:
            resp = client.get("https://www.googleapis.com/oauth2/v2/userinfo", headers=headers)
            if resp.status_code != 200:
                raise ValueError(f"Failed to fetch Google userinfo: HTTP {resp.status_code}")
            user_data = resp.json()

        email = user_data.get("email") or ""
        name = user_data.get("name") or (email.split("@")[0] if email else "Google User")

        return {
            "provider_user_id": str(user_data.get("id") or ""),
            "username": email,
            "display_name": name,
            "profile_url": "https://myaccount.google.com",
            "account_type": "personal",
            "avatar_url": user_data.get("picture") or ""
        }

    def sync_signals(self, user_id: int, access_token: str) -> List[Dict[str, Any]]:
        """Delegates YouTube data synchronization to the YouTubeDataService."""
        from services.integrations.youtube import YouTubeDataService
        yt_service = YouTubeDataService()
        return yt_service.sync_signals(user_id, access_token)

    def disconnect(self, access_token: str) -> bool:
        """Revokes token access on Google servers."""
        if access_token:
            try:
                with httpx.Client(timeout=8.0) as client:
                    client.post(
                        "https://oauth2.googleapis.com/revoke",
                        params={"token": access_token},
                        headers={"Content-Type": "application/x-www-form-urlencoded"}
                    )
            except Exception:
                pass
        return True
