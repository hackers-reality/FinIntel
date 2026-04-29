import React from 'react';
import { Zap, AlertCircle } from 'lucide-react';

const cn = (...classes: string[]) => classes.filter(Boolean).join(' ');

export default function ResearchPanel({ researchTicker, setResearchTicker, runResearch, isResearching, researchResult, behavior, docText, setDocText, analyzeDoc, isAnalyzing, docResult }: any) {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="flex space-x-4">
            <input placeholder="Ticker (e.g. RELIANCE)" className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-6 text-lg font-black uppercase outline-none focus:border-cyan-400" value={researchTicker} onChange={e => setResearchTicker(e.target.value)} />
            <button onClick={runResearch} disabled={isResearching} className="px-10 bg-cyan-400 text-black font-black uppercase rounded-2xl shadow-lg shadow-cyan-400/20">{isResearching ? "Analyzing..." : "Research"}</button>
          </div>
          {researchResult && (
            <div className="p-10 bg-white/5 border border-white/10 rounded-[3rem] space-y-6">
              <div className="flex items-center justify-between"><h2 className="text-3xl font-black italic uppercase">Investment Verdict</h2><div className={cn("px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest", researchResult.Verdict === 'Buy' ? "bg-emerald-400 text-black" : "bg-rose-400 text-white")}>{researchResult.Verdict}</div></div>
              {behavior && <div className="flex items-center space-x-2 px-4 py-2 bg-white/5 rounded-xl border border-white/10 w-fit"><Zap size={14} className="text-cyan-400"/><span className="text-[10px] font-black uppercase text-cyan-400">{behavior.status}</span></div>}
              <p className="text-sm text-gray-400 leading-relaxed">{researchResult.Summary}</p>
            </div>
          )}
        </div>
        <div className="space-y-6">
          <h3 className="text-xs font-black uppercase text-gray-500 px-4">Forensic Document Analysis</h3>
          <textarea placeholder="Paste regulatory filings or legal fine print here..." className="w-full h-48 bg-white/5 border border-white/10 rounded-3xl p-6 text-sm outline-none resize-none" value={docText} onChange={e => setDocText(e.target.value)} />
          <button onClick={analyzeDoc} disabled={isAnalyzing} className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">{isAnalyzing ? "Scanning..." : "Analyze Fine Print"}</button>
          {docResult && (
            <div className="p-8 bg-rose-400/5 border border-rose-400/20 rounded-[2.5rem] space-y-4">
              <div className="flex items-center space-x-3 text-rose-400"><AlertCircle size={18}/><h4 className="text-[10px] font-black uppercase tracking-widest">Risk & Liability Flags</h4></div>
              <ul className="space-y-2">{docResult.risk_clauses?.map((c: string, i: number) => <li key={i} className="text-xs font-bold text-gray-400">• {c}</li>)}</ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
