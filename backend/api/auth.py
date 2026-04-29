from fastapi import APIRouter

from backend.schemas.auth import AuthSession
from backend.security.session import create_session


router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/session", response_model=AuthSession)
def issue_session() -> AuthSession:
    return create_session()
