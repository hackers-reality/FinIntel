import { useCallback, useEffect, useState } from 'react'

import { portfolioService } from '../services/portfolio'
import type { PortfolioHoldingInput, PortfolioSummary } from '../types/portfolio'

const emptyHolding: PortfolioHoldingInput = {
  ticker: '',
  qty: '',
  price: '',
}

export function usePortfolio(sessionToken: string | null) {
  const [portfolio, setPortfolio] = useState<PortfolioSummary>({ total_value: 0, holdings: [] })
  const [newHolding, setNewHolding] = useState<PortfolioHoldingInput>(emptyHolding)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      setPortfolio(await portfolioService.getSummary())
      setError(null)
    } catch {
      setError('Unable to load portfolio data.')
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const addHolding = useCallback(async () => {
    if (!sessionToken || !newHolding.ticker || !newHolding.qty || !newHolding.price) {
      return
    }
    try {
      await portfolioService.addHolding(newHolding, sessionToken)
      setNewHolding(emptyHolding)
      await refresh()
      setError(null)
    } catch {
      setError('Unable to add the portfolio holding.')
    }
  }, [newHolding, refresh, sessionToken])

  return {
    portfolio,
    newHolding,
    setNewHolding,
    addHolding,
    error,
  }
}
