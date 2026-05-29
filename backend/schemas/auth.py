from datetime import datetime
from re import match

from pydantic import BaseModel, EmailStr, Field, field_validator


class AuthSession(BaseModel):
    token: str
    expires_at: datetime
    session_type: str
    capabilities: list[str]


def _validate_password(v: str) -> str:
    if len(v) < 8:
        raise ValueError("Password must be at least 8 characters")
    if not any(c.isupper() for c in v):
        raise ValueError("Password must contain an uppercase letter")
    if not any(c.isdigit() for c in v):
        raise ValueError("Password must contain a number")
    if not any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in v):
        raise ValueError("Password must contain a special character")
    return v


class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        return _validate_password(v)


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

    @field_validator("new_password")
    @classmethod
    def validate_new_password(cls, v: str) -> str:
        return _validate_password(v)


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    code: str
    new_password: str = Field(min_length=8)

    @field_validator("new_password")
    @classmethod
    def validate_new_password(cls, v: str) -> str:
        return _validate_password(v)
