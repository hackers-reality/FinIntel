from fastapi import APIRouter, Depends

from backend.schemas.research import CompanyDueDiligence, DocumentAnalysisRequest, DocumentRisk, MarketBehavior, ResearchResult
from backend.security.session import require_session
from backend.services.research_service import analyze_document, get_company_due_diligence, get_market_behavior, get_research


router = APIRouter(tags=["research"])


@router.get("/market/research/{ticker}", response_model=ResearchResult)
def market_research(ticker: str) -> ResearchResult:
    return get_research(ticker)


@router.get("/market/behavior/{ticker}", response_model=MarketBehavior)
def market_behavior(ticker: str) -> MarketBehavior:
    return get_market_behavior(ticker)


@router.get("/market/company-intel/{ticker}", response_model=CompanyDueDiligence)
def company_due_diligence(ticker: str) -> CompanyDueDiligence:
    return get_company_due_diligence(ticker)


@router.post("/analyze/document", response_model=DocumentRisk, dependencies=[Depends(require_session)])
def document_analysis(payload: DocumentAnalysisRequest) -> DocumentRisk:
    return analyze_document(payload.text)
