from pydantic import BaseModel, Field


class UserSettings(BaseModel):
    preferred_watchlist: list[str] = Field(default_factory=list)
    default_research_ticker: str = "RELIANCE"
    risk_acknowledged: bool = False


class UserSettingsUpdate(BaseModel):
    preferred_watchlist: list[str] | None = None
    default_research_ticker: str | None = None
    risk_acknowledged: bool | None = None
