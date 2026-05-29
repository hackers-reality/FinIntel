import { AlertCircle, Zap, BookOpen, Clock, ShieldCheck, HelpCircle, FileText } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

import type { CompanyDueDiligence, DocumentRisk, MarketBehavior, PortfolioResearchContext, ResearchResult } from '../types/research'

const cn = (...classes: string[]) => classes.filter(Boolean).join(' ')

interface Props {
  researchTicker: string
  setResearchTicker: (value: string) => void
  researchQuery: string
  setResearchQuery: (value: string) => void
  runResearch: () => void
  runMegaReport: () => void
  isResearching: boolean
  researchResult: ResearchResult | null
  megaReportContent: string | null
  megaReportHistory: any[]
  loadReportById: (id: number) => void
  saveOpportunity: () => void
  isSavingOpportunity: boolean
  downloadReportPdf: () => void
  activeReportId: number | null
  behavior: MarketBehavior | null
  companyIntel: CompanyDueDiligence | null
  portfolioContext: PortfolioResearchContext | null
  documentText: string
  setDocumentText: (value: string) => void
  analyzeDocument: () => void
  isAnalyzing: boolean
  documentRisk: DocumentRisk | null
}

export default function ResearchPanel({
  researchTicker,
  setResearchTicker,
  researchQuery,
  setResearchQuery,
  runResearch,
  runMegaReport,
  isResearching,
  researchResult,
  megaReportContent,
  megaReportHistory,
  loadReportById,
  saveOpportunity,
  isSavingOpportunity,
  downloadReportPdf,
  activeReportId,
  behavior,
  companyIntel,
  portfolioContext,
  documentText,
  setDocumentText,
  analyzeDocument,
  isAnalyzing,
  documentRisk
}: Props) {
  return (
    <div className="space-y-8">
      {/* Search Header Form */}
      <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 space-y-6">
        <div className="flex items-center space-x-3 text-cyan-400">
          <BookOpen size={24} />
          <h2 className="text-xl font-black uppercase tracking-wider">Mega Strategic Report Generator</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-gray-500 tracking-wider">Ticker Symbol</label>
            <input 
              placeholder="e.g. RELIANCE.NS" 
              className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm font-bold uppercase outline-none focus:border-cyan-400 transition-colors" 
              value={researchTicker} 
              onChange={(event) => setResearchTicker(event.target.value)} 
            />
          </div>
          <div className="md:col-span-2 space-y-2">
            <label className="text-[10px] font-black uppercase text-gray-500 tracking-wider">Analysis Query</label>
            <input 
              placeholder="e.g. Analyze growth prospects and regulatory risk" 
              className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm outline-none focus:border-cyan-400 transition-colors" 
              value={researchQuery} 
              onChange={(event) => setResearchQuery(event.target.value)} 
            />
          </div>
        </div>

        <div className="flex justify-end space-x-4 pt-2">
          <button 
            onClick={runResearch} 
            disabled={isResearching} 
            className="px-6 py-3 bg-white/5 border border-white/10 text-xs font-black uppercase rounded-xl hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            Basic Ticker Scan
          </button>
          <button 
            onClick={runMegaReport} 
            disabled={isResearching} 
            className="px-8 py-3 bg-cyan-400 text-black font-black text-xs uppercase rounded-xl shadow-lg shadow-cyan-400/20 hover:bg-cyan-300 transition-colors disabled:opacity-50"
          >
            {isResearching ? 'Generating Report...' : 'Generate Mega Report'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left/Middle section: Report Content */}
        <div className="lg:col-span-2 space-y-6">
          {megaReportContent ? (
            <div className="p-8 md:p-10 bg-white/5 border border-white/10 rounded-[3rem] space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
                <div>
                  <h3 className="text-xs font-black uppercase text-cyan-400 tracking-widest">Mega Strategic Analysis</h3>
                  <h2 className="text-2xl font-black uppercase italic tracking-tighter mt-1">Research Findings</h2>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={downloadReportPdf}
                    className="flex items-center space-x-2 px-5 py-2.5 bg-cyan-400 text-black font-black text-[10px] uppercase tracking-wider rounded-xl shadow-lg shadow-cyan-400/10 hover:bg-cyan-300 transition-colors"
                  >
                    <FileText size={14} />
                    <span>Download PDF</span>
                  </button>
                  <button
                    onClick={saveOpportunity}
                    disabled={isSavingOpportunity}
                    className="flex items-center space-x-2 px-5 py-2.5 bg-emerald-400 text-black font-black text-[10px] uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-400/10 hover:bg-emerald-300 transition-colors disabled:opacity-50"
                  >
                    <ShieldCheck size={14} />
                    <span>{isSavingOpportunity ? 'Saving...' : 'Save to Opportunities'}</span>
                  </button>
                </div>
              </div>

              {/* Render Markdown report content beautifully */}
              <div className="prose prose-invert max-w-none text-gray-300 leading-relaxed font-sans">
                <ReactMarkdown
                  components={{
                    h1: ({node, ...props}) => <h1 className="text-2xl font-black uppercase text-cyan-400 mt-8 mb-4 border-b border-white/5 pb-2" {...props} />,
                    h2: ({node, ...props}) => <h2 className="text-lg font-black uppercase text-white mt-6 mb-3 border-l-4 border-cyan-400 pl-3" {...props} />,
                    h3: ({node, ...props}) => <h3 className="text-base font-black text-gray-200 mt-4 mb-2" {...props} />,
                    p: ({node, ...props}) => <p className="text-sm text-gray-400 leading-relaxed mb-4" {...props} />,
                    ul: ({node, ...props}) => <ul className="list-disc pl-5 space-y-2 mb-4 text-gray-400 text-sm" {...props} />,
                    ol: ({node, ...props}) => <ol className="list-decimal pl-5 space-y-2 mb-4 text-gray-400 text-sm" {...props} />,
                    li: ({node, ...props}) => <li className="mb-1" {...props} />,
                    code: ({node, ...props}) => <code className="bg-white/5 px-1.5 py-0.5 rounded text-xs font-mono text-cyan-300 border border-white/5" {...props} />,
                    blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-cyan-400 bg-white/5 p-4 rounded-r-xl italic my-4 text-sm text-gray-300" {...props} />,
                    table: ({node, ...props}) => (
                      <div className="overflow-x-auto my-6 rounded-xl border border-white/10 bg-black/20">
                        <table className="w-full border-collapse text-sm" {...props} />
                      </div>
                    ),
                    th: ({node, ...props}) => <th className="border-b border-white/10 bg-white/5 px-4 py-3 text-left font-bold text-white uppercase text-[10px] tracking-wider" {...props} />,
                    td: ({node, ...props}) => <td className="border-b border-white/5 px-4 py-3 text-gray-400 text-xs" {...props} />
                  }}
                >
                  {megaReportContent}
                </ReactMarkdown>
              </div>
            </div>
          ) : researchResult ? (
            <div className="p-10 bg-white/5 border border-white/10 rounded-[3rem] space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-black italic uppercase">Basic Ticker Scan</h2>
                <div className={cn('px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest', researchResult.verdict === 'Buy' ? 'bg-emerald-400 text-black' : researchResult.verdict === 'Reduce' ? 'bg-rose-400 text-white' : 'bg-amber-300 text-black')}>
                  {researchResult.verdict}
                </div>
              </div>
              {behavior && (
                <div className="flex items-center space-x-2 px-4 py-2 bg-white/5 rounded-xl border border-white/10 w-fit">
                  <Zap size={14} className="text-cyan-400" />
                  <span className="text-[10px] font-black uppercase text-cyan-400">{behavior.status}</span>
                </div>
              )}
              <p className="text-sm text-gray-400 leading-relaxed">{researchResult.summary}</p>
              
              {portfolioContext && (
                <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5 space-y-3">
                  <p className="text-[10px] font-black uppercase text-gray-500">Portfolio Context</p>
                  <div className="grid grid-cols-4 gap-4">
                    <div><p className="text-[10px] font-black uppercase text-gray-500">Local Qty</p><p className="text-sm font-bold text-white">{portfolioContext.local_holding_quantity}</p></div>
                    <div><p className="text-[10px] font-black uppercase text-gray-500">Broker Qty</p><p className="text-sm font-bold text-white">{portfolioContext.broker_holding_quantity}</p></div>
                    <div><p className="text-[10px] font-black uppercase text-gray-500">Cash</p><p className="text-sm font-bold text-white">₹{portfolioContext.available_cash.toLocaleString()}</p></div>
                    <div><p className="text-[10px] font-black uppercase text-gray-500">Exposure</p><p className="text-sm font-bold text-white">₹{portfolioContext.current_exposure_value.toLocaleString()}</p></div>
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed">{portfolioContext.diversification_note}</p>
                  <p className="text-xs text-gray-400 leading-relaxed">{portfolioContext.deployment_guidance}</p>
                  {portfolioContext.caution_notes.map((note) => <p key={note} className="text-[11px] text-amber-200/80 leading-relaxed">{note}</p>)}
                </div>
              )}
            </div>
          ) : (
            <div className="p-10 bg-white/5 border border-white/10 rounded-[3rem] flex flex-col items-center justify-center text-center py-20 space-y-4">
              <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-gray-500 border border-white/10">
                <HelpCircle size={32} />
              </div>
              <h3 className="text-lg font-black uppercase tracking-wider">No Report Generated</h3>
              <p className="text-xs text-gray-500 max-w-sm">
                Enter a stock ticker and query parameters above, then click "Generate Mega Report" to run deep AI research with market indices and news data.
              </p>
            </div>
          )}
        </div>

        {/* Right section: History list & Document Review */}
        <div className="space-y-6">
          {/* Past History List */}
          <div className="p-6 bg-white/5 border border-white/10 rounded-[2rem] space-y-4">
            <div className="flex items-center space-x-2 text-cyan-400 border-b border-white/5 pb-3">
              <Clock size={16} />
              <h4 className="text-[10px] font-black uppercase tracking-widest">Recent Intelligence Reports</h4>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {megaReportHistory.length > 0 ? (
                megaReportHistory.map((report) => (
                  <button
                    key={report.id}
                    onClick={() => loadReportById(report.id)}
                    className="w-full text-left p-3.5 rounded-xl border border-white/5 bg-black/20 hover:bg-white/5 transition-all flex flex-col space-y-1 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase text-cyan-400 tracking-wider">
                        {report.ticker || 'GLOBAL REPORT'}
                      </span>
                      <span className="text-[8px] text-gray-500 font-medium">
                        {report.created_at ? new Date(report.created_at).toLocaleDateString() : ''}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-gray-300 group-hover:text-white transition-colors line-clamp-1">
                      {report.query}
                    </span>
                  </button>
                ))
              ) : (
                <p className="text-[10px] text-gray-500 text-center py-4 font-bold uppercase tracking-wider">
                  No past reports found
                </p>
              )}
            </div>
          </div>

          {/* Document Risk */}
          <div className="p-6 bg-white/5 border border-white/10 rounded-[2rem] space-y-4">
            <h4 className="text-[10px] font-black uppercase text-gray-500 tracking-widest px-1">Document Risk Review</h4>
            <textarea 
              placeholder="Paste disclosures, contracts, or regulatory text here..." 
              className="w-full h-36 bg-black/40 border border-white/10 rounded-2xl p-4 text-xs outline-none resize-none focus:border-cyan-400 transition-colors" 
              value={documentText} 
              onChange={(event) => setDocumentText(event.target.value)} 
            />
            <button 
              onClick={analyzeDocument} 
              disabled={isAnalyzing} 
              className="w-full py-3.5 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all disabled:opacity-50"
            >
              {isAnalyzing ? 'Scanning...' : 'Analyze Document'}
            </button>
            {documentRisk && (
              <div className="p-5 bg-rose-400/5 border border-rose-400/20 rounded-2xl space-y-3">
                <div className="flex items-center space-x-2 text-rose-400">
                  <AlertCircle size={14} />
                  <h4 className="text-[9px] font-black uppercase tracking-widest">Risk & Liability Flags</h4>
                </div>
                <ul className="space-y-1.5">
                  {documentRisk.risk_clauses.map((clause) => (
                    <li key={clause} className="text-[11px] font-bold text-gray-400 leading-normal">
                      - {clause}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
