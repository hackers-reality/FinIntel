import React, { useState, useEffect, useRef } from 'react';
import { 
  TrendingUp, TrendingDown, Search, Zap, Bell, Shield, 
  Download, Check, Mic, Brain, LayoutDashboard, History, 
  Bookmark, Settings, PieChart as PieIcon, LineChart as LineIcon,
  Filter, Trash2, X, ChevronRight, Menu, Globe, AlertTriangle
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  Line, Cell, PieChart as RePieChart, Pie 
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

export default function Dashboard() {
  const [selectedTicker, setSelectedTicker] = useState('^NSEI');
  const [activeTab, setActiveTab] = useState<'Overview' | 'AI Insights' | 'Analytics' | 'Saved' | 'History' | 'Alerts' | 'Memory' | 'Settings'>('Overview');
  const [data, setData] = useState<any>(null);
  const [researchResult, setResearchResult] = useState<any>(null);
  const [isResearching, setIsResearching] = useState(false);
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [chatMessage, setChatMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [researchHistory, setResearchHistory] = useState<any[]>([]);
  const [savedOpportunities, setSavedOpportunities] = useState<any[]>([]);
  const [memoryStats, setMemoryStats] = useState<any[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<{status: string, message: string} | null>(null);
  const [alertFilter, setAlertFilter] = useState('');
  const [showMA, setShowMA] = useState(true);
  const [showRSI, setShowRSI] = useState(false);
  const [chartData, setChartData] = useState<any[]>([]);
  const [chartType, setChartType] = useState<'Area' | 'Line' | 'Candle'>('Area');
  const [sysSettings, setSysSettings] = useState<any>({ risk_profile: 'Moderate' });

  // ── Sync Engine ──────────────────────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [oRes, cRes, aRes, hRes, sRes, mRes] = await Promise.all([
          fetch('http://localhost:8008/market/overview'),
          fetch(`http://localhost:8008/market/chart/${selectedTicker}`),
          fetch('http://localhost:8008/market/notifications'),
          fetch('http://localhost:8008/market/history'),
          fetch('http://localhost:8008/market/saved'),
          fetch('http://localhost:8008/system/memory')
        ]);
        setData(await oRes.json());
        setChartData(await cRes.json());
        setAlerts(await aRes.json());
        setResearchHistory(await hRes.json());
        setSavedOpportunities(await sRes.json());
        setMemoryStats(await mRes.json());
      } catch (e) { console.error("Sync failed"); }
    };

    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [selectedTicker]);

  const runDeepResearch = async (ticker: string) => {
    setIsResearching(true);
    setResearchResult(null);
    setActiveTab('AI Insights');
    try {
      const res = await fetch(`http://localhost:8008/market/research/${ticker}`);
      const result = await res.json();
      setResearchResult(result);
    } catch (e) { alert("Research engine offline."); }
    finally { setIsResearching(false); }
  };

  const saveToVault = async () => {
    if (!researchResult) return;
    try {
      await fetch('http://localhost:8008/market/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticker: researchResult.ticker,
          verdict: researchResult.analysis.Verdict,
          score: researchResult.analysis.Score
        })
      });
      alert("Opportunity Armored in Vault.");
    } catch (e) { console.error(e); }
  };

  const purgeMemory = async () => {
    if (!confirm("Wipe all semantic kernel memory?")) return;
    await fetch('http://localhost:8008/system/memory', { method: 'DELETE' });
    setMemoryStats([]);
    alert("Memory Purged.");
  };

  const sendChat = async () => {
    if (!chatMessage) return;
    const msg = chatMessage;
    setChatMessage('');
    setChatHistory(prev => [...prev, { role: 'user', content: msg }]);
    try {
      const res = await fetch('http://localhost:8008/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg })
      });
      const result = await res.json();
      setChatHistory(prev => [...prev, { role: 'assistant', content: result.response }]);
    } catch (e) { console.error(e); }
  };

  // ── Render Components ──────────────────────────────────────────────
  const verifyKey = async (provider: string, model: string, key: string) => {
    setIsVerifying(true);
    setVerifyStatus(null);
    try {
      const res = await fetch('http://localhost:8008/settings/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, model, key })
      });
      const result = await res.json();
      setVerifyStatus(result);
      if (result.status === 'success') {
        // Automatically save if verification passes
        await fetch('http://localhost:8008/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            llm_provider: provider, 
            llm_model: model,
            [`${provider}_api_key`]: key 
          })
        });
      }
    } catch (e) { setVerifyStatus({ status: 'error', message: 'Connection to kernel failed.' }); }
    finally { setIsVerifying(false); }
  };

  const renderOverview = () => (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-[3rem] p-10 backdrop-blur-3xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-black tracking-tighter text-white">{selectedTicker}</h2>
              <p className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mt-1">Live Technical Feed</p>
            </div>
            <div className="flex space-x-2">
              {['Area', 'Line', 'Candle'].map((t) => (
                <button key={t} onClick={() => setChartType(t as any)} className={cn("px-4 py-1.5 rounded-full text-[10px] font-black uppercase transition-all", chartType === t ? "bg-cyan-400 text-black" : "bg-white/5 text-gray-500")}>{t}</button>
              ))}
              <div className="w-px h-6 bg-white/10 mx-2"></div>
              <button onClick={() => setShowMA(!showMA)} className={cn("px-4 py-1.5 rounded-full text-[10px] font-black uppercase transition-all", showMA ? "bg-purple-500 text-white" : "bg-white/5 text-gray-500")}>MA</button>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'Candle' ? (
                <AreaChart data={chartData}>
                  <XAxis dataKey="time" hide />
                  <YAxis hide domain={['auto', 'auto']} />
                  <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '15px', fontSize: '10px' }} />
                  {/* Candlestick high-fidelity simulation */}
                  <Area type="step" dataKey="close" stroke="#22d3ee" strokeWidth={1} fill="#22d3ee" fillOpacity={0.1} />
                  {chartData.map((entry, index) => (
                    <defs key={index}>
                      <linearGradient id={`grad-${index}`} x1="0" y1="0" x2="0" y2="1">
                         <stop offset="0%" stopColor={entry.close > entry.open ? '#34d399' : '#f87171'} />
                         <stop offset="100%" stopColor={entry.close > entry.open ? '#34d399' : '#f87171'} />
                      </linearGradient>
                    </defs>
                  ))}
                </AreaChart>
              ) : (
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" hide />
                  <YAxis hide domain={['auto', 'auto']} />
                  <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '15px', fontSize: '10px' }} />
                  {chartType === 'Area' ? (
                    <Area type="monotone" dataKey="close" stroke="#22d3ee" strokeWidth={3} fill="url(#colorPrice)" />
                  ) : (
                    <Line type="monotone" dataKey="close" stroke="#22d3ee" strokeWidth={3} dot={false} />
                  )}
                  {showMA && <Line type="monotone" dataKey="close" stroke="#a855f7" strokeWidth={2} dot={false} strokeDasharray="5 5" opacity={0.5} />}
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-[3rem] p-10 backdrop-blur-3xl flex flex-col justify-between">
           <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-6">Market Social Pulse</h3>
           <div className="space-y-6">
              {['Banking', 'IT', 'Energy', 'Consumer'].map((s, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black uppercase">
                    <span className="text-gray-400">{s}</span>
                    <span className="text-cyan-400">{Math.floor(Math.random() * 40 + 60)}%</span>
                  </div>
                  <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${Math.random() * 40 + 60}%` }} className="h-full bg-cyan-400" />
                  </div>
                </div>
              ))}
           </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         {(data?.Stocks || []).slice(0, 8).map((s: any) => (
           <motion.div 
            key={s.ticker} 
            whileHover={{ y: -5 }}
            onClick={() => runDeepResearch(s.ticker)}
            className="bg-white/5 border border-white/10 p-6 rounded-[2rem] backdrop-blur-xl cursor-pointer hover:border-cyan-400/30 transition-all group"
           >
             <div className="flex justify-between items-start mb-4">
                <span className="text-lg font-black">{s.ticker}</span>
                <span className={cn("text-[10px] font-black", s.change >= 0 ? "text-emerald-400" : "text-rose-400")}>{s.change}%</span>
             </div>
             <p className="text-xl font-mono">₹{s.price}</p>
             <div className="mt-4 flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                <span className="text-[8px] font-black uppercase text-gray-500 tracking-tighter">AI Opportunity Detected</span>
             </div>
           </motion.div>
         ))}
      </div>
    </div>
  );

  const renderAIInsights = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full animate-in slide-in-from-bottom-8 duration-700">
      <div className="bg-white/5 border border-white/10 rounded-[3rem] p-10 space-y-8 backdrop-blur-3xl overflow-y-auto max-h-[80vh]">
        <div className="flex items-center justify-between">
           <div className="flex items-center space-x-3 text-cyan-400">
             <Brain size={28} />
             <h2 className="text-2xl font-black tracking-tight">Sovereign Research</h2>
           </div>
           {researchResult && (
             <div className="flex space-x-3">
               <button onClick={saveToVault} className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl hover:bg-emerald-500 hover:text-black transition-all"><Bookmark size={20} /></button>
               <button onClick={() => { navigator.clipboard.writeText(JSON.stringify(researchResult, null, 2)); setCopied(true); setTimeout(()=>setCopied(false), 2000); }} className="p-3 bg-white/5 text-gray-400 rounded-2xl hover:text-white transition-all">{copied ? <Check size={20} /> : <Download size={20} />}</button>
             </div>
           )}
        </div>
        
        {researchResult ? (
          <div className="space-y-10">
            <div className="bg-black/40 p-8 rounded-[2.5rem] border border-white/5 flex justify-between items-center">
               <div className="space-y-1">
                 <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Final Verdict</span>
                 <h3 className={cn("text-6xl font-black", researchResult.analysis.Verdict === 'BUY' ? "text-emerald-400" : "text-rose-400")}>{researchResult.analysis.Verdict}</h3>
               </div>
               <div className="text-right">
                 <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Conviction</span>
                 <p className="text-4xl font-black text-white">{researchResult.analysis.Score}%</p>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
               <div className="glass-panel p-6">
                 <p className="text-[10px] font-black text-gray-500 uppercase mb-2">Investment Strategy</p>
                 <p className="text-sm font-bold text-cyan-400">{researchResult.analysis.Strategy}</p>
               </div>
               <div className="glass-panel p-6">
                 <p className="text-[10px] font-black text-gray-500 uppercase mb-2">Target Price (12m)</p>
                 <p className="text-sm font-bold text-emerald-400">{researchResult.analysis.Target_Price}</p>
               </div>
            </div>

            <div className="space-y-4">
               <h4 className="text-xs font-black uppercase text-gray-500 tracking-widest">Executive Summary</h4>
               <p className="text-sm text-gray-300 leading-relaxed italic bg-white/5 p-6 rounded-3xl border border-white/5">"{researchResult.analysis.Summary}"</p>
            </div>

            <div className="space-y-4">
               <h4 className="text-xs font-black uppercase text-gray-500 tracking-widest">Strategic Rationale</h4>
               <p className="text-sm text-gray-400 leading-relaxed bg-black/20 p-6 rounded-3xl border border-white/5">{researchResult.analysis.Investment_Rationale}</p>
            </div>
            
            <div className="space-y-4">
               <h4 className="text-xs font-black uppercase text-gray-500 tracking-widest">Asset Allocation & Size</h4>
               <p className="text-sm text-gray-400 leading-relaxed bg-black/20 p-6 rounded-3xl border border-white/5">{researchResult.analysis.Asset_Allocation}</p>
            </div>
          </div>
        ) : (
          <div className="py-32 text-center text-gray-600 flex flex-col items-center">
            <Search size={64} className="mb-4 opacity-10" />
            <p className="text-sm font-bold uppercase tracking-widest">Waiting for Research Command</p>
          </div>
        )}
      </div>

      <div className="bg-white/5 border border-white/10 rounded-[3rem] flex flex-col overflow-hidden backdrop-blur-3xl h-full">
         <div className="p-8 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center space-x-3">
               <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
               <h3 className="font-bold">Sovereign Advisor</h3>
            </div>
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Memory Active</span>
         </div>
         <div className="flex-1 overflow-y-auto p-8 space-y-4 min-h-[400px]">
            {chatHistory.map((m, i) => (
              <div key={i} className={cn("flex", m.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div className={cn("max-w-[85%] p-4 rounded-3xl text-xs leading-relaxed", m.role === 'user' ? 'bg-cyan-400 text-black font-bold' : 'bg-white/5 text-gray-300 border border-white/5')}>
                   {m.content}
                </div>
              </div>
            ))}
         </div>
         <div className="p-6 bg-black/40 border-t border-white/5 flex space-x-3">
            <input 
              type="text" 
              placeholder="Query the kernel..." 
              value={chatMessage}
              onChange={(e)=>setChatMessage(e.target.value)}
              onKeyDown={(e)=>e.key === 'Enter' && sendChat()}
              className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm outline-none focus:border-cyan-400/50 transition-all"
            />
            <button onClick={sendChat} className="bg-cyan-400 text-black p-4 rounded-2xl hover:scale-105 transition-all"><Zap size={20} /></button>
         </div>
      </div>
    </div>
  );

  const renderAlerts = () => (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
         <h2 className="text-2xl font-black">Sentinel History</h2>
         <div className="relative">
           <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
           <input 
            type="text" 
            placeholder="Search alerts..." 
            value={alertFilter}
            onChange={(e)=>setAlertFilter(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-2xl pl-10 pr-6 py-3 text-xs outline-none focus:border-cyan-400/50"
           />
         </div>
      </div>
      <div className="grid grid-cols-1 gap-4">
        {alerts.filter(a => (a.asset + a.message).toLowerCase().includes(alertFilter.toLowerCase())).map((a, i) => (
          <div key={i} className={cn("p-6 rounded-[2rem] border backdrop-blur-xl flex items-center justify-between", a.asset === 'TITAN' ? "bg-amber-400/5 border-amber-400/20" : "bg-white/5 border-white/10")}>
            <div className="flex items-center space-x-6">
               <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", a.asset === 'TITAN' ? "bg-amber-400/10 text-amber-400" : "bg-cyan-400/10 text-cyan-400")}>
                  {a.asset === 'TITAN' ? <Shield size={24} /> : <Globe size={24} />}
               </div>
               <div>
                  <p className="font-black text-sm uppercase tracking-tight">{a.asset}: {a.event}</p>
                  <p className="text-xs text-gray-400 mt-1">{a.message}</p>
               </div>
            </div>
            <span className="text-[10px] font-black text-gray-500 uppercase">{new Date(a.time).toLocaleTimeString()}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSaved = () => (
    <div className="space-y-8 animate-in fade-in duration-700">
       <h2 className="text-2xl font-black">Sovereign Vault: Saved Picks</h2>
       <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {savedOpportunities.map((s, i) => (
            <div key={i} className="bg-white/5 border border-white/10 p-10 rounded-[3rem] backdrop-blur-3xl group relative overflow-hidden">
               <div className="absolute top-0 right-0 p-6 text-[8px] font-black text-gray-700 uppercase tracking-widest">{new Date(s.time).toLocaleDateString()}</div>
               <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center font-black text-xl mb-8 group-hover:bg-cyan-400 group-hover:text-black transition-all">{s.ticker[0]}</div>
               <h3 className="text-3xl font-black mb-2">{s.ticker}</h3>
               <div className={cn("text-xs font-black uppercase", s.verdict === 'BUY' ? "text-emerald-400" : "text-rose-400")}>{s.verdict} • {s.score}% Conviction</div>
               <button onClick={()=>runDeepResearch(s.ticker)} className="w-full mt-10 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">Re-Analyze Live</button>
            </div>
          ))}
       </div>
    </div>
  );

  const renderHistory = () => (
    <div className="space-y-8 animate-in fade-in duration-700">
       <h2 className="text-2xl font-black">Strategic Research History</h2>
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {researchHistory.map((h, i) => (
            <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-3xl flex justify-between items-center hover:border-cyan-400/30 cursor-pointer transition-all" onClick={()=>{ setSelectedTicker(h.ticker); setResearchResult(h); setActiveTab('AI Insights'); }}>
               <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center font-black text-xs">{h.ticker[0]}</div>
                  <div>
                    <p className="font-black text-sm">{h.ticker}</p>
                    <p className="text-[10px] text-gray-500 uppercase">{new Date(h.time).toLocaleString()}</p>
                  </div>
               </div>
               <div className="text-right">
                  <p className="text-sm font-black text-cyan-400">{h.score}%</p>
                  <p className="text-[8px] text-gray-500 uppercase font-black">Score</p>
               </div>
            </div>
          ))}
       </div>
    </div>
  );

  const renderMemory = () => (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="bg-white/5 border border-white/10 rounded-[3rem] p-12 backdrop-blur-3xl">
        <div className="flex items-center justify-between mb-12">
           <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-cyan-400/10 rounded-3xl flex items-center justify-center text-cyan-400"><Brain size={32} /></div>
              <div>
                 <h2 className="text-2xl font-black tracking-tight">Semantic Kernel Memory</h2>
                 <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Learned User Context</p>
              </div>
           </div>
           <button onClick={purgeMemory} className="px-8 py-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 font-black text-[10px] uppercase rounded-2xl hover:bg-rose-500 hover:text-black transition-all">Purge All Memory</button>
        </div>
        <div className="space-y-4">
           {memoryStats.map((m, i) => (
             <div key={i} className="p-6 bg-black/40 border border-white/5 rounded-[2rem] group hover:border-cyan-400/20 transition-all">
                <p className="text-sm text-gray-300 italic leading-relaxed">"{m.summary}"</p>
                <p className="text-[10px] text-gray-600 font-black uppercase mt-4">{new Date(m.time).toLocaleString()}</p>
             </div>
           ))}
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="max-w-2xl mx-auto space-y-12 py-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
       <div className="space-y-4">
          <h2 className="text-3xl font-black tracking-tighter">Sovereign Settings</h2>
          <p className="text-sm text-gray-500">Configure your LLM providers and secure your intelligence vault.</p>
       </div>
       
       <div className="space-y-10">
          <div className="space-y-6">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Active Intelligence Provider</label>
            <div className="grid grid-cols-1 gap-4">
              {[
                { id: 'nvidia', name: 'NVIDIA NIM', model: 'meta/llama-3.1-70b-instruct' },
                { id: 'openai', name: 'OpenAI', model: 'gpt-4o' },
                { id: 'anthropic', name: 'Anthropic', model: 'claude-3-5-sonnet' },
                { id: 'groq', name: 'Groq Cloud', model: 'llama-3.1-70b-versatile' }
              ].map((p) => (
                <div key={p.id} className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] space-y-6 hover:border-white/20 transition-all">
                   <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-3">
                         <div className={cn("w-2 h-2 rounded-full", sysSettings.llm_provider === p.id ? "bg-emerald-400 animate-pulse" : "bg-gray-700")}></div>
                         <h3 className="font-bold">{p.name}</h3>
                      </div>
                      <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{p.model}</span>
                   </div>
                   
                   <div className="flex space-x-3">
                      <input 
                        type="password" 
                        placeholder={`Enter ${p.name} API Key...`}
                        value={sysSettings[`${p.id}_api_key`] && sysSettings[`${p.id}_api_key`].startsWith('gAAAA') ? '••••••••••••••••' : sysSettings[`${p.id}_api_key`] || ''}
                        onChange={(e) => setSysSettings({...sysSettings, [`${p.id}_api_key`]: e.target.value})}
                        className="flex-1 bg-black/40 border border-white/10 rounded-2xl px-6 py-3 text-xs outline-none focus:border-cyan-400/50 transition-all"
                      />
                      <button 
                        onClick={() => verifyKey(p.id, p.model, sysSettings[`${p.id}_api_key`])}
                        disabled={isVerifying}
                        className="px-6 py-3 bg-cyan-400 text-black text-[10px] font-black uppercase rounded-2xl hover:scale-105 transition-all disabled:opacity-50"
                      >
                        {isVerifying && sysSettings.llm_provider === p.id ? 'Testing...' : 'Verify & Set'}
                      </button>
                   </div>
                   
                   {verifyStatus && sysSettings.llm_provider === p.id && (
                     <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={cn("text-[10px] font-bold p-3 rounded-xl", verifyStatus.status === 'success' ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400")}>
                        {verifyStatus.status === 'success' ? <Check size={12} className="inline mr-2" /> : <AlertTriangle size={12} className="inline mr-2" />}
                        {verifyStatus.message}
                     </motion.div>
                   )}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
             <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Intelligence Pulse</label>
             <div className="p-8 bg-white/5 border border-white/10 rounded-[2rem] flex items-center justify-between">
                <div>
                   <h3 className="font-bold">Global Notifications</h3>
                   <p className="text-xs text-gray-500 mt-1">Receive desktop alerts for Big Bull movements and volatility spikes.</p>
                </div>
                <button 
                  onClick={() => setSysSettings({...sysSettings, notifications_enabled: !sysSettings.notifications_enabled})}
                  className={cn("w-16 h-8 rounded-full transition-all relative", sysSettings.notifications_enabled ? "bg-cyan-400" : "bg-gray-700")}
                >
                  <div className={cn("absolute top-1 w-6 h-6 bg-white rounded-full transition-all", sysSettings.notifications_enabled ? "left-9" : "left-1")}></div>
                </button>
             </div>
          </div>
       </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-cyan-400 selection:text-black">
      {/* ── Top Navigation ────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/60 backdrop-blur-xl border-b border-white/5 px-10 py-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-cyan-400 rounded-2xl flex items-center justify-center text-black shadow-[0_0_30px_rgba(34,211,238,0.4)]">
            <Zap size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter">FININTEL <span className="text-cyan-400">PRO</span></h1>
            <p className="text-[8px] font-black text-gray-500 uppercase tracking-[0.3em] leading-none mt-1">Sovereign Intelligence Engine</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 bg-white/5 p-1.5 rounded-full border border-white/10">
          {['Overview', 'AI Insights', 'Alerts', 'Saved', 'History', 'Memory', 'Settings'].map(tab => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab as any)}
              className={cn(
                "px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                activeTab === tab ? "bg-cyan-400 text-black" : "text-gray-500 hover:text-white"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
                <div className="flex space-x-3">
                   <div className="text-right">
                      <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Active Mesh Node</p>
                      <p className="text-xs font-black text-cyan-400 uppercase">{researchResult?.provider || sysSettings.llm_provider}</p>
                   </div>
                   <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-gray-400"><Menu size={20} /></div>
                </div>
      </nav>

      {/* ── Main Content Area ─────────────────────────────────────── */}
      <main className="pt-32 px-10 pb-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
          >
            {activeTab === 'Overview' && renderOverview()}
            {activeTab === 'AI Insights' && renderAIInsights()}
            {activeTab === 'Alerts' && renderAlerts()}
            {activeTab === 'Saved' && renderSaved()}
            {activeTab === 'History' && renderHistory()}
            {activeTab === 'Memory' && renderMemory()}
            {activeTab === 'Settings' && renderSettings()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ── Global Ticker ─────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-md border-t border-white/5 px-10 py-3 overflow-hidden">
        <div className="flex items-center animate-ticker whitespace-nowrap space-x-12">
          {(data?.Stocks || []).map((s: any) => (
            <div key={s.ticker} className="flex items-center space-x-3">
              <span className="text-[10px] font-black text-gray-500 uppercase">{s.ticker}</span>
              <span className="text-xs font-bold text-white">₹{s.price}</span>
              <span className={cn("text-[10px] font-black", s.change >= 0 ? "text-emerald-400" : "text-rose-400")}>
                {s.change >= 0 ? '▲' : '▼'} {Math.abs(s.change)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
