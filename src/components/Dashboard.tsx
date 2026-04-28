import React, { useState, useEffect } from 'react';
import { 
  Shield, Search, History, Cpu, BarChart3, TrendingUp, TrendingDown, 
  Zap, Clock, Activity, Wallet, FileText, AlertCircle, List, Terminal, Command, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHotkeys } from 'react-hotkeys-hook';

const cn = (...classes: string[]) => classes.filter(Boolean).join(' ');

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [showPalette, setShowPalette] = useState(false);
  const [paletteSearch, setPaletteSearch] = useState('');
  const [data, setData] = useState<any>(null);
  const [portfolio, setPortfolio] = useState<any>({ holdings: [] });
  const [whaleNews, setWhaleNews] = useState<any[]>([]);
  const [fiidii, setFiidii] = useState<any[]>([]);
  const [selectedTicker, setSelectedTicker] = useState('^NSEI');
  const [filingText, setFilingText] = useState('');
  const [filingAnalysis, setFilingAnalysis] = useState<any>(null);
  const [isResearching, setIsResearching] = useState(false);
  const [researchResult, setResearchResult] = useState<any>(null);

  useHotkeys('ctrl+k', (e) => { e.preventDefault(); setShowPalette(!showPalette); });
  useHotkeys('esc', () => setShowPalette(false));

  const fetchInit = async () => {
    try {
      const [oRes, pRes, wRes, fRes] = await Promise.all([
        fetch('http://localhost:8008/market/overview'),
        fetch('http://localhost:8008/market/portfolio/summary'),
        fetch('http://localhost:8008/market/traders/news'),
        fetch('http://localhost:8008/market/fiidii')
      ]);
      setData(await oRes.json());
      setPortfolio(await pRes.json());
      setWhaleNews(await wRes.json());
      setFiidii(await fRes.json());
    } catch {}
  };

  useEffect(() => {
    fetchInit();
    const ws = new WebSocket('ws://localhost:8008/ws/prices');
    ws.onmessage = (e) => setData(JSON.parse(e.data));
    return () => ws.close();
  }, []);

  const runResearch = async () => {
    setIsResearching(true);
    try {
      const res = await fetch(`http://localhost:8008/market/research/${selectedTicker}`);
      setResearchResult(await res.json());
    } catch {} finally { setIsResearching(false); }
  };

  const analyzeFiling = async () => {
    try {
      const res = await fetch('http://localhost:8008/analyze/document', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: filingText })
      });
      setFilingAnalysis(await res.json());
    } catch {}
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-cyan-400 selection:text-black font-sans">
      <AnimatePresence>
        {showPalette && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-start justify-center pt-32 px-4">
            <motion.div initial={{ scale: 0.95, y: -20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: -20 }} className="w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
               <div className="p-6 flex items-center space-x-4 border-b border-white/5">
                  <Command size={24} className="text-cyan-400" />
                  <input autoFocus placeholder="Search Nexus Commands..." value={paletteSearch} onChange={e => setPaletteSearch(e.target.value)} className="w-full bg-transparent border-none outline-none text-lg font-medium text-white placeholder-gray-600" />
               </div>
               <div className="p-4 max-h-96 overflow-y-auto">
                  {['overview', 'portfolio', 'research'].map(id => (
                    <button key={id} onClick={() => { setActiveTab(id); setShowPalette(false); }} className="w-full p-4 flex items-center space-x-4 hover:bg-white/5 rounded-xl transition-colors group">
                       <p className="text-sm font-black uppercase text-gray-400 group-hover:text-cyan-400">{id}</p>
                    </button>
                  ))}
               </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <nav className="fixed top-0 inset-x-0 h-20 bg-black/40 backdrop-blur-2xl border-b border-white/5 z-50 flex items-center justify-between px-10">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-cyan-400 rounded-xl flex items-center justify-center text-black shadow-lg shadow-cyan-400/20"><Shield size={24} /></div>
          <h1 className="text-lg font-black tracking-tighter uppercase italic">Sovereign Nexus</h1>
        </div>
        <div className="flex space-x-1 bg-white/5 p-1 rounded-xl border border-white/10">
          {['overview', 'portfolio', 'research'].map(t => (
            <button key={t} onClick={() => setActiveTab(t)} className={cn("px-6 py-2 rounded-lg text-[10px] font-black uppercase transition-all", activeTab === t ? "bg-white/10 text-white" : "text-gray-500")}>{t}</button>
          ))}
        </div>
        <button onClick={() => setShowPalette(true)} className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-gray-500 hover:text-white transition-all"><Search size={18}/></button>
      </nav>

      <main className="pt-28 pb-12 px-10 max-w-7xl mx-auto">
        {activeTab === 'overview' && (
           <div className="space-y-12">
              <div className="grid grid-cols-4 gap-4">
                {data?.Stocks?.map((s: any) => (
                  <div key={s.symbol} className="p-6 bg-white/5 border border-white/10 rounded-[2rem]">
                     <p className="text-[10px] font-black text-gray-500 uppercase mb-2">{s.symbol}</p>
                     <p className="text-2xl font-black">₹{s.price.toLocaleString()}</p>
                     <p className={cn("text-[10px] font-black mt-1", s.change > 0 ? "text-emerald-400" : "text-rose-400")}>{s.change.toFixed(2)}%</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-8">
                 <div className="p-8 bg-white/5 border border-white/10 rounded-[3rem] space-y-4">
                    <h3 className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Whale Watch</h3>
                    <div className="space-y-2">
                       {whaleNews.map((w, i) => (
                         <div key={i} className="p-3 bg-white/5 rounded-xl flex justify-between items-center text-[10px]">
                            <span className="font-black text-cyan-400">{w.trader}</span>
                            <span className="text-gray-400 truncate ml-4 flex-1">{w.title}</span>
                         </div>
                       ))}
                    </div>
                 </div>
                 <div className="p-8 bg-white/5 border border-white/10 rounded-[3rem] space-y-4">
                    <h3 className="text-[10px] font-black uppercase text-gray-500 tracking-widest">FII/DII Trends</h3>
                    <div className="space-y-2">
                       {fiidii.map((f, i) => (
                         <div key={i} className="p-3 bg-white/5 rounded-xl flex justify-between items-center text-[10px]">
                            <span className="font-black text-gray-500">{f.date}</span>
                            <span className={f.fii_net > 0 ? "text-emerald-400" : "text-rose-400"}>FII: {f.fii_net} Cr</span>
                         </div>
                       ))}
                    </div>
                 </div>
              </div>
           </div>
        )}

        {activeTab === 'portfolio' && (
           <div className="bg-white/5 border border-white/10 rounded-[3rem] overflow-hidden">
              <table className="w-full text-left text-xs">
                 <thead className="bg-white/5 text-[10px] font-black uppercase text-gray-500">
                    <tr><th className="p-6">Ticker</th><th className="p-6">Qty</th><th className="p-6">Avg</th><th className="p-6">Current</th><th className="p-6 text-right">PnL</th></tr>
                 </thead>
                 <tbody className="divide-y divide-white/5 font-black">
                    {portfolio.holdings?.map((h: any, i: number) => (
                      <tr key={i} className="hover:bg-white/5">
                         <td className="p-6 text-cyan-400">{h.ticker}</td>
                         <td className="p-6">{h.qty}</td>
                         <td className="p-6 text-gray-400">₹{h.avg_price}</td>
                         <td className="p-6">₹{h.current_price}</td>
                         <td className={cn("p-6 text-right", h.pnl > 0 ? "text-emerald-400" : "text-rose-400")}>₹{h.pnl.toLocaleString()}</td>
                      </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        )}

        {activeTab === 'research' && (
           <div className="space-y-12">
              <div className="p-12 bg-white/5 border border-white/10 rounded-[4rem] space-y-8">
                 <h2 className="text-2xl font-black tracking-tighter uppercase italic">Forensic Scan</h2>
                 <textarea value={filingText} onChange={e => setFilingText(e.target.value)} placeholder="Paste filing text..." className="w-full h-48 bg-black/40 border border-white/10 rounded-3xl p-8 text-sm outline-none focus:border-cyan-400" />
                 <button onClick={analyzeFiling} className="w-full py-6 bg-cyan-400 text-black font-black uppercase rounded-3xl shadow-xl shadow-cyan-400/20">Initiate Forensic Verdict</button>
                 {filingAnalysis && (
                    <div className="p-8 bg-white/5 rounded-3xl border border-white/5">
                       <p className="text-[10px] font-black text-rose-400 uppercase">Verdict: {filingAnalysis.sentiment_verdict}</p>
                       <p className="text-xs text-gray-400 mt-2">{filingAnalysis.risk_clauses?.join(', ')}</p>
                    </div>
                 )}
              </div>
           </div>
        )}
      </main>
    </div>
  );
}
