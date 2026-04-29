import { apiRequest } from './api'
import type { PortfolioHoldingInput, PortfolioSummary } from '../types/portfolio'

export const portfolioService = {
  getSummary: () => apiRequest<PortfolioSummary>('/market/portfolio/summary'),
  addHolding: (payload: PortfolioHoldingInput, sessionToken: string) =>
    apiRequest<{ status: string }>('/market/portfolio/holdings', {
      method: 'POST',
      sessionToken,
      body: {
        ticker: payload.ticker,
        qty: Number(payload.qty),
        price: Number(payload.price),
      },
    }),
}
