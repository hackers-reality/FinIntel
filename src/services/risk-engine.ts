import type {
  AuditLogEntry,
  PositionRecord,
  RiskCheck,
  RiskProfile,
  RiskState,
} from '../types/risk-engine'
import { DEFAULT_RISK_PROFILE } from '../types/risk-engine'

let state: RiskState = {
  profile: DEFAULT_RISK_PROFILE,
  positions: [],
  dailyPnL: 0,
  dailyLoss: 0,
  drawdown: 0,
  totalTrades: 0,
  winRate: 0,
  auditLog: [],
  isTradingHalted: false,
}

let wins = 0

function addAuditEntry(entry: Omit<AuditLogEntry, 'timestamp'>): void {
  const fullEntry: AuditLogEntry = {
    ...entry,
    timestamp: new Date().toISOString(),
  }
  state.auditLog.unshift(fullEntry)

  if (state.auditLog.length > 500) {
    state.auditLog = state.auditLog.slice(0, 500)
  }
}

export function initRiskEngine(profile?: Partial<RiskProfile>): RiskState {
  state = {
    ...state,
    profile: { ...DEFAULT_RISK_PROFILE, ...profile },
  }
  return state
}

export function getRiskState(): RiskState {
  return state
}

export function updateRiskProfile(profile: Partial<RiskProfile>): void {
  state.profile = { ...state.profile, ...profile }
  addAuditEntry({
    action: 'mode_change',
    details: `Risk profile updated: ${JSON.stringify(profile)}`,
  })
}

export function kellySize(
  winProbability: number,
  winAmount: number,
  lossAmount: number,
  bankroll: number,
  fraction = 0.25,
): number {
  if (lossAmount <= 0 || winAmount <= 0) {
    return 0
  }

  const b = winAmount / lossAmount
  const p = winProbability
  const q = 1 - p
  const kelly = (b * p - q) / b

  if (kelly <= 0) {
    return 0
  }

  const kellyAmount = kelly * bankroll * fraction
  const maxByPercent = bankroll * (state.profile.perTradePercent / 100)

  return Math.min(kellyAmount, maxByPercent, state.profile.maxPositionUsd)
}

export function calculateRiskScore(): number {
  let score = 0

  const positionCount = state.positions.length
  if (positionCount >= state.profile.maxOpenPositions) {
    score += 0.3
  } else if (positionCount >= state.profile.maxOpenPositions - 1) {
    score += 0.15
  }

  if (state.dailyLoss > 0) {
    const lossRatio = state.dailyLoss / state.profile.maxDailyLossUsd
    score += Math.min(lossRatio * 0.3, 0.3)
  }

  const ddRatio = state.drawdown / state.profile.dailyDDKill
  score += Math.min(ddRatio * 0.3, 0.3)

  if (positionCount > 0) {
    const totalValue = state.positions.reduce((sum, p) => sum + p.qty * p.currentPrice, 0)
    if (totalValue > 0) {
      const largestPosition = Math.max(...state.positions.map((p) => p.qty * p.currentPrice))
      const concentration = largestPosition / totalValue
      if (concentration > 0.5) {
        score += 0.1
      }
    }
  }

  return Math.min(score, 1.0)
}

export function checkTrade(params: {
  symbol: string
  qty: number
  price: number
  winProbability?: number
  winAmount?: number
  lossAmount?: number
}): RiskCheck {
  const { symbol, qty, price, winProbability, winAmount, lossAmount } = params
  const positionValue = qty * price
  const warnings: string[] = []

  if (state.isTradingHalted) {
    return {
      approved: false,
      riskScore: 1.0,
      warnings: ['Trading is halted due to daily drawdown limit'],
      reason: 'Trading halted - daily drawdown exceeded',
    }
  }

  if (positionValue > state.profile.maxPositionUsd) {
    warnings.push(`Position size $${positionValue.toFixed(2)} exceeds max $${state.profile.maxPositionUsd}`)
  }

  if (state.positions.length >= state.profile.maxOpenPositions) {
    warnings.push(`Maximum open positions (${state.profile.maxOpenPositions}) reached`)
  }

  if (state.dailyLoss >= state.profile.maxDailyLossUsd) {
    return {
      approved: false,
      riskScore: 1.0,
      warnings: ['Daily loss limit reached'],
      reason: 'Daily loss limit exceeded',
    }
  }

  const drawdownThreshold = state.profile.startingCapital * (state.profile.dailyDDKill / 100)
  if (state.drawdown >= drawdownThreshold) {
    state.isTradingHalted = true
    addAuditEntry({
      action: 'panic',
      details: `Trading halted: drawdown ${state.drawdown.toFixed(2)} exceeds threshold ${drawdownThreshold.toFixed(2)}`,
    })
    return {
      approved: false,
      riskScore: 1.0,
      warnings: ['Kill switch triggered - daily drawdown exceeded'],
      reason: 'Kill switch activated',
    }
  }

  let adjustedSize: number | undefined
  if (winProbability !== undefined && winAmount !== undefined && lossAmount !== undefined) {
    const kelly = kellySize(winProbability, winAmount, lossAmount, state.profile.startingCapital)
    if (kelly < positionValue) {
      adjustedSize = kelly
      warnings.push(`Kelly sizing recommends $${kelly.toFixed(2)} vs requested $${positionValue.toFixed(2)}`)
    }
  }

  const positionCountWarning = state.positions.length >= state.profile.maxOpenPositions - 1
  if (positionCountWarning) {
    warnings.push(`Approaching max positions (${state.positions.length}/${state.profile.maxOpenPositions})`)
  }

  const riskScore = calculateRiskScore()
  const approved = warnings.length === 0 || adjustedSize !== undefined

  addAuditEntry({
    action: 'risk_check',
    symbol,
    qty,
    price,
    riskScore,
    details: approved ? 'Approved with warnings' : 'Rejected',
  })

  return {
    approved,
    riskScore,
    warnings,
    adjustedSize,
  }
}

export function openPosition(params: {
  symbol: string
  qty: number
  entryPrice: number
}): PositionRecord {
  const { symbol, qty, entryPrice } = params

  const position: PositionRecord = {
    id: `${symbol}-${Date.now()}`,
    symbol,
    qty,
    entryPrice,
    currentPrice: entryPrice,
    pnl: 0,
    openedAt: new Date().toISOString(),
  }

  state.positions.push(position)

  addAuditEntry({
    action: 'open',
    symbol,
    qty,
    price: entryPrice,
    details: `Opened ${qty} shares of ${symbol} at $${entryPrice}`,
  })

  return position
}

export function closePosition(positionId: string, exitPrice: number): PositionRecord | null {
  const index = state.positions.findIndex((p) => p.id === positionId)
  if (index === -1) {
    return null
  }

  const position = state.positions[index]
  const pnl = (exitPrice - position.entryPrice) * position.qty

  position.currentPrice = exitPrice
  position.pnl = pnl
  position.closedAt = new Date().toISOString()

  state.positions.splice(index, 1)

  state.totalTrades++
  if (pnl > 0) {
    wins++
    state.dailyPnL += pnl
  } else {
    state.dailyLoss += Math.abs(pnl)
    state.dailyPnL -= Math.abs(pnl)
  }

  state.drawdown = Math.max(state.drawdown, state.dailyLoss)
  state.winRate = state.totalTrades > 0 ? wins / state.totalTrades : 0

  addAuditEntry({
    action: 'close',
    symbol: position.symbol,
    qty: position.qty,
    price: exitPrice,
    pnl,
    details: `Closed ${position.qty} shares of ${position.symbol} at $${exitPrice}, PnL: $${pnl.toFixed(2)}`,
  })

  return position
}

export function updatePositionPrices(prices: Record<string, number>): void {
  for (const position of state.positions) {
    if (prices[position.symbol] !== undefined) {
      position.currentPrice = prices[position.symbol]
      position.pnl = (position.currentPrice - position.entryPrice) * position.qty
    }
  }
}

export function panicFlatten(): PositionRecord[] {
  const closed = [...state.positions]

  for (const position of state.positions) {
    closePosition(position.id, position.currentPrice)
  }

  state.isTradingHalted = true

  addAuditEntry({
    action: 'panic',
    details: `Panic flatten: closed ${closed.length} positions`,
  })

  return closed
}

export function resetDailyMetrics(): void {
  state.dailyPnL = 0
  state.dailyLoss = 0
  state.drawdown = 0
  state.isTradingHalted = false

  addAuditEntry({
    action: 'mode_change',
    details: 'Daily metrics reset',
  })
}

export function getAuditLog(limit = 50): AuditLogEntry[] {
  return state.auditLog.slice(0, limit)
}

export function getPositionsSummary(): {
  totalValue: number
  unrealizedPnL: number
  positionCount: number
  positions: PositionRecord[]
} {
  const totalValue = state.positions.reduce((sum, p) => sum + p.qty * p.currentPrice, 0)
  const unrealizedPnL = state.positions.reduce((sum, p) => sum + p.pnl, 0)

  return {
    totalValue,
    unrealizedPnL,
    positionCount: state.positions.length,
    positions: state.positions,
  }
}
