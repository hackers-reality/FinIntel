from pydantic import BaseModel, Field


class ResearchResult(BaseModel):
    ticker: str
    verdict: str
    summary: str
    price_change_pct: float
    volume_signal: str


class MarketBehavior(BaseModel):
    ticker: str
    status: str
    signal: str


class DocumentAnalysisRequest(BaseModel):
    text: str = Field(min_length=20, max_length=20000)


class DocumentRisk(BaseModel):
    risk_clauses: list[str]


class ResearchSource(BaseModel):
    title: str
    url: str
    snippet: str
    source_type: str


class CompanyDueDiligence(BaseModel):
    ticker: str
    summary: str
    caution_level: str
    legal_risks: list[str]
    news_signals: list[str]
    blog_signals: list[str]
    sources: list[ResearchSource]


class PortfolioResearchContext(BaseModel):
    ticker: str
    local_holding_quantity: float
    broker_holding_quantity: float
    available_cash: float
    current_exposure_value: float
    diversification_note: str
    deployment_guidance: str
    caution_notes: list[str]
