from pydantic import BaseModel, Field


class BrokerHolding(BaseModel):
    symbol: str
    quantity: float
    average_price: float
    last_price: float
    pnl: float


class BrokerAccountSummary(BaseModel):
    provider: str
    account_id: str | None = None
    account_name: str | None = None
    total_investment: float = 0.0
    current_value: float = 0.0
    available_cash: float = 0.0
    pnl: float = 0.0
    holdings: list[BrokerHolding] = Field(default_factory=list)
    status: str
    mode: str
    message: str
