import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

import type { ProviderSettingInput, ProviderSettingStatus } from '../types/settings'

const PROVIDERS = [
  { value: 'openai', label: 'OpenAI', baseUrl: '' },
  { value: 'groq', label: 'Groq', baseUrl: 'https://api.groq.com/openai/v1' },
  { value: 'nvidia', label: 'NVIDIA NIM', baseUrl: 'https://integrate.api.nvidia.com/v1' },
  { value: 'custom', label: 'Custom OpenAI-Compatible', baseUrl: '' },
]

interface Props {
  isOpen: boolean
  onClose: () => void
  onSave: (payload: ProviderSettingInput) => Promise<void>
  onVerify: (provider: string) => Promise<void>
  providers: ProviderSettingStatus[]
  defaultProvider?: string
}

export default function ProviderModal({ isOpen, onClose, onSave, onVerify, providers, defaultProvider = 'openai' }: Props) {
  const [provider, setProvider] = useState(defaultProvider)
  const [apiKey, setApiKey] = useState('')
  const [baseUrl, setBaseUrl] = useState('')
  const [model, setModel] = useState('gpt-4.1-mini')
  const [message, setMessage] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      setMessage(null)
      setApiKey('')
    }
  }, [isOpen])

  useEffect(() => {
    const current = PROVIDERS.find((item) => item.value === provider)
    setBaseUrl(current?.baseUrl ?? '')
  }, [provider])

  if (!isOpen) {
    return null
  }

  const selected = providers.find((item) => item.provider === provider)

  async function saveProvider() {
    setIsSaving(true)
    try {
      await onSave({
        provider,
        api_key: apiKey,
        base_url: baseUrl || null,
        model: model || null,
      })
      setMessage('Provider key saved. Run verify to confirm access.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to save provider key.')
    } finally {
      setIsSaving(false)
    }
  }

  async function verifyProvider() {
    setIsSaving(true)
    try {
      await onVerify(provider)
      setMessage('Provider verification completed.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to verify provider key.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 px-4">
      <div className="w-full max-w-3xl rounded-[2.5rem] border border-white/10 bg-[#070b12] p-6 shadow-2xl shadow-black/40">
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-cyan-300">Provider keys</p>
            <h3 className="mt-2 text-2xl font-black">LLM key entry and verification</h3>
            <p className="mt-2 text-sm text-gray-400 leading-relaxed">
              Use this for OpenAI-compatible providers. Keys are stored encrypted locally for development convenience and should be replaced by an external secret manager in production.
            </p>
          </div>
          <button onClick={onClose} className="rounded-full border border-white/10 bg-white/5 p-2 text-gray-300">
            <X size={18} />
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Provider</span>
            <select value={provider} onChange={(event) => setProvider(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none">
              {PROVIDERS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Model</span>
            <input value={model} onChange={(event) => setModel(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none" placeholder="gpt-4.1-mini" />
          </label>
          <label className="space-y-2 md:col-span-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">API Key</span>
            <input value={apiKey} onChange={(event) => setApiKey(event.target.value)} type="password" className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none" placeholder="Paste your LLM key" />
          </label>
          <label className="space-y-2 md:col-span-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Base URL</span>
            <input value={baseUrl} onChange={(event) => setBaseUrl(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none" placeholder="Optional OpenAI-compatible endpoint" />
          </label>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-gray-400">
            {selected?.verification_status ? `Last status: ${selected.verification_status}` : 'No verification status yet.'}
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={saveProvider} disabled={isSaving} className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-[10px] font-black uppercase tracking-widest">
              Save
            </button>
            <button onClick={verifyProvider} disabled={isSaving} className="rounded-2xl bg-cyan-300 px-5 py-3 text-[10px] font-black uppercase tracking-widest text-black">
              Verify
            </button>
          </div>
        </div>

        {message && <p className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-300">{message}</p>}

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {providers.map((item) => (
            <div key={item.provider} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold capitalize">{item.provider}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">{item.has_key ? 'key saved' : 'empty'}</p>
              </div>
              <p className="mt-2 text-xs text-gray-400">{item.verification_message ?? 'Not verified yet.'}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
