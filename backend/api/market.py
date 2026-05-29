from fastapi import APIRouter, Query

from backend.schemas.market import (
    BulkDeal,
    CurrencyQuote,
    FiiDiiFlow,
    InvestorNews,
    MarketAlert,
    MarketChartSeries,
    MarketEvent,
    MarketOverview,
    MarketQuote,
    SectorPerformance,
)
from backend.services.market_service import (
    get_bulk_deals,
    get_currency_quotes,
    get_institutional_flows,
    get_investor_news,
    get_market_alerts,
    get_market_events,
    get_market_chart,
    get_market_overview,
    get_market_quotes,
    get_sector_performance,
    get_ticker_indicators,
)


router = APIRouter(prefix="/market", tags=["market"])


@router.get("/overview", response_model=MarketOverview)
def market_overview() -> MarketOverview:
    return get_market_overview()


@router.get("/quotes", response_model=list[MarketQuote])
def market_quotes() -> list[MarketQuote]:
    return get_market_quotes()


@router.get("/currencies", response_model=list[CurrencyQuote])
def currency_quotes() -> list[CurrencyQuote]:
    return get_currency_quotes()


@router.get("/chart/{symbol}", response_model=MarketChartSeries)
def market_chart(
    symbol: str,
    period: str = Query(default="1mo"),
    interval: str = Query(default="1d"),
) -> MarketChartSeries:
    return get_market_chart(symbol, period=period, interval=interval)


@router.get("/sectors", response_model=list[SectorPerformance])
def sector_performance() -> list[SectorPerformance]:
    return get_sector_performance()


@router.get("/traders/news", response_model=list[InvestorNews])
def investor_news() -> list[InvestorNews]:
    return get_investor_news()


@router.get("/fiidii", response_model=list[FiiDiiFlow])
def institutional_flow() -> list[FiiDiiFlow]:
    return get_institutional_flows()


@router.get("/bulkdeals", response_model=list[BulkDeal])
def bulk_deals() -> list[BulkDeal]:
    return get_bulk_deals()


@router.get("/events", response_model=list[MarketEvent])
def market_events() -> list[MarketEvent]:
    return get_market_events()


@router.get("/alerts", response_model=list[MarketAlert])
def market_alerts() -> list[MarketAlert]:
    return get_market_alerts()


@router.get("/indicators/{symbol}")
def market_indicators(symbol: str) -> dict:
    return get_ticker_indicators(symbol)


api_market_router = APIRouter(prefix="/api/market", tags=["market"])

@api_market_router.get("/overview", response_model=MarketOverview)
def api_market_overview() -> MarketOverview:
    return get_market_overview()

@api_market_router.get("/quotes", response_model=list[MarketQuote])
def api_market_quotes(tickers: str = Query(default=None)) -> list[MarketQuote]:
    return get_market_quotes()

@api_market_router.get("/chart", response_model=MarketChartSeries)
def api_market_chart(
    ticker: str = Query(...),
    period: str = Query(default="1mo"),
    interval: str = Query(default="1d"),
) -> MarketChartSeries:
    return get_market_chart(ticker, period=period, interval=interval)
