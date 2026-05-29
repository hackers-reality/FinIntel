import { useCallback, useState } from 'react'

import { researchService } from '../services/research'
import { API_BASE_URL } from '../constants/api'
import type { CompanyDueDiligence, DocumentRisk, MarketBehavior, PortfolioResearchContext, ResearchResult } from '../types/research'
import type { MegaReportHistoryEntry } from '../services/research'

export function useResearch(sessionToken: string | null) {
  const [researchTicker, setResearchTicker] = useState('RELIANCE')
  const [researchQuery, setResearchQuery] = useState('Analyze RELIANCE for long term investment')
  const [documentText, setDocumentText] = useState('')
  const [researchResult, setResearchResult] = useState<ResearchResult | null>(null)
  const [megaReportContent, setMegaReportContent] = useState<string | null>(null)
  const [megaReportHistory, setMegaReportHistory] = useState<MegaReportHistoryEntry[]>([])
  const [activeReportId, setActiveReportId] = useState<number | null>(null)
  const [behavior, setBehavior] = useState<MarketBehavior | null>(null)
  const [companyIntel, setCompanyIntel] = useState<CompanyDueDiligence | null>(null)
  const [portfolioContext, setPortfolioContext] = useState<PortfolioResearchContext | null>(null)
  const [documentRisk, setDocumentRisk] = useState<DocumentRisk | null>(null)
  const [isResearching, setIsResearching] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isSavingOpportunity, setIsSavingOpportunity] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runResearch = useCallback(async () => {
    if (!researchTicker) {
      return
    }
    try {
      setIsResearching(true)
      const portfolioContextPromise = sessionToken
        ? researchService.getPortfolioContext(researchTicker, sessionToken)
        : Promise.resolve(null)
      const [research, marketBehavior, dueDiligence, nextPortfolioContext] = await Promise.all([
        researchService.getResearch(researchTicker),
        researchService.getBehavior(researchTicker),
        researchService.getCompanyIntel(researchTicker),
        portfolioContextPromise,
      ])
      setResearchResult(research)
      setBehavior(marketBehavior)
      setCompanyIntel(dueDiligence)
      setPortfolioContext(nextPortfolioContext)
      setError(null)
    } catch {
      setError('Unable to run ticker research.')
    } finally {
      setIsResearching(false)
    }
  }, [researchTicker, sessionToken])

  const runMegaReport = useCallback(async () => {
    if (!sessionToken) {
      setError('You must be logged in to generate a mega report.')
      return
    }
    try {
      setIsResearching(true)
      const result = await researchService.generateReport(researchQuery, researchTicker || null, sessionToken)
      setMegaReportContent(result.content)
      setActiveReportId(result.id)
      setError(null)
      // Refresh history list
      const hist = await researchService.getReportHistory(sessionToken)
      setMegaReportHistory(hist)
    } catch (exc: any) {
      setError(exc.message || 'Unable to generate mega report.')
    } finally {
      setIsResearching(false)
    }
  }, [researchQuery, researchTicker, sessionToken])

  const loadHistory = useCallback(async () => {
    if (!sessionToken) return
    try {
      const hist = await researchService.getReportHistory(sessionToken)
      setMegaReportHistory(hist)
    } catch {
      setError('Unable to load report history.')
    }
  }, [sessionToken])

  const loadReportById = useCallback(async (id: number) => {
    if (!sessionToken) return
    try {
      setIsResearching(true)
      const report = await researchService.getReportById(id, sessionToken)
      setMegaReportContent(report.report)
      setActiveReportId(report.id)
      setResearchTicker(report.ticker || '')
      setResearchQuery(report.query)
      setError(null)
    } catch {
      setError('Unable to load report by ID.')
    } finally {
      setIsResearching(false)
    }
  }, [sessionToken])

  const saveOpportunity = useCallback(async () => {
    if (!sessionToken || !megaReportContent) return
    try {
      setIsSavingOpportunity(true)
      const thesis = megaReportContent.slice(0, 1000)
      await researchService.saveOpportunity(researchTicker, thesis, sessionToken)
      setError(null)
      alert('Opportunity saved successfully!')
    } catch {
      setError('Unable to save opportunity.')
    } finally {
      setIsSavingOpportunity(false)
    }
  }, [researchTicker, megaReportContent, sessionToken])

  const downloadReportPdf = useCallback(async () => {
    if (!sessionToken || !activeReportId) return
    try {
      const response = await fetch(`${API_BASE_URL}/research/${activeReportId}/pdf`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        }
      })
      if (!response.ok) throw new Error('Failed to download PDF')
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${researchTicker || 'market'}_report.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch {
      setError('Unable to download PDF report.')
    }
  }, [activeReportId, researchTicker, sessionToken])

  const analyzeDocument = useCallback(async () => {
    if (!sessionToken || !documentText) {
      return
    }
    try {
      setIsAnalyzing(true)
      setDocumentRisk(await researchService.analyzeDocument(documentText, sessionToken))
      setError(null)
    } catch {
      setError('Unable to analyze the document text.')
    } finally {
      setIsAnalyzing(false)
    }
  }, [documentText, sessionToken])

  return {
    researchTicker,
    setResearchTicker,
    researchQuery,
    setResearchQuery,
    documentText,
    setDocumentText,
    researchResult,
    megaReportContent,
    megaReportHistory,
    activeReportId,
    behavior,
    companyIntel,
    portfolioContext,
    documentRisk,
    isResearching,
    isAnalyzing,
    isSavingOpportunity,
    error,
    runResearch,
    runMegaReport,
    loadHistory,
    loadReportById,
    saveOpportunity,
    downloadReportPdf,
    analyzeDocument,
  }
}
