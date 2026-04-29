import { useCallback, useState } from 'react'

import { researchService } from '../services/research'
import type { CompanyDueDiligence, DocumentRisk, MarketBehavior, PortfolioResearchContext, ResearchResult } from '../types/research'

export function useResearch(sessionToken: string | null) {
  const [researchTicker, setResearchTicker] = useState('RELIANCE')
  const [documentText, setDocumentText] = useState('')
  const [researchResult, setResearchResult] = useState<ResearchResult | null>(null)
  const [behavior, setBehavior] = useState<MarketBehavior | null>(null)
  const [companyIntel, setCompanyIntel] = useState<CompanyDueDiligence | null>(null)
  const [portfolioContext, setPortfolioContext] = useState<PortfolioResearchContext | null>(null)
  const [documentRisk, setDocumentRisk] = useState<DocumentRisk | null>(null)
  const [isResearching, setIsResearching] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
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
    documentText,
    setDocumentText,
    researchResult,
    behavior,
    companyIntel,
    portfolioContext,
    documentRisk,
    isResearching,
    isAnalyzing,
    error,
    runResearch,
    analyzeDocument,
  }
}
