import React from 'react';
import { Activity, ExternalLink, AlertTriangle } from 'lucide-react';
import { StockIndex, InstitutionalNews, InstitutionalFlow, StrategicEvent } from '../types/market';

const cn = (...classes: string[]) => classes.filter(Boolean).join(' ');

interface Props {
  data: { Stocks: StockIndex[] };
  titanNews: InstitutionalNews[];
  fiidii: InstitutionalFlow[];
  bulkDeals: any[];
  pendingEvents: StrategicEvent[];
  marketStatus: string;
}

export default function OverviewPanel({ data, titanNews, fiidii, bulkDeals, pendingEvents, marketStatus }: Props) {
  return (
    <div className="space-y-10">
      <div className="grid grid-cols-4 gap-6">
        {data?.Stocks?.map((s) => {
          const hasEvent = pendingEvents.some((e) => e.ticker.toUpperCase() === s.symbol.replace('.NS', '').toUpperCase());
          return (
            <div key={s.symbol} className={cn("p-8 bg-white/5 border rounded-[2.5rem] relative group overflow-hidden transition-all", hasEvent ? "border-rose-500/50" : "border-white/10")}>
              {hasEvent && <div className="absolute inset-x-0 top-0 py-1.5 bg-rose-500 text-white text-[8px] font-black uppercase tracking-tighter flex items-center justify-center space-x-1"><AlertTriangle size={8}/><span>STRATEGIC LOCK — ACTIVE</span></div>}
              <p className="text-[10px] font-black text-gray-500 uppercase mb-2 mt-2">{s.symbol}</p>
              <p className="text-3xl font-black">₹{s.price.toLocaleString()}</p>
              <p className={cn("text-[10px] font-black mt-2", s.change > 0 ? "text-emerald-400" : "text-rose-400")}>{s.change > 0 ? "+" : ""}{s.change.toFixed(2)}%</p>
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-3 gap-8">
        <div className="col-span-2 space-y-4">
          <h2 className="text-xs font-black uppercase text-gray-500 px-4">Institutional Flow Metrics</h2>
          <div className="p-8 bg-white/5 border border-white/10 rounded-[3rem] space-y-6">
            <div className="grid grid-cols-2 gap-8 pb-6 border-b border-white/5">
              <div><p className="text-[10px] font-black uppercase text-gray-500 mb-2">FII Net Flow (Today)</p><p className={cn("text-2xl font-black", (fiidii[0]?.fii || 0) > 0 ? "text-emerald-400" : "text-rose-400")}>{fiidii[0]?.fii?.toFixed(0) || 0} Cr</p></div>
              <div><p className="text-[10px] font-black uppercase text-gray-500 mb-2">DII Net Flow (Today)</p><p className={cn("text-2xl font-black", (fiidii[0]?.dii || 0) > 0 ? "text-emerald-400" : "text-rose-400")}>{fiidii[0]?.dii?.toFixed(0) || 0} Cr</p></div>
            </div>
            <div className="space-y-4">
              {bulkDeals.map((d, i) => (
                <div key={i} className="flex items-center justify-between group">
                  <div><p className="text-[10px] font-black text-cyan-400 uppercase">{d.ticker}</p><h3 className="text-sm font-bold text-gray-300">{d.client}</h3></div>
                  <div className="text-right"><p className={cn("text-[10px] font-black uppercase", d.type === 'BUY' ? "text-emerald-400" : "text-rose-400")}>{d.type} @ ₹{d.price}</p><p className="text-[10px] font-black text-gray-500">{d.qty.toLocaleString()} SHARES</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <h2 className="text-xs font-black uppercase text-gray-500 px-4">Professional Market Intelligence</h2>
          <div className="space-y-4">
            {titanNews.map((n, i) => (
              <div key={i} className="p-6 bg-white/5 border border-white/10 rounded-3xl hover:bg-white/10 transition-all flex items-center justify-between group">
                <div className="pr-4"><p className="text-[10px] font-black text-cyan-400 uppercase mb-1">{n.titan}</p><h3 className="text-xs font-bold leading-tight line-clamp-2">{n.title}</h3></div>
                <a href={n.url} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shrink-0"><ExternalLink size={14}/></a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
