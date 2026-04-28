import React from 'react';
import { Activity, BarChart3, Bell, LayoutDashboard, PieChart, Settings, TrendingUp, TrendingDown, Zap, Search, Shield, ChevronRight, Menu, X, Copy, Check, HelpCircle, Mic, Download } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RePieChart, Pie, Cell } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const mockChartData = [
  { name: '09:00', price: 24500 },
  { name: '10:00', price: 24650 },
  { name: '11:00', price: 24600 },
  { name: '12:00', price: 24800 },
  { name: '13:00', price: 24700 },
  { name: '14:00', price: 24950 },
  { name: '15:00', price: 25100 },
];

const DEFAULT_SETTINGS = {
  risk_profile: 'Moderate',
  llm_provider: 'openai',
  llm_model: 'gpt-4o'
};

const Dashboard: React.FC = () => {
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [apiKey, setApiKey] = React.useState('');
  const [savingKey, setSavingKey] = React.useState(false);
  const [chartData, setChartData] = React.useState<any[]>(mockChartData);
  const [selectedTicker, setSelectedTicker] = React.useState('^NSEI');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [activeTab, setActiveTab] = React.useState('Overview');
  const [timeRange, setTimeRange] = React.useState('1D');
  const [llmProvider, setLlmProvider] = React.useState('openai');
  const [llmModel, setLlmModel] = React.useState('gpt-4o');
  const [notifications, setNotifications] = React.useState<any[]>([]);
  const [showMA, setShowMA] = React.useState(false);
  const [showRSI, setShowRSI] = React.useState(false);
  const [chatMessage, setChatMessage] = React.useState('');
  const [chatHistory, setChatHistory] = React.useState<{role: string, content: string}[]>([]);
  const [isResearching, setIsResearching] = React.useState(false);
  const [researchResult, setResearchResult] = React.useState<any>(null);
  const [alertThreshold, setAlertThreshold] = React.useState(1.5);
  const [compareT1, setCompareT1] = React.useState('RELIANCE');
  const [compareT2, setCompareT2] = React.useState('TCS');
  const [compareData, setCompareData] = React.useState<any>(null);
  const [copied, setCopied] = React.useState(false);
  const [marketPulse, setMarketPulse] = React.useState<any>({ score: 85, verdict: 'Bullish' });
  const [sectorData, setSectorData] = React.useState<any[]>([]);
  const [showTour, setShowTour] = React.useState(false);
  const [health, setHealth] = React.useState<any>(null);
  const [showPulseDetails, setShowPulseDetails] = React.useState(false);
  const [sysLogs, setSysLogs] = React.useState<string[]>([]);
  const [alertTab, setAlertTab] = React.useState<'Market' | 'System'>('Market');
  const [language, setLanguage] = React.useState('English');
  const [kernelSounds, setKernelSounds] = React.useState(true);
  const [settings, setSettings] = React.useState<any>(DEFAULT_SETTINGS);
  const [priceAlerts, setPriceAlerts] = React.useState<any[]>([]);
  const [newAlert, setNewAlert] = React.useState({ ticker: '', target: '', condition: '>=' });
  const [newsTicker, setNewsTicker] = React.useState<string[]>([
    "RELIANCE to announce Q4 results today",
    "NIFTY 50 hits record high as FII inflows surge",
    "TCS wins $2B multi-year cloud transformation deal",
    "HDFC Bank integration synergies to boost margins",
    "RBI maintains repo rate at 6.5%, outlook stable"
  ]);

  const opportunities = data?.Stocks || [];
  const nifty = data?.Indices?.find((i: any) => i.ticker === '^NSEI') || { price: 0, change: 0 };
  const sysSettings = settings || DEFAULT_SETTINGS;

  const fetchChartData = async (ticker: string, range: string = '1D') => {
    try {
      const intervalMap: any = { '1H': '1m', '1D': '5m', '1W': '1h', '1M': '1d' };
      const interval = intervalMap[range] || '1h';
      const response = await fetch(`http://localhost:8008/market/chart/${ticker}?interval=${interval}`);
      const result = await response.json();
      if (Array.isArray(result) && result.length > 0) {
        let formatted = result.map((d: any) => ({
          name: new Date(d.time * 1000).toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + 
                new Date(d.time * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          price: d.close,
          timestamp: d.time
        }));

        if (formatted.length > 20) {
          formatted = formatted.map((d: any, i: number) => {
            if (i < 19) return d;
            const slice = formatted.slice(i - 19, i + 1);
            const avg = slice.reduce((sum: number, curr: any) => sum + curr.price, 0) / 20;
            return { ...d, ma: avg };
          });
        }

        if (formatted.length > 14) {
          let gains = 0, losses = 0;
          for (let i = 1; i <= 14; i++) {
            const diff = formatted[i].price - formatted[i-1].price;
            if (diff >= 0) gains += diff; else losses -= diff;
          }
          let avgGain = gains / 14, avgLoss = losses / 14;
          
          formatted = formatted.map((d: any, i: number) => {
            if (i <= 14) return d;
            const diff = d.price - formatted[i-1].price;
            const gain = diff >= 0 ? diff : 0;
            const loss = diff < 0 ? -diff : 0;
            avgGain = (avgGain * 13 + gain) / 14;
            avgLoss = (avgLoss * 13 + loss) / 14;
            const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
            return { ...d, rsi: 100 - (100 / (1 + rs)) };
          });
        }

        setChartData(formatted);
      }
    } catch (error) {
      console.error("Error fetching chart data:", error);
    }
  };

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:8008/market/overview');
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error("Error fetching market data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    fetchChartData(selectedTicker, timeRange);
    
    const fetchNotifications = async () => {
      try {
        const response = await fetch('http://localhost:8008/market/notifications');
        const result = await response.json();
        setNotifications(result);
      } catch (e) { console.error(e); }
    };
    fetchNotifications();

    const fetchPulse = async () => {
      try {
        const response = await fetch('http://localhost:8008/market/pulse');
        const result = await response.json();
        setMarketPulse(result);
      } catch (e) { console.error(e); }
    };
    fetchPulse();

    const fetchSectors = async () => {
      try {
        const response = await fetch('http://localhost:8008/market/sectors');
        const result = await response.json();
        setSectorData(result);
      } catch (e) { console.error(e); }
    };
    fetchSectors();

    const fetchHealth = async () => {
      try {
        const response = await fetch('http://localhost:8008/health');
        const result = await response.json();
        setHealth(result);
      } catch (e) { console.error(e); }
    };
    fetchHealth();

    const fetchLogs = async () => {
      try {
        const response = await fetch('http://localhost:8008/system/logs');
        const result = await response.json();
        setSysLogs(result);
      } catch (e) { console.error(e); }
    };
    fetchLogs();

    const fetchPriceAlerts = async () => {
      try {
        const response = await fetch('http://localhost:8008/market/alerts');
        const result = await response.json();
        setPriceAlerts(result);
      } catch (e) { console.error(e); }
    };
    fetchPriceAlerts();

    const interval = setInterval(() => {
      fetchData();
      fetchNotifications();
      fetchPulse();
      fetchSectors();
      fetchHealth();
      fetchLogs();
      fetchPriceAlerts();
    }, 30000);
    return () => clearInterval(interval);
  }, [selectedTicker, timeRange]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery) {
      setSelectedTicker(searchQuery.toUpperCase());
    }
  };

  const saveApiKey = async () => {
    setSavingKey(true);
    try {
      const res = await fetch('http://localhost:8008/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: llmProvider, model: llmModel, key: apiKey })
      });
      const result = await res.json();
      if (res.ok) alert(result.message);
      else alert(`Error: ${result.error || 'Failed to verify'}`);
    } catch (e) {
      alert('Network Error: Failed to verify key');
    } finally {
      setSavingKey(false);
    }
  };

  const exportReport = () => {
    if (!researchResult) return;
    const a = researchResult; // Already contains .analysis from fetch
    const report = `# MEGA STRATEGIC REPORT: ${selectedTicker}\n\nVerdict: ${a.Verdict}\nScore: ${a.Score}%\nStrategy: ${a.Strategy}\nTarget Price: ${a.Target_Price}\nMoat Score: ${a.Moat_Score}/10\n\n## Executive Summary\n${a.Summary}\n\n## Investment Rationale\n${a.Investment_Rationale}\n\n## Asset Allocation & Growth\n${a.Asset_Allocation}\n\n## Key Risks\n${(a.Risks || []).map((r: string) => `- ${r}`).join('\n')}\n\n---\nGenerated by FinIntel Pro Sovereign Intelligence`;
    navigator.clipboard.writeText(report);
    alert("Mega Strategic Report copied to clipboard as Markdown.");
  };

  const sendChatMessage = async () => {
    if (!chatMessage) return;
    const userMsg = chatMessage;
    setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    setChatMessage('');
    try {
      const res = await fetch('http://localhost:8008/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg })
      });
      const data = await res.json();
      setChatHistory(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (e) {
      setChatHistory(prev => [...prev, { role: 'assistant', content: "Error: Failed to connect to advisor." }]);
    }
  };

  const createPriceAlert = async () => {
    if (!newAlert.ticker || !newAlert.target) return;
    try {
      await fetch('http://localhost:8008/market/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newAlert, target: parseFloat(newAlert.target) })
      });
      setNewAlert({ ticker: '', target: '', condition: '>=' });
      const res = await fetch('http://localhost:8008/market/alerts');
      setPriceAlerts(await res.json());
      alert("Sovereign Price Alert Armored.");
    } catch (e) { console.error(e); }
  };
    setIsResearching(true);
    setResearchResult(null);
    setActiveTab('AI Insights');
    try {
      const res = await fetch(`http://localhost:8008/market/research/${ticker}`);
      const data = await res.json();
      setResearchResult(data.analysis);
    } catch (e) {
      alert("Research engine failed. Check backend logs.");
    } finally {
      setIsResearching(false);
    }
  };

  const renderOverview = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'NIFTY 50', value: `₹${nifty.price.toLocaleString('en-IN')}`, change: nifty.change, color: 'cyan' },
          { label: 'SENSEX', value: `₹${(data?.Indices?.find((i:any) => i.ticker === '^BSESN')?.price || 72000).toLocaleString('en-IN')}`, change: data?.Indices?.find((i:any) => i.ticker === '^BSESN')?.change || 0, color: 'purple' },
          { label: 'USD/INR', value: '₹84.22', change: -0.12, color: 'emerald' },
          { label: 'AI Market Pulse', value: 'Strong Bullish', change: 88, color: 'amber', isStatic: true }
        ].map((stat, i) => (
          <motion.div 
            key={i}
            whileHover={{ scale: 1.02, y: -5 }}
            className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl hover:border-white/20 transition-all cursor-default group"
          >
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">{stat.label}</p>
            <div className="flex items-baseline justify-between">
              <h3 className="text-2xl font-black tracking-tight">{stat.value}</h3>
              <span className={cn(
                "text-[10px] font-bold flex items-center space-x-1",
                stat.change >= 0 ? 'text-emerald-400' : 'text-rose-400'
              )}>
                {stat.change >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                <span>{stat.change}%</span>
              </span>
            </div>
            <div className="mt-4 w-full h-1 bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, Math.abs(stat.change) * 20)}%` }}
                className={cn("h-full", stat.change >= 0 ? 'bg-emerald-400' : 'bg-rose-400')}
              />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold">Performance: {selectedTicker}</h2>
            </div>
            <div className="flex space-x-2">
              <button onClick={() => setShowMA(!showMA)} className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${showMA ? 'bg-purple-500 text-white' : 'bg-white/5 text-gray-400'}`}>MA 20</button>
              <button onClick={() => setShowRSI(!showRSI)} className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${showRSI ? 'bg-amber-500 text-white' : 'bg-white/5 text-gray-400'}`}>RSI 14</button>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis dataKey="name" stroke="#444" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#444" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value.toLocaleString()}`} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }} />
                <Area type="monotone" dataKey="price" stroke="#22d3ee" strokeWidth={2} fillOpacity={1} fill="url(#colorPrice)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 backdrop-blur-xl">
           <h2 className="text-xl font-bold mb-6">Market Social Heat</h2>
           <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Banking', val: 82 },
                { label: 'IT', val: 64 },
                { label: 'Energy', val: 45 },
                { label: 'Auto', val: 78 }
              ].map((s, i) => (
                <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-bold text-gray-500 uppercase">{s.label}</span>
                    <span className={cn("text-[10px] font-black", s.val > 70 ? "text-emerald-400" : s.val > 50 ? "text-cyan-400" : "text-rose-400")}>{s.val}%</span>
                  </div>
                  <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${s.val}%` }} className={cn("h-full", s.val > 70 ? "bg-emerald-400" : s.val > 50 ? "bg-cyan-400" : "bg-rose-400")} />
                  </div>
                </div>
              ))}
           </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 backdrop-blur-xl flex flex-col justify-center items-center">
           <h2 className="text-xl font-bold mb-6 self-start">Fear & Greed Index</h2>
           <div className="relative w-48 h-24 overflow-hidden">
              <div className="absolute inset-0 border-[12px] border-white/5 rounded-t-full"></div>
              <motion.div 
                initial={{ rotate: -90 }}
                animate={{ rotate: 45 }}
                className="absolute inset-0 border-[12px] border-cyan-400 rounded-t-full origin-bottom"
              ></motion.div>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
                 <p className="text-2xl font-black">74</p>
                 <p className="text-[8px] font-bold text-cyan-400 uppercase tracking-widest">Greed</p>
              </div>
           </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col justify-between backdrop-blur-xl relative">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">AI Sentiment Hub</h2>
            <button onClick={() => setShowPulseDetails(!showPulseDetails)} className="text-[10px] font-bold text-cyan-400 hover:underline">Details</button>
          </div>
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-300">Market Momentum</span>
              <div className="flex-1 mx-4 h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${marketPulse.score}%` }}
                  className="h-full bg-cyan-400" 
                />
              </div>
              <span className="text-[10px] font-bold text-cyan-400">{marketPulse.verdict}</span>
            </div>
          </div>

          <AnimatePresence>
            {showPulseDetails && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-full left-0 right-0 mt-4 z-20 glass-panel p-6 space-y-4"
              >
                <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500">Leading Headlines</h4>
                <div className="space-y-2">
                  {(marketPulse.headlines || []).map((h: string, i: number) => (
                    <div key={i} className="text-[10px] text-gray-300 border-l-2 border-cyan-400/30 pl-3 py-1">{h}</div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Strategic Opportunities</h2>
            <button className="text-cyan-400 text-xs font-bold hover:underline">View Watchlist</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {opportunities.slice(0, 4).map((op: any, i: number) => (
              <motion.div 
                key={op.ticker}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ scale: 1.02, y: -5 }}
                onClick={() => { setSelectedTicker(op.ticker); setActiveTab('AI Insights'); runDeepResearch(op.ticker); }}
                className="bg-white/5 border border-white/10 rounded-3xl p-5 group cursor-pointer hover:border-cyan-400/30 transition-all backdrop-blur-xl hover:bg-white/[0.02]"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-sm group-hover:text-cyan-400 transition-colors">{op.ticker}</h3>
                    <span className="text-[8px] text-gray-500 uppercase font-bold tracking-widest">{op.sector || 'NSE INDIA'}</span>
                  </div>
                  <div className={cn(
                    "flex items-center space-x-1 text-[10px] font-bold",
                    op.change >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  )}>
                    {op.change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    <span>{op.change}%</span>
                  </div>
                </div>
                <div className="text-xl font-bold mb-4 font-mono">₹{op.price.toLocaleString('en-IN')}</div>
                <div className="flex items-center justify-between text-[10px] mb-1">
                  <div className="text-gray-400">AI Conviction</div>
                  <div className="font-bold text-cyan-400">85%</div>
                </div>
                <div className="flex items-center justify-between text-[10px] mb-3">
                  <div className="text-gray-400">Technical Score</div>
                  <div className="font-bold text-emerald-400">Strong Buy</div>
                </div>
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: '85%' }} className="h-full bg-cyan-400" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 backdrop-blur-xl">
          <h2 className="text-xl font-bold mb-6 flex items-center space-x-3">
             <LayoutDashboard size={20} className="text-purple-400" />
             <span>Strategic Calendar</span>
          </h2>
          <div className="space-y-6">
             {[
               { event: 'RBI Policy Meet', date: 'May 12', impact: 'High' },
               { event: 'CPI Inflation Data', date: 'May 14', impact: 'Medium' },
               { event: 'Reliance AGM', date: 'May 20', impact: 'Critical' },
             ].map((e, i) => (
               <div key={i} className="flex justify-between items-center group">
                 <div className="space-y-1">
                   <p className="text-xs font-bold group-hover:text-cyan-400 transition-colors">{e.event}</p>
                   <p className="text-[10px] text-gray-500 uppercase font-bold tracking-tighter">{e.date}</p>
                 </div>
                 <span className={cn(
                   "text-[8px] px-2 py-1 rounded-full font-black uppercase tracking-tighter",
                   e.impact === 'Critical' ? 'bg-rose-500/10 text-rose-400' : 'bg-white/5 text-gray-400'
                 )}>{e.impact}</span>
               </div>
             ))}
          </div>
          <button className="w-full mt-8 py-3 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">Export to GCal</button>
        </div>
      </div>
    </div>
  );

  const runComparison = async () => {
    try {
      const res = await fetch(`http://localhost:8008/market/compare?t1=${compareT1}&t2=${compareT2}`);
      const result = await res.json();
      setCompareData(result);
    } catch (e) { alert("Comparison failed."); }
  };

  const renderAnalytics = () => (
    <div className="space-y-8">
      <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 backdrop-blur-xl">
        <h2 className="text-xl font-bold mb-6">Strategic Peer Comparison</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <input type="text" placeholder="Asset 1" className="bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-cyan-400/50" value={compareT1} onChange={(e) => setCompareT1(e.target.value.toUpperCase())} />
          <input type="text" placeholder="Asset 2" className="bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-cyan-400/50" value={compareT2} onChange={(e) => setCompareT2(e.target.value.toUpperCase())} />
          <button onClick={runComparison} className="bg-cyan-400 text-black font-bold rounded-xl hover:bg-white transition-all">RUN COMPARISON</button>
        </div>
        {compareData && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="p-6 bg-cyan-400/5 border border-cyan-400/10 rounded-2xl">
              <h3 className="font-bold text-cyan-400 mb-2 italic flex items-center space-x-2">
                <Zap size={16} />
                <span>Advisor Insight</span>
              </h3>
              <p className="text-sm text-gray-300 leading-relaxed italic">"{compareData.insight}"</p>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={compareData.t1_data.map((v: any, i: number) => ({ name: i, [compareT1]: v, [compareT2]: compareData.t2_data[i] }))}>
                  <XAxis hide />
                  <YAxis hide />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }} />
                  <Area type="monotone" dataKey={compareT1} stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.1} />
                  <Area type="monotone" dataKey={compareT2} stroke="#a855f7" fill="#a855f7" fillOpacity={0.1} />
                </AreaChart>
              </ResponsiveContainer>
              <div className="flex justify-center space-x-8 mt-4">
                <div className="flex items-center space-x-2">
                   <div className="w-3 h-3 bg-cyan-400 rounded-full"></div>
                   <span className="text-[10px] font-bold text-gray-400 uppercase">{compareT1}</span>
                </div>
                <div className="flex items-center space-x-2">
                   <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                   <span className="text-[10px] font-bold text-gray-400 uppercase">{compareT2}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-[2rem] p-8 backdrop-blur-xl">
           <h2 className="text-xl font-bold mb-6">Market Depth Analysis</h2>
           <div className="space-y-2">
             <div className="flex justify-between text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">
               <span>Bid Price</span>
               <span>Size</span>
               <span>Ask Price</span>
             </div>
             {[...Array(8)].map((_, i) => (
               <div key={i} className="flex justify-between items-center text-[11px] font-mono">
                 <span className="text-emerald-400 w-24">₹{(25100 - i * 2.5).toFixed(2)}</span>
                 <div className="flex-1 px-4 flex items-center space-x-2">
                    <div className="h-1 bg-emerald-400/20 rounded-full flex-1 overflow-hidden">
                      <div className="h-full bg-emerald-400" style={{ width: `${Math.random() * 100}%` }}></div>
                    </div>
                    <div className="h-1 bg-rose-500/20 rounded-full flex-1 overflow-hidden flex justify-end">
                      <div className="h-full bg-rose-500" style={{ width: `${Math.random() * 100}%` }}></div>
                    </div>
                 </div>
                 <span className="text-rose-400 w-24 text-right">₹{(25105 + i * 2.5).toFixed(2)}</span>
               </div>
             ))}
           </div>
        </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 backdrop-blur-xl">
           <h2 className="text-xl font-bold mb-6">Sentiment vs Performance</h2>
           <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                 <RePieChart>
                    {/* Mock Scatter Plot using Bubble simulation */}
                    <Pie data={[
                      { x: 10, y: 20, z: 100, name: 'RELIANCE' },
                      { x: 40, y: 50, z: 200, name: 'TCS' },
                      { x: 70, y: 80, z: 150, name: 'INFY' }
                    ]} cx="50%" cy="50%" outerRadius={80} fill="#22d3ee" label />
                 </RePieChart>
              </ResponsiveContainer>
           </div>
           <div className="mt-4 text-center text-[10px] text-gray-500 uppercase tracking-widest">Cross-Asset Alpha Correlation</div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 backdrop-blur-xl flex flex-col justify-center items-center space-y-6">
           <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center text-purple-400">
             <TrendingUp size={32} />
           </div>
           <div className="text-center">
             <h3 className="text-lg font-bold">Volatility Index</h3>
             <p className="text-3xl font-black text-white mt-2">12.45</p>
             <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">-2.4% Today</span>
           </div>
        </div>
      </div>
    </div>
  );

  const renderPortfolio = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
          <h2 className="text-xl font-bold mb-8">Asset Watchlist</h2>
          <div className="space-y-4">
            {opportunities.map((op: any) => (
              <div key={op.ticker} className="flex items-center justify-between p-5 bg-black/20 border border-white/5 rounded-2xl hover:border-cyan-400/30 transition-all group">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center font-black text-xs text-gray-500 group-hover:text-cyan-400 transition-colors">{op.ticker[0]}</div>
                  <div>
                    <p className="text-sm font-bold tracking-tight">{op.ticker}</p>
                    <p className="text-[10px] text-gray-500 uppercase font-bold">{op.sector || 'Other'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black">₹{op.price.toLocaleString('en-IN')}</p>
                  <p className={cn("text-[10px] font-bold", op.change >= 0 ? "text-emerald-400" : "text-rose-400")}>
                    {op.change}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl flex flex-col items-center justify-center">
          <h2 className="text-xl font-bold mb-8 self-start">Sector Exposure</h2>
          <div className="h-48 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie data={sectorData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                  {sectorData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={['#22d3ee', '#a855f7', '#10b981', '#f59e0b', '#6366f1'][index % 5]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '10px' }} />
              </RePieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-4 w-full">
            {sectorData.slice(0, 4).map((s, i) => (
              <div key={i} className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ['#22d3ee', '#a855f7', '#10b981', '#f59e0b'][i % 4] }}></div>
                <span className="text-[10px] font-bold text-gray-400">{s.name}: {s.value}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
           <h2 className="text-xl font-bold mb-6">Market Heatmap Grid</h2>
           <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
              {[...Array(24)].map((_, i) => (
                <div key={i} className={cn(
                  "aspect-square rounded-lg flex items-center justify-center text-[8px] font-black",
                  Math.random() > 0.5 ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                )}>
                  {['REL','TCS','INFY','HDFC','SBI','ITC','ADANI','BHARTI'][i % 8]}
                </div>
              ))}
           </div>
           <div className="mt-6 flex items-center justify-between text-[8px] font-black text-gray-500 uppercase tracking-widest">
              <span>Low Momentum</span>
              <span>High Momentum</span>
           </div>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-3xl p-12 text-center backdrop-blur-xl">
        <p className="text-sm text-gray-500 mb-6 italic max-w-lg mx-auto">"Sector rotation detected in Infrastructure and Banking. AI suggests maintaining {sysSettings.risk_profile} exposure."</p>
        <button className="premium-gradient text-black px-10 py-4 rounded-3xl font-black text-xs uppercase tracking-[0.2em] hover:scale-105 transition-all shadow-[0_0_40px_rgba(34,211,238,0.2)]">Connect Kite Portfolio</button>
      </div>
    </div>
  );

  const renderAIInsights = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
      <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 text-cyan-400">
            <Zap size={24} />
            <h2 className="text-xl font-bold">Strategic Research</h2>
          </div>
          <div className="flex items-center space-x-4">
            {researchResult && (
              <button onClick={exportReport} className="text-[10px] font-black text-cyan-400 border border-cyan-400/20 px-4 py-2 rounded-xl hover:bg-cyan-400 hover:text-black transition-all uppercase tracking-widest">
                Export Strategy
              </button>
            )}
            {isResearching && <div className="animate-pulse text-xs text-cyan-400 font-bold">SYNTHESIZING...</div>}
          </div>
        </div>
        {researchResult ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex justify-between items-center bg-black/20 p-6 rounded-[2rem] border border-white/5">
               <div className="space-y-1">
                 <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Final Verdict</span>
                 <h3 className={cn("text-5xl font-black", researchResult.analysis.Verdict === 'BUY' ? "text-emerald-400" : researchResult.analysis.Verdict === 'SELL' ? "text-rose-400" : "text-cyan-400")}>{researchResult.analysis.Verdict}</h3>
               </div>
               <div className="text-right space-y-1">
                 <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Conviction</span>
                 <div className="text-3xl font-black text-white">{researchResult.analysis.Score}%</div>
               </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
               <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Strategy</span>
                  <p className="text-xs font-black text-cyan-400 mt-1">{researchResult.analysis.Strategy}</p>
               </div>
               <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Scale</span>
                  <p className="text-xs font-black text-purple-400 mt-1">{researchResult.analysis.Company_Size}</p>
               </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-cyan-400">
                <Shield size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">Executive Summary</span>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed font-medium bg-white/5 p-6 rounded-3xl border border-white/5 italic">
                "{researchResult.analysis.Summary}"
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="glass-panel p-6 border-white/10">
                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-4">Moat Analysis</div>
                <div className="flex items-center space-x-4">
                  <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(researchResult.analysis.Moat_Score || 5) * 10}%` }}
                      className="h-full premium-gradient" 
                    />
                  </div>
                  <span className="text-lg font-black text-white">{researchResult.analysis.Moat_Score}/10</span>
                </div>
              </div>
              <div className="glass-panel p-6 border-white/10 flex flex-col justify-center items-center">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Target Price</span>
                <span className="text-2xl font-black text-emerald-400">{researchResult.analysis.Target_Price}</span>
              </div>
            </div>

            <div className="space-y-4">
               <h4 className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Investment Rationale</h4>
               <p className="text-xs text-gray-400 leading-relaxed bg-black/20 p-6 rounded-3xl border border-white/5">
                 {researchResult.analysis.Investment_Rationale}
               </p>
            </div>

            <div className="space-y-4">
               <h4 className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Asset Allocation & Growth</h4>
               <p className="text-xs text-gray-400 leading-relaxed bg-black/20 p-6 rounded-3xl border border-white/5">
                 {researchResult.analysis.Asset_Allocation}
               </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-rose-400">
                <Bell size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">Critical Risks</span>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {(researchResult.Risks || []).map((risk: string, i: number) => (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + (i * 0.1) }}
                    className="text-xs bg-rose-500/10 text-rose-400 border border-rose-500/20 px-5 py-3 rounded-2xl font-bold flex items-center space-x-3"
                  >
                    <div className="w-1.5 h-1.5 bg-rose-500 rounded-full"></div>
                    <span>{risk}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center text-gray-500">
            <Search size={48} className="mb-4 opacity-20" />
            <p>Run analysis from the Overview to see deep synthesis.</p>
          </div>
        )}
      </div>

      <div className="bg-white/5 border border-white/10 rounded-3xl flex flex-col overflow-hidden backdrop-blur-xl">
        <div className="p-6 border-b border-white/5">
          <h2 className="font-bold text-sm">Strategic Advisor</h2>
          <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-tighter">Memory Active</p>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-[300px]">
          {chatHistory.map((m, i) => (
            <div key={i} className={cn("flex", m.role === 'user' ? 'justify-end' : 'justify-start')}>
              <div className={cn("max-w-[80%] p-3 rounded-2xl text-xs", m.role === 'user' ? 'bg-cyan-400 text-black' : 'bg-white/5 text-gray-300')}>
                {m.content}
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 bg-black/20 border-t border-white/5 flex space-x-2">
          <input
            type="text"
            placeholder="Ask your sovereign advisor..."
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-cyan-400/50"
            value={chatMessage}
            onChange={(e) => setChatMessage(e.target.value)}
          />
          <button className="p-3 bg-white/5 border border-white/10 rounded-xl text-gray-500 hover:text-cyan-400 transition-all">
            <Mic size={16} />
          </button>
          <button onClick={sendChatMessage} className="bg-cyan-400 text-black p-3 rounded-xl hover:scale-105 transition-all">
            <Zap size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  const renderAlerts = () => (
    <div className="space-y-8">
      <div className="flex justify-between items-center bg-white/5 p-2 rounded-2xl border border-white/5 w-fit">
        {['Market', 'System'].map((t: any) => (
          <button 
            key={t} 
            onClick={() => setAlertTab(t)}
            className={cn(
              "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              alertTab === t ? "bg-cyan-400 text-black" : "text-gray-500 hover:text-white"
            )}
          >
            {t} Engine
          </button>
        ))}
      </div>

      {alertTab === 'Market' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Kernel Market Notifications</h2>
              <button onClick={() => setNotifications([])} className="text-[10px] font-bold text-gray-500 border border-white/10 px-3 py-1 rounded-full uppercase hover:text-white transition-all">Clear History</button>
            </div>
            <div className="space-y-3">
              {notifications.length > 0 ? notifications.map((alert, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={cn(
                    "flex items-center justify-between p-5 bg-white/5 rounded-3xl border transition-all group",
                    alert.asset === 'TITAN' ? "border-amber-400/50 bg-amber-400/10 shadow-[0_0_20px_rgba(251,191,36,0.1)]" : 
                    alert.asset === 'WORLD' ? "border-cyan-400/30 bg-cyan-400/5" : "border-white/5 hover:border-cyan-400/30"
                  )}
                >
                  <div className="flex items-center space-x-6">
                    <div className={cn(
                      "w-10 h-10 rounded-2xl flex items-center justify-center",
                      alert.asset === 'TITAN' ? "bg-amber-400/20" : "bg-cyan-400/10"
                    )}>
                      {alert.asset === 'TITAN' ? <Shield size={20} className="text-amber-400" /> : <Bell size={20} className="text-cyan-400" />}
                    </div>
                    <div>
                      <p className={cn("text-sm font-black", alert.asset === 'TITAN' ? "text-amber-400" : "")}>{alert.asset}: {alert.event}</p>
                      <p className="text-xs text-gray-400 font-medium">{alert.message}</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-500 font-black uppercase tracking-tighter">{new Date(alert.time).toLocaleTimeString()}</span>
                </motion.div>
              )) : (
                <div className="p-32 text-center flex flex-col items-center space-y-4">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-gray-600"><Bell size={32} /></div>
                  <p className="text-sm text-gray-500 font-medium tracking-tight">No critical volatility detected.</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 backdrop-blur-xl">
               <h3 className="text-lg font-bold mb-6 flex items-center space-x-3 text-cyan-400">
                 <Zap size={20} />
                 <span>Deploy Target Alert</span>
               </h3>
               <div className="space-y-4">
                 <input 
                   type="text" 
                   placeholder="Ticker (e.g. RELIANCE)" 
                   className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs outline-none focus:border-cyan-400/50" 
                   value={newAlert.ticker}
                   onChange={(e) => setNewAlert({...newAlert, ticker: e.target.toUpperCase()})}
                 />
                 <div className="flex space-x-2">
                   <select 
                     className="bg-black/40 border border-white/10 rounded-xl px-2 py-3 text-xs outline-none w-20"
                     value={newAlert.condition}
                     onChange={(e) => setNewAlert({...newAlert, condition: e.target.value})}
                   >
                     <option value=">=">≥</option>
                     <option value="<=">≤</option>
                   </select>
                   <input 
                     type="number" 
                     placeholder="Target Price" 
                     className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs outline-none focus:border-cyan-400/50" 
                     value={newAlert.target}
                     onChange={(e) => setNewAlert({...newAlert, target: e.target.value})}
                   />
                 </div>
                 <button onClick={createPriceAlert} className="w-full premium-gradient text-black font-black py-3 rounded-xl text-[10px] uppercase tracking-widest hover:scale-105 transition-all">
                   INITIATE MONITORING
                 </button>
               </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 backdrop-blur-xl">
               <h3 className="text-sm font-black uppercase tracking-widest text-gray-500 mb-6">Active Price Targets</h3>
               <div className="space-y-3">
                 {priceAlerts.filter(a => a.active).map((a, i) => (
                   <div key={i} className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                     <span className="text-xs font-bold">{a.ticker}</span>
                     <span className="text-[10px] font-mono text-cyan-400">{a.condition} ₹{a.target}</span>
                   </div>
                 ))}
                 {priceAlerts.filter(a => a.active).length === 0 && <p className="text-[10px] text-gray-600 italic">No targets deployed.</p>}
               </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-black/40 border border-white/5 rounded-3xl p-8 font-mono text-[10px] space-y-2 overflow-y-auto h-[500px] shadow-inner">
           <div className="flex items-center space-x-2 text-emerald-400 mb-4 animate-pulse">
             <Activity size={14} />
             <span className="font-bold uppercase tracking-widest">Live Kernel Output</span>
           </div>
           {sysLogs.map((log, i) => (
             <div key={i} className="text-gray-400 opacity-80 hover:opacity-100 transition-opacity">
               <span className="text-gray-600">[{i}]</span> {log}
             </div>
           ))}
        </div>
      )}
    </div>
  );

  const renderSettings = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 space-y-8 backdrop-blur-xl">
        <div className="space-y-6">
          <div className="flex items-center space-x-3 text-cyan-400">
            <Shield size={20} />
            <h2 className="text-xl font-bold">LLM Configuration</h2>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase">Provider</label>
              <select className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-cyan-400/50" value={llmProvider} onChange={(e) => setLlmProvider(e.target.value)}>
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
                <option value="nvidia_nim">NVIDIA NIM</option>
                <option value="groq">Groq</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase">Model</label>
              <input type="text" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-cyan-400/50" value={llmModel} onChange={(e) => setLlmModel(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">API Key</label>
            <div className="relative">
              <input type="password" placeholder="Enter Secure Key..." className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-cyan-400/50" value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
              <button onClick={saveApiKey} className="absolute right-3 top-1/2 -translate-y-1/2 bg-cyan-400 text-black px-4 py-1.5 rounded-lg text-[10px] font-bold hover:bg-white transition-all disabled:opacity-50" disabled={savingKey}>
                {savingKey ? 'VERIFYING...' : 'VERIFY & SAVE'}
              </button>
            </div>
          </div>
        </div>
        <div className="space-y-6 pt-8 border-t border-white/5">
          <h2 className="text-xl font-bold flex items-center space-x-3 text-purple-400"><Bell size={20}/> <span>Alert Sensitivity</span></h2>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase">Threshold (%)</label>
              <input type="number" step="0.1" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-cyan-400/50" value={alertThreshold} onChange={(e) => setAlertThreshold(parseFloat(e.target.value))} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase">UI Language</label>
              <select className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-cyan-400/50" value={language} onChange={(e) => setLanguage(e.target.value)}>
                <option value="English">English</option>
                <option value="Hindi">Hindi (हिंदी)</option>
              </select>
            </div>
          </div>
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
            <div className="space-y-1">
              <p className="text-xs font-bold">Kernel Audio Feedback</p>
              <p className="text-[10px] text-gray-500">Enable synthesized feedback for background events.</p>
            </div>
            <button 
              onClick={() => setKernelSounds(!kernelSounds)} 
              className={cn("w-12 h-6 rounded-full transition-all relative", kernelSounds ? "bg-cyan-400" : "bg-white/10")}
            >
              <motion.div animate={{ x: kernelSounds ? 24 : 4 }} className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 backdrop-blur-xl">
        <h2 className="text-xl font-bold mb-8 flex items-center space-x-3">
          <Activity className="text-emerald-400" />
          <span>System Health</span>
        </h2>
        {health ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-black/20 rounded-2xl border border-white/5">
                <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Status</p>
                <p className="text-lg font-black text-emerald-400 uppercase">{health.status}</p>
              </div>
              <div className="p-4 bg-black/20 rounded-2xl border border-white/5">
                <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Latency</p>
                <p className="text-lg font-black text-white">{health.latency_p99}</p>
              </div>
              <div className="p-4 bg-black/20 rounded-2xl border border-white/5">
                <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Memory</p>
                <p className="text-lg font-black text-white">{health.memory_usage}</p>
              </div>
              <div className="p-4 bg-black/20 rounded-2xl border border-white/5">
                <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Uptime</p>
                <p className="text-lg font-black text-white">{Math.floor(health.uptime / 3600)}h</p>
              </div>
            </div>
            <div className="pt-6 border-t border-white/5 space-y-4">
               <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-gray-500">
                 <span>Scheduler Engine</span>
                 <span className="text-emerald-400">ACTIVE</span>
               </div>
               <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                 <motion.div animate={{ x: [-200, 400] }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }} className="w-40 h-full bg-cyan-400/50" />
               </div>
            </div>
          </div>
        ) : (
          <div className="animate-pulse flex flex-col space-y-4">
            <div className="h-20 bg-white/5 rounded-2xl"></div>
            <div className="h-20 bg-white/5 rounded-2xl"></div>
          </div>
        )}
      </div>
    </div>
  );

  const renderTour = () => (
    <AnimatePresence>
      {showTour && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-8"
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="max-w-2xl w-full glass-panel p-12 space-y-8 text-center relative"
          >
            <button onClick={() => setShowTour(false)} className="absolute top-6 right-6 text-gray-500 hover:text-white"><X /></button>
            <div className="w-20 h-20 bg-cyan-400 rounded-3xl mx-auto flex items-center justify-center shadow-[0_0_50px_rgba(34,211,238,0.3)]">
              <Zap size={40} className="text-black" />
            </div>
            <div className="space-y-4">
              <h2 className="text-4xl font-black tracking-tight text-gradient">Welcome to FinIntel Pro</h2>
              <p className="text-gray-400 leading-relaxed">Your sovereign command center for the Indian markets. Let's walk through the core strategic layers of your new engine.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              {[
                { title: 'Synthesis', desc: 'Weighted research from news, socials, and blogs.' },
                { title: 'Security', desc: 'AES-256 encrypted API keys stored locally.' },
                { title: 'Strategy', desc: 'AI side-by-side comparison & moat analysis.' },
              ].map((step, i) => (
                <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/5">
                  <h4 className="font-bold text-cyan-400 text-sm mb-1">{step.title}</h4>
                  <p className="text-[10px] text-gray-500 leading-normal">{step.desc}</p>
                </div>
              ))}
            </div>
            <button 
              onClick={() => setShowTour(false)} 
              className="premium-gradient text-black px-12 py-4 rounded-3xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all"
            >
              INITIALIZE COMMAND CENTER
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const renderContent = () => (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === 'Overview' && renderOverview()}
        {activeTab === 'Analytics' && renderAnalytics()}
        {activeTab === 'Portfolio' && renderPortfolio()}
        {activeTab === 'AI Insights' && renderAIInsights()}
        {activeTab === 'Alerts' && renderAlerts()}
        {activeTab === 'Settings' && renderSettings()}
      </motion.div>
    </AnimatePresence>
  );

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-white font-sans selection:bg-cyan-400/30">
      <aside className="hidden lg:flex w-72 border-r border-white/5 flex-col p-8 space-y-10 bg-black/40 backdrop-blur-3xl z-20">
        <div className="flex items-center space-x-3 px-2 group cursor-pointer">
          <div className="w-12 h-12 bg-cyan-400 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(34,211,238,0.4)] group-hover:scale-110 transition-transform duration-500">
            <Activity className="text-black w-6 h-6" />
          </div>
          <span className="text-2xl font-black tracking-tight text-gradient">FinIntel Pro</span>
        </div>
        <nav className="flex-1 space-y-3">
          {[
            { id: 'Overview', icon: LayoutDashboard },
            { id: 'Analytics', icon: BarChart3 },
            { id: 'Portfolio', icon: PieChart },
            { id: 'AI Insights', icon: Zap },
            { id: 'Alerts', icon: Bell, badge: (notifications.length + priceAlerts.filter(a => a.active).length) || 0 },
            { id: 'Settings', icon: Settings },
          ].map((item) => (
            <button 
              key={item.id} 
              onClick={() => setActiveTab(item.id)} 
              className={cn(
                "nav-item w-full group relative",
                activeTab === item.id ? "bg-cyan-400/10 text-cyan-400 border border-cyan-400/20" : "text-gray-500 hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon size={20} className={cn(activeTab === item.id ? "text-cyan-400" : "group-hover:text-cyan-400")} />
              <span className="font-bold text-sm tracking-wide">{item.id}</span>
              {item.badge ? (
                <span className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 bg-cyan-400 text-black text-[10px] font-black rounded-full flex items-center justify-center">
                  {item.badge}
                </span>
              ) : null}
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 flex flex-col overflow-y-auto">
        <header className="h-24 border-b border-white/5 flex items-center justify-between px-10 bg-black/20 backdrop-blur-2xl sticky top-0 z-10">
          <form onSubmit={handleSearch} className="relative w-[400px]">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
            <input 
              type="text" 
              placeholder="Deep search NSE assets..." 
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-14 pr-6 outline-none focus:border-cyan-400/50 focus:bg-white/10 transition-all text-sm font-medium" 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
            />
          </form>
          <div className="flex items-center space-x-6">
            <button onClick={() => setShowTour(true)} className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all group">
              <HelpCircle size={22} className="text-gray-400 group-hover:text-cyan-400 transition-colors" />
            </button>
            <div className="flex flex-col items-end border-r border-white/10 pr-6">
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Nifty Index</span>
              <span className={cn("text-lg font-black font-mono", nifty.change >= 0 ? "text-emerald-400" : "text-rose-400")}>
                ₹{nifty.price.toLocaleString('en-IN')}
              </span>
            </div>
            <button className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all relative group">
              <Bell size={22} className="text-gray-400 group-hover:text-white transition-colors" />
              {notifications.length > 0 && <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-cyan-400 rounded-full border-2 border-[#020617] animate-pulse"></span>}
            </button>
          </div>
        </header>

        <div className="p-8 pb-32">
          {renderContent()}
        </div>

        <div className="fixed bottom-0 left-0 right-0 lg:left-72 h-10 bg-cyan-400/10 border-t border-cyan-400/20 backdrop-blur-xl flex items-center overflow-hidden z-40">
           <div className="bg-cyan-400 text-black text-[8px] font-black px-4 h-full flex items-center uppercase tracking-widest z-10">Live Ticker</div>
           <div className="flex-1 overflow-hidden">
             <div className="whitespace-nowrap animate-ticker inline-block">
               {newsTicker.concat(newsTicker).map((news, i) => (
                 <span key={i} className="text-[10px] font-bold text-cyan-400/80 mx-10 uppercase tracking-tighter">
                   • {news}
                 </span>
               ))}
             </div>
           </div>
        </div>

        <footer className="lg:hidden h-20 border-t border-white/5 bg-black/80 backdrop-blur-lg flex items-center justify-around px-4 sticky bottom-10 z-50">
          {[
            { icon: LayoutDashboard, label: 'Overview' },
            { icon: Zap, label: 'AI Insights' },
            { icon: Bell, label: 'Alerts' },
            { icon: Settings, label: 'Settings' },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => setActiveTab(item.label)}
              className={cn(
                "flex flex-col items-center space-y-1 transition-all",
                activeTab === item.label ? 'text-cyan-400' : 'text-gray-500'
              )}
            >
              <item.icon size={20} />
              <span className="text-[8px] font-bold uppercase">{item.label}</span>
            </button>
          ))}
        </footer>
      </main>
      {renderTour()}
    </div>
  );
};

export default Dashboard;
