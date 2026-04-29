from fastapi import APIRouter, Depends, status

from backend.schemas.portfolio import PortfolioHoldingCreate, PortfolioSummary
from backend.security.session import require_session
from backend.services.portfolio_service import add_holding, get_portfolio_summary


router = APIRouter(prefix="/market/portfolio", tags=["portfolio"])


@router.get("/summary", response_model=PortfolioSummary)
def portfolio_summary() -> PortfolioSummary:
    return get_portfolio_summary()


@router.post("/holdings", status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_session)])
def create_holding(payload: PortfolioHoldingCreate) -> dict[str, str]:
    add_holding(payload)
    return {"status": "created"}
