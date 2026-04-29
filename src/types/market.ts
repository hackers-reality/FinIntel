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

export interface MarketQuote {
  symbol: string
  name: string
  price: number
  change: number
  change_percent: number
  volume: number
  category: 'stock' | 'currency'
}

export interface CurrencyQuote {
  symbol: string
  price: number
  change: number
  change_percent: number
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

export interface MarketChartPoint {
  timestamp: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface MarketChartSeries {
  symbol: string
  period: string
  interval: string
  points: MarketChartPoint[]
}

export interface MarketAlert {
  symbol: string
  title: string
  severity: 'info' | 'medium' | 'high'
  description: string
  source: string
}
