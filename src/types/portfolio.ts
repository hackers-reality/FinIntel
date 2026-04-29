export interface PortfolioHolding {
  symbol: string
  qty: number
  avg_price: number
  curr_price: number
  pnl: number
}

export interface PortfolioSummary {
  total_value: number
  holdings: PortfolioHolding[]
}

export interface PortfolioHoldingInput {
  ticker: string
  qty: string
  price: string
}
