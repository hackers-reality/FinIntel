import { TrendingUp, Bell, Globe2, CandlestickChart, LineChart, AreaChart, Newspaper } from 'lucide-react'

import type { BulkDeal, CurrencyQuote, FiiDiiFlow, InstitutionalNews, MarketAlert, MarketChartSeries, MarketEvent, MarketQuote, MarketOverview, SectorData } from '../types/market'
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
}

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
}: Props) {
  const featuredQuotes = quotes.slice(0, 8)
  const latestChartPoints = chart?.points ?? []

  return (
    <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
              <p className="mt-4 text-2xl font-black">₹{quote.price.toLocaleString()}</p>
              <p className={cn('text-[10px] font-black uppercase tracking-widest mt-2', quote.change_percent >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
                {quote.change_percent >= 0 ? '+' : ''}{quote.change_percent.toFixed(2)}%
              </p>
            </button>
          ))}
        </div>

        <div className="rounded-[2.5rem] border border-white/10 bg-white/5 p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Market desk</p>
              <h2 className="text-2xl font-black tracking-tight">{chart?.symbol ?? selectedSymbol}</h2>
              <p className="text-xs text-gray-500">Terminal-style charting over yfinance data</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {(['line', 'area', 'candle'] as ChartMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setChartMode(mode)}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-widest',
                    chartMode === mode ? 'border-cyan-300 bg-cyan-300 text-black' : 'border-white/10 bg-black/20 text-gray-400',
                  )}
                >
                  {mode === 'line' && <LineChart size={12} />}
                  {mode === 'area' && <AreaChart size={12} />}
                  {mode === 'candle' && <CandlestickChart size={12} />}
                  {mode}
                </button>
              ))}
            </div>
          </div>
          <PriceChart points={latestChartPoints} mode={chartMode} />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">Currencies</p>
            <div className="grid grid-cols-2 gap-3">
              {currencies.map((currency) => (
                <div key={currency.symbol} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold">{currency.symbol}</p>
                    <Globe2 size={14} className="text-cyan-300" />
                  </div>
                  <p className="mt-3 text-xl font-black">{currency.price.toLocaleString()}</p>
                  <p className={cn('mt-1 text-[10px] font-black uppercase tracking-widest', currency.change_percent >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
                    {currency.change_percent >= 0 ? '+' : ''}{currency.change_percent.toFixed(2)}%
                  </p>
                </div>
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

        <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">News tape</p>
              <Newspaper size={16} className="text-cyan-300" />
            </div>
            <div className="mt-4 space-y-3">
              {news.slice(0, 6).map((item) => (
                <a key={`${item.title}-${item.url}`} href={item.url} target="_blank" rel="noreferrer" className="block rounded-2xl border border-white/10 bg-black/20 p-4 transition-all hover:bg-white/10">
                  <p className="text-[10px] font-black uppercase tracking-widest text-cyan-300">{item.investor_name}</p>
                  <p className="mt-2 text-sm font-bold text-gray-100 leading-snug">{item.title}</p>
                </a>
              ))}
            </div>
          </div>
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Flows and events</p>
            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">FII</p>
                  <p className="mt-2 text-2xl font-black text-emerald-400">{flows[0]?.fii?.toFixed(0) ?? '0'} Cr</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">DII</p>
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

      <div className="space-y-6">
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Alerts</p>
              <h3 className="text-lg font-black">Notifications</h3>
            </div>
            <Bell size={18} className="text-cyan-300" />
          </div>
          <div className="mt-4 space-y-3">
            {alerts.map((alert) => (
              <div key={`${alert.symbol}-${alert.title}`} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-cyan-300">{alert.source}</p>
                  <span className={cn('rounded-full px-2 py-1 text-[10px] font-black uppercase', alert.severity === 'high' ? 'bg-rose-400 text-black' : alert.severity === 'medium' ? 'bg-amber-300 text-black' : 'bg-cyan-300 text-black')}>
                    {alert.severity}
                  </span>
                </div>
                <p className="mt-2 text-sm font-bold">{alert.title}</p>
                <p className="mt-1 text-xs text-gray-400 leading-relaxed">{alert.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Market state</p>
              <h3 className="text-lg font-black">{overview?.market_status ?? 'CLOSED'}</h3>
            </div>
            <TrendingUp size={18} className="text-emerald-300" />
          </div>
          <p className="mt-3 text-xs text-gray-400 leading-relaxed">
            Coverage now includes equities, sectors, currencies, chart views, market alerts, and public news sourced from yfinance and DuckDuckGo. The design is intentionally research-first, not broker-first.
          </p>
        </div>
      </div>
    </div>
  )
}
