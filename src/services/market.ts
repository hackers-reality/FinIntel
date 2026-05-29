import { apiRequest } from './api'
import type {
  BulkDeal,
  CurrencyQuote,
  FiiDiiFlow,
  InstitutionalNews,
  MarketAlert,
  MarketChartSeries,
  MarketEvent,
  MarketOverview,
  MarketQuote,
  SectorData,
} from '../types/market'

export const marketService = {
  getOverview: () => apiRequest<MarketOverview>('/api/market/overview'),
  getQuotes: (tickers?: string) => apiRequest<MarketQuote[]>(`/api/market/quotes${tickers ? `?tickers=${encodeURIComponent(tickers)}` : ''}`),
  getCurrencies: () => apiRequest<CurrencyQuote[]>('/market/currencies'),
  getChart: (ticker: string, period: string, interval: string) =>
    apiRequest<MarketChartSeries>(`/api/market/chart?ticker=${encodeURIComponent(ticker)}&period=${encodeURIComponent(period)}&interval=${encodeURIComponent(interval)}`),
  getAlerts: () => apiRequest<MarketAlert[]>('/market/alerts'),
  getSectors: () => apiRequest<SectorData[]>('/market/sectors'),
  getNews: () => apiRequest<InstitutionalNews[]>('/market/traders/news'),
  getFlows: () => apiRequest<FiiDiiFlow[]>('/market/fiidii'),
  getBulkDeals: () => apiRequest<BulkDeal[]>('/market/bulkdeals'),
  getEvents: () => apiRequest<MarketEvent[]>('/market/events'),
  getIndicators: (symbol: string) => apiRequest<any>(`/market/indicators/${encodeURIComponent(symbol)}`),
}
