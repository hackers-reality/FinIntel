import { useCallback, useEffect, useRef, useState } from 'react'

import { getStoredAccessToken } from '../services/auth'

interface MarketUpdate {
  symbol: string
  data: Record<string, unknown>
}

interface WebSocketState {
  isConnected: boolean
  lastUpdate: MarketUpdate | null
  error: string | null
  latency: number | null
}

export function useMarketWebSocket(symbols: string[] = [], autoReconnect = true) {
  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    lastUpdate: null,
    error: null,
    latency: null,
  })

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5

  const connect = useCallback(() => {
    const token = getStoredAccessToken()
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const query = token ? `?token=${encodeURIComponent(token)}` : ''
    const wsUrl = `${protocol}//${window.location.hostname}:8008/ws${query}`

    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => {
      setState((prev) => ({ ...prev, isConnected: true, error: null }))
      reconnectAttempts.current = 0
      if (symbols.length > 0) {
        ws.send(JSON.stringify({
          action: 'subscribe',
          channels: ['market_update'],
        }))
      }
    }

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        if (message.type === 'market_update') {
          const update: MarketUpdate = {
            symbol: message.payload.symbol,
            data: message.payload.data,
          }
          setState((prev) => ({
            ...prev,
            lastUpdate: update,
            latency: message.payload.latency ?? null,
          }))
        }
      } catch {
        // Ignore parse errors
      }
    }

    ws.onclose = (event) => {
      setState((prev) => ({ ...prev, isConnected: false }))
      if (event.code === 4003) {
        setState((prev) => ({ ...prev, error: 'Authentication required for market data.' }))
        return
      }
      if (autoReconnect && reconnectAttempts.current < maxReconnectAttempts) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000)
        reconnectTimer.current = setTimeout(() => {
          reconnectAttempts.current++
          connect()
        }, delay)
      }
    }

    ws.onerror = () => {
      setState((prev) => ({ ...prev, error: 'WebSocket connection error.' }))
    }
  }, [symbols, autoReconnect])

  useEffect(() => {
    connect()
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current)
      }
    }
  }, [connect])

  const requestSnapshot = useCallback((symbol: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        action: 'request_snapshot',
        symbol,
      }))
    }
  }, [])

  return {
    ...state,
    requestSnapshot,
  }
}
