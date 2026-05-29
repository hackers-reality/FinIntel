import { apiRequest } from './api'
import type { CompanyDueDiligence, DocumentRisk, MarketBehavior, PortfolioResearchContext, ResearchResult } from '../types/research'

export interface MegaReportHistoryEntry {
  id: number
  query: string
  ticker: string | null
  created_at: string
}

export interface MegaReport {
  id: number
  query: string
  ticker: string | null
  report: string
  created_at: string
  provider: string
}

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
  generateReport: (query: string, ticker: string | null, sessionToken: string) =>
    apiRequest<{ id: number; content: string; saved_path: string }>('/research/report', {
      method: 'POST',
      sessionToken,
      body: { query, ticker },
    }),
  getReportHistory: (sessionToken: string) =>
    apiRequest<MegaReportHistoryEntry[]>('/research/history', {
      sessionToken,
    }),
  getReportById: (id: number, sessionToken: string) =>
    apiRequest<MegaReport>(`/research/${id}`, {
      sessionToken,
    }),
  saveOpportunity: (ticker: string, thesis: string, sessionToken: string) =>
    apiRequest<{ status: string; id: number }>('/api/opportunities', {
      method: 'POST',
      sessionToken,
      body: { ticker, thesis },
    }),
}
