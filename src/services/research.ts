import { apiRequest } from './api'
import type { CompanyDueDiligence, DocumentRisk, MarketBehavior, PortfolioResearchContext, ResearchResult } from '../types/research'

export const researchService = {
  getResearch: (ticker: string) => apiRequest<ResearchResult>(`/market/research/${ticker}`),
  getBehavior: (ticker: string) => apiRequest<MarketBehavior>(`/market/behavior/${ticker}`),
  getCompanyIntel: (ticker: string) => apiRequest<CompanyDueDiligence>(`/market/company-intel/${ticker}`),
  getPortfolioContext: (ticker: string, sessionToken: string) =>
    apiRequest<PortfolioResearchContext>(`/market/portfolio-context/${ticker}`, {
      sessionToken,
    }),
  analyzeDocument: (text: string, sessionToken: string) =>
    apiRequest<DocumentRisk>('/analyze/document', {
      method: 'POST',
      sessionToken,
      body: { text },
    }),
}
