from pydantic import BaseModel, Field, field_validator


class PortfolioHolding(BaseModel):
    symbol: str
    qty: float
    avg_price: float
    curr_price: float
    pnl: float


class PortfolioSummary(BaseModel):
    total_value: float
    holdings: list[PortfolioHolding] = Field(default_factory=list)


class PortfolioHoldingCreate(BaseModel):
    ticker: str
    qty: float
    price: float

    @field_validator("ticker")
    @classmethod
    def normalize_ticker(cls, value: str) -> str:
        normalized = value.strip().upper()
        if not normalized:
            raise ValueError("Ticker is required.")
        return normalized

    @field_validator("qty", "price")
    @classmethod
    def positive_number(cls, value: float) -> float:
        if value <= 0:
            raise ValueError("Value must be greater than zero.")
        return value
