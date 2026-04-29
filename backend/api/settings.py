from fastapi import APIRouter, Depends, HTTPException, status

from backend.schemas.settings import (
    ProviderSettingInput,
    ProviderSettingStatus,
    UserSettings,
    UserSettingsUpdate,
)
from backend.security.session import require_session
from backend.services.settings_service import (
    get_user_settings,
    list_provider_settings,
    update_user_settings,
    upsert_provider_setting,
    verify_provider_setting,
)


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


@router.get("/providers")
def read_providers() -> list[ProviderSettingStatus]:
    return list_provider_settings()


@router.post("/providers")
def write_provider(payload: ProviderSettingInput) -> ProviderSettingStatus:
    try:
        return upsert_provider_setting(payload.provider, payload.api_key, payload.base_url, payload.model)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post("/providers/{provider}/verify")
def verify_provider(provider: str) -> ProviderSettingStatus:
    try:
        return verify_provider_setting(provider)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
