import React, { useState, useEffect } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';
import { 
  Shield, Search, History, Cpu, Send, BarChart3, TrendingUp, TrendingDown, Settings as SettingsIcon,
  Globe, Zap, Clock, Download, Layers, Activity, Wallet, Plus, Trash2, Terminal, Monitor, Swords, List, AlertCircle, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHotkeys } from 'react-hotkeys-hook';

const cn = (...classes: string[]) => classes.filter(Boolean).join(' ');
const COLORS = ['#22d3ee', '#a855f7', '#f43f5e', '#fbbf24', '#10b981'];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [theme, setTheme] = useState<'sovereign' | 'terminal'>('sovereign');
  const [selectedTicker, setSelectedTicker] = useState('RELIANCE.NS');
  const [data, setData] = useState<any>(null);
  const [zerodhaHoldings, setZerodhaHoldings] = useState<any[]>([]);
  const [filingText, setFilingText] = useState('');
  const [filingAnalysis, setFilingAnalysis] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [behavior, setBehavior] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isResearching, setIsResearching] = useState(false);
  const [researchResult, setResearchResult] = useState<any>(null);
  const [sysSettings, setSysSettings] = useState<any>({});
  const [alerts, setAlerts] = useState<any[]>([]);

  const fetchInit = async () => {
    try {
      const [oRes, zRes, sRes] = await Promise.all([
        fetch('http://localhost:8008/market/overview'),
        fetch('http://localhost:8008/market/zerodha/holdings'),
        fetch('http://localhost:8008/settings')
      ]);
      setData(await oRes.json());
      setZerodhaHoldings(await zRes.json());
      setSysSettings(await sRes.json());
    } catch {}
  };

  useEffect(() => {
    fetchInit();
    const ws = new WebSocket('ws://localhost:8008/ws/prices');
    ws.onmessage = (e) => setData(JSON.parse(e.data));
    return () => ws.close();
  }, []);

  useEffect(() => {
    const fetchTickerData = async () => {
      try {
        const [eRes, bRes] = await Promise.all([
          fetch(`http://localhost:8008/market/events/${selectedTicker}`),
          fetch(`http://localhost:8008/market/behavior/${selectedTicker}`)
        ]);
        setEvents(await eRes.json());
        setBehavior(await bRes.json());
      } catch {}
    };
    fetchTickerData();
  }, [selectedTicker]);

  const analyzeFiling = async () => {
    setIsAnalyzing(true);
    const res = await fetch('http://localhost:8008/analyze/document', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: filingText })
    });
    setFilingAnalysis(await res.json());
    setIsAnalyzing(false);
  };

  const runResearch = async () => {
    setIsResearching(true);
    const res = await fetch(`http://localhost:8008/market/research/${selectedTicker}`);
    setResearchResult(await res.json());
    setIsResearching(false);
  };

  return (
    <div className={cn("min-h-screen selection:bg-cyan-400 selection:text-black transition-colors duration-700", 
      theme === 'terminal' ? "bg-black font-mono text-emerald-400" : "bg-[#050505] font-sans text-white")}>
      
      <nav className="fixed top-0 inset-x-0 h-24 bg-black/40 backdrop-blur-2xl border-b border-white/5 z-50 flex items-center justify-between px-12">
        <div className="flex items-center space-x-4">
          <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg", theme === 'terminal' ? "bg-emerald-400 text-black" : "bg-cyan-400 text-black shadow-cyan-400/20")}><Shield size={24} /></div>
          <h1 className="text-xl font-black tracking-tighter uppercase italic">FinIntel Pro</h1>
        </div>
        <div className="flex space-x-2 bg-white/5 p-1.5 rounded-2xl border border-white/10">
          {['overview', 'portfolio', 'research', 'chat'].map(t => (
            <button key={t} onClick={() => setActiveTab(t)} className={cn("px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all", activeTab === t ? "bg-white/10 text-white" : "text-gray-500")}>{t}</button>
          ))}
        </div>
        <div className="flex items-center space-x-4">
           <button onClick={() => setTheme(theme === 'sovereign' ? 'terminal' : 'sovereign')} className="p-2 text-gray-500 hover:text-white"><Terminal size={20} /></button>
           <div className="text-right"><p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Sovereign 2.0</p><p className="text-xs font-black text-cyan-400 uppercase">ZERODHA ACTIVE</p></div>
        </div>
      </nav>

      <main className="pt-32 pb-12 px-12">
        {data?.market_status === 'CLOSED' && (
          <div className="mb-8 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-center space-x-3 text-rose-400 text-[10px] font-black uppercase tracking-widest">
             <Clock size={16} /> <span>Market Closed — Opens at 9:15 AM IST</span>
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in duration-700">
             <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {data?.Stocks?.map((s: any) => (
                  <button key={s.symbol} onClick={() => setSelectedTicker(s.symbol)} className={cn("p-6 rounded-3xl border transition-all text-left relative", selectedTicker === s.symbol ? "bg-cyan-400 border-cyan-400 text-black" : "bg-white/5 border-white/10")}>
                     <div className="flex justify-between items-center mb-4">
                        <span className="font-black tracking-tighter">{s.symbol}</span>
                        {behavior?.status === 'ACCUMULATION' && <span className="text-[8px] font-black px-2 py-1 bg-emerald-500/20 rounded-full text-emerald-500">ACCUMULATION</span>}
                     </div>
                     <div className="text-xl font-black">₹{s.price.toFixed(2)}</div>
                     <div className={cn("text-[10px] font-black", s.change > 0 ? "text-emerald-500" : "text-rose-500")}>{s.change.toFixed(2)}%</div>
                     {events.length > 0 && <div className="mt-4 flex items-center space-x-2 text-[8px] font-black text-rose-500 uppercase tracking-tighter"><AlertCircle size={12} /> <span>PENDING EVENT — DO NOT TRADE</span></div>}
                  </button>
                ))}
             </div>
          </div>
        )}

        {activeTab === 'research' && (
          <div className="max-w-4xl mx-auto space-y-12 py-10 animate-in fade-in duration-700">
             <div className="p-12 bg-white/5 border border-white/10 rounded-[4rem] space-y-8">
                <div className="flex justify-between items-center">
                   <h2 className="text-3xl font-black tracking-tighter">Document Forensic Center</h2>
                   <FileText size={24} className="text-cyan-400" />
                </div>
                <textarea value={filingText} onChange={e => setFilingText(e.target.value)} placeholder="Paste legal filing or regulatory text here..." className="w-full h-48 bg-black/40 border border-white/10 rounded-3xl p-8 text-sm outline-none focus:border-cyan-400 custom-scrollbar" />
                <button onClick={analyzeFiling} disabled={isAnalyzing} className="w-full py-5 bg-cyan-400 text-black font-black uppercase rounded-3xl shadow-xl shadow-cyan-400/20">{isAnalyzing ? "Scanning Fine Print..." : "Analyze Forensic Risks"}</button>
                
                {filingAnalysis && (
                  <div className="mt-10 p-10 bg-white/5 border border-white/5 rounded-3xl space-y-6 animate-in slide-in-from-bottom-8">
                     <div className="flex justify-between items-center"><span className="text-[10px] font-black text-cyan-400 uppercase">Analysis Results</span><span className="text-xs font-black text-rose-500">{filingAnalysis.sentiment_verdict}</span></div>
                     <div className="grid grid-cols-2 gap-8">
                        <div><p className="text-[8px] font-black text-gray-500 uppercase mb-2">Risk Clauses</p><ul className="text-xs space-y-1">{filingAnalysis.risk_clauses?.map((r: any, i: number) => <li key={i}>• {r}</li>)}</ul></div>
                        <div><p className="text-[8px] font-black text-gray-500 uppercase mb-2">Regulatory Flags</p><ul className="text-xs space-y-1">{filingAnalysis.regulatory_flags?.map((r: any, i: number) => <li key={i}>• {r}</li>)}</ul></div>
                     </div>
                  </div>
                )}
             </div>

             <div className="flex justify-center"><button onClick={runResearch} disabled={isResearching} className="px-12 py-5 bg-white text-black font-black uppercase rounded-full hover:scale-105 transition-all shadow-2xl">{isResearching ? "Deep Researching..." : `Final Research: ${selectedTicker}`}</button></div>
             
             {researchResult && (
               <div className="p-12 bg-white/5 border border-white/10 rounded-[4rem] space-y-10">
                  <div className="flex justify-between items-center">
                     <div className="flex space-x-3 items-center"><div className="px-4 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-black uppercase">{researchResult.Verdict}</div><span className="text-2xl font-black">{researchResult.Score}% CONVICTION</span></div>
                  </div>
                  <div className="grid grid-cols-2 gap-10">
                     <div className="space-y-4"><h4 className="text-[10px] font-black text-gray-500 uppercase">Investment Rationale</h4><p className="text-sm leading-relaxed text-gray-300">{researchResult.Investment_Rationale}</p></div>
                     <div className="space-y-4"><h4 className="text-[10px] font-black text-gray-500 uppercase">Risks</h4><p className="text-sm leading-relaxed text-gray-300">{researchResult.Risks}</p></div>
                  </div>
                  <div className="flex justify-between pt-6 border-t border-white/5">
                     <div className="text-center"><p className="text-[8px] font-black text-gray-500 uppercase">Target Price</p><p className="text-xl font-black text-cyan-400">₹{researchResult.Target_Price}</p></div>
                     <div className="text-center"><p className="text-[8px] font-black text-gray-500 uppercase">Moat Score</p><p className="text-xl font-black text-purple-400">{researchResult.Moat_Score}/10</p></div>
                  </div>
               </div>
             )}
          </div>
        )}

        {activeTab === 'portfolio' && (
          <div className="space-y-8 animate-in fade-in duration-700">
             <div className="p-10 bg-white/5 border border-white/10 rounded-[3rem] space-y-8">
                <div className="flex justify-between items-center"><h2 className="text-3xl font-black tracking-tighter text-cyan-400">Zerodha Live holdings</h2><Activity size={24} className="text-cyan-400" /></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {zerodhaHoldings.map((h, i) => (
                     <div key={i} className="p-6 bg-white/5 border border-white/5 rounded-3xl">
                        <div className="flex justify-between items-center mb-2"><span className="font-black text-xs">{h.tradingsymbol}</span><span className="text-[10px] font-black text-gray-500">Qty: {h.quantity}</span></div>
                        <div className="text-lg font-black">₹{h.last_price}</div>
                        <div className={cn("text-[10px] font-black", h.pnl > 0 ? "text-emerald-500" : "text-rose-500")}>PnL: ₹{h.pnl.toFixed(2)}</div>
                     </div>
                   ))}
                </div>
             </div>
          </div>
        )}
      </main>
    </div>
  );
}
