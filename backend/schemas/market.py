from pydantic import BaseModel, Field


class StockData(BaseModel):
    symbol: str
    price: float
    change: float


class MarketOverview(BaseModel):
    stocks: list[StockData] = Field(default_factory=list)
    market_status: str
    as_of: str


class SectorPerformance(BaseModel):
    sector: str
    change: float


class FiiDiiFlow(BaseModel):
    date: str
    fii: float
    dii: float


class BulkDeal(BaseModel):
    ticker: str
    client: str
    qty: float
    price: float
    type: str
    date: str


class MarketEvent(BaseModel):
    id: int
    ticker: str
    type: str
    description: str
    ts: str
    status: str


class InvestorNews(BaseModel):
    investor_name: str
    title: str
    url: str
    date: str
