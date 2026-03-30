'use client'
import { useId } from 'react'
import { TrendPoint } from '@/lib/supabase'

interface Props {
  data: TrendPoint[]
  width?: number
  height?: number
  roasTarget?: number
}

export default function Sparkline({ data, width = 64, height = 24, roasTarget = 2.5 }: Props) {
  const id = useId().replace(/:/g, '')
  const values = data.map(d => d.roas)

  if (values.length < 2) {
    return <span className="text-muted text-xs font-display font-bold">—</span>
  }

  const max = Math.max(...values, roasTarget * 1.1)
  const min = Math.min(...values, 0)
  const range = max - min || 1

  const pad = 2
  const w = width - pad * 2
  const h = height - pad * 2

  const toX = (i: number) => pad + (i / (values.length - 1)) * w
  const toY = (v: number) => pad + h - ((v - min) / range) * h

  const linePts = values.map((v, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(v).toFixed(1)}`).join(' ')
  const areaPath = `${linePts} L ${toX(values.length - 1).toFixed(1)} ${(pad + h).toFixed(1)} L ${pad} ${(pad + h).toFixed(1)} Z`

  const last = values[values.length - 1]
  const first = values[0]
  const trending = last >= first
  const isWinning = last >= roasTarget
  const color = isWinning ? '#0021EF' : last < 1.5 ? '#FF3319' : '#7878A0'

  const targetY = toY(roasTarget)
  const showTarget = targetY >= pad && targetY <= pad + h

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="overflow-visible"
    >
      <defs>
        <linearGradient id={`sg-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Target reference line */}
      {showTarget && (
        <line
          x1={pad} y1={targetY.toFixed(1)}
          x2={pad + w} y2={targetY.toFixed(1)}
          stroke={color} strokeWidth="0.5" strokeDasharray="2,2" opacity="0.4"
        />
      )}

      {/* Area fill */}
      <path d={areaPath} fill={`url(#sg-${id})`} />

      {/* Line */}
      <path
        d={linePts}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Last value dot */}
      <circle
        cx={toX(values.length - 1).toFixed(1)}
        cy={toY(last).toFixed(1)}
        r="2"
        fill={color}
      />
    </svg>
  )
}
