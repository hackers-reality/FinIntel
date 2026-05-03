import { AlertTriangle, Shield, TrendingDown, TrendingUp } from 'lucide-react'
import { getPositionsSummary, getAuditLog } from '../services/risk-engine'
import type { RiskState } from '../types/risk-engine'

const cn = (...classes: string[]) => classes.filter(Boolean).join(' ')

interface Props {
  riskState: RiskState
}

export default function RiskPanel({ riskState }: Props) {
  const positions = getPositionsSummary()
  const auditLog = getAuditLog(20)

  const riskScore = riskState.dailyLoss / riskState.profile.maxDailyLossUsd
  const drawdownRatio = riskState.drawdown / (riskState.profile.startingCapital * riskState.profile.dailyDDKill / 100)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
          <p className="text-[10px] font-black uppercase text-gray-500 mb-1">Daily P&L</p>
          <p className={cn('text-lg font-black', riskState.dailyPnL >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
            {riskState.dailyPnL >= 0 ? '+' : ''}₹{riskState.dailyPnL.toFixed(2)}
          </p>
        </div>
        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
          <p className="text-[10px] font-black uppercase text-gray-500 mb-1">Win Rate</p>
          <p className="text-lg font-black text-white">{(riskState.winRate * 100).toFixed(1)}%</p>
        </div>
        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
          <p className="text-[10px] font-black uppercase text-gray-500 mb-1">Open Positions</p>
          <p className="text-lg font-black text-white">{positions.positionCount}/{riskState.profile.maxOpenPositions}</p>
        </div>
        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
          <p className="text-[10px] font-black uppercase text-gray-500 mb-1">Total Trades</p>
          <p className="text-lg font-black text-white">{riskState.totalTrades}</p>
        </div>
      </div>

      <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-4">
        <div className="flex items-center space-x-3">
          <Shield size={18} className="text-cyan-400" />
          <h3 className="text-xs font-black uppercase text-cyan-400">Risk Metrics</h3>
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] font-black uppercase text-gray-500">Daily Loss Usage</p>
              <p className="text-xs font-bold text-white">₹{riskState.dailyLoss.toFixed(2)} / ₹{riskState.profile.maxDailyLossUsd}</p>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all', riskScore > 0.8 ? 'bg-rose-400' : riskScore > 0.5 ? 'bg-amber-400' : 'bg-emerald-400')}
                style={{ width: `${Math.min(riskScore * 100, 100)}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] font-black uppercase text-gray-500">Drawdown</p>
              <p className="text-xs font-bold text-white">₹{riskState.drawdown.toFixed(2)} / ₹{(riskState.profile.startingCapital * riskState.profile.dailyDDKill / 100).toFixed(2)}</p>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all', drawdownRatio > 0.8 ? 'bg-rose-400' : drawdownRatio > 0.5 ? 'bg-amber-400' : 'bg-emerald-400')}
                style={{ width: `${Math.min(drawdownRatio * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {riskState.isTradingHalted && (
          <div className="flex items-center space-x-3 p-4 bg-rose-400/10 border border-rose-400/30 rounded-xl">
            <AlertTriangle size={16} className="text-rose-400" />
            <p className="text-xs font-bold text-rose-400">Trading Halted - Daily drawdown limit exceeded</p>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3 pt-2">
          <div>
            <p className="text-[10px] font-black uppercase text-gray-500">Max Position</p>
            <p className="text-sm font-bold text-white">${riskState.profile.maxPositionUsd.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-gray-500">Per Trade</p>
            <p className="text-sm font-bold text-white">{riskState.profile.perTradePercent}%</p>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-gray-500">Kill Switch</p>
            <p className="text-sm font-bold text-white">{riskState.profile.dailyDDKill}% DD</p>
          </div>
        </div>
      </div>

      {positions.positions.length > 0 && (
        <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-3">
          <h3 className="text-xs font-black uppercase text-gray-500">Open Positions</h3>
          <div className="space-y-2">
            {positions.positions.map((pos) => (
              <div key={pos.id} className="flex items-center justify-between p-3 bg-black/20 rounded-xl">
                <div>
                  <p className="text-sm font-bold text-white">{pos.symbol}</p>
                  <p className="text-[10px] text-gray-500">{pos.qty} shares @ ${pos.entryPrice.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className={cn('text-sm font-bold', pos.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
                    {pos.pnl >= 0 ? '+' : ''}${pos.pnl.toFixed(2)}
                  </p>
                  <p className="text-[10px] text-gray-500">${pos.currentPrice.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {auditLog.length > 0 && (
        <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-3">
          <h3 className="text-xs font-black uppercase text-gray-500">Audit Log</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {auditLog.map((entry, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-black/20 rounded-xl">
                <div className="mt-0.5">
                  {entry.action === 'open' && <TrendingUp size={14} className="text-emerald-400" />}
                  {entry.action === 'close' && <TrendingDown size={14} className="text-rose-400" />}
                  {entry.action === 'panic' && <AlertTriangle size={14} className="text-rose-400" />}
                  {entry.action === 'risk_check' && <Shield size={14} className="text-cyan-400" />}
                  {entry.action === 'mode_change' && <Shield size={14} className="text-amber-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-300 truncate">{entry.details}</p>
                  <p className="text-[10px] text-gray-600">{new Date(entry.timestamp).toLocaleString()}</p>
                </div>
                {entry.pnl !== undefined && (
                  <p className={cn('text-xs font-bold', entry.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
                    {entry.pnl >= 0 ? '+' : ''}${entry.pnl.toFixed(2)}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
