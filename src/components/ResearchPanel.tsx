import { AlertCircle, Zap } from 'lucide-react'

import type { CompanyDueDiligence, DocumentRisk, MarketBehavior, ResearchResult } from '../types/research'

const cn = (...classes: string[]) => classes.filter(Boolean).join(' ')

interface Props {
  researchTicker: string
  setResearchTicker: (value: string) => void
  runResearch: () => void
  isResearching: boolean
  researchResult: ResearchResult | null
  behavior: MarketBehavior | null
  companyIntel: CompanyDueDiligence | null
  documentText: string
  setDocumentText: (value: string) => void
  analyzeDocument: () => void
  isAnalyzing: boolean
  documentRisk: DocumentRisk | null
}

export default function ResearchPanel({ researchTicker, setResearchTicker, runResearch, isResearching, researchResult, behavior, companyIntel, documentText, setDocumentText, analyzeDocument, isAnalyzing, documentRisk }: Props) {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="flex space-x-4">
            <input placeholder="Ticker (e.g. RELIANCE)" className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-6 text-lg font-black uppercase outline-none focus:border-cyan-400" value={researchTicker} onChange={(event) => setResearchTicker(event.target.value)} />
            <button onClick={runResearch} disabled={isResearching} className="px-10 bg-cyan-400 text-black font-black uppercase rounded-2xl shadow-lg shadow-cyan-400/20">{isResearching ? 'Analyzing...' : 'Research'}</button>
          </div>
          {researchResult && (
            <div className="p-10 bg-white/5 border border-white/10 rounded-[3rem] space-y-6">
              <div className="flex items-center justify-between"><h2 className="text-3xl font-black italic uppercase">Research Summary</h2><div className={cn('px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest', researchResult.verdict === 'Buy' ? 'bg-emerald-400 text-black' : researchResult.verdict === 'Reduce' ? 'bg-rose-400 text-white' : 'bg-amber-300 text-black')}>{researchResult.verdict}</div></div>
              {behavior && <div className="flex items-center space-x-2 px-4 py-2 bg-white/5 rounded-xl border border-white/10 w-fit"><Zap size={14} className="text-cyan-400" /><span className="text-[10px] font-black uppercase text-cyan-400">{behavior.status}</span></div>}
              <p className="text-sm text-gray-400 leading-relaxed">{researchResult.summary}</p>
              {companyIntel && (
                <>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-[10px] font-black uppercase text-gray-500 mb-2">Legal & Regulatory</p>
                      {companyIntel.legal_risks.map((item) => <p key={item} className="text-xs text-gray-300 leading-relaxed">{item}</p>)}
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-[10px] font-black uppercase text-gray-500 mb-2">Operating News</p>
                      {companyIntel.news_signals.map((item) => <p key={item} className="text-xs text-gray-300 leading-relaxed">{item}</p>)}
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-[10px] font-black uppercase text-gray-500 mb-2">Public Commentary</p>
                      {companyIntel.blog_signals.map((item) => <p key={item} className="text-xs text-gray-300 leading-relaxed">{item}</p>)}
                    </div>
                  </div>
                  <div className="rounded-[2rem] border border-white/10 bg-black/20 p-5 space-y-3">
                    <p className="text-[10px] font-black uppercase text-gray-500">Due Diligence Sources</p>
                    {companyIntel.sources.slice(0, 6).map((source) => (
                      <a key={`${source.source_type}-${source.url}`} href={source.url} target="_blank" rel="noreferrer" className="block rounded-xl border border-white/5 bg-white/5 p-3 hover:bg-white/10 transition-all">
                        <p className="text-[10px] font-black uppercase text-cyan-400">{source.source_type}</p>
                        <p className="text-sm font-bold text-gray-200">{source.title}</p>
                        <p className="text-xs text-gray-500 leading-relaxed">{source.snippet}</p>
                      </a>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
        <div className="space-y-6">
          <h3 className="text-xs font-black uppercase text-gray-500 px-4">Document Risk Review</h3>
          <textarea placeholder="Paste disclosures, contracts, or regulatory text here..." className="w-full h-48 bg-white/5 border border-white/10 rounded-3xl p-6 text-sm outline-none resize-none" value={documentText} onChange={(event) => setDocumentText(event.target.value)} />
          <button onClick={analyzeDocument} disabled={isAnalyzing} className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">{isAnalyzing ? 'Scanning...' : 'Analyze Document'}</button>
          {documentRisk && (
            <div className="p-8 bg-rose-400/5 border border-rose-400/20 rounded-[2.5rem] space-y-4">
              <div className="flex items-center space-x-3 text-rose-400"><AlertCircle size={18} /><h4 className="text-[10px] font-black uppercase tracking-widest">Risk & Liability Flags</h4></div>
              <ul className="space-y-2">{documentRisk.risk_clauses.map((clause) => <li key={clause} className="text-xs font-bold text-gray-400">- {clause}</li>)}</ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
