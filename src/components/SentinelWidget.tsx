import { useState, useEffect, useCallback } from 'react'
import { Shield, ShieldAlert, Play, RefreshCw, Clock, Users, FileText, ExternalLink } from 'lucide-react'
import { API_BASE_URL } from '../constants/api'

interface SentinelStatus {
  running: boolean
  next_run: string
  findings_count: number
  titans_tracked: number
}

interface Finding {
  titan: string
  headline: string
  source: string
  link: string
  timestamp: string
}

interface Props {
  accessToken: string | null
}

export default function SentinelWidget({ accessToken }: Props) {
  const [status, setStatus] = useState<SentinelStatus | null>(null)
  const [findings, setFindings] = useState<Finding[]>([])
  const [loadingStatus, setLoadingStatus] = useState(true)
  const [loadingFindings, setLoadingFindings] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStatus = useCallback(async () => {
    try {
      const headers: HeadersInit = {}
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`
      }
      const response = await fetch(`${API_BASE_URL}/api/sentinel/status`, { headers })
      if (!response.ok) throw new Error('Failed to fetch status')
      const data = await response.json()
      if (data.error) {
        throw new Error(data.error)
      }
      setStatus(data)
      setError(null)
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Error fetching status')
    } finally {
      setLoadingStatus(false)
    }
  }, [accessToken])

  const fetchFindings = useCallback(async () => {
    try {
      const headers: HeadersInit = {}
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`
      }
      const response = await fetch(`${API_BASE_URL}/api/sentinel/findings`, { headers })
      if (!response.ok) throw new Error('Failed to fetch findings')
      const data = await response.json()
      if (Array.isArray(data)) {
        setFindings(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingFindings(false)
    }
  }, [accessToken])

  const runScan = useCallback(async () => {
    setScanning(true)
    setError(null)
    try {
      const headers: HeadersInit = { 'Content-Type': 'application/json' }
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`
      }
      const response = await fetch(`${API_BASE_URL}/api/sentinel/scan`, {
        method: 'POST',
        headers
      })
      if (!response.ok) throw new Error('Scan execution failed')
      const data = await response.json()
      if (data.error) {
        throw new Error(data.error)
      }
      // Reload findings and status
      await Promise.all([fetchStatus(), fetchFindings()])
    } catch (err: any) {
      setError(err.message || 'Scan error occurred')
    } finally {
      setScanning(false)
    }
  }, [fetchStatus, fetchFindings, accessToken])

  // Poll status/findings on mount and every 60s
  useEffect(() => {
    void fetchStatus()
    void fetchFindings()

    const interval = setInterval(() => {
      void fetchStatus()
      void fetchFindings()
    }, 60000)

    return () => clearInterval(interval)
  }, [fetchStatus, fetchFindings])

  return (
    <div className="space-y-6">
      {/* Overview Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#111118] border border-[#1e1e2e] rounded-2xl p-5 flex items-center justify-between shadow-lg">
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Sentinel Engine</p>
            <div className="flex items-center space-x-2 mt-1">
              <span className={`w-2.5 h-2.5 rounded-full ${status?.running ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
              <p className="text-sm font-bold uppercase tracking-wider text-white">
                {status?.running ? 'Running' : 'Stopped'}
              </p>
            </div>
          </div>
          <div className={`p-3 rounded-xl ${status?.running ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
            {status?.running ? <Shield size={20} /> : <ShieldAlert size={20} />}
          </div>
        </div>

        <div className="bg-[#111118] border border-[#1e1e2e] rounded-2xl p-5 flex items-center justify-between shadow-lg">
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Titans Monitored</p>
            <p className="text-xl font-black text-cyan-400 mt-1">
              {loadingStatus ? '...' : status?.titans_tracked ?? 4}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-cyan-400/10 text-cyan-400 border border-cyan-400/20">
            <Users size={20} />
          </div>
        </div>

        <div className="bg-[#111118] border border-[#1e1e2e] rounded-2xl p-5 flex items-center justify-between shadow-lg">
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Findings Count</p>
            <p className="text-xl font-black text-purple-400 mt-1">
              {loadingStatus ? '...' : status?.findings_count ?? 0}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-purple-400/10 text-purple-400 border border-purple-400/20">
            <FileText size={20} />
          </div>
        </div>

        <div className="bg-[#111118] border border-[#1e1e2e] rounded-2xl p-5 flex items-center justify-between shadow-lg">
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Next Auto-Scan</p>
            <p className="text-xs font-bold text-gray-300 mt-1 truncate">
              {loadingStatus ? '...' : status?.next_run ? new Date(status.next_run).toLocaleTimeString() : 'N/A'}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-yellow-400/10 text-yellow-400 border border-yellow-400/20">
            <Clock size={20} />
          </div>
        </div>
      </div>

      {/* Control Panel */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#111118] border border-[#1e1e2e] rounded-2xl p-4 shadow-md">
        <div>
          <h3 className="text-sm font-black text-white uppercase tracking-wider">Manual Sentinel Scan</h3>
          <p className="text-[11px] text-gray-500 mt-0.5">Scrapes latest Titan trades and regulatory filings immediately.</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => void fetchStatus()}
            disabled={loadingStatus}
            className="p-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-all disabled:opacity-50"
            title="Refresh Status"
          >
            <RefreshCw size={16} className={loadingStatus ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={runScan}
            disabled={scanning}
            className="flex items-center space-x-2 px-4 py-2.5 bg-cyan-400 text-black font-black uppercase tracking-wider text-xs rounded-xl hover:bg-cyan-300 transition-all disabled:opacity-50"
          >
            {scanning ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>Scanning...</span>
              </>
            ) : (
              <>
                <Play size={14} fill="black" />
                <span>Scan Now</span>
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-950/20 border border-red-500/30 rounded-2xl text-xs text-red-400">
          {error}
        </div>
      )}

      {/* Findings List */}
      <div className="bg-[#111118] border border-[#1e1e2e] rounded-[2rem] p-6 shadow-xl">
        <h3 className="text-sm font-black text-cyan-400 uppercase tracking-widest mb-4">Latest Intel Findings</h3>
        {loadingFindings ? (
          <div className="flex flex-col items-center justify-center py-10 space-y-3">
            <RefreshCw className="text-cyan-400 animate-spin" size={24} />
            <p className="text-xs text-gray-500">Retrieving recent Titan updates...</p>
          </div>
        ) : findings.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-xs text-gray-500 uppercase tracking-wider">No findings recorded yet. Click Scan Now.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-[10px] uppercase tracking-widest text-gray-500">
                  <th className="pb-3 font-black">Titan</th>
                  <th className="pb-3 font-black">Headline</th>
                  <th className="pb-3 font-black">Source</th>
                  <th className="pb-3 font-black">Time Found</th>
                  <th className="pb-3 font-black text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {findings.map((item, idx) => (
                  <tr key={idx} className="text-xs hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 pr-3 font-black text-cyan-300 uppercase tracking-wider">{item.titan}</td>
                    <td className="py-4 pr-3 text-gray-200 font-medium max-w-md truncate" title={item.headline}>
                      {item.headline}
                    </td>
                    <td className="py-4 pr-3 text-purple-400 uppercase tracking-wider font-semibold text-[10px]">
                      {item.source}
                    </td>
                    <td className="py-4 pr-3 text-gray-500 font-mono text-[10px]">
                      {new Date(item.timestamp).toLocaleString()}
                    </td>
                    <td className="py-4 text-right">
                      {item.link ? (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center space-x-1 text-cyan-400 hover:text-cyan-300 font-semibold"
                        >
                          <span>Link</span>
                          <ExternalLink size={12} />
                        </a>
                      ) : (
                        <span className="text-gray-600">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
