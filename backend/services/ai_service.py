import os
import json
import logging
from typing import Dict, Any, List, Optional
from dotenv import load_dotenv

# Ensure .env is loaded from backend directory or project root
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
env_path = os.path.join(base_dir, ".env")
if os.path.exists(env_path):
    load_dotenv(env_path)
else:
    load_dotenv()

logger = logging.getLogger(__name__)

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

class AIService:
    """
    AI Provider Abstraction Layer for Aira:
    - PRIMARY: Google Gemini (gemini-3.5-flash-lite / gemini-3.6-flash) for ultra-low latency & natural chat
    - FALLBACK: OpenAI (gpt-4o-mini) if Gemini encounters rate-limit, timeout, or service disruption
    - TTS: OpenAI TTS (nova voice) with high-fidelity speech synthesis
    """

    def __init__(self):
        self.openai_client = None
        if OPENAI_API_KEY and not OPENAI_API_KEY.startswith("your-") and len(OPENAI_API_KEY) > 10:
            try:
                from openai import OpenAI
                self.openai_client = OpenAI(api_key=OPENAI_API_KEY)
            except Exception as e:
                logger.warning(f"Failed to initialize OpenAI client: {e}")

    def call_gemini_chat(self, system_prompt: str, user_prompt: str, temperature: float = 0.7, json_mode: bool = False) -> Optional[str]:
        """
        Primary AI call using Google Gemini flash endpoint.
        Tries gemini-3.5-flash-lite first for ~1.5s latency, then gemini-3.6-flash.
        """
        if not GEMINI_API_KEY or len(GEMINI_API_KEY) < 10:
            return None
        
        import httpx
        candidate_models = ["gemini-3.5-flash-lite", "gemini-3.6-flash", "gemini-3.1-flash-lite", "gemini-3.5-flash"]
        
        combined_prompt = f"System Instructions:\n{system_prompt}\n\nUser Request:\n{user_prompt}"
        payload = {
            "contents": [
                {
                    "parts": [{"text": combined_prompt}]
                }
            ],
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": 2048
            }
        }
        if json_mode:
            payload["generationConfig"]["responseMimeType"] = "application/json"

        for model in candidate_models:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={GEMINI_API_KEY}"
            try:
                with httpx.Client(timeout=15.0) as client:
                    res = client.post(url, json=payload)
                    if res.status_code == 200:
                        data = res.json()
                        candidates = data.get("candidates", [])
                        if candidates:
                            parts = candidates[0].get("content", {}).get("parts", [])
                            if parts:
                                text = parts[0].get("text", "").strip()
                                if text:
                                    return text
                    elif res.status_code in [404, 503, 429]:
                        logger.info(f"Gemini {model} returned status {res.status_code}, trying next model...")
                        continue
            except Exception as e:
                logger.warning(f"Gemini {model} call error ({type(e).__name__}): {e}")
                continue

        return None

    def call_openai_chat(self, system_prompt: str, user_prompt: str, temperature: float = 0.7, json_mode: bool = False) -> Optional[str]:
        """
        Fallback AI call using OpenAI chat completions.
        """
        if not self.openai_client:
            return None
        try:
            kwargs = {
                "model": "gpt-4o-mini",
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                "temperature": temperature,
                "timeout": 15.0
            }
            if json_mode:
                kwargs["response_format"] = {"type": "json_object"}
            
            response = self.openai_client.chat.completions.create(**kwargs)
            content = response.choices[0].message.content
            if content and content.strip():
                return content.strip()
        except Exception as e:
            logger.warning(f"OpenAI fallback chat failed ({type(e).__name__}): {e}")
        return None

    def generate_completion(self, system_prompt: str, user_prompt: str, temperature: float = 0.7, json_mode: bool = False) -> str:
        """
        Preferred flow:
        1. PRIMARY: Gemini
        2. FALLBACK: OpenAI (only if Gemini fails or is unavailable)
        """
        # 1. Primary: Gemini
        result = self.call_gemini_chat(system_prompt, user_prompt, temperature, json_mode)
        if result:
            return result

        # 2. Fallback: OpenAI
        result = self.call_openai_chat(system_prompt, user_prompt, temperature, json_mode)
        if result:
            return result

        return ""

    def generate_speech(self, text: str) -> Optional[bytes]:
        """
        Generates natural female speech (MP3) using OpenAI TTS ('nova' voice).
        """
        if not self.openai_client or not text:
            return None
        try:
            clean_text = text.strip().strip('"').strip("'")
            if len(clean_text) > 1000:
                clean_text = clean_text[:1000]

            response = self.openai_client.audio.speech.create(
                model="tts-1",
                voice="shimmer",  # Sweet, warm, clear, expressive female robot voice
                input=clean_text,
                response_format="mp3",
                speed=1.0
            )
            return response.content
        except Exception as e:
            logger.warning(f"OpenAI TTS audio generation failed ({type(e).__name__}): {e}")
            return None

    def get_provider_status(self) -> Dict[str, Any]:
        """Safe status checker for developer/status UI without exposing secrets."""
        gemini_ok = bool(GEMINI_API_KEY and len(GEMINI_API_KEY) > 10)
        openai_ok = bool(OPENAI_API_KEY and len(OPENAI_API_KEY) > 10 and self.openai_client is not None)
        return {
            "primary_provider": "Gemini (gemini-3.5-flash-lite)",
            "fallback_provider": "OpenAI (gpt-4o-mini)",
            "gemini_configured": gemini_ok,
            "openai_configured": openai_ok
        }

ai_service = AIService()
