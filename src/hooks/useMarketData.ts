import { useCallback, useEffect, useState } from 'react'

import { marketService } from '../services/market'
import type { BulkDeal, FiiDiiFlow, InstitutionalNews, MarketEvent, MarketOverview, SectorData } from '../types/market'

interface MarketDataState {
  overview: MarketOverview | null
  sectors: SectorData[]
  news: InstitutionalNews[]
  flows: FiiDiiFlow[]
  bulkDeals: BulkDeal[]
  events: MarketEvent[]
}

const initialState: MarketDataState = {
  overview: null,
  sectors: [],
  news: [],
  flows: [],
  bulkDeals: [],
  events: [],
}

export function useMarketData() {
  const [state, setState] = useState<MarketDataState>(initialState)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const [overview, sectors, news, flows, bulkDeals, events] = await Promise.all([
        marketService.getOverview(),
        marketService.getSectors(),
        marketService.getNews(),
        marketService.getFlows(),
        marketService.getBulkDeals(),
        marketService.getEvents(),
      ])
      setState({ overview, sectors, news, flows, bulkDeals, events })
      setError(null)
    } catch {
      setError('Unable to load market data.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
    const interval = window.setInterval(() => void refresh(), 60000)
    return () => window.clearInterval(interval)
  }, [refresh])

  return {
    ...state,
    isLoading,
    error,
    refresh,
  }
}
