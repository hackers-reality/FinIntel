import { AlertTriangle, ExternalLink } from 'lucide-react'

import type { BulkDeal, FiiDiiFlow, InstitutionalNews, MarketEvent, MarketOverview } from '../types/market'

const cn = (...classes: string[]) => classes.filter(Boolean).join(' ')

interface Props {
  overview: MarketOverview
  news: InstitutionalNews[]
  flows: FiiDiiFlow[]
  bulkDeals: BulkDeal[]
  events: MarketEvent[]
}

export default function OverviewPanel({ overview, news, flows, bulkDeals, events }: Props) {
  return (
    <div className="space-y-10">
      <div className="grid grid-cols-4 gap-6">
        {overview.stocks.map((stock) => {
          const hasEvent = events.some((event) => event.ticker.toUpperCase() === stock.symbol.replace('.NS', '').toUpperCase())
          return (
            <div key={stock.symbol} className={cn('p-8 bg-white/5 border rounded-[2.5rem] relative group overflow-hidden transition-all', hasEvent ? 'border-amber-500/50' : 'border-white/10')}>
              {hasEvent && <div className="absolute inset-x-0 top-0 py-1.5 bg-amber-500 text-black text-[8px] font-black uppercase tracking-tighter flex items-center justify-center space-x-1"><AlertTriangle size={8} /><span>Event Watch Active</span></div>}
              <p className="text-[10px] font-black text-gray-500 uppercase mb-2 mt-2">{stock.symbol}</p>
              <p className="text-3xl font-black">₹{stock.price.toLocaleString()}</p>
              <p className={cn('text-[10px] font-black mt-2', stock.change > 0 ? 'text-emerald-400' : 'text-rose-400')}>{stock.change > 0 ? '+' : ''}{stock.change.toFixed(2)}%</p>
            </div>
          )
        })}
      </div>
      <div className="grid grid-cols-3 gap-8">
        <div className="col-span-2 space-y-4">
          <h2 className="text-xs font-black uppercase text-gray-500 px-4">Institutional Flow Metrics</h2>
          <div className="p-8 bg-white/5 border border-white/10 rounded-[3rem] space-y-6">
            <div className="grid grid-cols-2 gap-8 pb-6 border-b border-white/5">
              <div><p className="text-[10px] font-black uppercase text-gray-500 mb-2">FII Net Flow (Latest)</p><p className={cn('text-2xl font-black', (flows[0]?.fii || 0) > 0 ? 'text-emerald-400' : 'text-rose-400')}>{flows[0]?.fii?.toFixed(0) || 0} Cr</p></div>
              <div><p className="text-[10px] font-black uppercase text-gray-500 mb-2">DII Net Flow (Latest)</p><p className={cn('text-2xl font-black', (flows[0]?.dii || 0) > 0 ? 'text-emerald-400' : 'text-rose-400')}>{flows[0]?.dii?.toFixed(0) || 0} Cr</p></div>
            </div>
            <div className="space-y-4">
              {bulkDeals.map((deal) => (
                <div key={`${deal.ticker}-${deal.client}-${deal.date}`} className="flex items-center justify-between group">
                  <div><p className="text-[10px] font-black text-cyan-400 uppercase">{deal.ticker}</p><h3 className="text-sm font-bold text-gray-300">{deal.client}</h3></div>
                  <div className="text-right"><p className={cn('text-[10px] font-black uppercase', deal.type === 'BUY' ? 'text-emerald-400' : 'text-rose-400')}>{deal.type} @ ₹{deal.price}</p><p className="text-[10px] font-black text-gray-500">{deal.qty.toLocaleString()} shares</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <h2 className="text-xs font-black uppercase text-gray-500 px-4">Professional Market Intelligence</h2>
          <div className="space-y-4">
            {news.map((item) => (
              <div key={`${item.investor_name}-${item.url}`} className="p-6 bg-white/5 border border-white/10 rounded-3xl hover:bg-white/10 transition-all flex items-center justify-between group">
                <div className="pr-4"><p className="text-[10px] font-black text-cyan-400 uppercase mb-1">{item.investor_name}</p><h3 className="text-xs font-bold leading-tight line-clamp-2">{item.title}</h3></div>
                <a href={item.url} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shrink-0"><ExternalLink size={14} /></a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
