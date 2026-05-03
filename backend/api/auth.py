import json
from typing import Generator

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.database.db import get_db
from backend.models.user import User, UserRole
from backend.schemas.auth import (
    AuthSession,
    MFASetup,
    MFAVerify,
    PasswordChange,
    TokenRefresh,
    TokenResponse,
    UserLogin,
    UserProfile,
    UserRegister,
)
from backend.security.jwt import create_access_token, create_refresh_token, decode_access_token, decode_refresh_token
from backend.security.mfa import generate_backup_codes, generate_mfa_secret, generate_mfa_uri, verify_mfa_token
from backend.security.password import hash_password, verify_password
from backend.security.session import create_session

router = APIRouter(prefix="/auth", tags=["auth"])

_revoked_tokens: set[str] = set()


def get_current_user(
    authorization: str | None = None,
    db: Session = Depends(get_db),
) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing or invalid Authorization header.")
    token = authorization.split(" ", 1)[1]
    if token in _revoked_tokens:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has been revoked.")
    payload = decode_access_token(token)
    user = db.query(User).filter(User.id == int(payload["sub"])).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive.")
    return user


def get_current_user_from_header(
    authorization: str | None = None,
    db: Session = Depends(get_db),
) -> User:
    return get_current_user(authorization, db)


@router.post("/session", response_model=AuthSession)
def issue_session() -> AuthSession:
    return create_session()


@router.post("/register", response_model=UserProfile, status_code=status.HTTP_201_CREATED)
def register(payload: UserRegister, db: Session = Depends(get_db)) -> UserProfile:
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered.")
    user = User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        role=UserRole.USER,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return UserProfile(
        id=user.id,
        email=user.email,
        role=user.role.value,
        mfa_enabled=user.mfa_enabled,
        created_at=user.created_at.isoformat(),
    )


@router.post("/login", response_model=TokenResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)) -> TokenResponse:
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password.")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is deactivated.")
    if user.mfa_enabled:
        if not payload.mfa_code:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="MFA code required.")
        if not user.mfa_secret or not verify_mfa_token(user.mfa_secret, payload.mfa_code):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid MFA code.")
    access = create_access_token(user.id, user.role.value)
    refresh = create_refresh_token(user.id)
    return TokenResponse(access_token=access, refresh_token=refresh)


@router.post("/refresh", response_model=TokenResponse)
def refresh_tokens(payload: TokenRefresh, db: Session = Depends(get_db)) -> TokenResponse:
    if payload.refresh_token in _revoked_tokens:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token has been revoked.")
    payload_data = decode_refresh_token(payload.refresh_token)
    user = db.query(User).filter(User.id == int(payload_data["sub"])).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive.")
    access = create_access_token(user.id, user.role.value)
    refresh = create_refresh_token(user.id)
    return TokenResponse(access_token=access, refresh_token=refresh)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(payload: TokenRefresh) -> None:
    _revoked_tokens.add(payload.refresh_token)


@router.post("/mfa/enable", response_model=MFASetup)
def enable_mfa(user: User = Depends(get_current_user_from_header)) -> MFASetup:
    if user.mfa_enabled:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="MFA is already enabled.")
    secret = generate_mfa_secret()
    uri = generate_mfa_uri(secret, user.email)
    backup_codes = generate_backup_codes()
    return MFASetup(secret=secret, uri=uri, backup_codes=backup_codes)


@router.post("/mfa/verify")
def verify_mfa(payload: MFAVerify, user: User = Depends(get_current_user_from_header), db: Session = Depends(get_db)) -> dict:
    if not user.mfa_secret:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Enable MFA first via /auth/mfa/enable.")
    if not verify_mfa_token(user.mfa_secret, payload.mfa_code):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid MFA code.")
    user.mfa_enabled = True
    user.mfa_backup_codes = json.dumps([])
    db.commit()
    return {"success": True, "message": "MFA enabled successfully."}


@router.get("/me", response_model=UserProfile)
def get_profile(user: User = Depends(get_current_user_from_header)) -> UserProfile:
    return UserProfile(
        id=user.id,
        email=user.email,
        role=user.role.value,
        mfa_enabled=user.mfa_enabled,
        created_at=user.created_at.isoformat(),
    )


@router.post("/password/change")
def change_password(payload: PasswordChange, user: User = Depends(get_current_user_from_header), db: Session = Depends(get_db)) -> dict:
    if not verify_password(payload.current_password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect.")
    user.hashed_password = hash_password(payload.new_password)
    db.commit()
    return {"success": True, "message": "Password changed successfully."}
