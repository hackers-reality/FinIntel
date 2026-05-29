from fastapi import APIRouter, Depends, Request, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from backend.database.db import get_db, SavedOpportunity
from backend.security.jwt import decode_access_token

router = APIRouter(prefix="/api/opportunities", tags=["opportunities"])

class OpportunityPayload(BaseModel):
    ticker: str
    thesis: str
    entry_price: float | None = None
    target_price: float | None = None
    stop_loss: float | None = None

@router.get("")
def get_opportunities(request: Request, db: Session = Depends(get_db)) -> list:
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing authorization.")

    token = auth_header.split(" ", 1)[1]
    try:
        decode_access_token(token)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token.")

    entries = db.query(SavedOpportunity).order_by(SavedOpportunity.created_at.desc()).all()
    return [
        {
            "id": entry.id,
            "ticker": entry.ticker,
            "thesis": entry.thesis,
            "entry_price": entry.entry_price,
            "target_price": entry.target_price,
            "stop_loss": entry.stop_loss,
            "created_at": entry.created_at.isoformat() if entry.created_at else None
        }
        for entry in entries
    ]

@router.post("")
def save_opportunity(payload: OpportunityPayload, request: Request, db: Session = Depends(get_db)) -> dict:
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing authorization.")

    token = auth_header.split(" ", 1)[1]
    try:
        decode_access_token(token)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token.")

    entry = SavedOpportunity(
        ticker=payload.ticker,
        thesis=payload.thesis,
        entry_price=payload.entry_price,
        target_price=payload.target_price,
        stop_loss=payload.stop_loss
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return {"status": "saved", "id": entry.id}
