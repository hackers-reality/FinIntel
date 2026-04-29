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
  getOverview: () => apiRequest<MarketOverview>('/market/overview'),
  getQuotes: () => apiRequest<MarketQuote[]>('/market/quotes'),
  getCurrencies: () => apiRequest<CurrencyQuote[]>('/market/currencies'),
  getChart: (symbol: string, period: string, interval: string) =>
    apiRequest<MarketChartSeries>(`/market/chart/${encodeURIComponent(symbol)}?period=${encodeURIComponent(period)}&interval=${encodeURIComponent(interval)}`),
  getAlerts: () => apiRequest<MarketAlert[]>('/market/alerts'),
  getSectors: () => apiRequest<SectorData[]>('/market/sectors'),
  getNews: () => apiRequest<InstitutionalNews[]>('/market/traders/news'),
  getFlows: () => apiRequest<FiiDiiFlow[]>('/market/fiidii'),
  getBulkDeals: () => apiRequest<BulkDeal[]>('/market/bulkdeals'),
  getEvents: () => apiRequest<MarketEvent[]>('/market/events'),
}
