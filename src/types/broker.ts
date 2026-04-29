export interface BrokerHolding {
  symbol: string
  quantity: number
  average_price: number
  last_price: number
  pnl: number
}

export interface BrokerAccountSummary {
  provider: string
  account_id: string | null
  account_name: string | null
  total_investment: number
  current_value: number
  available_cash: number
  pnl: number
  holdings: BrokerHolding[]
  status: string
  mode: string
  message: string
}
