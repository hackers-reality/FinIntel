import { FileText, ShieldCheck, Cpu } from 'lucide-react'

import { listConfiguredProviders, getRegistryState } from '../services/ai-provider-registry'
import type { BrokerAccountSummary } from '../types/broker'
import type { ComplianceBundle, ProviderSettingStatus, UserSettings } from '../types/settings'

const cn = (...classes: string[]) => classes.filter(Boolean).join(' ')

interface Props {
  settings: UserSettings | null
  compliance: ComplianceBundle | null
  brokerAccount: BrokerAccountSummary | null
  providers: ProviderSettingStatus[]
  onManageProviders: () => void
  onAcknowledgeRisk: () => void
  onUpdateSettings?: (updates: Partial<UserSettings>) => Promise<void>
}

export default function SettingsPanel({
  settings,
  compliance,
  brokerAccount,
  providers,
  onManageProviders,
  onAcknowledgeRisk,
  onUpdateSettings,
}: Props) {
  return (
    <div className="space-y-8">
      <div className="p-10 bg-white/5 border border-white/10 rounded-[3rem] space-y-8">
        <div className="flex items-center space-x-4">
          <ShieldCheck className="text-cyan-400" size={24} />
          <h2 className="text-xl font-black uppercase italic">Compliance & Configuration</h2>
        </div>

        {/* Secret Handling / Risk Disclosure */}
        <div className="p-6 bg-cyan-400/5 border border-cyan-400/20 rounded-2xl space-y-4">
          <p className="text-xs font-bold text-cyan-400 uppercase">Secret handling</p>
          <p className="text-[10px] text-gray-400 leading-relaxed">
            Provider keys can be stored locally for development and verification, but production deployments should use environment variables or an external secret manager.
          </p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase text-gray-500">Risk disclosure acknowledged</p>
              <p className="text-sm text-gray-300">{settings?.risk_acknowledged ? 'Yes' : 'Pending'}</p>
            </div>
            <button onClick={onAcknowledgeRisk} className="px-5 py-3 rounded-2xl bg-cyan-400 text-black text-[10px] font-black uppercase">
              Acknowledge
            </button>
          </div>
        </div>

        {/* LLM Providers Management */}
        <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-cyan-400 uppercase">LLM providers</p>
              <p className="text-[10px] text-gray-400 leading-relaxed">
                Add and verify OpenAI-compatible keys from a modal rather than scattering secret inputs through the interface.
              </p>
            </div>
            <button onClick={onManageProviders} className="rounded-2xl bg-cyan-300 px-5 py-3 text-[10px] font-black uppercase tracking-widest text-black">
              Manage Keys
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {providers.map((provider) => (
              <div key={provider.provider} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold capitalize">{provider.provider}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">{provider.verification_status ?? 'unverified'}</p>
                </div>
                <p className="mt-2 text-xs text-gray-400">{provider.model ?? 'No model selected'}</p>
                <p className="mt-1 text-[10px] text-gray-500">{provider.verification_message ?? 'No verification message yet.'}</p>
              </div>
            ))}
          </div>
        </div>

        {/* AI Provider Registry */}
        <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-4">
          <div className="flex items-center space-x-3">
            <Cpu size={18} className="text-cyan-400" />
            <p className="text-xs font-bold text-cyan-400 uppercase">AI Provider Registry</p>
          </div>
          <p className="text-[10px] text-gray-400 leading-relaxed">
            Multi-provider support with role-based routing. Configure once, use across research, analysis, and document review.
          </p>
          <div className="grid grid-cols-3 gap-3">
            {(() => {
              try {
                const configured = listConfiguredProviders()
                const registry = getRegistryState()
                return (
                  <>
                    <div className="p-3 bg-black/20 rounded-xl">
                      <p className="text-[10px] font-black uppercase text-gray-500">Configured</p>
                      <p className="text-lg font-black text-white">{configured.length}</p>
                    </div>
                    <div className="p-3 bg-black/20 rounded-xl">
                      <p className="text-[10px] font-black uppercase text-gray-500">Preferred</p>
                      <p className="text-sm font-bold text-white capitalize">{registry.preferred}</p>
                    </div>
                    <div className="p-3 bg-black/20 rounded-xl">
                      <p className="text-[10px] font-black uppercase text-gray-500">Available</p>
                      <p className="text-lg font-black text-white">{providers.length + 8}</p>
                    </div>
                  </>
                )
              } catch {
                return <p className="text-xs text-gray-500 col-span-3">Registry not initialized</p>
              }
            })()}
          </div>
        </div>

        {/* Debug Environment Keys */}
        <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-4">
          <p className="text-xs font-bold text-cyan-400 uppercase">Environment Keys</p>
          <p className="text-[10px] text-gray-400 leading-relaxed">
            API keys loaded from <code className="text-cyan-400">.env</code> file (read-only, shown only if present).
          </p>
          <div className="grid grid-cols-2 gap-3">
            {(() => {
              const envKeys = [
                { name: 'NVIDIA NIM', key: 'NVIDIA_NIM_API_KEY', envKey: 'nvidia_nim_api_key' },
                { name: 'OpenAI', key: 'OPENAI_API_KEY', envKey: 'openai_api_key' },
                { name: 'Alpha Vantage', key: 'ALPHA_VANTAGE_API_KEY', envKey: 'alpha_vantage_api_key' },
                { name: 'Polygon', key: 'POLYGON_API_KEY', envKey: 'polygon_api_key' },
              ]
              const params = new URLSearchParams(window.location.search)
              const showEnv = params.get('debug') === 'env'
              if (!showEnv) {
                return (
                  <p className="text-[10px] text-gray-500 col-span-2">
                    Add <code className="text-cyan-400">?debug=env</code> to URL to view env keys status.
                  </p>
                )
              }
              return envKeys.map(({ name, key, envKey }) => {
                const stored = localStorage.getItem(`ai_key_${envKey}`)
                const masked = stored ? `${stored.slice(0, 8)}...${stored.slice(-4)}` : 'Not configured'
                return (
                  <div key={key} className="p-3 bg-black/20 rounded-xl">
                    <p className="text-[10px] font-black uppercase text-gray-500">{name}</p>
                    <p className="text-xs font-bold text-white truncate">{masked}</p>
                  </div>
                )
              })
            })()}
          </div>
        </div>

        {/* Zerodha Kite Broker configuration */}
        <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-4">
          <div className="flex items-center space-x-3">
            <Cpu size={18} className="text-cyan-400" />
            <p className="text-xs font-bold text-cyan-400 uppercase">Broker Account Intelligence (Zerodha Kite)</p>
          </div>
          <p className="text-[10px] text-gray-400 leading-relaxed">
            Broker connection is read-only. FinIntel never places, modifies, or cancels trading orders. This data is leveraged strictly for asset valuation context and AI risk modeling.
          </p>
          
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              const fd = new FormData(e.currentTarget)
              const apiKey = fd.get('api_key') as string
              const accessToken = fd.get('access_token') as string
              const enabled = fd.get('enabled') === 'true'
              if (onUpdateSettings) {
                try {
                  await onUpdateSettings({
                    zerodha_api_key: apiKey,
                    zerodha_access_token: accessToken,
                    zerodha_enabled: enabled,
                  })
                  alert('Zerodha credentials saved. Refreshing broker metrics...')
                  window.location.reload()
                } catch {
                  alert('Failed to update credentials settings.')
                }
              }
            }}
            className="space-y-4 bg-black/30 p-5 rounded-2xl border border-white/5"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[9px] font-black uppercase text-gray-500 mb-1">Zerodha API Key</label>
                <input
                  type="text"
                  name="api_key"
                  defaultValue={settings?.zerodha_api_key ?? ''}
                  placeholder="Enter API Key"
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-white placeholder-gray-600 focus:border-cyan-300 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[9px] font-black uppercase text-gray-500 mb-1">Zerodha Access Token</label>
                <input
                  type="password"
                  name="access_token"
                  defaultValue={settings?.zerodha_access_token ?? ''}
                  placeholder="Enter Access Token"
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-white placeholder-gray-600 focus:border-cyan-300 focus:outline-none"
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="zerodha_enabled"
                  name="enabled"
                  value="true"
                  defaultChecked={settings?.zerodha_enabled ?? false}
                  className="rounded border-white/10 bg-black/40 text-cyan-300 focus:ring-0 cursor-pointer"
                />
                <label htmlFor="zerodha_enabled" className="text-[10px] font-bold text-gray-400 uppercase cursor-pointer select-none">
                  Enable Zerodha Read-only connection
                </label>
              </div>
              <button type="submit" className="rounded-xl bg-cyan-300 px-5 py-2 text-[10px] font-black uppercase text-black hover:bg-cyan-200 transition-colors">
                Connect Accounts
              </button>
            </div>
          </form>

          <div className="border-t border-white/5 pt-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Connection Status</p>
            <p className="text-sm text-gray-300">{brokerAccount?.message ?? 'Broker summary not loaded yet.'}</p>
            {brokerAccount && brokerAccount.status === 'connected' && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 bg-black/30 p-4 rounded-xl border border-white/5">
                <div>
                  <p className="text-[9px] font-black uppercase text-gray-500">Invested Capital</p>
                  <p className="text-sm font-bold text-white mt-1">₹{brokerAccount.total_investment.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase text-gray-500">Current Valuation</p>
                  <p className="text-sm font-bold text-white mt-1">₹{brokerAccount.current_value.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase text-gray-500">Cash Balance</p>
                  <p className="text-sm font-bold text-white mt-1">₹{brokerAccount.available_cash.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase text-gray-500">Net Profit/Loss</p>
                  <p className={cn('text-sm font-bold mt-1', brokerAccount.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
                    ₹{brokerAccount.pnl.toLocaleString()}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {compliance && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-3">
              <div className="flex items-center space-x-3">
                <FileText className="text-cyan-400 shrink-0" size={18} />
                <p className="text-xs font-bold text-cyan-400 uppercase">{compliance.privacy_policy.title}</p>
              </div>
              <p className="text-[10px] text-gray-400 leading-relaxed">{compliance.privacy_policy.summary}</p>
              {compliance.privacy_policy.sections.map((section) => (
                <p key={section} className="text-[10px] text-gray-500 leading-relaxed">{section}</p>
              ))}
            </div>
            <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-3">
              <p className="text-xs font-bold text-cyan-400 uppercase">{compliance.terms_of_service.title}</p>
              <p className="text-[10px] text-gray-400 leading-relaxed">{compliance.terms_of_service.summary}</p>
              {compliance.terms_of_service.sections.map((section) => (
                <p key={section} className="text-[10px] text-gray-500 leading-relaxed">{section}</p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
