import logging
import os
import secrets
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv
from pydantic import BaseModel, Field, model_validator


ROOT_DIR = Path(__file__).resolve().parents[2]
load_dotenv(ROOT_DIR / ".env")

logger = logging.getLogger("finintel.config")


class AppSettings(BaseModel):
    app_name: str = "FinIntel API"
    app_version: str = "3.0.0"
    environment: str = Field(default_factory=lambda: os.getenv("FININTEL_ENV", "development"))
    timezone: str = Field(default_factory=lambda: os.getenv("FININTEL_TIMEZONE", "Asia/Kolkata"))
    database_path: str = Field(default_factory=lambda: os.getenv("FININTEL_DB_PATH", str(ROOT_DIR / "finintel.db")))
    app_secret: str = Field(default_factory=lambda: os.getenv("FININTEL_APP_SECRET", ""))
    allowed_origins: list[str] = Field(
        default_factory=lambda: [
            origin.strip()
            for origin in os.getenv("FININTEL_ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")
            if origin.strip()
        ]
    )
    request_rate_limit: str = Field(default_factory=lambda: os.getenv("FININTEL_RATE_LIMIT", "60/minute"))
    session_ttl_minutes: int = Field(default_factory=lambda: int(os.getenv("FININTEL_SESSION_TTL_MINUTES", "480")))
    enable_broker_readonly: bool = Field(default_factory=lambda: os.getenv("FININTEL_ENABLE_BROKER_READONLY", "false").lower() == "true")

    @model_validator(mode="after")
    def validate_security_posture(self) -> "AppSettings":
        if self.environment.lower() in {"production", "prod"}:
            if not self.app_secret or len(self.app_secret) < 32:
                raise ValueError("FININTEL_APP_SECRET must be set to a strong value in production.")
            if "*" in self.allowed_origins:
                raise ValueError("Wildcard CORS origins are not allowed in production.")
        return self


@lru_cache(maxsize=1)
def get_settings() -> AppSettings:
    settings = AppSettings()
    if not settings.app_secret:
        settings.app_secret = secrets.token_urlsafe(32)
        logger.warning("FININTEL_APP_SECRET is not set. Using an ephemeral in-memory secret for this process.")
    return settings
