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


class CurrencyQuote(BaseModel):
    symbol: str
    price: float
    change: float
    change_percent: float


class MarketQuote(BaseModel):
    symbol: str
    name: str
    price: float
    change: float
    change_percent: float
    volume: float
    category: str


class MarketChartPoint(BaseModel):
    timestamp: str
    open: float
    high: float
    low: float
    close: float
    volume: float


class MarketChartSeries(BaseModel):
    symbol: str
    period: str
    interval: str
    points: list[MarketChartPoint]


class MarketAlert(BaseModel):
    symbol: str
    title: str
    severity: str
    description: str
    source: str
