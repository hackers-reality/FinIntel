export interface ResearchResult {
  ticker: string
  verdict: 'Buy' | 'Hold' | 'Reduce'
  summary: string
  price_change_pct: number
  volume_signal: string
}

export interface MarketBehavior {
  ticker: string
  status: string
  signal: string
}

export interface DocumentRisk {
  risk_clauses: string[]
}

export interface ResearchSource {
  title: string
  url: string
  snippet: string
  source_type: string
}

export interface CompanyDueDiligence {
  ticker: string
  summary: string
  caution_level: string
  legal_risks: string[]
  news_signals: string[]
  blog_signals: string[]
  sources: ResearchSource[]
}
