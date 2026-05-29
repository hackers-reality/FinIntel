from fastapi import APIRouter, Depends, HTTPException, Request, status

from backend.schemas.settings import (
    ProviderSettingInput,
    ProviderSettingStatus,
    UserSettings,
    UserSettingsUpdate,
)
from backend.security.jwt import decode_access_token
from backend.services.settings_service import (
    get_user_settings,
    list_provider_settings,
    update_user_settings,
    upsert_provider_setting,
    verify_provider_setting,
)


router = APIRouter(prefix="/settings", tags=["settings"])


def _require_auth(request: Request):
    """Extract and validate JWT token from Authorization header."""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing authorization.")
    token = auth_header.split(" ", 1)[1]
    try:
        payload = decode_access_token(token)
        return payload
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token.") from exc


@router.get("", response_model=UserSettings)
def read_settings() -> UserSettings:
    return get_user_settings()


@router.put("", response_model=UserSettings)
def write_settings(payload: UserSettingsUpdate) -> UserSettings:
    return update_user_settings(payload)


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


from pydantic import BaseModel

class FetchModelsRequest(BaseModel):
    api_key: str | None = None
    base_url: str | None = None

@router.post("/providers/{provider}/models")
def fetch_provider_models(provider: str, payload: FetchModelsRequest) -> list[str]:
    from backend.services.settings_service import fetch_models_from_provider
    try:
        return fetch_models_from_provider(provider, payload.api_key, payload.base_url)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post("/vault")
async def write_vault(request: Request) -> dict:
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON body.")
        
    provider = body.get("provider")
    api_key = body.get("api_key")
    if not provider or not api_key:
        raise HTTPException(status_code=400, detail="Missing provider or api_key.")
        
    try:
        return upsert_provider_setting(provider, api_key, None, None)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


api_settings_router = APIRouter(prefix="/api/settings", tags=["settings"])

@api_settings_router.post("/vault")
async def api_write_vault(request: Request) -> dict:
    return await write_vault(request)

