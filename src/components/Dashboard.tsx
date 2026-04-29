import React, { useState, useEffect } from 'react';
import { 
  Shield, Search, History, Cpu, BarChart3, TrendingUp, TrendingDown, 
  Zap, Clock, Activity, Wallet, FileText, AlertCircle, List, Terminal, Command, CheckCircle2, Settings as SettingsIcon, Key, Globe, BrainCircuit
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHotkeys } from 'react-hotkeys-hook';

const cn = (...classes: string[]) => classes.filter(Boolean).join(' ');

const PROVIDERS = [
  { id: 'nvidia', name: 'NVIDIA NIM', icon: <Cpu size={16}/>, models: ['meta/llama-3.1-405b-instruct', 'meta/llama-3.1-70b-instruct', 'nvidia/nemotron-4-340b-instruct'] },
  { id: 'groq', name: 'Groq Cloud', icon: <Zap size={16}/>, models: ['llama3-70b-8192', 'llama3-8b-8192', 'mixtral-8x7b-32768'] },
  { id: 'openrouter', name: 'OpenRouter', icon: <Globe size={16}/>, models: ['google/gemini-pro-1.5', 'anthropic/claude-3.5-sonnet', 'openai/gpt-4o', 'meta/llama-3.1-405b', 'futuristic/gpt-5.5-alpha'] },
  { id: 'openai', name: 'OpenAI Direct', icon: <BrainCircuit size={16}/>, models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'] }
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [showPalette, setShowPalette] = useState(false);
  const [data, setData] = useState<any>(null);
  const [portfolio, setPortfolio] = useState<any>({ holdings: [] });
  const [activeConfig, setActiveConfig] = useState({ provider: 'nvidia', model: 'meta/llama-3.1-405b-instruct' });
  const [marketStatus, setMarketStatus] = useState('CLOSED');

  // Settings State
  const [vault, setVault] = useState<any>({});
  const [verifyStatus, setVerifyStatus] = useState<any>({});
  const [isSyncing, setIsSyncing] = useState(false);

  useHotkeys('ctrl+k', (e) => { e.preventDefault(); setShowPalette(!showPalette); });

  const fetchInit = async () => {
    try {
      const oRes = await fetch('http://localhost:8008/market/overview');
      const oData = await oRes.json();
      setData(oData);
      setMarketStatus(oData.market_status);
      const pRes = await fetch('http://localhost:8008/market/portfolio/summary');
      setPortfolio(await pRes.json());
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

  const triggerAuth = async () => {
    setIsSyncing(true);
    const res = await fetch('http://localhost:8008/market/zerodha/auth', { method: 'POST' });
    setIsSyncing(false);
    if (res.ok) alert("Nexus Synchronized.");
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
        )}

        {activeTab === 'settings' && (
           <div className="grid grid-cols-2 gap-8">
              <div className="col-span-2 p-10 bg-white/5 border border-white/10 rounded-[3rem] space-y-6">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                       <Key className="text-cyan-400" size={24} />
                       <h2 className="text-xl font-black tracking-tighter uppercase italic">Zerodha Tactical Sync</h2>
                    </div>
                    <button onClick={triggerAuth} disabled={isSyncing} className="px-8 py-3 bg-cyan-400 text-black text-[10px] font-black uppercase rounded-xl shadow-lg shadow-cyan-400/20">{isSyncing ? "Syncing..." : "Ignite Sync"}</button>
                 </div>
                 <div className="grid grid-cols-3 gap-4">
                    <input placeholder="User ID" className="bg-black/40 border border-white/10 rounded-xl p-4 text-[10px] font-black uppercase outline-none" onChange={e => saveToVault('zerodha_user_id', e.target.value)} />
                    <input type="password" placeholder="Password" className="bg-black/40 border border-white/10 rounded-xl p-4 text-[10px] font-black uppercase outline-none" onChange={e => saveToVault('zerodha_password', e.target.value)} />
                    <input placeholder="TOTP Secret" className="bg-black/40 border border-white/10 rounded-xl p-4 text-[10px] font-black uppercase outline-none" onChange={e => saveToVault('zerodha_totp_secret', e.target.value)} />
                 </div>
              </div>

              {PROVIDERS.map(p => (
                <div key={p.id} className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] space-y-6 relative overflow-hidden">
                   <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                         <div className="text-cyan-400">{p.icon}</div>
                         <h3 className="text-xs font-black uppercase">{p.name}</h3>
                      </div>
                      <div className={cn("w-2 h-2 rounded-full", activeConfig.provider === p.id ? "bg-cyan-400 shadow-[0_0_10px_#22d3ee]" : "bg-white/10")} />
                   </div>
                   <div className="flex space-x-2">
                      <input type="password" placeholder="API Key" className="flex-1 bg-black/40 border border-white/10 rounded-xl p-4 text-[10px] font-black uppercase outline-none" onChange={e => saveToVault(`${p.id}_api_key`, e.target.value)} />
                      <button onClick={() => verifyKey(p.id)} className="px-4 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase hover:bg-white/10">
                         {verifyStatus[p.id] === 'valid' ? <CheckCircle2 size={16} className="text-emerald-400"/> : verifyStatus[p.id] === 'verifying' ? "..." : "Verify"}
                      </button>
                   </div>
                   <select className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-[10px] font-black uppercase outline-none appearance-none" onChange={e => setModel(p.id, e.target.value)}>
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
