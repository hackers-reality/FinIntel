import { useState, useEffect } from 'react'
import { TrendingUp, Bell, Globe2, CandlestickChart, LineChart, AreaChart, Newspaper, Search, ChevronDown, ChevronUp, ExternalLink, Sparkles, AlertCircle, X } from 'lucide-react'

import type { BulkDeal, CurrencyQuote, FiiDiiFlow, InstitutionalNews, MarketAlert, MarketChartSeries, MarketEvent, MarketQuote, MarketOverview, SectorData } from '../types/market'
import { marketService } from '../services/market'
import PriceChart from './PriceChart'

const cn = (...classes: string[]) => classes.filter(Boolean).join(' ')
type ChartMode = 'line' | 'area' | 'candle'

interface Props {
  overview: MarketOverview | null
  quotes: MarketQuote[]
  currencies: CurrencyQuote[]
  sectors: SectorData[]
  alerts: MarketAlert[]
  chart: MarketChartSeries | null
  news: InstitutionalNews[]
  flows: FiiDiiFlow[]
  bulkDeals: BulkDeal[]
  events: MarketEvent[]
  selectedSymbol: string
  onSelectSymbol: (symbol: string) => void
  chartMode: ChartMode
  setChartMode: (mode: ChartMode) => void
  chartPeriod: string
  chartInterval: string
  refreshChart: (symbol: string, period?: string, interval?: string) => void
  onAskAI?: (question: string, context?: string) => Promise<string>
}

const TIMEFRAME_PRESETS = [
  { label: '1 Min', period: '1d', interval: '1m' },
  { label: '5 Min', period: '5d', interval: '5m' },
  { label: '1 Hour', period: '1mo', interval: '1h' },
  { label: '1 Day', period: '3mo', interval: '1d' },
  { label: '1 Week', period: '1y', interval: '1wk' },
  { label: '1 Month', period: 'max', interval: '1mo' },
]

export default function MarketDeskPanel({
  overview,
  quotes,
  currencies,
  sectors,
  alerts,
  chart,
  news,
  flows,
  bulkDeals,
  events,
  selectedSymbol,
  onSelectSymbol,
  chartMode,
  setChartMode,
  chartPeriod,
  chartInterval,
  refreshChart,
  onAskAI,
}: Props) {
  const [searchInput, setSearchInput] = useState('')
  const [expandedNews, setExpandedNews] = useState<Record<string, boolean>>({})
  const [expandedAlerts, setExpandedAlerts] = useState<Record<string, boolean>>({})
  const [indicators, setIndicators] = useState<{
    signal: string
    score: number
    rsi: number
    macd: number
    ema9: number
    ema21: number
    stop_loss: number
    take_profit: number
    details: string
  } | null>(null)
  const [loadingIndicators, setLoadingIndicators] = useState(false)

  // AI Modal states for card click details
  const [activeModalData, setActiveModalData] = useState<{ title: string; subtitle?: string; content: string; url?: string; source?: string } | null>(null)
  const [aiResponse, setAiResponse] = useState<string | null>(null)
  const [loadingAi, setLoadingAi] = useState(false)

  // Fetch indicators when selectedSymbol changes
  useEffect(() => {
    let active = true
    async function fetchIndicators() {
      setLoadingIndicators(true)
      try {
        const data = await marketService.getIndicators(selectedSymbol)
        if (active) {
          setIndicators(data)
        }
      } catch (err) {
        console.error('Error fetching indicators:', err)
      } finally {
        if (active) {
          setLoadingIndicators(false)
        }
      }
    }
    fetchIndicators()
    return () => {
      active = false
    }
  }, [selectedSymbol])

  // Automatically trigger AI analysis when modal pops up
  useEffect(() => {
    if (activeModalData) {
      void triggerAiAnalysis(activeModalData.title, activeModalData.subtitle, activeModalData.content)
    } else {
      setAiResponse(null)
    }
  }, [activeModalData])

  const triggerAiAnalysis = async (title: string, subtitle?: string, content?: string) => {
    if (!onAskAI) return
    setLoadingAi(true)
    setAiResponse(null)
    try {
      const question = `Conduct a comprehensive, structured investment sentiment analysis for the following headline or alert event. Detail the market context, possible target stocks, currency implications, and specific risk considerations: "${title}"`
      const context = `Source/Category: ${subtitle || 'General Market'}\nContext Snippet: ${content || 'No details provided.'}`
      const response = await onAskAI(question, context)
      setAiResponse(response)
    } catch (err) {
      setAiResponse('Aegis AI Core analysis failed to complete.')
    } finally {
      setLoadingAi(false)
    }
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchInput.trim()) {
      const cleanSymbol = searchInput.trim().toUpperCase()
      onSelectSymbol(cleanSymbol)
    }
  }

  const toggleNews = (id: string) => {
    setExpandedNews((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const toggleAlert = (id: string) => {
    setExpandedAlerts((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const featuredQuotes = quotes
  const latestChartPoints = chart?.points ?? []

  // Helper to color-code signal recommendations
  const getSignalBadgeStyles = (signal: string) => {
    switch (signal) {
      case 'STRONG BUY':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40 animate-pulse'
      case 'BUY':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-400/20'
      case 'STRONG SELL':
        return 'bg-rose-500/20 text-rose-300 border-rose-400/40 animate-pulse'
      case 'SELL':
        return 'bg-rose-500/10 text-rose-400 border-rose-400/20'
      case 'HOLD':
      default:
        return 'bg-amber-500/10 text-amber-400 border-amber-400/20'
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr] relative">
      {/* Left Main Column */}
      <div className="space-y-6">
        {/* Watchlist Section */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {featuredQuotes.map((quote) => (
            <button
              key={quote.symbol}
              onClick={() => onSelectSymbol(quote.symbol)}
              className={cn(
                'rounded-[1.75rem] border p-5 text-left transition-all bg-white/5 hover:bg-white/10',
                selectedSymbol === quote.symbol ? 'border-cyan-300/50 shadow-[0_0_25px_rgba(34,211,238,0.15)]' : 'border-white/10',
              )}
            >
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">{quote.category}</p>
              <h3 className="mt-2 text-sm font-bold text-gray-200">{quote.name}</h3>
              <p className="mt-4 text-2xl font-black">₹{quote.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</p>
              <p className={cn('text-[10px] font-black uppercase tracking-widest mt-2', quote.change_percent >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
                {quote.change_percent >= 0 ? '+' : ''}{quote.change_percent.toFixed(2)}%
              </p>
            </button>
          ))}
        </div>

        {/* Chart Card */}
        <div className="rounded-[2.5rem] border border-white/10 bg-white/5 p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Market desk</p>
              <h2 className="text-2xl font-black tracking-tight">{chart?.symbol ?? selectedSymbol}</h2>
              <p className="text-xs text-gray-500">Terminal charting over yfinance data (interval: {chartInterval})</p>
            </div>
            
            {/* Search and Timeframe row */}
            <div className="flex flex-wrap items-center gap-4">
              <form onSubmit={handleSearchSubmit} className="flex gap-2">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search stock, crypto, index..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="w-48 rounded-full border border-white/10 bg-black/40 px-4 py-1.5 text-xs text-white placeholder-gray-500 focus:border-cyan-300 focus:outline-none focus:ring-1 focus:ring-cyan-300"
                  />
                  <Search size={12} className="absolute right-3 top-2.5 text-gray-500 pointer-events-none" />
                </div>
                <button type="submit" className="rounded-full bg-cyan-300 px-3 py-1.5 text-[10px] font-black uppercase text-black hover:bg-cyan-200 transition-colors">
                  Query
                </button>
              </form>

              {/* Timeframe Presets */}
              <div className="flex flex-wrap gap-1 bg-black/35 p-1 rounded-full border border-white/10">
                {TIMEFRAME_PRESETS.map((preset) => {
                  const isActive = chartPeriod === preset.period && chartInterval === preset.interval
                  return (
                    <button
                      key={preset.label}
                      onClick={() => refreshChart(selectedSymbol, preset.period, preset.interval)}
                      className={cn(
                        'rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-wider transition-all',
                        isActive ? 'bg-cyan-300 text-black shadow' : 'text-gray-400 hover:text-white'
                      )}
                    >
                      {preset.label}
                    </button>
                  )
                })}
              </div>

              {/* Chart Modes */}
              <div className="flex flex-wrap gap-1">
                {(['line', 'area', 'candle'] as ChartMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setChartMode(mode)}
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-widest',
                      chartMode === mode ? 'border-cyan-300 bg-cyan-300 text-black' : 'border-white/10 bg-black/20 text-gray-400',
                    )}
                  >
                    {mode === 'line' && <LineChart size={10} />}
                    {mode === 'area' && <AreaChart size={10} />}
                    {mode === 'candle' && <CandlestickChart size={10} />}
                    {mode}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <PriceChart points={latestChartPoints} mode={chartMode} />
        </div>

        {/* Currency & Sector pulse */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">Currencies</p>
            <div className="grid grid-cols-2 gap-3">
              {currencies.map((currency) => (
                <button
                  key={currency.symbol}
                  onClick={() => onSelectSymbol(currency.symbol + '=X')}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4 text-left transition-all hover:bg-white/5"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold">{currency.symbol}</p>
                    <Globe2 size={14} className="text-cyan-300" />
                  </div>
                  <p className="mt-3 text-xl font-black">{currency.price.toLocaleString(undefined, { minimumFractionDigits: 4 })}</p>
                  <p className={cn('mt-1 text-[10px] font-black uppercase tracking-widest', currency.change_percent >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
                    {currency.change_percent >= 0 ? '+' : ''}{currency.change_percent.toFixed(2)}%
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">Sector pulse</p>
            <div className="grid grid-cols-2 gap-3">
              {sectors.map((sector) => (
                <div key={sector.sector} className={cn(
                  'rounded-2xl border p-4',
                  sector.change >= 0 ? 'border-emerald-400/20 bg-emerald-400/5' : 'border-rose-400/20 bg-rose-400/5',
                )}>
                  <p className="text-sm font-bold text-gray-200">{sector.sector}</p>
                  <p className={cn('mt-2 text-2xl font-black', sector.change >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
                    {sector.change >= 0 ? '+' : ''}{sector.change.toFixed(2)}%
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Expandable News with Links */}
        <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">News tape</p>
              <Newspaper size={16} className="text-cyan-300" />
            </div>
            <div className="mt-4 space-y-3">
              {news.slice(0, 6).map((item, idx) => {
                const itemId = `${item.title}-${idx}`
                const isExpanded = !!expandedNews[itemId]
                const splitIndex = item.title.indexOf(' - ')
                const newsTitle = splitIndex !== -1 ? item.title.substring(0, splitIndex) : item.title
                const newsSnippet = splitIndex !== -1 ? item.title.substring(splitIndex + 3) : ''

                return (
                  <div
                    key={itemId}
                    onClick={() => setActiveModalData({
                      title: newsTitle,
                      subtitle: item.investor_name,
                      content: newsSnippet,
                      url: item.url,
                      source: 'News Tape'
                    })}
                    className="rounded-2xl border border-white/10 bg-black/20 p-4 transition-all hover:border-white/20 cursor-pointer"
                  >
                    <div className="flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                      <span className="text-[10px] font-black uppercase tracking-widest text-cyan-300">{item.investor_name}</span>
                      <div className="flex gap-2">
                        {item.url && (
                          <a href={item.url} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-white transition-colors" title="Read original article">
                            <ExternalLink size={12} />
                          </a>
                        )}
                        {newsSnippet && (
                          <button onClick={() => toggleNews(itemId)} className="text-gray-400 hover:text-white transition-colors">
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="mt-2 text-sm font-bold text-gray-100 leading-snug">{newsTitle}</p>
                    
                    {isExpanded && newsSnippet && (
                      <div className="mt-3 border-t border-white/5 pt-2 text-xs text-gray-400 leading-relaxed animate-fadeIn">
                        {newsSnippet}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Institutional flows / deals */}
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Flows and events</p>
            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">FII Net Flow</p>
                  <p className="mt-2 text-2xl font-black text-emerald-400">{flows[0]?.fii?.toFixed(0) ?? '0'} Cr</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">DII Net Flow</p>
                  <p className="mt-2 text-2xl font-black text-rose-300">{flows[0]?.dii?.toFixed(0) ?? '0'} Cr</p>
                </div>
              </div>
              {bulkDeals.slice(0, 3).map((deal) => (
                <div key={`${deal.ticker}-${deal.date}`} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-bold">{deal.ticker}</p>
                    <p className={cn('text-[10px] font-black uppercase tracking-widest', deal.type === 'BUY' ? 'text-emerald-400' : 'text-rose-400')}>{deal.type}</p>
                  </div>
                  <p className="mt-2 text-xs text-gray-400">{deal.client}</p>
                </div>
              ))}
              {events.slice(0, 3).map((event) => (
                <div key={event.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-300">{event.type}</p>
                  <p className="mt-2 text-sm font-bold">{event.ticker}</p>
                  <p className="text-xs text-gray-400">{event.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Intelligence Column */}
      <div className="space-y-6">
        {/* GainzAlgo V3 Indicator Widget */}
        <div className="rounded-[2.5rem] border border-white/10 bg-white/5 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-cyan-300" />
              <h3 className="text-lg font-black tracking-tight">Aegis Sovereign Signal</h3>
            </div>
            {loadingIndicators && <span className="text-[9px] font-bold text-cyan-300 uppercase tracking-widest animate-pulse">Calculating...</span>}
          </div>

          {indicators ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Algorithmic Signal</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className={cn('border rounded-lg px-3 py-1 text-xs font-black tracking-wider uppercase', getSignalBadgeStyles(indicators.signal))}>
                      {indicators.signal}
                    </span>
                    <span className="text-xs text-gray-400">Score: {indicators.score > 0 ? `+${indicators.score}` : indicators.score}/4</span>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">RSI Indicator</p>
                  <p className={cn('text-lg font-black mt-1', (indicators.rsi ?? 50) >= 70 ? 'text-rose-400' : (indicators.rsi ?? 50) <= 30 ? 'text-emerald-400' : 'text-gray-200')}>
                    {indicators.rsi !== undefined && indicators.rsi !== null ? indicators.rsi.toFixed(2) : '50.00'}
                  </p>
                </div>
              </div>

              {/* Stop-Loss & Take-Profit Targets */}
              <div className="grid grid-cols-2 gap-3 border-t border-b border-white/5 py-4">
                <div className="rounded-xl bg-rose-500/5 border border-rose-500/10 p-3">
                  <p className="text-[9px] font-black uppercase tracking-widest text-rose-400">Target Stop Loss</p>
                  <p className="mt-1 text-lg font-black text-rose-300">₹{indicators.stop_loss !== undefined && indicators.stop_loss !== null ? indicators.stop_loss.toLocaleString() : '0'}</p>
                </div>
                <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/10 p-3">
                  <p className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Target Take Profit</p>
                  <p className="mt-1 text-lg font-black text-emerald-300">₹{indicators.take_profit !== undefined && indicators.take_profit !== null ? indicators.take_profit.toLocaleString() : '0'}</p>
                </div>
              </div>

              {/* Indicators checklist */}
              <div className="space-y-2 text-xs text-gray-300">
                <div className="flex justify-between">
                  <span className="text-gray-500">MACD Value</span>
                  <span className="font-bold">{indicators.macd !== undefined && indicators.macd !== null ? indicators.macd.toFixed(4) : 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">EMA 9 Period</span>
                  <span className="font-bold">{indicators.ema9 !== undefined && indicators.ema9 !== null ? `₹${indicators.ema9.toLocaleString()}` : 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">EMA 21 Period</span>
                  <span className="font-bold">{indicators.ema21 !== undefined && indicators.ema21 !== null ? `₹${indicators.ema21.toLocaleString()}` : 'N/A'}</span>
                </div>
              </div>

              <div className="rounded-xl bg-black/30 p-3 border border-white/5 flex gap-2">
                <AlertCircle size={14} className="text-gray-400 shrink-0 mt-0.5" />
                <p className="text-[10px] text-gray-400 leading-relaxed italic">{indicators.details}</p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-500 italic">No mathematical technical signals calculated yet.</p>
          )}
        </div>

        {/* Notifications and Alerts */}
        <div className="rounded-[2.5rem] border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Alerts</p>
              <h3 className="text-lg font-black">Notifications</h3>
            </div>
            <Bell size={18} className="text-cyan-300" />
          </div>
          <div className="space-y-3">
            {alerts.map((alert, idx) => {
              const alertId = `${alert.symbol}-${idx}`
              const isExpanded = !!expandedAlerts[alertId]
              return (
                <div
                  key={alertId}
                  onClick={() => setActiveModalData({
                    title: alert.title,
                    subtitle: alert.source,
                    content: alert.description,
                    source: 'Notifications'
                  })}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4 transition-all hover:border-white/20 cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-3" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onSelectSymbol(alert.symbol !== 'NEWS' ? alert.symbol : selectedSymbol)}
                      className="text-[10px] font-black uppercase tracking-widest text-cyan-300 hover:underline text-left"
                    >
                      {alert.symbol}
                    </button>
                    <div className="flex items-center gap-2">
                      <span className={cn('rounded-full px-2 py-0.5 text-[8px] font-black uppercase', alert.severity === 'high' ? 'bg-rose-400 text-black' : alert.severity === 'medium' ? 'bg-amber-300 text-black' : 'bg-cyan-300 text-black')}>
                        {alert.severity}
                      </span>
                      <button onClick={() => toggleAlert(alertId)} className="text-gray-500 hover:text-white transition-colors">
                        {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </button>
                    </div>
                  </div>
                  <p className="mt-2 text-sm font-bold">{alert.title}</p>
                  {isExpanded && (
                    <p className="mt-2 border-t border-white/5 pt-2 text-xs text-gray-400 leading-relaxed animate-fadeIn">{alert.description}</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Market State Details */}
        <div className="rounded-[2.5rem] border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Market state</p>
              <h3 className="text-lg font-black">{overview?.market_status ?? 'CLOSED'}</h3>
            </div>
            <TrendingUp size={18} className="text-emerald-300" />
          </div>
          <p className="mt-3 text-xs text-gray-400 leading-relaxed">
            Coverage now includes equities, sectors, cryptocurrencies (BTC, SHIB, ETH), currencies, chart views, market alerts, and public news sourced from yfinance and DuckDuckGo. The design is intentionally research-first, not broker-first.
          </p>
        </div>
      </div>

      {/* AI Deep Info Modal Popup overlay */}
      {activeModalData && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[999] flex items-center justify-center p-4">
          <div className="bg-[#0b101d] border border-cyan-400/30 rounded-[2.5rem] p-8 max-w-2xl w-full max-h-[85vh] overflow-y-auto space-y-6 shadow-2xl relative scrollbar-thin scrollbar-thumb-white/10">
            {/* Close Button */}
            <button
              onClick={() => setActiveModalData(null)}
              className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400 bg-cyan-400/10 px-3 py-1 rounded-full">
                {activeModalData.source || 'Intelligence Feed'}
              </span>
              <h3 className="text-xl font-black text-gray-100 tracking-tight mt-4">{activeModalData.title}</h3>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mt-2">
                Origin: {activeModalData.subtitle || 'System Alert'}
              </p>
            </div>

            {activeModalData.content && (
              <div className="bg-black/30 p-5 rounded-2xl border border-white/5">
                <p className="text-xs text-gray-400 leading-relaxed italic">"{activeModalData.content}"</p>
              </div>
            )}

            {activeModalData.url && (
              <div className="flex items-center">
                <a
                  href={activeModalData.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-cyan-300 text-xs font-bold hover:underline"
                >
                  <ExternalLink size={14} />
                  Read full original article
                </a>
              </div>
            )}

            {/* AI Insights Segment */}
            <div className="border-t border-white/10 pt-5 space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-cyan-300" />
                <h4 className="text-xs font-black uppercase tracking-widest text-cyan-300">Aegis AI Core Analysis</h4>
              </div>

              {loadingAi ? (
                <div className="py-8 text-center space-y-3">
                  <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-xs text-cyan-300/80 animate-pulse uppercase font-black tracking-widest">
                    Initiating AI Core Impact Assessment...
                  </p>
                </div>
              ) : aiResponse ? (
                <div className="bg-cyan-400/5 border border-cyan-400/10 p-5 rounded-2xl text-xs text-gray-300 leading-relaxed space-y-2 whitespace-pre-wrap">
                  {aiResponse}
                </div>
              ) : (
                <p className="text-xs text-gray-500 italic">Analysis queued.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
