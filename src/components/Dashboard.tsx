import React, { useState, useEffect } from 'react';
import { 
  Shield, Search, History, Cpu, BarChart3, TrendingUp, TrendingDown, 
  Zap, Clock, Activity, Wallet, FileText, AlertCircle, List, Terminal, Command
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHotkeys } from 'react-hotkeys-hook';

const cn = (...classes: string[]) => classes.filter(Boolean).join(' ');

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [showPalette, setShowPalette] = useState(false);
  const [paletteSearch, setPaletteSearch] = useState('');
  const [data, setData] = useState<any>(null);
  const [sysSettings, setSysSettings] = useState<any>({});

  useHotkeys('ctrl+k', (e) => { e.preventDefault(); setShowPalette(!showPalette); });
  useHotkeys('esc', () => setShowPalette(false));

  useEffect(() => {
    const fetchInit = async () => {
      const oRes = await fetch('http://localhost:8008/market/overview');
      setData(await oRes.json());
    };
    fetchInit();
  }, []);

  const runCommand = (cmd: string) => {
    if (cmd === 'portfolio') setActiveTab('portfolio');
    if (cmd === 'research') setActiveTab('research');
    if (cmd === 'overview') setActiveTab('overview');
    setShowPalette(false);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-cyan-400 selection:text-black font-sans">
      <AnimatePresence>
        {showPalette && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-start justify-center pt-32 px-4">
            <motion.div initial={{ scale: 0.95, y: -20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: -20 }} className="w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
               <div className="p-6 flex items-center space-x-4 border-b border-white/5">
                  <Command size={24} className="text-cyan-400" />
                  <input autoFocus placeholder="Search tickers or run commands..." value={paletteSearch} onChange={e => setPaletteSearch(e.target.value)} className="w-full bg-transparent border-none outline-none text-lg font-medium text-white placeholder-gray-600" />
                  <span className="text-[10px] font-black text-gray-500 uppercase border border-white/10 px-2 py-1 rounded">ESC</span>
               </div>
               <div className="p-4 max-h-96 overflow-y-auto">
                  <div className="space-y-1">
                     <p className="text-[10px] font-black text-gray-500 uppercase px-4 py-2">Quick Navigation</p>
                     {[
                       { id: 'overview', icon: <BarChart3 size={16}/>, label: 'Market Overview' },
                       { id: 'portfolio', icon: <Wallet size={16}/>, label: 'Portfolio Alpha' },
                       { id: 'research', icon: <Search size={16}/>, label: 'Strategic Research' }
                     ].map(item => (
                       <button key={item.id} onClick={() => runCommand(item.id)} className="w-full p-4 flex items-center space-x-4 hover:bg-white/5 rounded-xl transition-colors group">
                          <span className="text-gray-500 group-hover:text-cyan-400 transition-colors">{item.icon}</span>
                          <span className="text-sm font-medium">{item.label}</span>
                       </button>
                     ))}
                  </div>
               </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <nav className="fixed top-0 inset-x-0 h-20 bg-black/40 backdrop-blur-2xl border-b border-white/5 z-50 flex items-center justify-between px-10">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-cyan-400 rounded-xl flex items-center justify-center text-black shadow-lg shadow-cyan-400/20"><Shield size={24} /></div>
          <h1 className="text-lg font-black tracking-tighter uppercase italic">FinIntel Pro</h1>
        </div>
        <div className="flex space-x-1 bg-white/5 p-1 rounded-xl border border-white/10">
          <button onClick={() => setActiveTab('overview')} className={cn("px-6 py-2 rounded-lg text-[10px] font-black uppercase transition-all", activeTab === 'overview' ? "bg-white/10 text-white" : "text-gray-500")}>Market</button>
          <button onClick={() => setActiveTab('portfolio')} className={cn("px-6 py-2 rounded-lg text-[10px] font-black uppercase transition-all", activeTab === 'portfolio' ? "bg-white/10 text-white" : "text-gray-500")}>Portfolio</button>
          <button onClick={() => setActiveTab('research')} className={cn("px-6 py-2 rounded-lg text-[10px] font-black uppercase transition-all", activeTab === 'research' ? "bg-white/10 text-white" : "text-gray-500")}>Nexus</button>
        </div>
        <div className="flex items-center space-x-4">
           <button onClick={() => setShowPalette(true)} className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-gray-500 hover:text-white transition-all"><Search size={18}/></button>
           <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-gray-400"><Cpu size={20} /></div>
        </div>
      </nav>

      <main className="pt-28 pb-12 px-10 max-w-7xl mx-auto">
        {activeTab === 'overview' && (
           <div className="space-y-10 animate-in fade-in duration-700">
              <div className="grid grid-cols-4 gap-4">
                {data?.Stocks?.map((s: any) => (
                  <div key={s.symbol} className="p-6 bg-white/5 border border-white/10 rounded-[2rem]">
                     <p className="text-[10px] font-black text-gray-500 uppercase mb-2">{s.symbol}</p>
                     <p className="text-2xl font-black">₹{s.price.toLocaleString()}</p>
                     <p className={cn("text-[10px] font-black mt-1", s.change > 0 ? "text-emerald-400" : "text-rose-400")}>{s.change.toFixed(2)}%</p>
                  </div>
                ))}
              </div>
           </div>
        )}
        {activeTab === 'portfolio' && <div className="text-center text-gray-500 py-20 uppercase text-[10px] font-black tracking-widest">Portfolio Module Online</div>}
        {activeTab === 'research' && <div className="text-center text-gray-500 py-20 uppercase text-[10px] font-black tracking-widest">Nexus Research Pulse Active</div>}
      </main>
    </div>
  );
}
