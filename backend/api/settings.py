from fastapi import APIRouter, Depends, HTTPException, status

from backend.schemas.settings import UserSettings, UserSettingsUpdate
from backend.security.session import require_session
from backend.services.settings_service import get_user_settings, update_user_settings


router = APIRouter(prefix="/settings", tags=["settings"], dependencies=[Depends(require_session)])


@router.get("", response_model=UserSettings)
def read_settings() -> UserSettings:
    return get_user_settings()


@router.put("", response_model=UserSettings)
def write_settings(payload: UserSettingsUpdate) -> UserSettings:
    return update_user_settings(payload)


@router.post("/vault", status_code=status.HTTP_400_BAD_REQUEST)
def reject_secret_storage() -> None:
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Credential storage is disabled. Configure provider secrets through environment variables or an external secret manager.",
    )
