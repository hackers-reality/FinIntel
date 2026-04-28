import React, { useState, useEffect, useRef } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  Line, ComposedChart, Bar, Cell 
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Shield, Zap, Search, Bell, 
  Settings as SettingsIcon, History, Cpu, ArrowUpRight, 
  Check, AlertTriangle, Menu, Send, Copy, Bookmark, BarChart3
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const cn = (...classes: string[]) => classes.filter(Boolean).join(' ');

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedTicker, setSelectedTicker] = useState('^NSEI');
  const [data, setData] = useState<any>(null);
  const [isResearching, setIsResearching] = useState(false);
  const [researchResult, setResearchResult] = useState<any>(null);
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [chatMessage, setChatMessage] = useState('');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [chartType, setChartType] = useState<'Area' | 'Line' | 'Candle'>('Area');
  const [showMA, setShowMA] = useState(true);
  const [showRSI, setShowRSI] = useState(false);
  const [sysSettings, setSysSettings] = useState<any>({ risk_profile: 'Moderate', notifications_enabled: true });
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<any>(null);

  // ── Sync Engine ──────────────────────────────────────────────────
  useEffect(() => {
    const fetchGlobalData = async () => {
      try {
        const [oRes, nRes, hRes, sRes] = await Promise.all([
          fetch('http://localhost:8008/market/overview'),
          fetch('http://localhost:8008/market/notifications'),
          fetch('http://localhost:8008/chat/history'),
          fetch('http://localhost:8008/settings')
        ]);
        setData(await oRes.json());
        setNotifications(await nRes.json());
        setChatHistory(await hRes.json());
        setSysSettings(await sRes.json());
      } catch (e) { console.error("Global sync failed"); }
    };
    fetchGlobalData();
    const interval = setInterval(fetchGlobalData, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchChart = async () => {
      try {
        const res = await fetch(`http://localhost:8008/market/chart/${selectedTicker}`);
        setChartData(await res.json());
      } catch (e) { console.error("Chart sync failed"); }
    };
    fetchChart();
  }, [selectedTicker]);

  // ── Logic ────────────────────────────────────────────────────────
  const runResearch = async () => {
    setIsResearching(true);
    try {
      const res = await fetch(`http://localhost:8008/market/research/${selectedTicker}`);
      setResearchResult(await res.json());
    } catch (e) { console.error("Research failed"); }
    finally { setIsResearching(false); }
  };

  const sendChat = async () => {
    if (!chatMessage.trim()) return;
    const userMsg = { role: 'user', content: chatMessage, time: new Date().toISOString() };
    setChatHistory([...chatHistory, userMsg]);
    setChatMessage('');
    try {
      const res = await fetch('http://localhost:8008/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: chatMessage })
      });
      const result = await res.json();
      setChatHistory(prev => [...prev, { role: 'assistant', content: result.response, time: new Date().toISOString() }]);
    } catch (e) { console.error("Chat failed"); }
  };

  const verifyKey = async (provider: string, model: string, key: string) => {
    setIsVerifying(true);
    setVerifyStatus(null);
    try {
      const res = await fetch('http://localhost:8008/settings/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, model, key })
      });
      setVerifyStatus(await res.json());
    } catch (e) { setVerifyStatus({ status: 'error', message: 'Handshake failed.' }); }
    finally { setIsVerifying(false); }
  };

  // ── Render Parts ──────────────────────────────────────────────────
  const renderOverview = () => (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 p-10 bg-white/5 border border-white/10 rounded-[3rem] backdrop-blur-3xl shadow-2xl space-y-8">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-4xl font-black tracking-tighter">{selectedTicker}</h2>
              <p className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mt-1">Sovereign Intelligence Feed</p>
            </div>
            <div className="flex space-x-2">
              {['Area', 'Line', 'Candle'].map((t) => (
                <button key={t} onClick={() => setChartType(t as any)} className={cn("px-4 py-1.5 rounded-full text-[10px] font-black uppercase transition-all", chartType === t ? "bg-cyan-400 text-black" : "bg-white/5 text-gray-500")}>{t}</button>
              ))}
              <div className="w-px h-6 bg-white/10 mx-2"></div>
              <button onClick={() => setShowMA(!showMA)} className={cn("px-4 py-1.5 rounded-full text-[10px] font-black uppercase transition-all", showMA ? "bg-purple-500 text-white" : "bg-white/5 text-gray-500")}>MA</button>
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'Candle' ? (
                <ComposedChart data={chartData}>
                  <XAxis dataKey="time" hide />
                  <YAxis hide domain={['auto', 'auto']} />
                  <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '15px', fontSize: '10px' }} />
                  {/* Real Candle Sticks */}
                  {chartData.map((entry, index) => (
                    <Line key={`wick-${index}`} dataKey="high" stroke={entry.close > entry.open ? '#34d399' : '#f87171'} strokeWidth={1} dot={false} />
                  ))}
                  <Bar dataKey="close" barSize={8}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.close > entry.open ? '#34d399' : '#f87171'} />
                    ))}
                  </Bar>
                </ComposedChart>
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

        <div className="p-10 bg-white/5 border border-white/10 rounded-[3rem] space-y-8">
          <h3 className="text-xl font-black tracking-tight">Sector Sentiment</h3>
          <div className="space-y-6">
            {data?.categories?.map((cat: any) => (
              <div key={cat.name} className="space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-400">
                  <span>{cat.name}</span>
                  <span>{cat.sentiment}%</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${cat.sentiment}%` }} className={cn("h-full", cat.sentiment > 60 ? "bg-emerald-400" : cat.sentiment > 40 ? "bg-yellow-400" : "bg-rose-400")} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {data?.Stocks?.map((stock: any) => (
          <button key={stock.symbol} onClick={() => setSelectedTicker(stock.symbol)} className={cn("p-6 rounded-[2rem] border transition-all text-left space-y-3", selectedTicker === stock.symbol ? "bg-cyan-400 border-cyan-400 text-black shadow-lg shadow-cyan-400/20" : "bg-white/5 border-white/10 text-white hover:border-white/20")}>
            <div className="flex justify-between items-center">
              <span className="font-black tracking-tight text-lg">{stock.symbol}</span>
              {stock.change > 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            </div>
            <div className="flex justify-between items-end">
              <span className="text-xl font-bold">₹{stock.price}</span>
              <span className={cn("text-[10px] font-black", stock.change > 0 ? "text-emerald-400" : "text-rose-400")}>{stock.change > 0 ? '+' : ''}{stock.change}%</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderResearch = () => (
    <div className="max-w-4xl mx-auto space-y-12 py-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
       <div className="text-center space-y-4">
          <h2 className="text-5xl font-black tracking-tighter">Strategic Analysis: {selectedTicker}</h2>
          <button onClick={runResearch} disabled={isResearching} className="px-10 py-4 bg-cyan-400 text-black font-black uppercase rounded-full hover:scale-105 transition-all shadow-xl shadow-cyan-400/20 disabled:opacity-50">
            {isResearching ? "Scoping Elite Sources..." : "Initiate Mega Research"}
          </button>
       </div>

       {researchResult && (
         <div className="p-12 bg-white/5 border border-white/10 rounded-[4rem] space-y-10">
            <div className="flex justify-between items-center">
               <div className="flex space-x-3 items-center">
                  <div className={cn("px-4 py-1 rounded-full text-[10px] font-black uppercase", researchResult.Score > 70 ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400")}>{researchResult.Verdict}</div>
                  <span className="text-2xl font-black">{researchResult.Score}% CONVICTION</span>
               </div>
               <span className="text-xs text-gray-500 uppercase tracking-widest font-bold">Mesh Node: {researchResult.provider}</span>
            </div>
            <p className="text-2xl text-gray-300 leading-relaxed font-medium">{researchResult.Summary}</p>
            <div className="grid grid-cols-2 gap-8 pt-10 border-t border-white/10">
               <div>
                  <h4 className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-4">Investment Rationale</h4>
                  <p className="text-sm text-gray-400">{researchResult.Investment_Rationale}</p>
               </div>
               <div>
                  <h4 className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-4">Risk Profile</h4>
                  <p className="text-sm text-gray-400">{researchResult.Risk_Factors}</p>
               </div>
            </div>
         </div>
       )}
    </div>
  );

  const renderSettings = () => (
    <div className="max-w-2xl mx-auto space-y-12 py-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
       <div className="space-y-4 text-center">
          <h2 className="text-4xl font-black tracking-tighter">Mesh Configuration</h2>
          <p className="text-sm text-gray-500">Orchestrate your sovereign intelligence mesh.</p>
       </div>
       
       <div className="space-y-6">
          {[
            { id: 'nvidia', name: 'NVIDIA NIM', model: 'meta/llama-3.1-70b-instruct' },
            { id: 'openai', name: 'OpenAI', model: 'gpt-4o' },
            { id: 'groq', name: 'Groq Cloud', model: 'llama-3.1-70b-versatile' }
          ].map((p) => (
            <div key={p.id} className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] space-y-6">
               <div className="flex justify-between items-center">
                  <h3 className="font-bold">{p.name}</h3>
                  <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">{p.model}</span>
               </div>
               <div className="flex space-x-3">
                  <input type="password" placeholder="API Key..." className="flex-1 bg-black/40 border border-white/10 rounded-2xl px-6 py-3 text-xs outline-none focus:border-cyan-400/50" />
                  <button onClick={() => verifyKey(p.id, p.model, "")} className="px-6 py-3 bg-cyan-400 text-black text-[10px] font-black uppercase rounded-2xl">Verify</button>
               </div>
               {verifyStatus && sysSettings.llm_provider === p.id && (
                  <div className={cn("text-[10px] font-bold p-3 rounded-xl", verifyStatus.status === 'success' ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400")}>{verifyStatus.message}</div>
               )}
            </div>
          ))}

          <div className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] flex items-center justify-between">
             <div>
                <h3 className="font-bold">Global Notifications</h3>
                <p className="text-xs text-gray-500">Live desktop alerts for volatility and titan triggers.</p>
             </div>
             <button onClick={() => setSysSettings({...sysSettings, notifications_enabled: !sysSettings.notifications_enabled})} className={cn("w-14 h-7 rounded-full relative transition-all", sysSettings.notifications_enabled ? "bg-cyan-400" : "bg-gray-700")}>
                <div className={cn("absolute top-1 w-5 h-5 bg-white rounded-full transition-all", sysSettings.notifications_enabled ? "left-8" : "left-1")} />
             </button>
          </div>
       </div>
    </div>
  );

  const renderChat = () => (
    <div className="max-w-4xl mx-auto h-[70vh] flex flex-col p-10 bg-white/5 border border-white/10 rounded-[3rem] animate-in fade-in duration-700">
       <div className="flex-1 overflow-y-auto space-y-6 mb-8 pr-4 custom-scrollbar">
          {chatHistory.map((msg, i) => (
            <div key={i} className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}>
               <div className={cn("max-w-[70%] p-6 rounded-[2rem]", msg.role === 'user' ? "bg-cyan-400 text-black" : "bg-white/10 text-white")}>
                  <p className="text-sm font-medium leading-relaxed">{msg.content}</p>
               </div>
            </div>
          ))}
       </div>
       <div className="flex space-x-3">
          <input value={chatMessage} onChange={(e) => setChatMessage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendChat()} placeholder="Ask the Sovereign Advisor..." className="flex-1 bg-black/40 border border-white/10 rounded-2xl px-8 py-4 text-sm outline-none focus:border-cyan-400/50 transition-all" />
          <button onClick={sendChat} className="p-4 bg-cyan-400 text-black rounded-2xl hover:scale-105 transition-all"><Send size={20} /></button>
       </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-cyan-400 selection:text-black">
      <nav className="fixed top-0 left-0 right-0 h-24 bg-black/40 backdrop-blur-2xl border-b border-white/5 z-50 flex items-center justify-between px-12">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-cyan-400 rounded-2xl flex items-center justify-center text-black shadow-lg shadow-cyan-400/20"><Shield size={24} /></div>
          <h1 className="text-xl font-black tracking-tighter uppercase italic">FinIntel Pro</h1>
        </div>
        <div className="flex space-x-2 bg-white/5 p-1.5 rounded-2xl border border-white/10">
          {[
            { id: 'overview', icon: <BarChart3 size={16} />, label: 'Market' },
            { id: 'research', icon: <Search size={16} />, label: 'Deep Dive' },
            { id: 'chat', icon: <History size={16} />, label: 'Advisor' },
            { id: 'settings', icon: <SettingsIcon size={16} />, label: 'Mesh' }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={cn("flex items-center space-x-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all", activeTab === tab.id ? "bg-white/10 text-white border border-white/10 shadow-lg" : "text-gray-500 hover:text-white")}>
              {tab.icon} <span>{tab.label}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
             <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Active Mesh Node</p>
             <p className="text-xs font-black text-cyan-400 uppercase">{sysSettings.llm_provider}</p>
          </div>
          <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-gray-400"><Cpu size={20} /></div>
        </div>
      </nav>

      <main className="pt-32 pb-12 px-12">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'research' && renderResearch()}
        {activeTab === 'chat' && renderChat()}
        {activeTab === 'settings' && renderSettings()}
      </main>

      <div className="fixed bottom-0 left-0 right-0 h-12 bg-black border-t border-white/5 flex items-center px-12 overflow-hidden">
        <div className="flex whitespace-nowrap animate-ticker space-x-12">
          {data?.Stocks?.map((s: any) => (
            <div key={s.symbol} className="flex items-center space-x-4">
              <span className="text-[10px] font-black uppercase tracking-widest">{s.symbol}</span>
              <span className="text-sm font-bold">₹{s.price}</span>
              <span className={cn("text-[10px] font-black", s.change > 0 ? "text-emerald-400" : "text-rose-400")}>{s.change}%</span>
            </div>
          ))}
          {/* Duplicating for infinite effect */}
          {data?.Stocks?.map((s: any) => (
            <div key={`dup-${s.symbol}`} className="flex items-center space-x-4">
              <span className="text-[10px] font-black uppercase tracking-widest">{s.symbol}</span>
              <span className="text-sm font-bold">₹{s.price}</span>
              <span className={cn("text-[10px] font-black", s.change > 0 ? "text-emerald-400" : "text-rose-400")}>{s.change}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
