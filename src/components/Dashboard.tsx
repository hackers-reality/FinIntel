import { useEffect, useState } from 'react'
import { Shield } from 'lucide-react'

import { useAuth } from '../hooks/useAuth'
import { useBroker } from '../hooks/useBroker'
import { useMarketData } from '../hooks/useMarketData'
import { usePortfolio } from '../hooks/usePortfolio'
import { useResearch } from '../hooks/useResearch'
import { settingsService } from '../services/settings'
import type { ComplianceBundle, UserSettings } from '../types/settings'
import OverviewPanel from './OverviewPanel'
import PortfolioPanel from './PortfolioPanel'
import ResearchPanel from './ResearchPanel'
import SectorPanel from './SectorPanel'
import SettingsPanel from './SettingsPanel'

const cn = (...classes: string[]) => classes.filter(Boolean).join(' ')

type DashboardTab = 'overview' | 'sectors' | 'portfolio' | 'research' | 'settings'

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview')
  const { sessionToken, isLoading: isAuthLoading, error: authError } = useAuth()
  const { account: brokerAccount, error: brokerError } = useBroker(sessionToken)
  const { overview, sectors, news, flows, bulkDeals, events, isLoading: isMarketLoading, error: marketError } = useMarketData()
  const { portfolio, newHolding, setNewHolding, addHolding, error: portfolioError } = usePortfolio(sessionToken)
  const {
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
    error: researchError,
    runResearch,
    analyzeDocument,
  } = useResearch(sessionToken)
  const [compliance, setCompliance] = useState<ComplianceBundle | null>(null)
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [settingsError, setSettingsError] = useState<string | null>(null)

  useEffect(() => {
    void settingsService.getCompliance().then(setCompliance).catch(() => {
      setSettingsError('Unable to load compliance information.')
    })
  }, [])

  useEffect(() => {
    if (!sessionToken) {
      return
    }
    void settingsService.getSettings(sessionToken).then(setSettings).catch(() => {
      setSettingsError('Unable to load user settings.')
    })
  }, [sessionToken])

  async function acknowledgeRisk() {
    if (!sessionToken) {
      return
    }
    try {
      const updatedSettings = await settingsService.updateSettings({ risk_acknowledged: true }, sessionToken)
      setSettings(updatedSettings)
      setSettingsError(null)
    } catch {
      setSettingsError('Unable to update the compliance acknowledgment.')
    }
  }

  const surfaceError = authError ?? brokerError ?? marketError ?? portfolioError ?? researchError ?? settingsError
  const marketStatus = overview?.market_status ?? 'CLOSED'

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans flex flex-col">
      <nav className="fixed top-0 inset-x-0 h-20 bg-black/40 backdrop-blur-2xl border-b border-white/5 z-50 flex items-center justify-between px-10">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-cyan-400 rounded-xl flex items-center justify-center text-black shadow-lg shadow-cyan-400/20"><Shield size={24} /></div>
            <h1 className="text-lg font-black tracking-tighter uppercase italic">FinIntel Market Intelligence</h1>
          </div>
          <div className={cn('px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest', marketStatus === 'OPEN' ? 'border-emerald-400/30 text-emerald-400 bg-emerald-400/5 shadow-[0_0_15px_#10b98110]' : 'border-rose-400/30 text-rose-400')}>Market {marketStatus}</div>
        </div>
        <div className="flex space-x-1 bg-white/5 p-1 rounded-xl border border-white/10">
          {(['overview', 'sectors', 'portfolio', 'research', 'settings'] as DashboardTab[]).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={cn('px-6 py-2 rounded-lg text-[10px] font-black uppercase transition-all', activeTab === tab ? 'bg-white/10 text-white' : 'text-gray-500')}>{tab}</button>
          ))}
        </div>
      </nav>

      <main className="flex-1 pt-28 pb-20 px-10 max-w-7xl mx-auto w-full space-y-6">
        {(isAuthLoading || isMarketLoading) && <p className="text-sm text-gray-400">Loading market intelligence workspace...</p>}
        {surfaceError && <p className="text-sm text-rose-300">{surfaceError}</p>}

        {activeTab === 'overview' && overview && <OverviewPanel overview={overview} news={news} flows={flows} bulkDeals={bulkDeals} events={events} />}
        {activeTab === 'sectors' && <SectorPanel sectors={sectors} />}
        {activeTab === 'portfolio' && <PortfolioPanel portfolio={portfolio} newHolding={newHolding} setNewHolding={setNewHolding} addHolding={addHolding} />}
        {activeTab === 'research' && (
          <ResearchPanel
            researchTicker={researchTicker}
            setResearchTicker={setResearchTicker}
            runResearch={runResearch}
            isResearching={isResearching}
            researchResult={researchResult}
            behavior={behavior}
            companyIntel={companyIntel}
            documentText={documentText}
            setDocumentText={setDocumentText}
            analyzeDocument={analyzeDocument}
            isAnalyzing={isAnalyzing}
            documentRisk={documentRisk}
          />
        )}
        {activeTab === 'settings' && <SettingsPanel settings={settings} compliance={compliance} brokerAccount={brokerAccount} onAcknowledgeRisk={acknowledgeRisk} />}
      </main>

      <footer className="py-6 px-10 border-t border-white/5 bg-black/40 backdrop-blur-xl text-center">
        <p className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-1">FinIntel Investor Research Platform</p>
        <p className="text-[8px] text-gray-600 uppercase tracking-widest">
          Not investment advice. Review disclosures, verify data sources, and comply with applicable SEBI and broker requirements before acting on any analysis.
        </p>
      </footer>
    </div>
  )
}
