import { useCallback, useEffect, useState } from 'react'

import { marketService } from '../services/market'
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

interface MarketDataState {
  overview: MarketOverview | null
  quotes: MarketQuote[]
  currencies: CurrencyQuote[]
  sectors: SectorData[]
  news: InstitutionalNews[]
  flows: FiiDiiFlow[]
  bulkDeals: BulkDeal[]
  events: MarketEvent[]
  alerts: MarketAlert[]
  chart: MarketChartSeries | null
}

const initialState: MarketDataState = {
  overview: null,
  quotes: [],
  currencies: [],
  sectors: [],
  news: [],
  flows: [],
  bulkDeals: [],
  events: [],
  alerts: [],
  chart: null,
}

export function useMarketData() {
  const [state, setState] = useState<MarketDataState>(initialState)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedSymbol, setSelectedSymbol] = useState('RELIANCE.NS')
  const [chartPeriod, setChartPeriod] = useState('1mo')
  const [chartInterval, setChartInterval] = useState('1d')

  const refresh = useCallback(async () => {
    try {
      const [overview, quotes, currencies, sectors, news, flows, bulkDeals, events, alerts, chart] = await Promise.all([
        marketService.getOverview(),
        marketService.getQuotes('RELIANCE.NS,TCS.NS,INFY.NS,HDFCBANK.NS,WIPRO.NS'),
        marketService.getCurrencies(),
        marketService.getSectors(),
        marketService.getNews(),
        marketService.getFlows(),
        marketService.getBulkDeals(),
        marketService.getEvents(),
        marketService.getAlerts(),
        marketService.getChart(selectedSymbol, chartPeriod, chartInterval),
      ])
      setState({ overview, quotes, currencies, sectors, news, flows, bulkDeals, events, alerts, chart })
      setError(null)
    } catch {
      setError('Unable to load market data.')
    } finally {
      setIsLoading(false)
    }
  }, [selectedSymbol, chartInterval, chartPeriod])

  const refreshChart = useCallback(async (symbol: string, period = chartPeriod, interval = chartInterval) => {
    try {
      setSelectedSymbol(symbol)
      setChartPeriod(period)
      setChartInterval(interval)
      const chart = await marketService.getChart(symbol, period, interval)
      setState((current) => ({ ...current, chart }))
      setError(null)
    } catch {
      setError('Unable to load chart data.')
    }
  }, [chartInterval, chartPeriod])

  useEffect(() => {
    void refresh()
    const interval = window.setInterval(() => void refresh(), 30000)
    return () => window.clearInterval(interval)
  }, [refresh])

  return {
    ...state,
    isLoading,
    error,
    refresh,
    selectedSymbol,
    setSelectedSymbol: (symbol: string) => void refreshChart(symbol),
    chartPeriod,
    setChartPeriod,
    chartInterval,
    setChartInterval,
    refreshChart,
  }
}
