import json
from typing import Generator

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.database.db import get_db
from backend.security.jwt import decode_access_token
from backend.services.research_service import research_engine

router = APIRouter(prefix="/research", tags=["research"])


class AskQuestion(BaseModel):
    question: str
    context: str = ""


@router.post("/ask")
async def ask_question(payload: AskQuestion, request: Request, db: Session = Depends(get_db)) -> dict:
    """AI chat endpoint for conversational research."""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing authorization.")

    token = auth_header.split(" ", 1)[1]
    try:
        payload_data = decode_access_token(token)
        user_id = int(payload_data["sub"])
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token.")

    try:
        answer = research_engine.ask_question(payload.question, payload.context)
        return {"answer": answer}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="AI service error.") from e


@router.post("/analyze")
async def analyze_ticker(ticker: str, request: Request, db: Session = Depends(get_db)) -> dict:
    """Deep research analysis for a ticker."""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing authorization.")

    token = auth_header.split(" ", 1)[1]
    try:
        payload_data = decode_access_token(token)
        user_id = int(payload_data["sub"])
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token.")

    try:
        result = research_engine.analyze_ticker(ticker)
        return result
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Research failed.") from e
