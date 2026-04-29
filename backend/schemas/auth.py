from datetime import datetime

from pydantic import BaseModel


class AuthSession(BaseModel):
    token: str
    expires_at: datetime
    session_type: str
    capabilities: list[str]
