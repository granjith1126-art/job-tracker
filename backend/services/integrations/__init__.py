from services.integrations.github import GitHubConnector
from services.integrations.google import GoogleConnector
from services.integrations.youtube import YouTubeDataService
from services.integrations.instagram import InstagramRadarConnector

google_connector = GoogleConnector()
youtube_service = YouTubeDataService()

RADAR_CONNECTORS = {
    "github": GitHubConnector(),
    "google": google_connector,
    "youtube": google_connector,
    "instagram": InstagramRadarConnector()
}

def get_radar_connector(provider: str):
    return RADAR_CONNECTORS.get(provider.lower())

def get_youtube_service() -> YouTubeDataService:
    return youtube_service

