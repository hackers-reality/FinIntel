export interface RiskProfile {
  startingCapital: number
  maxPositionUsd: number
  maxDailyLossUsd: number
  maxOpenPositions: number
  perTradePercent: number
  dailyDDKill: number
}

export interface PositionRecord {
  id: string
  symbol: string
  qty: number
  entryPrice: number
  currentPrice: number
  pnl: number
  openedAt: string
  closedAt?: string
}

export interface RiskCheck {
  approved: boolean
  riskScore: number
  warnings: string[]
  adjustedSize?: number
  reason?: string
}

export interface AuditLogEntry {
  timestamp: string
  action: 'open' | 'close' | 'panic' | 'risk_check' | 'mode_change'
  symbol?: string
  qty?: number
  price?: number
  pnl?: number
  riskScore?: number
  details?: string
}

export interface RiskState {
  profile: RiskProfile
  positions: PositionRecord[]
  dailyPnL: number
  dailyLoss: number
  drawdown: number
  totalTrades: number
  winRate: number
  auditLog: AuditLogEntry[]
  isTradingHalted: boolean
}

export const DEFAULT_RISK_PROFILE: RiskProfile = {
  startingCapital: 200000,
  maxPositionUsd: 2000,
  maxDailyLossUsd: 1000,
  maxOpenPositions: 5,
  perTradePercent: 5,
  dailyDDKill: 10,
}
