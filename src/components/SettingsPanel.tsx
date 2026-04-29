import { FileText, ShieldCheck } from 'lucide-react'

import type { BrokerAccountSummary } from '../types/broker'
import type { ComplianceBundle, ProviderSettingStatus, UserSettings } from '../types/settings'

interface Props {
  settings: UserSettings | null
  compliance: ComplianceBundle | null
  brokerAccount: BrokerAccountSummary | null
  providers: ProviderSettingStatus[]
  onManageProviders: () => void
  onAcknowledgeRisk: () => void
}

export default function SettingsPanel({ settings, compliance, brokerAccount, providers, onManageProviders, onAcknowledgeRisk }: Props) {
  return (
    <div className="space-y-8">
      <div className="p-10 bg-white/5 border border-white/10 rounded-[3rem] space-y-8">
        <div className="flex items-center space-x-4">
          <ShieldCheck className="text-cyan-400" size={24} />
          <h2 className="text-xl font-black uppercase italic">Compliance & Configuration</h2>
        </div>

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

        <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-3">
          <p className="text-xs font-bold text-cyan-400 uppercase">Broker account intelligence</p>
          <p className="text-[10px] text-gray-400 leading-relaxed">
            Broker access is intentionally read-only. FinIntel does not place, modify, or cancel orders. The connection is used only for portfolio context in analytics.
          </p>
          <p className="text-sm text-gray-300">{brokerAccount?.message ?? 'Broker summary not loaded yet.'}</p>
          {brokerAccount && brokerAccount.status === 'connected' && (
            <div className="grid grid-cols-4 gap-4">
              <div><p className="text-[10px] font-black uppercase text-gray-500">Investment</p><p className="text-sm font-bold text-white">₹{brokerAccount.total_investment.toLocaleString()}</p></div>
              <div><p className="text-[10px] font-black uppercase text-gray-500">Current Value</p><p className="text-sm font-bold text-white">₹{brokerAccount.current_value.toLocaleString()}</p></div>
              <div><p className="text-[10px] font-black uppercase text-gray-500">Cash</p><p className="text-sm font-bold text-white">₹{brokerAccount.available_cash.toLocaleString()}</p></div>
              <div><p className="text-[10px] font-black uppercase text-gray-500">PnL</p><p className="text-sm font-bold text-white">₹{brokerAccount.pnl.toLocaleString()}</p></div>
            </div>
          )}
        </div>

        {compliance && (
          <div className="grid grid-cols-2 gap-6">
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
