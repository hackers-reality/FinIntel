import { apiRequest } from './api'
import type { BulkDeal, FiiDiiFlow, InstitutionalNews, MarketEvent, MarketOverview, SectorData } from '../types/market'

export const marketService = {
  getOverview: () => apiRequest<MarketOverview>('/market/overview'),
  getSectors: () => apiRequest<SectorData[]>('/market/sectors'),
  getNews: () => apiRequest<InstitutionalNews[]>('/market/traders/news'),
  getFlows: () => apiRequest<FiiDiiFlow[]>('/market/fiidii'),
  getBulkDeals: () => apiRequest<BulkDeal[]>('/market/bulkdeals'),
  getEvents: () => apiRequest<MarketEvent[]>('/market/events'),
}
