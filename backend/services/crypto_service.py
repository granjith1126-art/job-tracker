import os
import base64
import hashlib
import hmac
import json
import time
from typing import Tuple, Optional
from cryptography.fernet import Fernet, InvalidToken

def _get_fernet() -> Fernet:
    """Returns a Fernet instance using the configured key or a derived fallback."""
    env_key = os.environ.get("OAUTH_TOKEN_ENCRYPTION_KEY") or os.environ.get("CAREER_RADAR_ENCRYPTION_KEY")
    if env_key and env_key.strip():
        try:
            return Fernet(env_key.strip().encode("utf-8"))
        except Exception:
            pass
    # Derive a 32-byte url-safe base64 key from JWT_SECRET or SECRET_KEY
    jwt_secret = os.environ.get("JWT_SECRET") or os.environ.get("SECRET_KEY", "careerai_super_secret_production_key_2026_jwt_token")
    digest = hashlib.sha256(jwt_secret.encode("utf-8")).digest()
    key = base64.urlsafe_b64encode(digest)
    return Fernet(key)

def encrypt_token(plain_token: Optional[str]) -> Optional[str]:
    """Encrypts an OAuth access or refresh token before persisting to database."""
    if not plain_token:
        return None
    try:
        f = _get_fernet()
        encrypted = f.encrypt(plain_token.encode("utf-8"))
        return encrypted.decode("utf-8")
    except Exception as e:
        raise ValueError(f"Failed to encrypt token: {e}")

def decrypt_token(encrypted_token: Optional[str]) -> Optional[str]:
    """Decrypts an encrypted token for authorized backend API requests."""
    if not encrypted_token:
        return None
    try:
        f = _get_fernet()
        decrypted = f.decrypt(encrypted_token.encode("utf-8"))
        return decrypted.decode("utf-8")
    except InvalidToken:
        return None
    except Exception as e:
        raise ValueError(f"Failed to decrypt token: {e}")

def _get_jwt_secret() -> str:
    return os.environ.get("JWT_SECRET") or os.environ.get("SECRET_KEY", "careerai_super_secret_production_key_2026_jwt_token")

def generate_oauth_state(user_id: int, provider: str, code_verifier: Optional[str] = None) -> str:
    """
    Generates a cryptographically signed state parameter for OAuth CSRF and PKCE protection.
    Format: base64(payload).signature
    """
    timestamp = int(time.time())
    nonce = os.urandom(16).hex()
    payload = {
        "u": user_id,
        "p": provider,
        "t": timestamp,
        "n": nonce
    }
    if code_verifier:
        payload["cv"] = code_verifier
    raw_payload = json.dumps(payload, separators=(',', ':'))
    b64_payload = base64.urlsafe_b64encode(raw_payload.encode("utf-8")).decode("utf-8").rstrip("=")
    
    sig = hmac.new(_get_jwt_secret().encode("utf-8"), b64_payload.encode("utf-8"), hashlib.sha256).hexdigest()
    return f"{b64_payload}.{sig}"

def verify_oauth_state(state: str, max_age_seconds: int = 900) -> Tuple[bool, Optional[int], Optional[str], Optional[str]]:
    """
    Verifies the OAuth CSRF state parameter.
    Returns (is_valid, user_id, provider, code_verifier).
    """
    if not state or "." not in state:
        return False, None, None, None
    
    parts = state.split(".", 1)
    if len(parts) != 2:
        return False, None, None, None
    
    b64_payload, signature = parts
    expected_sig = hmac.new(_get_jwt_secret().encode("utf-8"), b64_payload.encode("utf-8"), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(signature, expected_sig):
        return False, None, None, None
    
    # Pad base64 if needed
    padded = b64_payload + "=" * ((4 - len(b64_payload) % 4) % 4)
    try:
        raw_payload = base64.urlsafe_b64decode(padded.encode("utf-8")).decode("utf-8")
        payload = json.loads(raw_payload)
        user_id = int(payload.get("u"))
        provider = str(payload.get("p"))
        created_at = int(payload.get("t"))
        code_verifier = payload.get("cv")
        
        # Check age (default 15 minutes)
        if time.time() - created_at > max_age_seconds:
            return False, None, None, None
        
        return True, user_id, provider, code_verifier
    except Exception:
        return False, None, None, None
