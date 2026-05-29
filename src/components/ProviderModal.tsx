import { useEffect, useState } from 'react'
import { X, RefreshCw } from 'lucide-react'

import type { ProviderSettingInput, ProviderSettingStatus } from '../types/settings'
import { API_BASE_URL } from '../constants/api'

const PROVIDERS = [
  { value: 'nvidia_nim', label: 'NVIDIA NIM', baseUrl: 'https://integrate.api.nvidia.com/v1' },
  { value: 'openai', label: 'OpenAI', baseUrl: '' },
  { value: 'anthropic', label: 'Anthropic', baseUrl: 'https://api.anthropic.com/v1' },
  { value: 'groq', label: 'Groq', baseUrl: 'https://api.groq.com/openai/v1' },
  { value: 'openrouter', label: 'OpenRouter', baseUrl: 'https://openrouter.ai/api/v1' },
  { value: 'custom', label: 'Custom OpenAI-Compatible', baseUrl: '' },
]

const PROVIDER_MODELS: Record<string, { value: string; label: string }[]> = {
  nvidia_nim: [
    { value: 'meta/llama-3.1-70b-instruct', label: 'meta/llama-3.1-70b-instruct (Llama 3.1 70B)' },
    { value: 'meta/llama3-70b-instruct', label: 'meta/llama3-70b-instruct (Llama 3 70B)' },
    { value: 'nvidia/llama-3.1-nemotron-70b-instruct', label: 'nvidia/llama-3.1-nemotron-70b-instruct (Nemotron)' },
    { value: 'mistralai/mixtral-8x22b-instruct-v0.1', label: 'mistralai/mixtral-8x22b-instruct-v0.1 (Mixtral)' },
  ],
  openai: [
    { value: 'gpt-4o', label: 'gpt-4o (GPT-4o)' },
    { value: 'gpt-4o-mini', label: 'gpt-4o-mini (GPT-4o Mini)' },
    { value: 'gpt-4-turbo', label: 'gpt-4-turbo (GPT-4 Turbo)' },
    { value: 'o1-mini', label: 'o1-mini (o1 Mini)' },
  ],
  anthropic: [
    { value: 'claude-3-5-sonnet-latest', label: 'claude-3-5-sonnet-latest (Claude 3.5 Sonnet)' },
    { value: 'claude-sonnet-4-20250514', label: 'claude-sonnet-4-20250514 (Claude 4)' },
    { value: 'claude-3-5-haiku-latest', label: 'claude-3-5-haiku-latest (Claude 3.5 Haiku)' },
    { value: 'claude-3-opus-20240229', label: 'claude-3-opus-20240229 (Claude 3 Opus)' },
  ],
  groq: [
    { value: 'llama-3.3-70b-versatile', label: 'llama-3.3-70b-versatile (Llama 3.3 70B)' },
    { value: 'llama3-70b-8192', label: 'llama3-70b-8192 (Llama 3 70B)' },
    { value: 'mixtral-8x7b-32768', label: 'mixtral-8x7b-32768 (Mixtral 8x7B)' },
    { value: 'gemma2-9b-it', label: 'gemma2-9b-it (Gemma 2 9B)' },
  ],
  openrouter: [
    { value: 'meta-llama/llama-3.1-70b-instruct', label: 'Llama 3.1 70B Instruct' },
    { value: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
    { value: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet' },
  ],
  custom: [
    { value: 'custom-model', label: 'Custom Model' }
  ]
}

interface Props {
  isOpen: boolean
  onClose: () => void
  onSave: (payload: ProviderSettingInput) => Promise<void>
  onVerify: (provider: string) => Promise<void>
  providers: ProviderSettingStatus[]
  defaultProvider?: string
}

export default function ProviderModal({ isOpen, onClose, onSave, onVerify, providers, defaultProvider = 'nvidia_nim' }: Props) {
  const [provider, setProvider] = useState(defaultProvider)
  const [apiKey, setApiKey] = useState('')
  const [baseUrl, setBaseUrl] = useState('')
  const [model, setModel] = useState('meta/llama-3.1-70b-instruct')
  const [message, setMessage] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Dynamic models state
  const [dynamicModels, setDynamicModels] = useState<string[]>([])
  const [selectedSubprovider, setSelectedSubprovider] = useState<string>('all')
  const [isLoadingModels, setIsLoadingModels] = useState(false)

  const selected = providers.find((item) => item.provider === provider)

  // Fetch available models from provider's endpoint
  const fetchModels = async (keyToUse?: string) => {
    const hasSavedKey = selected?.has_key
    if (!keyToUse && !hasSavedKey) {
      setDynamicModels([])
      return
    }

    setIsLoadingModels(true)
    try {
      const accessToken = localStorage.getItem('finintel_access_token')
      const response = await fetch(`${API_BASE_URL}/settings/providers/${provider}/models`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          api_key: keyToUse || null,
          base_url: baseUrl || null
        })
      })
      if (response.ok) {
        const list = await response.json() as string[]
        if (Array.isArray(list) && list.length > 0) {
          setDynamicModels(list)
          
          // Autofill model if current model is not in the list
          const savedModel = selected?.model
          if (savedModel && list.includes(savedModel)) {
            setModel(savedModel)
          } else {
            // Pick first matching model
            const initialModel = provider === 'openrouter' 
              ? list.find(m => m.startsWith(selectedSubprovider + '/')) || list[0]
              : list[0]
            setModel(initialModel)
          }
          return
        }
      }
    } catch (e) {
      console.error("Failed to load models:", e)
    } finally {
      setIsLoadingModels(false)
    }
    setDynamicModels([])
  }

  useEffect(() => {
    if (!isOpen) {
      setMessage(null)
      setApiKey('')
    }
  }, [isOpen])

  // Synchronize model and base URL when provider changes
  useEffect(() => {
    const providerDefault = PROVIDERS.find((item) => item.value === provider)
    
    // Set base URL
    setBaseUrl(selected?.base_url || providerDefault?.baseUrl || '')
    
    // Reset key input when switching providers
    setApiKey('')
    setSelectedSubprovider('all')

    // Fetch models automatically if provider has saved key
    if (selected?.has_key) {
      void fetchModels()
    } else {
      setDynamicModels([])
      const availableModels = PROVIDER_MODELS[provider] || []
      const defaultModelVal = availableModels[0]?.value || ''
      setModel(defaultModelVal)
    }
  }, [provider, providers])

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
      // Refresh models after save
      void fetchModels(apiKey)
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
      void fetchModels(apiKey)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to verify provider key.')
    } finally {
      setIsSaving(false)
    }
  }

  // Parse subproviders for OpenRouter
  const subproviders = Array.from(new Set(
    dynamicModels
      .filter(m => m.includes('/'))
      .map(m => m.split('/')[0])
  )).sort()

  // Filter dynamic models
  const filteredDynamicModels = selectedSubprovider === 'all'
    ? dynamicModels
    : dynamicModels.filter(m => m.startsWith(selectedSubprovider + '/'))

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 px-4 cursor-pointer" onClick={onClose}>
      <div className="w-full max-w-3xl rounded-[2.5rem] border border-white/10 bg-[#070b12] p-6 shadow-2xl shadow-black/40 max-h-[90vh] overflow-y-auto cursor-default" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-cyan-300">Provider keys</p>
            <h3 className="mt-2 text-2xl font-black">LLM key entry and verification</h3>
            <p className="mt-2 text-sm text-gray-400 leading-relaxed">
              Use this for OpenAI-compatible providers. Keys are stored encrypted locally for development convenience and should be replaced by an external secret manager in production.
            </p>
          </div>
          <button onClick={onClose} className="rounded-full border border-white/10 bg-white/5 p-2 text-gray-300 hover:bg-white/10 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="space-y-2 flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Provider</span>
            <select value={provider} onChange={(event) => setProvider(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none text-white">
              {PROVIDERS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>

          {/* Subprovider Dropdown */}
          {subproviders.length > 0 && (
            <label className="space-y-2 flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">Sub-provider</span>
              <select 
                value={selectedSubprovider} 
                onChange={(event) => {
                  setSelectedSubprovider(event.target.value)
                  const filtered = event.target.value === 'all'
                    ? dynamicModels
                    : dynamicModels.filter(m => m.startsWith(event.target.value + '/'))
                  if (filtered.length > 0) {
                    setModel(filtered[0])
                  }
                }} 
                className="w-full rounded-2xl border border-cyan-400/20 bg-black/30 px-4 py-3 text-sm outline-none text-white focus:border-cyan-400/50"
              >
                <option value="all">All sub-providers</option>
                {subproviders.map((sp) => (
                  <option key={sp} value={sp}>{sp}</option>
                ))}
              </select>
            </label>
          )}

          <label className="space-y-2 flex flex-col md:col-span-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex justify-between items-center w-full">
              <span>Model</span>
              {isLoadingModels && <RefreshCw size={10} className="animate-spin text-cyan-400" />}
            </span>
            {provider === 'custom' ? (
              <input 
                value={model} 
                onChange={(event) => setModel(event.target.value)} 
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none text-white placeholder-gray-600" 
                placeholder="e.g. custom-llm-v1" 
              />
            ) : (
              <select 
                value={model} 
                onChange={(event) => setModel(event.target.value)} 
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none text-white"
              >
                {dynamicModels.length > 0 ? (
                  filteredDynamicModels.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))
                ) : (
                  (PROVIDER_MODELS[provider] || []).map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))
                )}
              </select>
            )}
          </label>

          <label className="space-y-2 md:col-span-2 flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">API Key</span>
            <div className="relative flex items-center">
              <input 
                value={apiKey} 
                onChange={(event) => setApiKey(event.target.value)} 
                onBlur={() => {
                  if (apiKey) void fetchModels(apiKey)
                }}
                type="password" 
                className="w-full rounded-2xl border border-white/10 bg-black/30 pl-4 pr-32 py-3 text-sm outline-none text-white placeholder-gray-600" 
                placeholder={selected?.has_key ? "•••••••••••••••• (Saved)" : "Paste your LLM key"} 
              />
              <button 
                type="button"
                onClick={() => void fetchModels(apiKey)}
                className="absolute right-2 px-3 py-1 bg-white/5 border border-white/10 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-colors"
              >
                Fetch Models
              </button>
            </div>
          </label>
          
          {provider === 'custom' && (
            <label className="space-y-2 md:col-span-2 flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Base URL</span>
              <input value={baseUrl} onChange={(event) => setBaseUrl(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none text-white placeholder-gray-600" placeholder="Optional OpenAI-compatible endpoint" />
            </label>
          )}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-gray-400">
            {selected?.verification_status ? `Last status: ${selected.verification_status}` : 'No verification status yet.'}
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={saveProvider} disabled={isSaving} className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-colors">
              Save
            </button>
            <button onClick={verifyProvider} disabled={isSaving} className="rounded-2xl bg-cyan-300 px-5 py-3 text-[10px] font-black uppercase tracking-widest text-black hover:bg-cyan-200 transition-colors">
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
                <p className="text-[10px] font-black uppercase tracking-widest text-cyan-400 truncate max-w-[150px]">{item.model || 'Default Model'}</p>
              </div>
              <div className="mt-2 flex justify-between items-center text-xs text-gray-400">
                <span>{item.has_key ? 'Key configured ✓' : 'No key saved'}</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{item.verification_status ?? 'Unverified'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
