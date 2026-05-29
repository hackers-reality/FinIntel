import json
import os
import tempfile
from typing import Generator

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.database.db import get_db
from backend.security.jwt import decode_access_token
from backend.services.research_service import research_engine

router = APIRouter(prefix="/research", tags=["research"])
api_research_router = APIRouter(prefix="/api/research", tags=["research"])
chat_router = APIRouter(prefix="/api/chat", tags=["chat"])
legacy_research_router = APIRouter(tags=["research"])

from backend.schemas.research import (
    ResearchResult as LegacyResearchResult,
    MarketBehavior as LegacyMarketBehavior,
    CompanyDueDiligence as LegacyCompanyDueDiligence,
    PortfolioResearchContext as LegacyPortfolioResearchContext,
    DocumentAnalysisRequest as LegacyDocumentAnalysisRequest,
    DocumentRisk as LegacyDocumentRisk,
)
from backend.services.research_service import (
    get_research,
    get_market_behavior,
    get_company_due_diligence,
    get_portfolio_research_context,
    analyze_document,
)

@legacy_research_router.get("/market/research/{ticker}", response_model=LegacyResearchResult)
def market_research(ticker: str) -> LegacyResearchResult:
    return get_research(ticker)

@legacy_research_router.get("/market/behavior/{ticker}", response_model=LegacyMarketBehavior)
def market_behavior(ticker: str) -> LegacyMarketBehavior:
    return get_market_behavior(ticker)

@legacy_research_router.get("/market/company-intel/{ticker}", response_model=LegacyCompanyDueDiligence)
def company_due_diligence(ticker: str) -> LegacyCompanyDueDiligence:
    return get_company_due_diligence(ticker)

@legacy_research_router.get("/market/portfolio-context/{ticker}", response_model=LegacyPortfolioResearchContext)
def portfolio_research_context(ticker: str) -> LegacyPortfolioResearchContext:
    return get_portfolio_research_context(ticker)

@legacy_research_router.post("/analyze/document", response_model=LegacyDocumentRisk)
def document_analysis(payload: LegacyDocumentAnalysisRequest) -> LegacyDocumentRisk:
    return analyze_document(payload.text)


class AskQuestion(BaseModel):
    question: str
    context: str = ""
    session_id: str = "default"


@router.post("/ask")
@api_research_router.post("/ask")
async def ask_question(payload: AskQuestion, request: Request, db: Session = Depends(get_db)) -> dict:
    """AI chat endpoint for conversational research."""
    try:
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return {"error": "Missing authorization"}

        token = auth_header.split(" ", 1)[1]
        try:
            payload_data = decode_access_token(token)
            user_id = int(payload_data["sub"])
        except Exception:
            return {"error": "Invalid token"}

        answer = await research_engine.ask_question(payload.question, payload.session_id, db)
        return {"answer": answer}
    except Exception as e:
        return {"error": f"AI service error: {str(e)}"}


@router.post("/analyze")
async def analyze_ticker(ticker: str, request: Request, db: Session = Depends(get_db)) -> dict:
    """Deep research analysis for a ticker."""
    try:
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return {"error": "Missing authorization"}

        token = auth_header.split(" ", 1)[1]
        try:
            payload_data = decode_access_token(token)
            user_id = int(payload_data["sub"])
        except Exception:
            return {"error": "Invalid token"}

        result = await research_engine.analyze_ticker(ticker, db)
        return result
    except Exception as e:
        return {"error": f"Research failed: {str(e)}"}


class ReportPayload(BaseModel):
    query: str
    ticker: str = None


@router.post("/report")
async def create_mega_report(payload: ReportPayload, request: Request, db: Session = Depends(get_db)) -> dict:
    try:
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return {"error": "Missing authorization"}

        token = auth_header.split(" ", 1)[1]
        try:
            payload_data = decode_access_token(token)
            user_id = int(payload_data["sub"])
        except Exception:
            return {"error": "Invalid token"}

        result = await research_engine.generate_mega_report(payload.query, payload.ticker, db)
        return result
    except Exception as e:
        return {"error": f"Report generation failed: {str(e)}"}


@router.get("/history")
def get_report_history(request: Request, db: Session = Depends(get_db)):
    try:
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return {"error": "Missing authorization"}

        token = auth_header.split(" ", 1)[1]
        try:
            payload_data = decode_access_token(token)
            user_id = int(payload_data["sub"])
        except Exception:
            return {"error": "Invalid token"}

        from backend.database.db import ResearchHistory
        results = (
            db.query(ResearchHistory)
            .order_by(ResearchHistory.created_at.desc())
            .all()
        )
        return [
            {
                "id": r.id,
                "query": r.query,
                "ticker": r.ticker,
                "created_at": r.created_at.isoformat() if r.created_at else None
            }
            for r in results
        ]
    except Exception as e:
        return {"error": f"Failed to retrieve history: {str(e)}"}


@router.get("/{id}")
def get_report_by_id(id: int, request: Request, db: Session = Depends(get_db)):
    try:
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return {"error": "Missing authorization"}

        token = auth_header.split(" ", 1)[1]
        try:
            payload_data = decode_access_token(token)
            user_id = int(payload_data["sub"])
        except Exception:
            return {"error": "Invalid token"}

        from backend.database.db import ResearchHistory
        report = db.query(ResearchHistory).filter(ResearchHistory.id == id).first()
        if not report:
            return {"error": "Report not found"}
        
        return {
            "id": report.id,
            "query": report.query,
            "ticker": report.ticker,
            "report": report.report,
            "created_at": report.created_at.isoformat() if report.created_at else None,
            "provider": report.provider
        }
    except Exception as e:
        return {"error": f"Failed to fetch report details: {str(e)}"}


@router.get("/{id}/pdf")
async def export_report_pdf(id: int, request: Request, db: Session = Depends(get_db)):
    try:
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing authorization.")

        token = auth_header.split(" ", 1)[1]
        try:
            decode_access_token(token)
        except Exception:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token.")

        from backend.database.db import ResearchHistory
        report = db.query(ResearchHistory).filter(ResearchHistory.id == id).first()
        if not report:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")

        # Fetch history if ticker is present
        history = None
        if report.ticker:
            try:
                from backend.services.market_service import get_history
                history = await get_history(report.ticker, period="3mo")
            except Exception:
                pass

        from backend.services.pdf_service import generate_report_pdf
        
        temp_dir = tempfile.gettempdir()
        pdf_filename = os.path.join(temp_dir, f"report_{id}.pdf")
        
        try:
            generate_report_pdf(pdf_filename, report.query, report.ticker, report.report, history)
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to generate PDF: {e}")
            
        return FileResponse(
            path=pdf_filename,
            filename=f"{report.ticker or 'market'}_report.pdf",
            media_type="application/pdf"
        )
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))


@chat_router.get("/history")
def get_chat_history(session_id: str, request: Request, db: Session = Depends(get_db)):
    try:
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return {"error": "Missing authorization"}

        token = auth_header.split(" ", 1)[1]
        try:
            decode_access_token(token)
        except Exception:
            return {"error": "Invalid token"}

        from backend.database.db import ChatHistory
        results = db.query(ChatHistory).filter(ChatHistory.session_id == session_id).order_by(ChatHistory.timestamp.asc()).all()
        
        return [
            {
                "id": str(r.id),
                "role": r.role,
                "content": r.content,
                "timestamp": r.timestamp.isoformat() if r.timestamp else None
            }
            for r in results
        ]
    except Exception as e:
        return {"error": f"Failed to retrieve chat history: {str(e)}"}
