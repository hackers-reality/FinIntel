from fastapi import APIRouter, HTTPException

from backend.services.premium_data import PremiumDataError, premium_provider

router = APIRouter(prefix="/premium", tags=["premium-data"])


@router.get("/quote/{symbol}")
async def premium_quote(symbol: str) -> dict:
    try:
        return await premium_provider.get_realtime_quote(symbol)
    except PremiumDataError as e:
        raise HTTPException(status_code=503, detail=str(e))


@router.get("/historical/{symbol}")
async def premium_historical(symbol: str, period: str = "1mo", interval: str = "1d") -> list[dict]:
    try:
        return await premium_provider.get_historical(symbol, period, interval)
    except PremiumDataError as e:
        raise HTTPException(status_code=503, detail=str(e))


@router.get("/depth/{symbol}")
async def premium_depth(symbol: str) -> dict:
    try:
        return await premium_provider.get_market_depth(symbol)
    except PremiumDataError as e:
        raise HTTPException(status_code=503, detail=str(e))


@router.get("/providers")
def list_premium_providers() -> list[dict]:
    return premium_provider.list_providers()
