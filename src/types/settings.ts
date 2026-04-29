export interface UserSettings {
  preferred_watchlist: string[]
  default_research_ticker: string
  risk_acknowledged: boolean
}

export interface ComplianceDocument {
  title: string
  summary: string
  sections: string[]
}

export interface ComplianceBundle {
  disclaimer: string
  risk_warning: string
  privacy_policy: ComplianceDocument
  terms_of_service: ComplianceDocument
  consent_notice: string
  data_sources: string[]
}
