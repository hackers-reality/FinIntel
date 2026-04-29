from fastapi import APIRouter

from backend.schemas.market import BulkDeal, FiiDiiFlow, InvestorNews, MarketEvent, MarketOverview, SectorPerformance
from backend.services.market_service import (
    get_bulk_deals,
    get_institutional_flows,
    get_investor_news,
    get_market_events,
    get_market_overview,
    get_sector_performance,
)


router = APIRouter(prefix="/market", tags=["market"])


@router.get("/overview", response_model=MarketOverview)
def market_overview() -> MarketOverview:
    return get_market_overview()


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
