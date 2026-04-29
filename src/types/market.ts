export interface StockData {
  symbol: string
  price: number
  change: number
}

export interface MarketOverview {
  stocks: StockData[]
  market_status: 'OPEN' | 'CLOSED'
  as_of: string
}

export interface SectorData {
  sector: string
  change: number
}

export interface InstitutionalNews {
  investor_name: string
  title: string
  url: string
  date: string
}

export interface FiiDiiFlow {
  date: string
  fii: number
  dii: number
}

export interface BulkDeal {
  ticker: string
  client: string
  qty: number
  price: number
  type: string
  date: string
}

export interface MarketEvent {
  id: number
  ticker: string
  type: string
  description: string
  ts: string
  status: string
}
