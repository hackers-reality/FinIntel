from fastapi import APIRouter, Depends

from backend.schemas.broker import BrokerAccountSummary
from backend.security.session import require_session
from backend.services.broker_service import get_broker_account_summary


router = APIRouter(prefix="/market/broker", tags=["broker"], dependencies=[Depends(require_session)])


@router.get("/account", response_model=BrokerAccountSummary)
def broker_account() -> BrokerAccountSummary:
    return get_broker_account_summary()
