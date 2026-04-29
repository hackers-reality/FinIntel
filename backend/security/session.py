import base64
import hashlib
import hmac
import json
from datetime import datetime, timedelta, timezone

from fastapi import Header, HTTPException, status

from backend.config.settings import get_settings
from backend.schemas.auth import AuthSession


def _encode(payload: dict[str, object]) -> str:
    body = json.dumps(payload, separators=(",", ":"), sort_keys=True).encode("utf-8")
    body_segment = base64.urlsafe_b64encode(body).decode("utf-8").rstrip("=")
    secret = get_settings().app_secret.encode("utf-8")
    signature = hmac.new(secret, body_segment.encode("utf-8"), hashlib.sha256).hexdigest()
    return f"{body_segment}.{signature}"


def _decode(token: str) -> dict[str, object]:
    try:
        body_segment, signature = token.split(".", 1)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session token.") from exc

    secret = get_settings().app_secret.encode("utf-8")
    expected_signature = hmac.new(secret, body_segment.encode("utf-8"), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(signature, expected_signature):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session token.")

    padding = "=" * (-len(body_segment) % 4)
    payload = base64.urlsafe_b64decode(f"{body_segment}{padding}".encode("utf-8"))
    data = json.loads(payload.decode("utf-8"))
    expires_at = datetime.fromisoformat(str(data["exp"]))
    if expires_at <= datetime.now(timezone.utc):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session token has expired.")
    return data


def create_session() -> AuthSession:
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=get_settings().session_ttl_minutes)
    payload: dict[str, object] = {
        "exp": expires_at.isoformat(),
        "type": "guest",
        "capabilities": ["market:read", "portfolio:read", "portfolio:write", "research:read", "settings:write"],
    }
    token = _encode(payload)
    return AuthSession(
        token=token,
        expires_at=expires_at,
        session_type="guest",
        capabilities=["market:read", "portfolio:read", "portfolio:write", "research:read", "settings:write"],
    )


def require_session(x_session_token: str | None = Header(default=None)) -> dict[str, object]:
    if not x_session_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing session token.")
    return _decode(x_session_token)
