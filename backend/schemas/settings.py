from pydantic import BaseModel, Field


class UserSettings(BaseModel):
    preferred_watchlist: list[str] = Field(default_factory=list)
    default_research_ticker: str = "RELIANCE"
    risk_acknowledged: bool = False
    zerodha_api_key: str = ""
    zerodha_access_token: str = ""
    zerodha_enabled: bool = False


class UserSettingsUpdate(BaseModel):
    preferred_watchlist: list[str] | None = None
    default_research_ticker: str | None = None
    risk_acknowledged: bool | None = None
    zerodha_api_key: str | None = None
    zerodha_access_token: str | None = None
    zerodha_enabled: bool | None = None


class ProviderSettingInput(BaseModel):
    provider: str
    api_key: str
    base_url: str | None = None
    model: str | None = None


class ProviderSettingStatus(BaseModel):
    provider: str
    has_key: bool
    base_url: str | None = None
    model: str | None = None
    verified_at: str | None = None
    verification_status: str | None = None
    verification_message: str | None = None
