import React, { useState, useEffect } from 'react';
import { 
  Shield, Search, History, Cpu, BarChart3, TrendingUp, TrendingDown, 
  Zap, Clock, Activity, Wallet, FileText, AlertCircle, List, Terminal, Command, CheckCircle2, Settings as SettingsIcon, Key, Globe, BrainCircuit, ExternalLink, Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHotkeys } from 'react-hotkeys-hook';

const cn = (...classes: string[]) => classes.filter(Boolean).join(' ');

const PROVIDERS = [
  { id: 'nvidia', name: 'NVIDIA NIM', icon: <Cpu size={16}/>, models: ['meta/llama-3.1-405b-instruct', 'meta/llama-3.1-70b-instruct'] },
  { id: 'groq', name: 'Groq Cloud', icon: <Zap size={16}/>, models: ['llama3-70b-8192', 'llama3-8b-8192'] },
  { id: 'openrouter', name: 'OpenRouter', icon: <Globe size={16}/>, models: ['google/gemini-pro-1.5', 'anthropic/claude-3.5-sonnet', 'openai/gpt-4o'] },
  { id: 'openai', name: 'OpenAI Direct', icon: <BrainCircuit size={16}/>, models: ['gpt-4o', 'gpt-4o-mini'] }
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [showPalette, setShowPalette] = useState(false);
  const [data, setData] = useState<any>(null);
  const [portfolio, setPortfolio] = useState<any>({ total_value: 0, holdings: [] });
  const [researchResult, setResearchResult] = useState<any>(null);
  const [titanNews, setTitanNews] = useState<any[]>([]);
  const [fiidii, setFiidii] = useState<any[]>([]);
  const [activeConfig, setActiveConfig] = useState({ provider: 'nvidia', model: 'meta/llama-3.1-405b-instruct' });
  const [marketStatus, setMarketStatus] = useState('CLOSED');

  // UI State
  const [vault, setVault] = useState<any>({});
  const [verifyStatus, setVerifyStatus] = useState<any>({});
  const [isSyncing, setIsSyncing] = useState(false);
  const [researchTicker, setResearchTicker] = useState('');
  const [isResearching, setIsResearching] = useState(false);
  const [newAsset, setNewAsset] = useState({ ticker: '', qty: '', price: '' });

  useHotkeys('ctrl+k', (e) => { e.preventDefault(); setShowPalette(!showPalette); });

  const fetchInit = async () => {
    try {
      const [oRes, pRes, nRes, fRes] = await Promise.all([
        fetch('http://localhost:8008/market/overview'),
        fetch('http://localhost:8008/market/portfolio/summary'),
        fetch('http://localhost:8008/market/traders/news'),
        fetch('http://localhost:8008/market/fiidii')
      ]);
      const oData = await oRes.json();
      setData(oData);
      setMarketStatus(oData.market_status);
      setPortfolio(await pRes.json());
      setTitanNews(await nRes.json());
      setFiidii(await fRes.json());
    } catch {}
  };

  useEffect(() => { 
    fetchInit(); 
    const ws = new WebSocket('ws://localhost:8008/ws/prices');
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.Stocks) setData(msg);
    };
    return () => ws.close();
  }, []);

  const runResearch = async () => {
    if (!researchTicker) return;
    setIsResearching(true);
    const res = await fetch(`http://localhost:8008/market/research/${researchTicker}`);
    setResearchResult(await res.json());
    setIsResearching(false);
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
    setVault({ ...vault, [key]: value });
  };

  const verifyKey = async (provider: string) => {
    const key = vault[`${provider}_api_key`];
    if (!key) return;
    setVerifyStatus({ ...verifyStatus, [provider]: 'verifying' });
    const res = await fetch(`http://localhost:8008/settings/verify/${provider}?key=${key}`);
    const status = (await res.json()).status;
    setVerifyStatus({ ...verifyStatus, [provider]: status });
  };

  const setModel = async (provider: string, model: string) => {
    await fetch('http://localhost:8008/settings/vault', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active_provider: provider, active_model: model })
    });
    setActiveConfig({ provider, model });
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-cyan-400 selection:text-black">
      <nav className="fixed top-0 inset-x-0 h-20 bg-black/40 backdrop-blur-2xl border-b border-white/5 z-50 flex items-center justify-between px-10">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-cyan-400 rounded-xl flex items-center justify-center text-black shadow-lg shadow-cyan-400/20"><Shield size={24} /></div>
            <h1 className="text-lg font-black tracking-tighter uppercase italic">Sovereign Nexus</h1>
          </div>
          <div className={cn("px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest", marketStatus === 'OPEN' ? "border-emerald-400/30 text-emerald-400 bg-emerald-400/5 shadow-[0_0_15px_rgba(52,211,153,0.1)]" : "border-rose-400/30 text-rose-400 bg-rose-400/5")}>
             Market {marketStatus}
          </div>
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
                 {data?.Stocks?.map((s: any) => (
                   <div key={s.symbol} className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 transition-opacity"><Activity size={14} className="text-cyan-400"/></div>
                      <p className="text-[10px] font-black text-gray-500 uppercase mb-2">{s.symbol}</p>
                      <p className="text-3xl font-black">₹{s.price.toLocaleString()}</p>
                      <p className={cn("text-[10px] font-black mt-2", s.change > 0 ? "text-emerald-400" : "text-rose-400")}>{s.change.toFixed(2)}%</p>
                   </div>
                 ))}
              </div>
              
              <div className="grid grid-cols-3 gap-8">
                 <div className="col-span-2 space-y-4">
                    <h2 className="text-xs font-black uppercase text-gray-500 px-4">Titan Whale Feed</h2>
                    {titanNews.map((n, i) => (
                      <div key={i} className="p-6 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-between group hover:bg-white/10 transition-all">
                         <div className="pr-10">
                            <p className="text-[10px] font-black text-cyan-400 uppercase mb-1">{n.titan}</p>
                            <h3 className="text-sm font-bold leading-tight">{n.title}</h3>
                         </div>
                         <a href={n.url} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shrink-0"><ExternalLink size={16}/></a>
                      </div>
                    ))}
                 </div>
                 <div className="space-y-4">
                    <h2 className="text-xs font-black uppercase text-gray-500 px-4">Institutional Flow (FII/DII)</h2>
                    <div className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] space-y-6">
                       {fiidii.map((f, i) => (
                         <div key={i} className="flex items-center justify-between">
                            <p className="text-[10px] font-black uppercase text-gray-500">{f.date}</p>
                            <div className="flex space-x-4">
                               <p className={cn("text-[10px] font-black", f.fii > 0 ? "text-emerald-400" : "text-rose-400")}>FII: {f.fii.toFixed(0)}Cr</p>
                               <p className={cn("text-[10px] font-black", f.dii > 0 ? "text-emerald-400" : "text-rose-400")}>DII: {f.dii.toFixed(0)}Cr</p>
                            </div>
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
                 <div>
                    <p className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-60">Total Portfolio Value</p>
                    <h2 className="text-6xl font-black tracking-tighter italic uppercase">₹{portfolio.total_value.toLocaleString()}</h2>
                 </div>
                 <div className="w-20 h-20 rounded-3xl bg-black/10 flex items-center justify-center"><Wallet size={40}/></div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                 <input placeholder="Ticker" className="bg-white/5 border border-white/10 rounded-2xl p-4 text-[10px] font-black uppercase outline-none focus:border-cyan-400" value={newAsset.ticker} onChange={e => setNewAsset({...newAsset, ticker: e.target.value})} />
                 <input placeholder="Qty" className="bg-white/5 border border-white/10 rounded-2xl p-4 text-[10px] font-black uppercase outline-none focus:border-cyan-400" value={newAsset.qty} onChange={e => setNewAsset({...newAsset, qty: e.target.value})} />
                 <input placeholder="Avg Price" className="bg-white/5 border border-white/10 rounded-2xl p-4 text-[10px] font-black uppercase outline-none focus:border-cyan-400" value={newAsset.price} onChange={e => setNewAsset({...newAsset, price: e.target.value})} />
                 <button onClick={addAsset} className="bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase hover:bg-cyan-400 hover:text-black transition-all flex items-center justify-center space-x-2"><Plus size={16}/><span>Add Asset</span></button>
              </div>

              <div className="p-10 bg-white/5 border border-white/10 rounded-[3rem] overflow-hidden">
                 <table className="w-full">
                    <thead>
                       <tr className="text-[10px] font-black uppercase text-gray-500 border-b border-white/5">
                          <th className="text-left pb-4">Asset</th>
                          <th className="text-right pb-4">Qty</th>
                          <th className="text-right pb-4">Avg Price</th>
                          <th className="text-right pb-4">Current</th>
                          <th className="text-right pb-4">PnL</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                       {portfolio.holdings.map((h: any) => (
                         <tr key={h.symbol} className="text-sm font-bold">
                            <td className="py-6">{h.symbol}</td>
                            <td className="py-6 text-right">{h.qty}</td>
                            <td className="py-6 text-right">₹{h.avg_price.toLocaleString()}</td>
                            <td className="py-6 text-right font-black">₹{h.curr_price.toLocaleString()}</td>
                            <td className={cn("py-6 text-right font-black", h.pnl > 0 ? "text-emerald-400" : "text-rose-400")}>₹{h.pnl.toLocaleString()}</td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
        )}

        {activeTab === 'research' && (
           <div className="space-y-8">
              <div className="flex space-x-4">
                 <input 
                   placeholder="Enter Ticker (e.g. RELIANCE)" 
                   className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-6 text-lg font-black uppercase outline-none focus:border-cyan-400 transition-all"
                   value={researchTicker}
                   onChange={e => setResearchTicker(e.target.value)}
                 />
                 <button onClick={runResearch} disabled={isResearching} className="px-10 bg-cyan-400 text-black font-black uppercase rounded-2xl shadow-lg shadow-cyan-400/20">{isResearching ? "Synthesizing..." : "Ignite Research"}</button>
              </div>

              {researchResult && (
                <div className="grid grid-cols-3 gap-8">
                   <div className="col-span-2 p-12 bg-white/5 border border-white/10 rounded-[3rem] space-y-8">
                      <div className="flex items-center justify-between">
                         <h2 className="text-4xl font-black tracking-tighter uppercase italic">Forensic Verdict</h2>
                         <div className={cn("px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest", researchResult.Verdict === 'Buy' ? "bg-emerald-400 text-black" : "bg-rose-400 text-white")}>{researchResult.Verdict}</div>
                      </div>
                      <div className="space-y-6">
                         <section>
                            <h3 className="text-[10px] font-black uppercase text-cyan-400 mb-2">Alpha Summary</h3>
                            <p className="text-lg font-medium leading-relaxed">{researchResult.Summary}</p>
                         </section>
                         <section className="grid grid-cols-2 gap-8">
                            <div>
                               <h3 className="text-[10px] font-black uppercase text-cyan-400 mb-2">Rationale</h3>
                               <p className="text-sm text-gray-400">{researchResult.Rationale}</p>
                            </div>
                            <div>
                               <h3 className="text-[10px] font-black uppercase text-cyan-400 mb-2">Risks</h3>
                               <p className="text-sm text-gray-400">{researchResult.Risks}</p>
                            </div>
                         </section>
                      </div>
                   </div>
                   <div className="space-y-8">
                      <div className="p-10 bg-white/5 border border-white/10 rounded-[2.5rem] flex flex-col items-center justify-center">
                         <p className="text-[10px] font-black uppercase text-gray-500 mb-2">Nexus Score</p>
                         <div className="text-7xl font-black text-cyan-400">{researchResult.Score}</div>
                      </div>
                      <div className="p-10 bg-white/5 border border-white/10 rounded-[2.5rem] space-y-4">
                         <h3 className="text-[10px] font-black uppercase text-cyan-400">Tactical Strategy</h3>
                         <p className="text-sm leading-relaxed">{researchResult.Strategy}</p>
                         <div className="pt-4 border-t border-white/5">
                            <p className="text-[10px] font-black uppercase text-gray-500">Target Price</p>
                            <p className="text-2xl font-black">₹{researchResult.Target}</p>
                         </div>
                      </div>
                   </div>
                </div>
              )}
           </div>
        )}

        {activeTab === 'settings' && (
           <div className="grid grid-cols-2 gap-8">
              <div className="col-span-2 p-10 bg-white/5 border border-white/10 rounded-[3rem] space-y-6">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                       <Key className="text-cyan-400" size={24} />
                       <h2 className="text-xl font-black tracking-tighter uppercase italic">Zerodha Tactical Sync</h2>
                    </div>
                 </div>
                 <div className="grid grid-cols-3 gap-4">
                    <input placeholder="User ID" className="bg-black/40 border border-white/10 rounded-xl p-4 text-[10px] font-black uppercase outline-none" onChange={e => saveToVault('zerodha_user_id', e.target.value)} />
                    <input type="password" placeholder="Password" className="bg-black/40 border border-white/10 rounded-xl p-4 text-[10px] font-black uppercase outline-none" onChange={e => saveToVault('zerodha_password', e.target.value)} />
                    <input placeholder="TOTP Secret" className="bg-black/40 border border-white/10 rounded-xl p-4 text-[10px] font-black uppercase outline-none" onChange={e => saveToVault('zerodha_totp_secret', e.target.value)} />
                 </div>
              </div>

              {PROVIDERS.map(p => (
                <div key={p.id} className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] space-y-6">
                   <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                         <div className="text-cyan-400">{p.icon}</div>
                         <h3 className="text-xs font-black uppercase">{p.name}</h3>
                      </div>
                   </div>
                   <div className="flex space-x-2">
                      <input type="password" placeholder="API Key" className="flex-1 bg-black/40 border border-white/10 rounded-xl p-4 text-[10px] font-black uppercase outline-none" onChange={e => saveToVault(`${p.id}_api_key`, e.target.value)} />
                      <button onClick={() => verifyKey(p.id)} className="px-4 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase hover:bg-white/10">Verify</button>
                   </div>
                   <select className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-[10px] font-black uppercase outline-none" onChange={e => setModel(p.id, e.target.value)}>
                      {p.models.map(m => <option key={m} value={m}>{m}</option>)}
                   </select>
                </div>
              ))}
           </div>
        )}
      </main>
    </div>
  );
}
