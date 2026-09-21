from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional

class CareerDataConnector(ABC):
    """Common interface for external career and technical data connectors."""

    def __init__(self, provider_name: str):
        self.provider_name = provider_name

    @abstractmethod
    def is_configured(self) -> bool:
        """Returns True if required OAuth client credentials exist in environment."""
        pass

    @abstractmethod
    def get_authorization_url(self, user_id: int, redirect_uri: str, state: str) -> str:
        """Generates the official OAuth authorization URL."""
        pass

    @abstractmethod
    def handle_callback(self, code: str, redirect_uri: str) -> Dict[str, Any]:
        """Exchanges auth code for access/refresh tokens and user identity."""
        pass

    @abstractmethod
    def get_account_info(self, access_token: str) -> Dict[str, Any]:
        """Fetches basic profile info (username, display name, avatar, profile url)."""
        pass

    @abstractmethod
    def sync_signals(self, user_id: int, access_token: str) -> List[Dict[str, Any]]:
        """Extracts normalized career signals (languages, frameworks, topics)."""
        pass

    @abstractmethod
    def disconnect(self, access_token: str) -> bool:
        """Revokes token if supported by official provider API."""
        pass
