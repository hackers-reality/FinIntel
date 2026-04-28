import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  Shield, Search, History, Cpu, Send, BarChart3, TrendingUp, TrendingDown, Settings as SettingsIcon,
  Globe, Zap, Clock, Download, Layers, Activity, Wallet, Plus, Trash2, Terminal, Monitor, FileText, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const cn = (...classes: string[]) => classes.filter(Boolean).join(' ');

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [theme, setTheme] = useState<'sovereign' | 'terminal'>('sovereign');
  const [selectedTicker, setSelectedTicker] = useState('^NSEI');
  const [data, setData] = useState<any>(null);
  const [researchResult, setResearchResult] = useState<any>(null);
  const [isResearching, setIsResearching] = useState(false);
  const [filingText, setFilingText] = useState('');
  const [filingAnalysis, setFilingAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [zerodhaHoldings, setZerodhaHoldings] = useState<any[]>([]);
  const [behavior, setBehavior] = useState<any>({});

  const fetchInit = async () => {
    try {
      const [oRes, zRes] = await Promise.all([
        fetch('http://localhost:8008/market/overview'),
        fetch('http://localhost:8008/market/zerodha/holdings')
      ]);
      setData(await oRes.json());
      setZerodhaHoldings(await zRes.json());
    } catch {}
  };

  useEffect(() => {
    fetchInit();
    const ws = new WebSocket('ws://localhost:8008/ws/prices');
    ws.onmessage = (e) => setData(JSON.parse(e.data));
    return () => ws.close();
  }, []);

  useEffect(() => {
    const fetchBehavior = async () => {
      try {
        const res = await fetch(`http://localhost:8008/market/behavior/${selectedTicker}`);
        setBehavior(await res.json());
      } catch {}
    };
    fetchBehavior();
  }, [selectedTicker]);

  const runResearch = async () => {
    setIsResearching(true);
    try {
      const res = await fetch(`http://localhost:8008/market/research/${selectedTicker}`);
      setResearchResult(await res.json());
    } catch {} finally { setIsResearching(false); }
  };

  const analyzeFiling = async () => {
    setIsAnalyzing(true);
    try {
      const res = await fetch('http://localhost:8008/analyze/document', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: filingText })
      });
      setFilingAnalysis(await res.json());
    } catch {} finally { setIsAnalyzing(false); }
  };

  return (
    <div className={cn("min-h-screen transition-colors duration-700", 
      theme === 'terminal' ? "bg-black font-mono text-emerald-400" : "bg-[#050505] font-sans text-white")}>
      
      <nav className="fixed top-0 inset-x-0 h-24 bg-black/40 backdrop-blur-2xl border-b border-white/5 z-50 flex items-center justify-between px-12">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-cyan-400 rounded-2xl flex items-center justify-center text-black shadow-lg shadow-cyan-400/20"><Shield size={24} /></div>
          <h1 className="text-xl font-black tracking-tighter uppercase italic">FinIntel Pro</h1>
        </div>
        <div className="flex space-x-2 bg-white/5 p-1.5 rounded-2xl border border-white/10">
          {['overview', 'portfolio', 'research', 'chat'].map(t => (
            <button key={t} onClick={() => setActiveTab(t)} className={cn("px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all", activeTab === t ? "bg-white/10 text-white shadow-lg" : "text-gray-500")}>{t}</button>
          ))}
        </div>
        <button onClick={() => setTheme(theme === 'sovereign' ? 'terminal' : 'sovereign')} className="p-3 bg-white/5 border border-white/10 rounded-2xl text-gray-500 hover:text-white"><Terminal size={20} /></button>
      </nav>

      <main className="pt-32 pb-12 px-12">
        {data?.market_status === 'CLOSED' && (
          <div className="mb-8 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-center text-rose-400 text-[10px] font-black uppercase tracking-widest flex items-center justify-center space-x-3">
             <Clock size={16} /> <span>MARKET CLOSED — Opens at 9:15 AM IST</span>
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in duration-700">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {data?.Stocks?.map((s: any) => (
                  <button key={s.symbol} onClick={() => setSelectedTicker(s.symbol)} className={cn("p-6 rounded-[2rem] border transition-all text-left relative overflow-hidden", selectedTicker === s.symbol ? "bg-cyan-400 border-cyan-400 text-black shadow-2xl" : "bg-white/5 border-white/10")}>
                     <div className="flex justify-between items-start mb-4">
                        <span className="font-black tracking-tighter">{s.symbol}</span>
                        {s.symbol === selectedTicker && behavior?.status === 'ACCUMULATION' && <span className="px-2 py-1 bg-emerald-500 text-[8px] font-black rounded-full text-white">ACCUMULATION</span>}
                     </div>
                     <div className="text-xl font-black">₹{s.price.toFixed(2)}</div>
                     <div className={cn("text-[10px] font-black mt-1", s.change > 0 ? "text-emerald-500" : "text-rose-500")}>{s.change.toFixed(2)}%</div>
                  </button>
                ))}
             </div>
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12">
                <div className="lg:col-span-2 p-10 bg-white/5 border border-white/10 rounded-[3rem] space-y-6">
                   <h3 className="text-xl font-black tracking-tight flex items-center space-x-2 text-cyan-400"><Activity size={20} /> <span>Strategic Analysis</span></h3>
                   <div className="h-64 bg-black/20 rounded-3xl" />
                </div>
                <div className="p-10 bg-white/5 border border-white/10 rounded-[3rem] space-y-6">
                   <h3 className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Sector Sentiment</h3>
                   <div className="space-y-4">
                      {data?.categories?.map((c: any) => (
                        <div key={c.name} className="space-y-2">
                           <div className="flex justify-between text-[10px] font-black"><span>{c.name}</span><span className={c.sentiment > 0 ? "text-emerald-400" : "text-rose-400"}>{c.sentiment}%</span></div>
                           <div className="h-1 bg-white/5 rounded-full overflow-hidden"><div className={cn("h-full", c.sentiment > 0 ? "bg-emerald-400" : "bg-rose-400")} style={{ width: `${Math.min(Math.abs(c.sentiment) * 20, 100)}%` }} /></div>
                        </div>
                      ))}
                   </div>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'research' && (
          <div className="max-w-4xl mx-auto space-y-12 py-10 animate-in fade-in duration-700">
             <div className="p-12 bg-white/5 border border-white/10 rounded-[4rem] space-y-8">
                <div className="flex justify-between items-center"><h2 className="text-3xl font-black tracking-tighter">Forensic Filing analysis</h2><FileText size={24} className="text-cyan-400" /></div>
                <textarea value={filingText} onChange={e => setFilingText(e.target.value)} placeholder="Paste filing text..." className="w-full h-48 bg-black/40 border border-white/10 rounded-3xl p-8 text-sm outline-none focus:border-cyan-400" />
                <button onClick={analyzeFiling} disabled={isAnalyzing} className="w-full py-5 bg-cyan-400 text-black font-black uppercase rounded-3xl shadow-xl shadow-cyan-400/20">{isAnalyzing ? "Scanning Fine Print..." : "Initiate Forensic Scan"}</button>
                {filingAnalysis && (
                  <div className="mt-8 grid grid-cols-2 gap-6 p-8 bg-white/5 rounded-3xl border border-white/5">
                     <div><p className="text-[8px] font-black text-gray-500 uppercase mb-2">Risks</p><p className="text-xs text-gray-300">{filingAnalysis.risk_clauses?.join(', ')}</p></div>
                     <div><p className="text-[8px] font-black text-gray-500 uppercase mb-2">Verdict</p><p className="text-xs text-rose-400 font-bold">{filingAnalysis.sentiment_verdict}</p></div>
                  </div>
                )}
             </div>

             <button onClick={runResearch} disabled={isResearching} className="w-full py-6 bg-white text-black font-black uppercase rounded-full hover:scale-105 transition-all shadow-2xl">{isResearching ? "Synthesizing Deep Research..." : `Generate Alpha Research: ${selectedTicker}`}</button>
             
             {researchResult && (
               <div className="p-12 bg-white/5 border border-white/10 rounded-[4rem] space-y-12">
                  <div className="flex justify-between items-center border-b border-white/5 pb-8">
                     <div className="space-y-1"><p className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">{researchResult.Verdict}</p><h3 className="text-4xl font-black tracking-tighter">{researchResult.Score}% CONVICTION</h3></div>
                     <div className="text-right"><p className="text-[10px] font-black text-gray-500 uppercase">Moat Score</p><p className="text-2xl font-black text-purple-400">{researchResult.Moat_Score}/10</p></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                     <div className="space-y-4 text-sm leading-relaxed text-gray-300">
                        <h4 className="text-[10px] font-black text-gray-500 uppercase">Investment Rationale</h4>
                        <p>{researchResult.Investment_Rationale}</p>
                     </div>
                     <div className="space-y-4 text-sm leading-relaxed text-gray-300">
                        <h4 className="text-[10px] font-black text-gray-500 uppercase">Target Strategy</h4>
                        <p>{researchResult.Strategy}</p>
                        <div className="pt-4"><p className="text-[10px] font-black text-gray-500 uppercase">Target Price</p><p className="text-2xl font-black text-emerald-400">₹{researchResult.Target_Price}</p></div>
                     </div>
                  </div>
                  <div className="p-8 bg-rose-500/5 border border-rose-500/10 rounded-3xl"><h4 className="text-[10px] font-black text-rose-500 uppercase mb-2">Critical Risks</h4><p className="text-xs text-gray-400">{researchResult.Risks}</p></div>
               </div>
             )}
          </div>
        )}
      </main>
    </div>
  );
}
