import { useCallback, useEffect, useState } from 'react'
import { Shield, Command, BarChart3 } from 'lucide-react'

import { useAuth } from '../hooks/useAuth'
import { useBroker } from '../hooks/useBroker'
import { useMarketData } from '../hooks/useMarketData'
import { usePortfolio } from '../hooks/usePortfolio'
import { useResearch } from '../hooks/useResearch'
import { settingsService } from '../services/settings'
import type { IntentMatch } from '../types/intent-router'
import type { ComplianceBundle, ProviderSettingStatus, UserSettings } from '../types/settings'
import type { RiskState } from '../types/risk-engine'
import CommandPalette from './CommandPalette'
import MarketDeskPanel from './MarketDeskPanel'
import PortfolioPanel from './PortfolioPanel'
import ProviderModal from './ProviderModal'
import ResearchPanel from './ResearchPanel'
import RiskPanel from './RiskPanel'
import SectorPanel from './SectorPanel'
import SettingsPanel from './SettingsPanel'

const cn = (...classes: string[]) => classes.filter(Boolean).join(' ')

type DashboardTab = 'market' | 'sectors' | 'portfolio' | 'research' | 'settings' | 'risk'
type ChartMode = 'line' | 'area' | 'candle'

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<DashboardTab>('market')
  const [chartMode, setChartMode] = useState<ChartMode>('line')
  const [providerModalOpen, setProviderModalOpen] = useState(false)
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const { sessionToken, isLoading: isAuthLoading, error: authError } = useAuth()
  const { account: brokerAccount, error: brokerError } = useBroker(sessionToken)
  const {
    overview,
    quotes,
    currencies,
    sectors,
    news,
    flows,
    bulkDeals,
    events,
    alerts,
    chart,
    selectedSymbol,
    setSelectedSymbol,
    isLoading: isMarketLoading,
    error: marketError,
  } = useMarketData()
  const { portfolio, newHolding, setNewHolding, addHolding, error: portfolioError } = usePortfolio(sessionToken)
  const {
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
    error: researchError,
    runResearch,
    analyzeDocument,
  } = useResearch(sessionToken)
  const [compliance, setCompliance] = useState<ComplianceBundle | null>(null)
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [providers, setProviders] = useState<ProviderSettingStatus[]>([])
  const [settingsError, setSettingsError] = useState<string | null>(null)
  const [riskState, setRiskState] = useState<RiskState | null>(null)

  useEffect(() => {
    import('../services/risk-engine').then(({ initRiskEngine, getRiskState: getState }) => {
      initRiskEngine()
      setRiskState(getState())
    })
  }, [])

  const handleCommand = useCallback((intent: IntentMatch) => {
    const { action, params } = intent

    switch (action) {
      case 'research':
        if (params.ticker) {
          setActiveTab('research')
          import('../hooks/useResearch').then(({ useResearch: hook }) => {
            const { setResearchTicker, runResearch } = hook(sessionToken)
            setResearchTicker(params.ticker)
            runResearch()
          })
        }
        break
      case 'analyze_document':
        setActiveTab('research')
        break
      case 'add_holding':
        setActiveTab('portfolio')
        break
      case 'remove_holding':
        setActiveTab('portfolio')
        break
      case 'check_portfolio':
        setActiveTab('portfolio')
        break
      case 'scan_market':
        setActiveTab('market')
        break
      case 'check_risk':
        setActiveTab('risk')
        break
      case 'switch_tab':
        if (params.tab && ['market', 'sectors', 'portfolio', 'research', 'settings', 'risk'].includes(params.tab)) {
          setActiveTab(params.tab as DashboardTab)
        }
        break
      case 'help':
        setCommandPaletteOpen(true)
        break
    }
  }, [sessionToken])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setCommandPaletteOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

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

  useEffect(() => {
    if (!sessionToken) {
      return
    }
    void settingsService.listProviders(sessionToken).then(setProviders).catch(() => {
      setSettingsError('Unable to load provider settings.')
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

  async function saveProvider(payload: Parameters<typeof settingsService.saveProvider>[0]) {
    if (!sessionToken) {
      return
    }
    const next = await settingsService.saveProvider(payload, sessionToken)
    setProviders((current) => {
      const filtered = current.filter((item) => item.provider !== next.provider)
      return [...filtered, next].sort((left, right) => left.provider.localeCompare(right.provider))
    })
  }

  async function verifyProvider(provider: string) {
    if (!sessionToken) {
      return
    }
    const next = await settingsService.verifyProvider(provider, sessionToken)
    setProviders((current) => {
      const filtered = current.filter((item) => item.provider !== next.provider)
      return [...filtered, next].sort((left, right) => left.provider.localeCompare(right.provider))
    })
  }

  const surfaceError = authError ?? brokerError ?? marketError ?? portfolioError ?? researchError ?? settingsError
  const marketStatus = overview?.market_status ?? 'CLOSED'

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans flex flex-col">
      <nav className="fixed top-0 inset-x-0 h-20 bg-black/40 backdrop-blur-2xl border-b border-white/5 z-50 flex items-center justify-between px-10">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-cyan-400 rounded-xl flex items-center justify-center text-black shadow-lg shadow-cyan-400/20"><Shield size={24} /></div>
            <h1 className="text-lg font-black tracking-tighter uppercase italic">FinIntel Market Desk</h1>
          </div>
          <div className={cn('px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest', marketStatus === 'OPEN' ? 'border-emerald-400/30 text-emerald-400 bg-emerald-400/5 shadow-[0_0_15px_#10b98110]' : 'border-rose-400/30 text-rose-400')}>Market {marketStatus}</div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex space-x-1 bg-white/5 p-1 rounded-xl border border-white/10">
            {(['market', 'sectors', 'portfolio', 'research', 'risk', 'settings'] as DashboardTab[]).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={cn('px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all', activeTab === tab ? 'bg-white/10 text-white' : 'text-gray-500')}>{tab === 'risk' ? <BarChart3 size={12} /> : tab}</button>
            ))}
          </div>
          <button onClick={() => setCommandPaletteOpen(true)} className="p-2 bg-white/5 border border-white/10 rounded-xl text-gray-500 hover:text-white transition-colors" title="Command Palette (Cmd+K)">
            <Command size={16} />
          </button>
        </div>
      </nav>

      <main className="flex-1 pt-28 pb-20 px-10 max-w-7xl mx-auto w-full space-y-6">
        {(isAuthLoading || isMarketLoading) && <p className="text-sm text-gray-400">Loading market intelligence workspace...</p>}
        {surfaceError && <p className="text-sm text-rose-300">{surfaceError}</p>}

        {activeTab === 'market' && (
          <MarketDeskPanel
            overview={overview}
            quotes={quotes}
            currencies={currencies}
            sectors={sectors}
            alerts={alerts}
            chart={chart}
            news={news}
            flows={flows}
            bulkDeals={bulkDeals}
            events={events}
            selectedSymbol={selectedSymbol}
            onSelectSymbol={setSelectedSymbol}
            chartMode={chartMode}
            setChartMode={setChartMode}
          />
        )}
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
            portfolioContext={portfolioContext}
            documentText={documentText}
            setDocumentText={setDocumentText}
            analyzeDocument={analyzeDocument}
            isAnalyzing={isAnalyzing}
            documentRisk={documentRisk}
          />
        )}
        {activeTab === 'settings' && (
          <SettingsPanel
            settings={settings}
            compliance={compliance}
            brokerAccount={brokerAccount}
            providers={providers}
            onManageProviders={() => setProviderModalOpen(true)}
            onAcknowledgeRisk={acknowledgeRisk}
          />
        )}
        {activeTab === 'risk' && riskState && <RiskPanel riskState={riskState} />}
      </main>

      <ProviderModal
        isOpen={providerModalOpen}
        onClose={() => setProviderModalOpen(false)}
        onSave={saveProvider}
        onVerify={verifyProvider}
        providers={providers}
      />

      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onCommand={handleCommand}
      />

      <footer className="py-6 px-10 border-t border-white/5 bg-black/40 backdrop-blur-xl text-center">
        <p className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-1">FinIntel Investor Research Platform</p>
        <p className="text-[8px] text-gray-600 uppercase tracking-widest">
          Not investment advice. Review disclosures, verify data sources, and comply with applicable SEBI and broker requirements before acting on any analysis.
        </p>
      </footer>
    </div>
  )
}
