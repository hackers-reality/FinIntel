export interface StockIndex {
  symbol: string;
  price: number;
  change: number;
}

export interface SectorData {
  sector: string;
  change: number;
}

export interface PortfolioHolding {
  symbol: string;
  qty: number;
  avg_price: number;
  curr_price: number;
  pnl: number;
}

export interface PortfolioSummary {
  total_value: number;
  holdings: PortfolioHolding[];
}

export interface InstitutionalNews {
  titan: string;
  title: string;
  url: string;
  date: string;
}

export interface InstitutionalFlow {
  date: string;
  fii: number;
  dii: number;
}

export interface StrategicEvent {
  id: number;
  ticker: string;
  type: string;
  description: string;
  ts: string;
  status: string;
}
