import React, { useState, useEffect } from 'react';
import { Shield } from 'lucide-react';
import OverviewPanel from './OverviewPanel';
import PortfolioPanel from './PortfolioPanel';
import ResearchPanel from './ResearchPanel';
import SettingsPanel from './SettingsPanel';
import SectorPanel from './SectorPanel';
import { StockIndex, SectorData, PortfolioSummary, InstitutionalNews, InstitutionalFlow, StrategicEvent } from '../types/market';

const cn = (...classes: string[]) => classes.filter(Boolean).join(' ');

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [data, setData] = useState<{ Stocks: StockIndex[] } | null>(null);
  const [sectors, setSectors] = useState<SectorData[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioSummary>({ total_value: 0, holdings: [] });
  const [researchResult, setResearchResult] = useState<any>(null);
  const [behavior, setBehavior] = useState<any>(null);
  const [docResult, setDocResult] = useState<any>(null);
  const [pendingEvents, setPendingEvents] = useState<StrategicEvent[]>([]);
  const [titanNews, setTitanNews] = useState<InstitutionalNews[]>([]);
  const [fiidii, setFiidii] = useState<InstitutionalFlow[]>([]);
  const [bulkDeals, setBulkDeals] = useState<any[]>([]);
  const [marketStatus, setMarketStatus] = useState('CLOSED');

  // Logic State
  const [researchTicker, setResearchTicker] = useState('');
  const [docText, setDocText] = useState('');
  const [isResearching, setIsResearching] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [newAsset, setNewAsset] = useState({ ticker: '', qty: '', price: '' });

  const fetchInit = async () => {
    try {
      const [oRes, sRes, pRes, nRes, eRes, fRes, bRes] = await Promise.all([
        fetch('http://localhost:8008/market/overview'), fetch('http://localhost:8008/market/sectors'),
        fetch('http://localhost:8008/market/portfolio/summary'), fetch('http://localhost:8008/market/traders/news'),
        fetch('http://localhost:8008/market/events'), fetch('http://localhost:8008/market/fiidii'),
        fetch('http://localhost:8008/market/bulkdeals')
      ]);
      const oData = await oRes.json();
      setData(oData);
      setMarketStatus(oData.market_status);
      setSectors(await sRes.json());
      setPortfolio(await pRes.json());
      setTitanNews(await nRes.json());
      setPendingEvents(await eRes.json());
      setFiidii(await fRes.json());
      setBulkDeals(await bRes.json());
    } catch {}
  };

  useEffect(() => { fetchInit(); const i = setInterval(fetchInit, 60000); return () => clearInterval(i); }, []);

  const runResearch = async () => {
    if (!researchTicker) return;
    setIsResearching(true);
    const [rRes, bRes] = await Promise.all([
      fetch(`http://localhost:8008/market/research/${researchTicker}`), fetch(`http://localhost:8008/market/behavior/${researchTicker}`)
    ]);
    setResearchResult(await rRes.json());
    setBehavior(await bRes.json());
    setIsResearching(false);
  };

  const analyzeDoc = async () => {
    if (!docText) return;
    setIsAnalyzing(true);
    const res = await fetch('http://localhost:8008/analyze/document', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: docText }) });
    setDocResult(await res.json());
    setIsAnalyzing(false);
  };

  const addAsset = async () => {
    if (!newAsset.ticker) return;
    await fetch('http://localhost:8008/market/portfolio/holdings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newAsset) });
    setNewAsset({ ticker: '', qty: '', price: '' });
    fetchInit();
  };

  const saveToVault = async (key: string, value: string) => {
    await fetch('http://localhost:8008/settings/vault', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ [key]: value }) });
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans flex flex-col">
      <nav className="fixed top-0 inset-x-0 h-20 bg-black/40 backdrop-blur-2xl border-b border-white/5 z-50 flex items-center justify-between px-10">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-cyan-400 rounded-xl flex items-center justify-center text-black shadow-lg shadow-cyan-400/20"><Shield size={24} /></div>
            <h1 className="text-lg font-black tracking-tighter uppercase italic">FinIntel Terminal</h1>
          </div>
          <div className={cn("px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest", marketStatus === 'OPEN' ? "border-emerald-400/30 text-emerald-400 bg-emerald-400/5 shadow-[0_0_15px_#10b98110]" : "border-rose-400/30 text-rose-400")}>Market {marketStatus}</div>
        </div>
        <div className="flex space-x-1 bg-white/5 p-1 rounded-xl border border-white/10">
          {['overview', 'sectors', 'portfolio', 'research', 'settings'].map(t => (
            <button key={t} onClick={() => setActiveTab(t)} className={cn("px-6 py-2 rounded-lg text-[10px] font-black uppercase transition-all", activeTab === t ? "bg-white/10 text-white" : "text-gray-500")}>{t}</button>
          ))}
        </div>
      </nav>

      <main className="flex-1 pt-28 pb-20 px-10 max-w-7xl mx-auto w-full">
        {activeTab === 'overview' && data && <OverviewPanel data={data} titanNews={titanNews} fiidii={fiidii} bulkDeals={bulkDeals} pendingEvents={pendingEvents} marketStatus={marketStatus} />}
        {activeTab === 'sectors' && <SectorPanel sectors={sectors} />}
        {activeTab === 'portfolio' && <PortfolioPanel portfolio={portfolio} newAsset={newAsset} setNewAsset={setNewAsset} addAsset={addAsset} />}
        {activeTab === 'research' && <ResearchPanel researchTicker={researchTicker} setResearchTicker={setResearchTicker} runResearch={runResearch} isResearching={isResearching} researchResult={researchResult} behavior={behavior} docText={docText} setDocText={setDocText} analyzeDoc={analyzeDoc} isAnalyzing={isAnalyzing} docResult={docResult} />}
        {activeTab === 'settings' && <SettingsPanel saveToVault={saveToVault} />}
      </main>

      <footer className="py-6 px-10 border-t border-white/5 bg-black/40 backdrop-blur-xl text-center">
        <p className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-1">FinIntel Strategic Research Terminal v5.0 — All Systems Hardened</p>
        <p className="text-[8px] text-gray-600 uppercase tracking-widest">Disclaimer: Not financial advice. SEBI registration required for advisory services. Data sourced from NSE/BSE exchange via professional forensics.</p>
      </footer>
    </div>
  );
}
