import { FileText, ShieldCheck } from 'lucide-react'

import type { BrokerAccountSummary } from '../types/broker'
import type { ComplianceBundle, UserSettings } from '../types/settings'

interface Props {
  settings: UserSettings | null
  compliance: ComplianceBundle | null
  brokerAccount: BrokerAccountSummary | null
  onAcknowledgeRisk: () => void
}

export default function SettingsPanel({ settings, compliance, brokerAccount, onAcknowledgeRisk }: Props) {
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
            Provider keys and broker credentials are not stored in the application UI. Configure them through environment variables or an external secret manager for production use.
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
