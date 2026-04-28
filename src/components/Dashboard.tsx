import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Search, 
  Shield, 
  Zap,
  BarChart3,
  PieChart,
  LayoutDashboard,
  Bell,
  Settings
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

const mockChartData = [
  { name: '09:00', price: 24500 },
  { name: '10:00', price: 24650 },
  { name: '11:00', price: 24600 },
  { name: '12:00', price: 24800 },
  { name: '13:00', price: 24700 },
  { name: '14:00', price: 24950 },
  { name: '15:00', price: 25100 },
];

const Dashboard: React.FC = () => {
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [apiKey, setApiKey] = React.useState('');
  const [savingKey, setSavingKey] = React.useState(false);
  const [chartData, setChartData] = React.useState<any[]>(mockChartData);
  const [selectedTicker, setSelectedTicker] = React.useState('^NSEI');
  const [searchQuery, setSearchQuery] = React.useState('');

  const fetchChartData = async (ticker: string) => {
    try {
      const response = await fetch(`http://localhost:8008/market/chart/${ticker}?interval=1h`);
      const result = await response.json();
      if (Array.isArray(result) && result.length > 0) {
        const formatted = result.map((d: any) => ({
          name: new Date(d.time * 1000).toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + 
                new Date(d.time * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          price: d.close
        }));
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
    fetchChartData(selectedTicker);
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [selectedTicker]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery) {
      setSelectedTicker(searchQuery.toUpperCase());
    }
  };

  const saveApiKey = async () => {
    setSavingKey(true);
    try {
      await fetch('http://localhost:8008/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: "openai", model: "gpt-4o", key: apiKey })
      });
      alert('Key verified and saved');
    } catch (e) {
      alert('Failed to verify key');
    } finally {
      setSavingKey(false);
    }
  };

  const opportunities = data?.categories?.["NSE Stocks"] || [];
  const nifty = data?.indices?.find((i: any) => i.name === 'NIFTY 50') || { price: 0, change: 0 };

  return (
    <div className="flex h-screen bg-slate-950 text-white overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/5 flex flex-col p-6 space-y-8 bg-black/40 backdrop-blur-xl">
        <div className="flex items-center space-x-3 px-2">
          <div className="w-10 h-10 bg-cyan-400 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.4)]">
            <Activity className="text-black w-6 h-6" />
          </div>
          <span className="text-xl font-bold tracking-tight">FinIntel <span className="text-cyan-400">Pro</span></span>
        </div>

        <nav className="flex-1 space-y-2">
          {[
            { icon: LayoutDashboard, label: 'Overview', active: true },
            { icon: BarChart3, label: 'Analytics', active: false },
            { icon: PieChart, label: 'Portfolio', active: false },
            { icon: Zap, label: 'AI Insights', active: false },
            { icon: Bell, label: 'Alerts', active: false },
            { icon: Settings, label: 'Settings', active: false },
          ].map((item) => (
            <button
              key={item.label}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                item.active ? 'bg-cyan-400/10 text-cyan-400 border border-cyan-400/20' : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon size={20} />
              <span className="font-medium text-sm">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 bg-cyan-400/5 border border-cyan-400/10 rounded-2xl">
          <div className="flex items-center space-x-2 text-cyan-400 mb-2">
            <Shield size={16} />
            <span className="text-[10px] font-bold uppercase tracking-wider">AI Guard Active</span>
          </div>
          <p className="text-[10px] text-gray-400 leading-relaxed">
            Real-time sentiment monitoring is active for 50+ Indian assets.
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        {/* Header */}
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-black/20 backdrop-blur-md sticky top-0 z-10">
          <form onSubmit={handleSearch} className="relative w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input
              type="text"
              placeholder="Search Indian stocks (e.g. RELIANCE)..."
              className="w-full bg-white/5 border border-white/10 rounded-full py-2.5 pl-12 pr-4 focus:outline-none focus:border-cyan-400/50 focus:bg-white/10 transition-all text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-emerald-400/10 border border-emerald-400/20 rounded-full px-3 py-1">
               <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
               <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Live NSE Data</span>
            </div>
            <div className="hidden xl:flex items-center space-x-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5">
               <Shield size={14} className="text-cyan-400" />
               <input 
                 type="password" 
                 placeholder="Enter API Key..." 
                 className="bg-transparent border-none outline-none text-[10px] w-32 focus:w-48 transition-all"
                 value={apiKey}
                 onChange={(e) => setApiKey(e.target.value)}
               />
               <button 
                 onClick={saveApiKey}
                 className="text-[10px] font-bold text-cyan-400 hover:text-white transition-colors"
                 disabled={savingKey}
               >
                 {savingKey ? '...' : 'VERIFY'}
               </button>
            </div>
            <div className="flex flex-col items-end px-4 border-r border-white/10">
              <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">NIFTY 50</span>
              <span className={`text-sm font-bold ${nifty.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                ₹{nifty.price.toLocaleString('en-IN')} ({nifty.change >= 0 ? '+' : ''}{nifty.change}%)
              </span>
            </div>
            <button className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all">
              <Bell size={18} className="text-gray-400" />
            </button>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-8 space-y-8">
          {/* Hero Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-3xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold">Performance: {selectedTicker}</h2>
                  <p className="text-sm text-gray-400">Real-time aggregate data across exchanges</p>
                </div>
                <div className="flex space-x-2">
                  {['1H', '1D', '1W', '1M'].map((t) => (
                    <button key={t} className={`px-3 py-1 rounded-lg text-[10px] font-bold ${t === '1D' ? 'bg-cyan-400 text-black' : 'bg-white/5 text-gray-400'}`}>
                      {t}
                    </button>
                  ))}
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
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                      itemStyle={{ color: '#22d3ee' }}
                    />
                    <Area type="monotone" dataKey="price" stroke="#22d3ee" strokeWidth={2} fillOpacity={1} fill="url(#colorPrice)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col justify-between overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-400/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
              <div>
                <h2 className="text-xl font-bold mb-1">AI Sentiment Hub</h2>
                <p className="text-sm text-gray-400 mb-6">Aggregate social & news signals</p>
                
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-300">Social Heat</span>
                    <div className="flex-1 mx-4 h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-400 w-[75%]"></div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-400">Bullish</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-300">News Trust</span>
                    <div className="flex-1 mx-4 h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-400 w-[82%]"></div>
                    </div>
                    <span className="text-[10px] font-bold text-cyan-400">High</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-300">Volatility</span>
                    <div className="flex-1 mx-4 h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-rose-500 w-[30%]"></div>
                    </div>
                    <span className="text-[10px] font-bold text-rose-500">Low</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-white/5">
                <div className="flex items-center space-x-3 text-sm">
                  <div className="w-10 h-10 rounded-full bg-cyan-400/10 flex items-center justify-center text-cyan-400">
                    <Zap size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-xs">Recommendation</p>
                    <p className="text-emerald-400 text-[10px]">Accumulate NIFTY Call Options</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Opportunities Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Top Investment Opportunities</h2>
              <button className="text-cyan-400 text-xs font-bold hover:underline">View All</button>
            </div>
            {loading ? (
              <div className="flex justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-cyan-400"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {opportunities.map((op: any) => (
                  <div key={op.ticker} className="bg-white/5 border border-white/10 rounded-3xl p-5 group cursor-pointer hover:border-cyan-400/30 transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold group-hover:text-cyan-400 transition-colors text-sm">{op.display_name}</h3>
                        <span className="text-[8px] text-gray-500 uppercase font-bold tracking-widest">NSE INDIA</span>
                      </div>
                      <div className={`flex items-center space-x-1 text-[10px] font-bold ${op.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {op.change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        <span>{op.change >= 0 ? '+' : ''}{op.change}%</span>
                      </div>
                    </div>
                    <div className="text-xl font-bold mb-4 font-mono">₹{op.price.toLocaleString('en-IN')}</div>
                    <div className="flex items-center justify-between text-[10px]">
                      <div className="text-gray-400">AI Conviction</div>
                      <div className="font-bold text-cyan-400">85%</div>
                    </div>
                    <div className="mt-2 w-full h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-400 w-[85%]"></div>
                    </div>
                    <div className="mt-4 flex justify-between items-center">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                        op.change > 2 ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20' : 
                        op.change > 0 ? 'bg-cyan-400/10 text-cyan-400 border border-cyan-400/20' : 'bg-white/5 text-gray-400'
                      }`}>
                        {op.change > 2 ? 'Strong Buy' : op.change > 0 ? 'Buy' : 'Neutral'}
                      </span>
                      <button className="text-white/10 group-hover:text-white transition-colors">
                        <Zap size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
