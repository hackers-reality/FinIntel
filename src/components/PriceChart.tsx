import { useState, useCallback } from 'react'
import type { MarketChartPoint } from '../types/market'

type ChartMode = 'line' | 'area' | 'candle'

interface Props {
  points: MarketChartPoint[]
  mode: ChartMode
}

const WIDTH = 1000
const HEIGHT = 420
const PADDING_X = 48
const PADDING_Y = 42

function scale(value: number, min: number, max: number, size: number) {
  if (max === min) return size / 2
  return size - ((value - min) / (max - min)) * size
}

export default function PriceChart({ points, mode }: Props) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null)

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const svgX = ((e.clientX - rect.left) / rect.width) * WIDTH
    const usableWidth = WIDTH - PADDING_X * 2
    const step = points.length > 1 ? usableWidth / (points.length - 1) : 0
    const index = Math.round((svgX - PADDING_X) / step)
    if (index >= 0 && index < points.length) {
      setHoverIndex(index)
      setMousePos({ x: e.clientX, y: e.clientY })
    } else {
      setHoverIndex(null)
      setMousePos(null)
    }
  }, [points.length])

  const handleMouseLeave = useCallback(() => {
    setHoverIndex(null)
    setMousePos(null)
  }, [])

  if (points.length === 0) {
    return (
      <div className="h-[420px] rounded-[2rem] border border-white/10 bg-black/20 flex items-center justify-center text-sm text-gray-500">
        No chart data available for this symbol.
      </div>
    )
  }

  const highs = points.map((p) => p.high)
  const lows = points.map((p) => p.low)
  const closes = points.map((p) => p.close)
  const maxValue = Math.max(...highs)
  const minValue = Math.min(...lows)
  const usableWidth = WIDTH - PADDING_X * 2
  const usableHeight = HEIGHT - PADDING_Y * 2
  const step = points.length > 1 ? usableWidth / (points.length - 1) : 0
  const linePoints = points.map((point, index) => ({
    x: PADDING_X + index * step,
    y: PADDING_Y + scale(point.close, minValue, maxValue, usableHeight),
  }))
  const candleWidth = Math.max(6, Math.min(18, step * 0.6))

  const linePath = linePoints.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')
  const areaPath = `${linePath} L ${PADDING_X + usableWidth} ${PADDING_Y + usableHeight} L ${PADDING_X} ${PADDING_Y + usableHeight} Z`
  const lastClose = closes[closes.length - 1]
  const firstClose = closes[0]
  const change = lastClose - firstClose
  const changePercent = firstClose ? (change / firstClose) * 100 : 0
  const positive = change >= 0

  const hoveredPoint = hoverIndex !== null ? points[hoverIndex] : null

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <div>
          <p className="text-[10px] font-black uppercase text-gray-500">Chart mode</p>
          <p className={positive ? 'text-emerald-300 text-sm font-bold' : 'text-rose-300 text-sm font-bold'}>
            {lastClose.toLocaleString()} ({change >= 0 ? '+' : ''}{change.toFixed(2)}, {changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%)
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black uppercase text-gray-500">Range</p>
          <p className="text-sm font-bold text-gray-200">{minValue.toLocaleString()} - {maxValue.toLocaleString()}</p>
        </div>
      </div>
      <div className="relative">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="w-full h-[420px] rounded-[2rem] border border-white/10 bg-[#060b14]"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <defs>
            <linearGradient id="finintelArea" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
            </linearGradient>
          </defs>
          {Array.from({ length: 5 }).map((_, index) => {
            const y = PADDING_Y + (usableHeight / 4) * index
            return <line key={index} x1={PADDING_X} y1={y} x2={PADDING_X + usableWidth} y2={y} stroke="rgba(255,255,255,0.07)" strokeDasharray="8 8" />
          })}
          {mode === 'line' && <path d={linePath} fill="none" stroke="#22d3ee" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
          {mode === 'area' && <path d={areaPath} fill="url(#finintelArea)" stroke="#22d3ee" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
          {mode === 'area' && <path d={linePath} fill="none" stroke="#22d3ee" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
          {mode === 'candle' && points.map((point, index) => {
            const x = PADDING_X + index * step
            const openY = PADDING_Y + scale(point.open, minValue, maxValue, usableHeight)
            const closeY = PADDING_Y + scale(point.close, minValue, maxValue, usableHeight)
            const highY = PADDING_Y + scale(point.high, minValue, maxValue, usableHeight)
            const lowY = PADDING_Y + scale(point.low, minValue, maxValue, usableHeight)
            const candleTop = Math.min(openY, closeY)
            const candleHeight = Math.max(Math.abs(closeY - openY), 2)
            const fill = point.close >= point.open ? '#10b981' : '#fb7185'
            return (
              <g key={point.timestamp}>
                <line x1={x} y1={highY} x2={x} y2={lowY} stroke={fill} strokeWidth="2" />
                <rect x={x - candleWidth / 2} y={candleTop} width={candleWidth} height={candleHeight} rx="4" fill={fill} opacity="0.95" />
              </g>
            )
          })}
          {hoveredPoint && (() => {
            const idx = hoverIndex!
            const x = PADDING_X + idx * step
            const y = PADDING_Y + scale(hoveredPoint.close, minValue, maxValue, usableHeight)
            return (
              <>
                <line x1={x} y1={PADDING_Y} x2={x} y2={PADDING_Y + usableHeight} stroke="rgba(34,211,238,0.3)" strokeWidth="1" strokeDasharray="4 4" />
                <circle cx={x} cy={y} r="6" fill="#38bdf8" stroke="white" strokeWidth="2" />
              </>
            )
          })()}
          {linePoints.length > 0 && !hoveredPoint && (
            <circle cx={linePoints[linePoints.length - 1].x} cy={linePoints[linePoints.length - 1].y} r="5" fill="#38bdf8" stroke="white" strokeWidth="2" />
          )}
        </svg>
        {hoveredPoint && mousePos && (
          <div
            className="fixed z-50 bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/20 rounded-xl p-3 text-xs space-y-1 pointer-events-none"
            style={{ left: mousePos.x + 12, top: mousePos.y - 60 }}
          >
            <p className="text-gray-400">{new Date(hoveredPoint.timestamp).toLocaleDateString()}</p>
            <p className="text-white font-bold">₹{hoveredPoint.close.toLocaleString()}</p>
            <div className="flex space-x-3 text-[10px]">
              <span className="text-gray-500">O: <span className="text-gray-300">{hoveredPoint.open.toLocaleString()}</span></span>
              <span className="text-gray-500">H: <span className="text-emerald-400">{hoveredPoint.high.toLocaleString()}</span></span>
              <span className="text-gray-500">L: <span className="text-rose-400">{hoveredPoint.low.toLocaleString()}</span></span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
