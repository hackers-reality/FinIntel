import React, { useState, useEffect } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  Line, ComposedChart, Bar, Cell 
} from 'recharts';
import { 
  Shield, Search, History, Cpu, 
  Check, AlertTriangle, Send, BarChart3, TrendingUp, TrendingDown, Settings as SettingsIcon
} from 'lucide-react';
import { motion } from 'framer-motion';

const cn = (...classes: string[]) => classes.filter(Boolean).join(' ');

// ── RSI Logic ───────────────────────────────────────────────────────
const calculateRSI = (data: any[], period = 14) => {
  if (data.length < period) return data;
  let res = [...data];
  for (let i = period; i < data.length; i++) {
    let gains = 0, losses = 0;
    for (let j = i - period + 1; j <= i; j++) {
      const diff = data[j].close - data[j - 1].close;
      if (diff >= 0) gains += diff;
      else losses -= diff;
    }
    const rs = (gains / period) / (losses / period);
    res[i].rsi = 100 - (100 / (1 + rs));
  }
  return res;
};

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
  const [verifyStatus, setVerifyStatus] = useState<any>(null);

  // ── Global Sync ──────────────────────────────────────────────────
  useEffect(() => {
    const fetchGlobal = async () => {
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
      } catch {}
    };
    fetchGlobal();
    const inv = setInterval(fetchGlobal, 30000);
    return () => clearInterval(inv);
  }, []);

  // ── Ticker Specific Sync ─────────────────────────────────────────
  useEffect(() => {
    const fetchChart = async () => {
      try {
        const res = await fetch(`http://localhost:8008/market/chart/${selectedTicker}`);
        const raw = await res.json();
        setChartData(calculateRSI(raw));
      } catch {}
    };
    fetchChart();
  }, [selectedTicker]);

  // ── Logic ────────────────────────────────────────────────────────
  const sendChat = async () => {
    if (!chatMessage.trim()) return;
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
    } catch {}
  };

  const renderOverview = () => (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 p-10 bg-white/5 border border-white/10 rounded-[3rem] space-y-8">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-4xl font-black tracking-tighter">{selectedTicker}</h2>
              <p className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mt-1">Sovereign Pulse</p>
            </div>
            <div className="flex space-x-2">
              {['Area', 'Line', 'Candle'].map((t) => (
                <button key={t} onClick={() => setChartType(t as any)} className={cn("px-4 py-1.5 rounded-full text-[10px] font-black uppercase", chartType === t ? "bg-cyan-400 text-black" : "bg-white/5 text-gray-500")}>{t}</button>
              ))}
              <div className="w-px h-6 bg-white/10 mx-2" />
              <button onClick={() => setShowMA(!showMA)} className={cn("px-4 py-1.5 rounded-full text-[10px] font-black uppercase", showMA ? "bg-purple-500 text-white" : "bg-white/5 text-gray-500")}>MA</button>
              <button onClick={() => setShowRSI(!showRSI)} className={cn("px-4 py-1.5 rounded-full text-[10px] font-black uppercase", showRSI ? "bg-emerald-500 text-white" : "bg-white/5 text-gray-500")}>RSI</button>
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'Candle' ? (
                <ComposedChart data={chartData}>
                  <XAxis dataKey="time" hide />
                  <YAxis hide domain={['auto', 'auto']} />
                  <Tooltip contentStyle={{ backgroundColor: '#000', border: 'none', borderRadius: '15px' }} />
                  <Bar dataKey="close" barSize={8}>
                    {chartData.map((e, i) => <Cell key={i} fill={e.close > e.open ? '#34d399' : '#f87171'} />)}
                  </Bar>
                  {showRSI && <Line type="monotone" dataKey="rsi" stroke="#10b981" dot={false} strokeWidth={1} opacity={0.8} />}
                </ComposedChart>
              ) : (
                <AreaChart data={chartData}>
                  <XAxis dataKey="time" hide />
                  <YAxis hide domain={['auto', 'auto']} />
                  <Tooltip contentStyle={{ backgroundColor: '#000', border: 'none' }} />
                  {chartType === 'Area' ? (
                    <Area type="monotone" dataKey="close" stroke="#22d3ee" strokeWidth={3} fillOpacity={0.1} fill="#22d3ee" />
                  ) : (
                    <Line type="monotone" dataKey="close" stroke="#22d3ee" strokeWidth={3} dot={false} />
                  )}
                  {showMA && <Line type="monotone" dataKey="close" stroke="#a855f7" strokeWidth={2} dot={false} strokeDasharray="5 5" opacity={0.5} />}
                  {showRSI && <Line type="monotone" dataKey="rsi" stroke="#10b981" dot={false} strokeWidth={2} opacity={0.8} />}
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
        <div className="p-10 bg-white/5 border border-white/10 rounded-[3rem] space-y-6">
           <h3 className="font-black uppercase tracking-widest text-[10px] text-gray-500">Sector Analysis</h3>
           {data?.categories?.map((c: any) => (
             <div key={c.name} className="space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase"><span>{c.name}</span><span>{c.sentiment}%</span></div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${c.sentiment}%` }} className="h-full bg-cyan-400" /></div>
             </div>
           ))}
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {data?.Stocks?.map((s: any) => (
          <button key={s.symbol} onClick={() => setSelectedTicker(s.symbol)} className={cn("p-6 rounded-[2rem] border transition-all text-left", selectedTicker === s.symbol ? "bg-cyan-400 border-cyan-400 text-black" : "bg-white/5 border-white/10 hover:border-white/20")}>
             <div className="font-black tracking-tighter text-lg">{s.symbol}</div>
             <div className="flex justify-between items-end mt-2">
                <span className="font-bold text-xl">₹{s.price}</span>
                <span className={cn("text-[10px] font-black", s.change > 0 ? "text-emerald-400" : "text-rose-400")}>{s.change > 0 ? '+' : ''}{s.change.toFixed(2)}%</span>
             </div>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-cyan-400 selection:text-black">
      <nav className="fixed top-0 inset-x-0 h-24 bg-black/40 backdrop-blur-2xl border-b border-white/5 z-50 flex items-center justify-between px-12">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-cyan-400 rounded-2xl flex items-center justify-center text-black shadow-lg shadow-cyan-400/20"><Shield size={24} /></div>
          <h1 className="text-xl font-black tracking-tighter uppercase italic">FinIntel Pro</h1>
        </div>
        <div className="flex space-x-2 bg-white/5 p-1.5 rounded-2xl border border-white/10">
          {['overview', 'research', 'chat', 'settings'].map(t => (
            <button key={t} onClick={() => setActiveTab(t)} className={cn("px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all", activeTab === t ? "bg-white/10 text-white shadow-lg" : "text-gray-500 hover:text-white")}>{t}</button>
          ))}
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
             <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Mesh Node</p>
             <p className="text-xs font-black text-cyan-400 uppercase">{sysSettings.llm_provider}</p>
          </div>
          <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-gray-400"><Cpu size={20} /></div>
        </div>
      </nav>

      <main className="pt-32 pb-12 px-12">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'chat' && (
          <div className="max-w-4xl mx-auto h-[70vh] flex flex-col p-10 bg-white/5 border border-white/10 rounded-[3rem]">
             <div className="flex-1 overflow-y-auto space-y-6 mb-8 pr-4">
                {chatHistory.map((m, i) => (
                  <div key={i} className={cn("flex", m.role === 'user' ? "justify-end" : "justify-start")}>
                     <div className={cn("max-w-[70%] p-6 rounded-[2rem]", m.role === 'user' ? "bg-cyan-400 text-black" : "bg-white/10 text-white")}>{m.content}</div>
                  </div>
                ))}
             </div>
             <div className="flex space-x-3">
                <input value={chatMessage} onChange={e => setChatMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendChat()} placeholder="Ask the mesh..." className="flex-1 bg-black/40 border border-white/10 rounded-2xl px-8 py-4 text-sm outline-none" />
                <button onClick={sendChat} className="p-4 bg-cyan-400 text-black rounded-2xl"><Send size={20} /></button>
             </div>
          </div>
        )}
        {activeTab === 'settings' && (
           <div className="max-w-2xl mx-auto space-y-12 py-10">
              <div className="space-y-4 text-center">
                 <h2 className="text-4xl font-black tracking-tighter">Mesh Settings</h2>
                 <p className="text-sm text-gray-500">Configure sovereign thresholds.</p>
              </div>
              <div className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] flex items-center justify-between">
                 <div><h3 className="font-bold">Notifications</h3><p className="text-xs text-gray-500">Enable titan movement alerts.</p></div>
                 <button onClick={() => setSysSettings({...sysSettings, notifications_enabled: !sysSettings.notifications_enabled})} className={cn("w-14 h-7 rounded-full relative transition-all", sysSettings.notifications_enabled ? "bg-cyan-400" : "bg-gray-700")}>
                    <div className={cn("absolute top-1 w-5 h-5 bg-white rounded-full transition-all", sysSettings.notifications_enabled ? "left-8" : "left-1")} />
                 </button>
              </div>
           </div>
        )}
      </main>

      <div className="fixed bottom-0 inset-x-0 h-12 bg-black border-t border-white/5 flex items-center px-12 overflow-hidden">
        <div className="flex whitespace-nowrap animate-ticker space-x-12">
          {data?.Stocks?.concat(data?.Stocks).map((s: any, i: number) => (
            <div key={i} className="flex items-center space-x-4 text-[10px] font-black uppercase">
              <span className="text-gray-500">{s.symbol}</span>
              <span className="text-white">₹{s.price}</span>
              <span className={s.change > 0 ? "text-emerald-400" : "text-rose-400"}>{s.change.toFixed(2)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
