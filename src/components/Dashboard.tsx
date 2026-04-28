import React, { useState, useEffect } from 'react';
import { 
  Shield, Search, History, Cpu, BarChart3, TrendingUp, TrendingDown, 
  Zap, Clock, Activity, Wallet, FileText, AlertCircle, List, CheckCircle2
} from 'lucide-react';

const cn = (...classes: string[]) => classes.filter(Boolean).join(' ');

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedTicker, setSelectedTicker] = useState('^NSEI');
  const [data, setData] = useState<any>(null);
  const [portfolio, setPortfolio] = useState<any>({ holdings: [] });
  const [whaleNews, setWhaleNews] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [fiidii, setFiidii] = useState<any[]>([]);
  const [isResearching, setIsResearching] = useState(false);
  const [researchResult, setResearchResult] = useState<any>(null);

  const fetchStrategic = async () => {
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
    fetchStrategic();
    const ws = new WebSocket('ws://localhost:8008/ws/prices');
    ws.onmessage = (e) => setData(JSON.parse(e.data));
    return () => ws.close();
  }, []);

  const resolveEvent = async (id: number) => {
    await fetch(`http://localhost:8008/market/events/${id}`, { method: 'PATCH' });
    // Refresh events logic here
  };

  const renderOverview = () => (
    <div className="space-y-10">
       {/* Utilitarian Market Pulse */}
       <div className="grid grid-cols-4 gap-4">
          {data?.Stocks?.map((s: any) => (
            <div key={s.symbol} className="p-4 bg-white/5 border border-white/10 rounded-xl">
               <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">{s.symbol}</p>
               <p className="text-lg font-black mt-1">₹{s.price.toLocaleString()}</p>
               <p className={cn("text-[10px] font-black", s.change > 0 ? "text-emerald-400" : "text-rose-400")}>{s.change.toFixed(2)}%</p>
            </div>
          ))}
       </div>

       {/* Strictly Utilitarian Whale Watch & FII/DII */}
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
             <h3 className="text-[10px] font-black uppercase text-gray-500 tracking-widest border-b border-white/5 pb-2 flex items-center gap-2"><TrendingUp size={12}/> Whale Watch (Institutional Activity)</h3>
             <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                <table className="w-full text-left text-[10px]">
                   <thead className="bg-white/5 border-b border-white/5 font-black uppercase">
                      <tr><th className="p-3">Trader</th><th className="p-3">Activity</th><th className="p-3 text-right">Source</th></tr>
                   </thead>
                   <tbody className="divide-y divide-white/5 font-medium">
                      {whaleNews.map((w, i) => (
                        <tr key={i} className="hover:bg-white/5 transition-colors">
                           <td className="p-3 font-black text-cyan-400">{w.trader}</td>
                           <td className="p-3 text-gray-400">{w.title}</td>
                           <td className="p-3 text-right"><a href={w.url} className="text-gray-500 hover:text-white underline">VIEW</a></td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
          <div className="space-y-4">
             <h3 className="text-[10px] font-black uppercase text-gray-500 tracking-widest border-b border-white/5 pb-2 flex items-center gap-2"><Zap size={12}/> FII / DII Trends</h3>
             <div className="grid grid-cols-1 gap-2">
                {fiidii.map((f, i) => (
                  <div key={i} className="p-3 bg-white/5 border border-white/5 rounded-lg flex justify-between items-center text-[10px]">
                     <span className="font-black text-gray-500">{f.date}</span>
                     <div className="space-x-4">
                        <span className={f.fii_net > 0 ? "text-emerald-400" : "text-rose-400"}>FII: {f.fii_net} Cr</span>
                        <span className={f.dii_net > 0 ? "text-emerald-400" : "text-rose-400"}>DII: {f.dii_net} Cr</span>
                     </div>
                  </div>
                ))}
             </div>
          </div>
       </div>
    </div>
  );

  const renderPortfolio = () => (
    <div className="space-y-8 animate-in fade-in">
       <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <table className="w-full text-left text-xs">
             <thead className="bg-white/5 border-b border-white/5 font-black uppercase text-[10px] text-gray-500">
                <tr><th className="p-4">Ticker</th><th className="p-4">Qty</th><th className="p-4">Avg</th><th className="p-4">Current</th><th className="p-4 text-right">PnL</th></tr>
             </thead>
             <tbody className="divide-y divide-white/5 font-black">
                {portfolio.holdings?.map((h: any, i: number) => (
                  <tr key={i} className="hover:bg-white/5 transition-all">
                     <td className="p-4 text-cyan-400">{h.ticker}</td>
                     <td className="p-4">{h.qty}</td>
                     <td className="p-4 text-gray-400">₹{h.avg_price}</td>
                     <td className="p-4">₹{h.current_price}</td>
                     <td className={cn("p-4 text-right", h.pnl > 0 ? "text-emerald-400" : "text-rose-400")}>
                        ₹{h.pnl.toLocaleString()}
                     </td>
                  </tr>
                ))}
             </tbody>
          </table>
          <div className="p-6 bg-white/5 border-t border-white/5 flex justify-between items-center">
             <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Aggregate Value</span>
             <span className="text-2xl font-black text-cyan-400 tracking-tighter">₹{portfolio.total_value?.toLocaleString()}</span>
          </div>
       </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-cyan-400 selection:text-black">
      <nav className="fixed top-0 inset-x-0 h-20 bg-black/80 backdrop-blur-2xl border-b border-white/5 z-50 flex items-center justify-between px-10">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-cyan-400 rounded-lg flex items-center justify-center text-black shadow-lg shadow-cyan-400/20"><Shield size={20} /></div>
          <h1 className="text-sm font-black tracking-tighter uppercase italic">FinIntel Pro</h1>
        </div>
        <div className="flex space-x-1 bg-white/5 p-1 rounded-xl border border-white/10">
          {['overview', 'portfolio', 'research'].map(t => (
            <button key={t} onClick={() => setActiveTab(t)} className={cn("px-5 py-2 rounded-lg text-[10px] font-black uppercase transition-all", activeTab === t ? "bg-white/10 text-white" : "text-gray-500")}>{t}</button>
          ))}
        </div>
        <div className="w-32 text-right"><p className="text-[8px] font-black text-gray-500 uppercase tracking-widest leading-none">Intelligence Hub</p><p className="text-[10px] font-black text-cyan-400 uppercase">ONLINE</p></div>
      </nav>

      <main className="pt-28 pb-12 px-10 max-w-7xl mx-auto">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'portfolio' && renderPortfolio()}
        {activeTab === 'research' && (
          <div className="text-center text-gray-500 py-20 text-[10px] font-black uppercase tracking-widest">Research Module Active</div>
        )}
      </main>
    </div>
  );
}
