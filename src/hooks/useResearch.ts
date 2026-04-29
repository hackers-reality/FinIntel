import { useCallback, useState } from 'react'

import { researchService } from '../services/research'
import type { CompanyDueDiligence, DocumentRisk, MarketBehavior, ResearchResult } from '../types/research'

export function useResearch(sessionToken: string | null) {
  const [researchTicker, setResearchTicker] = useState('RELIANCE')
  const [documentText, setDocumentText] = useState('')
  const [researchResult, setResearchResult] = useState<ResearchResult | null>(null)
  const [behavior, setBehavior] = useState<MarketBehavior | null>(null)
  const [companyIntel, setCompanyIntel] = useState<CompanyDueDiligence | null>(null)
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
      const [research, marketBehavior, dueDiligence] = await Promise.all([
        researchService.getResearch(researchTicker),
        researchService.getBehavior(researchTicker),
        researchService.getCompanyIntel(researchTicker),
      ])
      setResearchResult(research)
      setBehavior(marketBehavior)
      setCompanyIntel(dueDiligence)
      setError(null)
    } catch {
      setError('Unable to run ticker research.')
    } finally {
      setIsResearching(false)
    }
  }, [researchTicker])

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
    documentRisk,
    isResearching,
    isAnalyzing,
    error,
    runResearch,
    analyzeDocument,
  }
}
