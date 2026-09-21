import os
import urllib.parse
from typing import Dict, Any, List, Optional
import httpx
from services.integrations.base import CareerDataConnector
from services.oauth_config import get_oauth_credentials, is_provider_configured, get_oauth_redirect_uri

class GitHubConnector(CareerDataConnector):
    def __init__(self):
        super().__init__("github")

    def is_configured(self) -> bool:
        return is_provider_configured("github")

    def get_authorization_url(self, user_id: int, redirect_uri: Optional[str], state: str) -> str:
        if not self.is_configured():
            raise ValueError("GitHub integration is not configured in backend environment. Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET.")
        
        creds = get_oauth_credentials("github")
        actual_redirect = (redirect_uri or get_oauth_redirect_uri("github")).strip()
        params = {
            "client_id": creds["client_id"],
            "redirect_uri": actual_redirect,
            "scope": "read:user user:email public_repo",
            "state": state
        }
        return f"https://github.com/login/oauth/authorize?{urllib.parse.urlencode(params)}"

    def handle_callback(self, code: str, redirect_uri: Optional[str]) -> Dict[str, Any]:
        if not self.is_configured():
            raise ValueError("GitHub integration is not configured.")
        
        creds = get_oauth_credentials("github")
        actual_redirect = (redirect_uri or get_oauth_redirect_uri("github")).strip()
        
        token_url = "https://github.com/login/oauth/access_token"
        headers = {"Accept": "application/json", "User-Agent": "CareerAI-Radar"}
        payload = {
            "client_id": creds["client_id"],
            "client_secret": creds["client_secret"],
            "code": code,
            "redirect_uri": actual_redirect
        }
        with httpx.Client(timeout=12.0) as client:
            resp = client.post(token_url, json=payload, headers=headers)
            data = resp.json()

        if "error" in data:
            raise ValueError(f"GitHub OAuth exchange error: {data.get('error_description') or data.get('error')}")

        access_token = data.get("access_token")
        scope = data.get("scope", "")

        account_info = self.get_account_info(access_token)
        return {
            "access_token": access_token,
            "refresh_token": None,
            "token_expires_at": None,
            "scopes": [s.strip() for s in scope.split(",") if s.strip()] if scope else ["read:user", "user:email", "public_repo"],
            "account_info": account_info
        }

    def get_account_info(self, access_token: str) -> Dict[str, Any]:
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "CareerAI-Radar"
        }
        with httpx.Client(timeout=12.0) as client:
            resp = client.get("https://api.github.com/user", headers=headers)
            if resp.status_code != 200:
                raise ValueError(f"Failed to fetch GitHub profile: status {resp.status_code}")
            user_data = resp.json()

        return {
            "provider_user_id": str(user_data.get("id")),
            "username": user_data.get("login") or "",
            "display_name": user_data.get("name") or user_data.get("login") or "GitHub Developer",
            "profile_url": user_data.get("html_url") or f"https://github.com/{user_data.get('login')}",
            "account_type": "personal",
            "avatar_url": user_data.get("avatar_url") or ""
        }

    def sync_signals(self, user_id: int, access_token: str) -> List[Dict[str, Any]]:
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "CareerAI-Radar"
        }
        signals = []
        with httpx.Client(timeout=15.0) as client:
            # Fetch up to 30 most recently active repositories
            repos_resp = client.get("https://api.github.com/user/repos?sort=updated&per_page=30&affiliation=owner,collaborator", headers=headers)
            if repos_resp.status_code != 200:
                return []
            repos = repos_resp.json()

        lang_repos = {}
        topic_repos = {}
        total_repos = len(repos)

        for r in repos:
            repo_name = r.get("name") or "repo"
            # Language tracking
            lang = r.get("language")
            if lang:
                if lang not in lang_repos:
                    lang_repos[lang] = []
                lang_repos[lang].append(repo_name)
            
            # Topics tracking
            for t in r.get("topics", []):
                cleaned_topic = t.strip().lower()
                if cleaned_topic:
                    if cleaned_topic not in topic_repos:
                        topic_repos[cleaned_topic] = []
                    topic_repos[cleaned_topic].append(repo_name)

        # 1. Primary Language signals
        for lang, r_list in lang_repos.items():
            count = len(r_list)
            sample_names = ", ".join(r_list[:3])
            strength = round(min(0.95, 0.45 + (count / max(total_repos, 1)) * 0.5), 2)
            signals.append({
                "signal_type": "programming_language",
                "signal_value": lang,
                "strength": strength,
                "confidence": 0.92,
                "source_reference": f"GitHub: {count} repo(s) written in {lang} ({sample_names})"
            })

        # 2. Technology / Project Topics signals
        for topic, r_list in topic_repos.items():
            count = len(r_list)
            sample_names = ", ".join(r_list[:2])
            strength = round(min(0.92, 0.40 + (count * 0.12)), 2)
            signals.append({
                "signal_type": "technology",
                "signal_value": topic.title(),
                "strength": strength,
                "confidence": 0.88,
                "source_reference": f"GitHub: Tagged #{topic} in {sample_names}"
            })

        return signals

    def disconnect(self, access_token: str) -> bool:
        """Revokes the authorization token on GitHub if credentials available."""
        creds = get_oauth_credentials("github")
        if not creds["client_id"] or not creds["client_secret"] or not access_token:
            return True
        try:
            revoke_url = f"https://api.github.com/applications/{creds['client_id']}/token"
            with httpx.Client(timeout=8.0) as client:
                client.request(
                    "DELETE",
                    revoke_url,
                    auth=(creds["client_id"], creds["client_secret"]),
                    json={"access_token": access_token},
                    headers={"Accept": "application/vnd.github.v3+json", "User-Agent": "CareerAI-Radar"}
                )
        except Exception:
            pass
        return True
