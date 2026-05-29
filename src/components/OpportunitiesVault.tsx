import { useState, useEffect, useCallback } from 'react'
import { Plus, Target, Ban, ArrowDownRight, Compass, RefreshCw, Check } from 'lucide-react'
import { API_BASE_URL } from '../constants/api'

interface Opportunity {
  id: number
  ticker: string
  thesis: string
  entry_price?: number
  target_price?: number
  stop_loss?: number
  created_at?: string
}

interface Props {
  accessToken: string | null
}

export default function OpportunitiesVault({ accessToken }: Props) {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form states
  const [ticker, setTicker] = useState('')
  const [thesis, setThesis] = useState('')
  const [entryPrice, setEntryPrice] = useState('')
  const [targetPrice, setTargetPrice] = useState('')
  const [stopLoss, setStopLoss] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchOpportunities = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const headers: HeadersInit = {}
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`
      }
      const response = await fetch(`${API_BASE_URL}/api/opportunities`, { headers })
      if (!response.ok) throw new Error('Failed to load opportunities.')
      const data = await response.json()
      if (Array.isArray(data)) {
        setOpportunities(data)
      }
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Could not fetch opportunities.')
    } finally {
      setLoading(false)
    }
  }, [accessToken])

  useEffect(() => {
    void fetchOpportunities()
  }, [fetchOpportunities])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ticker.trim() || !thesis.trim()) {
      setError('Ticker and Thesis are required.')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`
      }

      const body = {
        ticker: ticker.trim().toUpperCase(),
        thesis: thesis.trim(),
        entry_price: entryPrice ? parseFloat(entryPrice) : null,
        target_price: targetPrice ? parseFloat(targetPrice) : null,
        stop_loss: stopLoss ? parseFloat(stopLoss) : null,
      }

      const response = await fetch(`${API_BASE_URL}/api/opportunities`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      })

      if (!response.ok) throw new Error('Failed to save opportunity.')
      
      // Reset form
      setTicker('')
      setThesis('')
      setEntryPrice('')
      setTargetPrice('')
      setStopLoss('')
      setShowAddForm(false)
      
      // Refresh list
      await fetchOpportunities()
    } catch (err: any) {
      setError(err.message || 'Error saving opportunity.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-black text-cyan-400 uppercase tracking-widest">Opportunities Vault</h2>
          <p className="text-[11px] text-gray-500 mt-0.5">Sovereign repository of proprietary ideas and structural trades.</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => void fetchOpportunities()}
            disabled={loading}
            className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white transition-all disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center space-x-1.5 px-4 py-2.5 bg-cyan-400 text-black font-black uppercase tracking-wider text-xs rounded-xl hover:bg-cyan-300 transition-all"
          >
            <Plus size={14} />
            <span>{showAddForm ? 'Cancel' : 'New Trade Setup'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-950/20 border border-red-500/30 rounded-2xl text-xs text-red-400">
          {error}
        </div>
      )}

      {/* Add form */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="bg-[#111118] border border-[#1e1e2e] rounded-[2rem] p-6 shadow-xl space-y-4 max-w-xl">
          <h3 className="text-xs font-black text-white uppercase tracking-widest">Create New Trade Thesis</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[9px] font-black uppercase text-gray-500 tracking-wider mb-1">Ticker / Symbol</label>
              <input
                type="text"
                placeholder="e.g. RELIANCE.NS"
                value={ticker}
                onChange={(e) => setTicker(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-400/50"
                required
              />
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[9px] font-black uppercase text-gray-500 tracking-wider mb-1">Entry Price</label>
                <input
                  type="number"
                  step="any"
                  placeholder="Entry"
                  value={entryPrice}
                  onChange={(e) => setEntryPrice(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-2 py-2 text-xs text-white outline-none focus:border-cyan-400/50"
                />
              </div>
              <div>
                <label className="block text-[9px] font-black uppercase text-gray-500 tracking-wider mb-1">Target</label>
                <input
                  type="number"
                  step="any"
                  placeholder="Target"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-2 py-2 text-xs text-white outline-none focus:border-cyan-400/50"
                />
              </div>
              <div>
                <label className="block text-[9px] font-black uppercase text-gray-500 tracking-wider mb-1">Stop Loss</label>
                <input
                  type="number"
                  step="any"
                  placeholder="Stop"
                  value={stopLoss}
                  onChange={(e) => setStopLoss(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-2 py-2 text-xs text-white outline-none focus:border-cyan-400/50"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[9px] font-black uppercase text-gray-500 tracking-wider mb-1">Investment Thesis / Details</label>
            <textarea
              placeholder="Why write this opportunity down? Sector headwinds, technical patterns, catalyst..."
              value={thesis}
              onChange={(e) => setThesis(e.target.value)}
              rows={3}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-400/50 resize-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="flex items-center space-x-1.5 px-4 py-2.5 bg-cyan-400 text-black font-black uppercase tracking-wider text-xs rounded-xl hover:bg-cyan-300 transition-all disabled:opacity-50"
          >
            {submitting ? <RefreshCw size={12} className="animate-spin" /> : <Check size={12} />}
            <span>Save Setup</span>
          </button>
        </form>
      )}

      {/* Opportunities list */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-3">
          <RefreshCw className="text-cyan-400 animate-spin" size={24} />
          <p className="text-xs text-gray-500">Decrypting vault holdings...</p>
        </div>
      ) : opportunities.length === 0 ? (
        <div className="bg-[#111118] border border-[#1e1e2e] rounded-[2rem] p-10 text-center">
          <p className="text-xs text-gray-500 uppercase tracking-widest">No active setups in your vault. Create one above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {opportunities.map((opp) => (
            <div key={opp.id} className="bg-[#111118] border border-[#1e1e2e] rounded-[2rem] p-6 shadow-xl flex flex-col justify-between hover:border-cyan-400/30 transition-all">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 text-[10px] font-black uppercase tracking-wider rounded-lg">
                    {opp.ticker}
                  </span>
                  {opp.created_at && (
                    <span className="text-[9px] text-gray-600 font-mono">
                      {new Date(opp.created_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-300 leading-relaxed font-medium">
                  {opp.thesis}
                </p>
              </div>

              {/* Price Targets */}
              <div className="grid grid-cols-3 gap-2 border-t border-white/5 pt-4 mt-4">
                <div className="bg-black/25 rounded-xl p-2.5 border border-white/[0.02]">
                  <p className="text-[8px] font-black text-gray-600 uppercase tracking-wider flex items-center">
                    <Compass size={10} className="mr-1 text-cyan-400" />
                    Entry
                  </p>
                  <p className="text-xs font-black text-cyan-400 mt-0.5">
                    {opp.entry_price ? `₹${opp.entry_price.toLocaleString('en-IN')}` : '—'}
                  </p>
                </div>
                <div className="bg-black/25 rounded-xl p-2.5 border border-white/[0.02]">
                  <p className="text-[8px] font-black text-gray-600 uppercase tracking-wider flex items-center">
                    <Target size={10} className="mr-1 text-emerald-400" />
                    Target
                  </p>
                  <p className="text-xs font-black text-emerald-400 mt-0.5">
                    {opp.target_price ? `₹${opp.target_price.toLocaleString('en-IN')}` : '—'}
                  </p>
                </div>
                <div className="bg-black/25 rounded-xl p-2.5 border border-white/[0.02]">
                  <p className="text-[8px] font-black text-gray-600 uppercase tracking-wider flex items-center">
                    <Ban size={10} className="mr-1 text-red-400" />
                    Stop Loss
                  </p>
                  <p className="text-xs font-black text-red-400 mt-0.5">
                    {opp.stop_loss ? `₹${opp.stop_loss.toLocaleString('en-IN')}` : '—'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
