import json
import random
from datetime import datetime, timezone, timedelta
from typing import Generator

from fastapi import APIRouter, Depends, HTTPException, Request, status, Header
from slowapi import Limiter
from sqlalchemy.orm import Session

from backend.database.db import SessionLocal, get_db
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
    ForgotPasswordRequest,
    ResetPasswordRequest,
)
from backend.security.jwt import create_access_token, create_refresh_token, decode_access_token, decode_refresh_token
from backend.security.mfa import generate_backup_codes, generate_mfa_secret, generate_mfa_uri, verify_mfa_token
from backend.security.password import hash_password, verify_password
from backend.security.session import create_session

router = APIRouter(prefix="/auth", tags=["auth"])

limiter = Limiter(key_func=lambda request: request.client.host if request and request.client else "unknown")

_revoked_tokens_set: set[str] = set()
_reset_codes: dict[str, dict] = {}


def _is_token_revoked(token: str) -> bool:
    if token in _revoked_tokens_set:
        return True
    db = SessionLocal()
    try:
        from backend.database.db import engine
        from sqlalchemy import text
        result = db.execute(
            text("SELECT 1 FROM revoked_tokens WHERE jti = :token"),
            {"token": token},
        )
        return result.first() is not None
    except Exception:
        return False
    finally:
        db.close()


def get_current_user(
    authorization: str | None = Header(None),
    db: Session = Depends(get_db),
) -> User:
    print(f"[DEBUG] get_current_user - authorization: {authorization}")
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing or invalid Authorization header.")
    token = authorization.split(" ", 1)[1]
    if _is_token_revoked(token):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has been revoked.")
    payload = decode_access_token(token)
    user = db.query(User).filter(User.id == int(payload["sub"])).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive.")
    return user


def get_current_user_from_header(
    authorization: str | None = Header(None),
    db: Session = Depends(get_db),
) -> User:
    return get_current_user(authorization, db)


@router.post("/session", response_model=AuthSession)
def issue_session() -> AuthSession:
    return create_session()


@router.post("/register", response_model=UserProfile, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
def register(request: Request, payload: UserRegister, db: Session = Depends(get_db)) -> UserProfile:
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
@limiter.limit("10/minute")
def login(request: Request, payload: UserLogin, db: Session = Depends(get_db)) -> TokenResponse:
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
@limiter.limit("10/minute")
def refresh_tokens(request: Request, payload: TokenRefresh, db: Session = Depends(get_db)) -> TokenResponse:
    if _is_token_revoked(payload.refresh_token):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token has been revoked.")
    payload_data = decode_refresh_token(payload.refresh_token)
    user = db.query(User).filter(User.id == int(payload_data["sub"])).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive.")
    access = create_access_token(user.id, user.role.value)
    refresh = create_refresh_token(user.id)
    return TokenResponse(access_token=access, refresh_token=refresh)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("10/minute")
def logout(request: Request, payload: TokenRefresh, db: Session = Depends(get_db)) -> None:
    _revoked_tokens_set.add(payload.refresh_token)
    from sqlalchemy import text
    db.execute(
        text("INSERT OR IGNORE INTO revoked_tokens (jti, revoked_at) VALUES (:token, :ts)"),
        {"token": payload.refresh_token, "ts": datetime.now(timezone.utc).isoformat()},
    )
    db.commit()


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


@router.post("/forgot-password")
@limiter.limit("5/minute")
def forgot_password(request: Request, payload: ForgotPasswordRequest, db: Session = Depends(get_db)) -> dict:
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        # Return success to prevent enumeration, but do not generate any code
        return {"success": True, "message": "If the email exists, a password reset code has been sent/logged."}
    
    code = f"{random.randint(100000, 999999)}"
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)
    _reset_codes[payload.email] = {
        "code": code,
        "expires_at": expires_at
    }
    
    # Print the verification code directly to the server terminal console/logs
    print(f"\n[SECURITY ALERT] Password reset requested for {payload.email}.")
    print(f"[SECURITY ALERT] Verification code: {code}")
    print(f"[SECURITY ALERT] Expires in 15 minutes.\n")
    
    return {"success": True, "message": "Verification code generated. Please check server logs/console."}


@router.post("/reset-password")
@limiter.limit("5/minute")
def reset_password(request: Request, payload: ResetPasswordRequest, db: Session = Depends(get_db)) -> dict:
    stored = _reset_codes.get(payload.email)
    if not stored:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No reset code found or code expired.")
    
    if stored["expires_at"] < datetime.now(timezone.utc):
        _reset_codes.pop(payload.email, None)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Reset code has expired.")
        
    if stored["code"] != payload.code:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid verification code.")
        
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
        
    user.hashed_password = hash_password(payload.new_password)
    db.commit()
    
    _reset_codes.pop(payload.email, None)
    
    return {"success": True, "message": "Password reset successfully."}
