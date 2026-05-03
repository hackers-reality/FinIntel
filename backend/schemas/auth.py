from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class AuthSession(BaseModel):
    token: str
    expires_at: datetime
    session_type: str
    capabilities: list[str]


class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)


class UserLogin(BaseModel):
    email: EmailStr
    password: str
    mfa_code: str | None = None


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenRefresh(BaseModel):
    refresh_token: str


class MFASetup(BaseModel):
    secret: str
    uri: str
    backup_codes: list[str]


class MFAVerify(BaseModel):
    mfa_code: str


class UserProfile(BaseModel):
    id: int
    email: str
    role: str
    mfa_enabled: bool
    created_at: str


class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8)
