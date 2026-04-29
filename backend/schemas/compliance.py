from pydantic import BaseModel


class ComplianceDocument(BaseModel):
    title: str
    summary: str
    sections: list[str]


class ComplianceBundle(BaseModel):
    disclaimer: str
    risk_warning: str
    privacy_policy: ComplianceDocument
    terms_of_service: ComplianceDocument
    consent_notice: str
    data_sources: list[str]
