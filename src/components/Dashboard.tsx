import React, { useState, useEffect } from 'react';
import { 
  Shield, Search, History, Cpu, BarChart3, TrendingUp, TrendingDown, 
  Zap, Clock, Activity, Wallet, FileText, AlertCircle, List, Terminal, Command, CheckCircle2, Settings as SettingsIcon, Key, Globe, BrainCircuit, ExternalLink, Plus, Layers, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHotkeys } from 'react-hotkeys-hook';

const cn = (...classes: string[]) => classes.filter(Boolean).join(' ');

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [data, setData] = useState<any>(null);
  const [portfolio, setPortfolio] = useState<any>({ total_value: 0, holdings: [] });
  const [researchResult, setResearchResult] = useState<any>(null);
  const [behavior, setBehavior] = useState<any>(null);
  const [docResult, setDocResult] = useState<any>(null);
  const [pendingEvents, setPendingEvents] = useState<any[]>([]);
  const [titanNews, setTitanNews] = useState<any[]>([]);
  const [fiidii, setFiidii] = useState<any[]>([]);
  const [bulkDeals, setBulkDeals] = useState<any[]>([]);
  const [marketStatus, setMarketStatus] = useState('CLOSED');

  // UI State
  const [researchTicker, setResearchTicker] = useState('');
  const [docText, setDocText] = useState('');
  const [isResearching, setIsResearching] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [newAsset, setNewAsset] = useState({ ticker: '', qty: '', price: '' });

  useHotkeys('ctrl+k', (e) => { e.preventDefault(); });

  const fetchInit = async () => {
    try {
      const [oRes, pRes, nRes, eRes, fRes, bRes] = await Promise.all([
        fetch('http://localhost:8008/market/overview'),
        fetch('http://localhost:8008/market/portfolio/summary'),
        fetch('http://localhost:8008/market/traders/news'),
        fetch('http://localhost:8008/market/events'),
        fetch('http://localhost:8008/market/fiidii'),
        fetch('http://localhost:8008/market/bulkdeals')
      ]);
      const oData = await oRes.json();
      setData(oData);
      setMarketStatus(oData.market_status);
      setPortfolio(await pRes.json());
      setTitanNews(await nRes.json());
      setPendingEvents(await eRes.json());
      setFiidii(await fRes.json());
      setBulkDeals(await bRes.json());
    } catch {}
  };

  useEffect(() => { 
    fetchInit(); 
    const interval = setInterval(fetchInit, 60000);
    return () => clearInterval(interval);
  }, []);

  const runResearch = async () => {
    if (!researchTicker) return;
    setIsResearching(true);
    const [rRes, bRes] = await Promise.all([
      fetch(`http://localhost:8008/market/research/${researchTicker}`),
      fetch(`http://localhost:8008/market/behavior/${researchTicker}`)
    ]);
    setResearchResult(await rRes.json());
    setBehavior(await bRes.json());
    setIsResearching(false);
  };

  const analyzeDoc = async () => {
    if (!docText) return;
    setIsAnalyzing(true);
    const res = await fetch('http://localhost:8008/analyze/document', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: docText })
    });
    setDocResult(await res.json());
    setIsAnalyzing(false);
  };

  const addAsset = async () => {
    if (!newAsset.ticker) return;
    await fetch('http://localhost:8008/market/portfolio/holdings', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newAsset)
    });
    setNewAsset({ ticker: '', qty: '', price: '' });
    fetchInit();
  };

  const saveToVault = async (key: string, value: string) => {
    await fetch('http://localhost:8008/settings/vault', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [key]: value })
    });
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-cyan-400 selection:text-black">
      <nav className="fixed top-0 inset-x-0 h-20 bg-black/40 backdrop-blur-2xl border-b border-white/5 z-50 flex items-center justify-between px-10">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-cyan-400 rounded-xl flex items-center justify-center text-black shadow-lg shadow-cyan-400/20"><Shield size={24} /></div>
            <h1 className="text-lg font-black tracking-tighter uppercase italic">Sovereign Nexus</h1>
          </div>
          <div className={cn("px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest", marketStatus === 'OPEN' ? "border-emerald-400/30 text-emerald-400 bg-emerald-400/5" : "border-rose-400/30 text-rose-400")}>Market {marketStatus}</div>
        </div>
        <div className="flex space-x-1 bg-white/5 p-1 rounded-xl border border-white/10">
          {['overview', 'portfolio', 'research', 'settings'].map(t => (
            <button key={t} onClick={() => setActiveTab(t)} className={cn("px-6 py-2 rounded-lg text-[10px] font-black uppercase transition-all", activeTab === t ? "bg-white/10 text-white" : "text-gray-500")}>{t}</button>
          ))}
        </div>
      </nav>

      <main className="pt-28 pb-20 px-10 max-w-7xl mx-auto">
        {activeTab === 'overview' && (
           <div className="space-y-10">
              <div className="grid grid-cols-4 gap-6">
                 {data?.Stocks?.map((s: any) => {
                   const hasEvent = pendingEvents.some(e => e.ticker.toUpperCase() === s.symbol.replace('.NS', '').toUpperCase());
                   return (
                     <div key={s.symbol} className={cn("p-8 bg-white/5 border rounded-[2.5rem] relative group overflow-hidden transition-all", hasEvent ? "border-rose-500/50 shadow-[0_0_30px_#f43f5e10]" : "border-white/10")}>
                       {hasEvent && (
                         <div className="absolute inset-x-0 top-0 py-1.5 bg-rose-500 text-white text-[8px] font-black uppercase tracking-tighter flex items-center justify-center space-x-1">
                           <AlertTriangle size={8}/><span>Pending Event — Do Not Trade</span>
                         </div>
                       )}
                       <p className="text-[10px] font-black text-gray-500 uppercase mb-2 mt-2">{s.symbol}</p>
                       <p className="text-3xl font-black">₹{s.price.toLocaleString()}</p>
                       <p className={cn("text-[10px] font-black mt-2", s.change > 0 ? "text-emerald-400" : "text-rose-400")}>{s.change.toFixed(2)}%</p>
                     </div>
                   );
                 })}
              </div>
              <div className="grid grid-cols-3 gap-8">
                 <div className="col-span-2 space-y-4">
                    <h2 className="text-xs font-black uppercase text-gray-500 px-4">Institutional Whale Command</h2>
                    <div className="p-8 bg-white/5 border border-white/10 rounded-[3rem] space-y-6">
                       <div className="grid grid-cols-2 gap-8 pb-6 border-b border-white/5">
                          <div><p className="text-[10px] font-black uppercase text-gray-500 mb-2">FII Net Flow</p><p className={cn("text-2xl font-black", (fiidii[0]?.fii || 0) > 0 ? "text-emerald-400" : "text-rose-400")}>{fiidii[0]?.fii?.toFixed(0) || 0} Cr</p></div>
                          <div><p className="text-[10px] font-black uppercase text-gray-500 mb-2">DII Net Flow</p><p className={cn("text-2xl font-black", (fiidii[0]?.dii || 0) > 0 ? "text-emerald-400" : "text-rose-400")}>{fiidii[0]?.dii?.toFixed(0) || 0} Cr</p></div>
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
                    <h2 className="text-xs font-black uppercase text-gray-500 px-4">Titan Whale Feed</h2>
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
        )}

        {activeTab === 'portfolio' && (
           <div className="space-y-8">
              <div className="flex items-center justify-between p-12 bg-cyan-400 rounded-[3rem] text-black">
                 <div><p className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-60">Portfolio Alpha</p><h2 className="text-6xl font-black tracking-tighter italic uppercase">₹{portfolio.total_value.toLocaleString()}</h2></div>
                 <div className="w-20 h-20 rounded-3xl bg-black/10 flex items-center justify-center"><Wallet size={40}/></div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                 <input placeholder="Ticker" className="bg-white/5 border border-white/10 rounded-2xl p-4 text-[10px] font-black uppercase outline-none focus:border-cyan-400" value={newAsset.ticker} onChange={e => setNewAsset({...newAsset, ticker: e.target.value})} />
                 <input placeholder="Qty" className="bg-white/5 border border-white/10 rounded-2xl p-4 text-[10px] font-black uppercase outline-none focus:border-cyan-400" value={newAsset.qty} onChange={e => setNewAsset({...newAsset, qty: e.target.value})} />
                 <input placeholder="Price" className="bg-white/5 border border-white/10 rounded-2xl p-4 text-[10px] font-black uppercase outline-none focus:border-cyan-400" value={newAsset.price} onChange={e => setNewAsset({...newAsset, price: e.target.value})} />
                 <button onClick={addAsset} className="bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase hover:bg-cyan-400 hover:text-black transition-all flex items-center justify-center space-x-2"><Plus size={16}/><span>Add Asset</span></button>
              </div>
              <div className="p-10 bg-white/5 border border-white/10 rounded-[3rem] overflow-hidden">
                 <table className="w-full text-left">
                    <thead><tr className="text-[10px] font-black uppercase text-gray-500 border-b border-white/5"><th className="pb-4">Asset</th><th className="pb-4 text-right">Qty</th><th className="pb-4 text-right">Avg Price</th><th className="pb-4 text-right">Current</th><th className="pb-4 text-right">PnL</th></tr></thead>
                    <tbody className="divide-y divide-white/5">
                       {portfolio.holdings.map((h: any) => (
                         <tr key={h.symbol} className="text-sm font-bold"><td className="py-6">{h.symbol}</td><td className="py-6 text-right">{h.qty}</td><td className="py-6 text-right">₹{h.avg_price.toLocaleString()}</td><td className="py-6 text-right font-black">₹{h.curr_price.toLocaleString()}</td><td className={cn("py-6 text-right font-black", h.pnl > 0 ? "text-emerald-400" : "text-rose-400")}>₹{h.pnl.toLocaleString()}</td></tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
        )}

        {activeTab === 'research' && (
           <div className="space-y-8">
              <div className="grid grid-cols-2 gap-8">
                 <div className="space-y-6">
                    <div className="flex space-x-4">
                       <input placeholder="Ticker (RELIANCE)" className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-6 text-lg font-black uppercase outline-none focus:border-cyan-400" value={researchTicker} onChange={e => setResearchTicker(e.target.value)} />
                       <button onClick={runResearch} disabled={isResearching} className="px-10 bg-cyan-400 text-black font-black uppercase rounded-2xl shadow-lg shadow-cyan-400/20">{isResearching ? "..." : "Ignite"}</button>
                    </div>
                    {researchResult && (
                       <div className="p-10 bg-white/5 border border-white/10 rounded-[3rem] space-y-6">
                          <div className="flex items-center justify-between"><h2 className="text-3xl font-black italic uppercase">Verdict</h2><div className={cn("px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest", researchResult.Verdict === 'Buy' ? "bg-emerald-400 text-black" : "bg-rose-400 text-white")}>{researchResult.Verdict}</div></div>
                          {behavior && <div className="flex items-center space-x-2 px-4 py-2 bg-white/5 rounded-xl border border-white/10 w-fit"><Zap size={14} className="text-cyan-400"/><span className="text-[10px] font-black uppercase text-cyan-400">{behavior.status}</span></div>}
                          <p className="text-sm text-gray-400 leading-relaxed">{researchResult.Summary}</p>
                       </div>
                    )}
                 </div>
                 <div className="space-y-6">
                    <textarea placeholder="Paste fine print here..." className="w-full h-48 bg-white/5 border border-white/10 rounded-3xl p-6 text-sm outline-none resize-none" value={docText} onChange={e => setDocText(e.target.value)} />
                    <button onClick={analyzeDoc} disabled={isAnalyzing} className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10">{isAnalyzing ? "Scanning..." : "Analyze Fine Print"}</button>
                    {docResult && (
                       <div className="p-8 bg-rose-400/5 border border-rose-400/20 rounded-[2.5rem] space-y-4">
                          <div className="flex items-center space-x-3 text-rose-400"><AlertCircle size={18}/><h4 className="text-[10px] font-black uppercase tracking-widest">Liability Flags</h4></div>
                          <ul className="space-y-2">{docResult.risk_clauses?.map((c: string, i: number) => <li key={i} className="text-xs font-bold text-gray-400">• {c}</li>)}</ul>
                       </div>
                    )}
                 </div>
              </div>
           </div>
        )}

        {activeTab === 'settings' && (
           <div className="p-10 bg-white/5 border border-white/10 rounded-[3rem] space-y-6">
              <div className="flex items-center space-x-4"><Key className="text-cyan-400" size={24} /><h2 className="text-xl font-black uppercase italic">Strategic Vault</h2></div>
              <div className="grid grid-cols-3 gap-4">
                 <input placeholder="NVIDIA API Key" type="password" className="bg-black/40 border border-white/10 rounded-xl p-4 text-[10px] font-black uppercase outline-none" onChange={e => saveToVault('nvidia_api_key', e.target.value)} />
                 <input placeholder="Groq API Key" type="password" className="bg-black/40 border border-white/10 rounded-xl p-4 text-[10px] font-black uppercase outline-none" onChange={e => saveToVault('groq_api_key', e.target.value)} />
                 <input placeholder="Zerodha API Key" type="password" className="bg-black/40 border border-white/10 rounded-xl p-4 text-[10px] font-black uppercase outline-none" onChange={e => saveToVault('zerodha_api_key', e.target.value)} />
              </div>
           </div>
        )}
      </main>
    </div>
  );
}
