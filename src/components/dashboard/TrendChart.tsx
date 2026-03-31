'use client'
import { useId, useState } from 'react'

interface DataPoint {
  date: string
  roas: number
  spend: number
}

interface Props {
  data: DataPoint[]
  roasTarget?: number
  height?: number
}

function fmtDate(d: string) {
  const dt = new Date(d)
  return dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function fmtSpend(n: number) {
  return n >= 1000 ? `€${(n / 1000).toFixed(1)}k` : `€${n.toFixed(0)}`
}

export default function TrendChart({ data, roasTarget = 2.5, height = 220 }: Props) {
  const id = useId().replace(/:/g, '')
  const [hover, setHover] = useState<number | null>(null)

  if (!data || data.length < 2) {
    return (
      <div className="flex items-center justify-center h-32 text-text-dim text-sm font-display font-bold uppercase tracking-wide">
        No trend data yet
      </div>
    )
  }

  // Chart dimensions
  const VW = 800
  const VH = height
  const ML = 48  // left margin (Y labels)
  const MR = 16  // right margin
  const MT = 16  // top margin
  const MB = 36  // bottom margin (X labels)
  const CW = VW - ML - MR  // chart width
  const CH = VH - MT - MB  // chart height

  // Data ranges
  const maxRoas = Math.max(...data.map(d => d.roas), roasTarget * 1.2)
  const minRoas = 0
  const roasRange = maxRoas - minRoas || 1
  const maxSpend = Math.max(...data.map(d => d.spend), 1)

  const toX = (i: number) => ML + (i / (data.length - 1)) * CW
  const toY = (v: number) => MT + CH - ((v - minRoas) / roasRange) * CH
  const spendBarH = (v: number) => (v / maxSpend) * (CH * 0.35)

  // ROAS path
  const roasLine = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(d.roas).toFixed(1)}`).join(' ')
  const roasArea = `${roasLine} L ${(ML + CW).toFixed(1)} ${(MT + CH).toFixed(1)} L ${ML} ${(MT + CH).toFixed(1)} Z`

  // Target Y
  const targetY = toY(roasTarget)

  // X axis labels — show every N points
  const step = Math.max(1, Math.floor(data.length / 7))
  const xLabels = data.reduce<number[]>((acc, _, i) => {
    if (i === 0 || i === data.length - 1 || i % step === 0) acc.push(i)
    return acc
  }, [])

  // Y axis ticks
  const yTicks = [0, 1, 2, roasTarget, Math.ceil(maxRoas)]
    .filter((v, i, arr) => arr.indexOf(v) === i && v <= maxRoas)
    .sort((a, b) => a - b)

  const hovered = hover !== null ? data[hover] : null

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${VW} ${VH}`}
        width="100%"
        className="overflow-visible"
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id={`rg-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0021EF" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#0021EF" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Spend bars (background) */}
        {data.map((d, i) => {
          const bw = Math.max(2, (CW / data.length) * 0.5)
          const bh = spendBarH(d.spend)
          const bx = toX(i) - bw / 2
          const by = MT + CH - bh
          return (
            <rect
              key={i}
              x={bx.toFixed(1)} y={by.toFixed(1)}
              width={bw.toFixed(1)} height={bh.toFixed(1)}
              fill={hover === i ? 'rgb(0 33 239 / 0.15)' : 'rgb(0 33 239 / 0.07)'}
              rx="1"
            />
          )
        })}

        {/* Grid lines */}
        {yTicks.map(tick => {
          const y = toY(tick)
          return (
            <line
              key={tick}
              x1={ML} y1={y.toFixed(1)}
              x2={ML + CW} y2={y.toFixed(1)}
              stroke="rgb(26 26 40)" strokeWidth="1"
            />
          )
        })}

        {/* Target ROAS reference line */}
        <line
          x1={ML} y1={targetY.toFixed(1)}
          x2={ML + CW} y2={targetY.toFixed(1)}
          stroke="#0021EF" strokeWidth="1" strokeDasharray="4 3" opacity="0.5"
        />
        <text
          x={(ML + CW + 4).toFixed(1)} y={(targetY + 4).toFixed(1)}
          fill="#0021EF" fontSize="9" fontFamily="sans-serif" opacity="0.7"
        >
          {roasTarget}x
        </text>

        {/* ROAS area */}
        <path d={roasArea} fill={`url(#rg-${id})`} />

        {/* ROAS line */}
        <path
          d={roasLine}
          fill="none"
          stroke="#0021EF"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Hover interaction strips */}
        {data.map((_, i) => {
          const stripW = CW / data.length
          return (
            <rect
              key={i}
              x={(toX(i) - stripW / 2).toFixed(1)}
              y={MT}
              width={stripW.toFixed(1)}
              height={CH}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
            />
          )
        })}

        {/* Hover vertical line + dot */}
        {hover !== null && (
          <>
            <line
              x1={toX(hover).toFixed(1)} y1={MT}
              x2={toX(hover).toFixed(1)} y2={MT + CH}
              stroke="rgb(244 244 244 / 0.15)" strokeWidth="1"
            />
            <circle
              cx={toX(hover).toFixed(1)}
              cy={toY(data[hover].roas).toFixed(1)}
              r="4" fill="#0021EF" stroke="#08080E" strokeWidth="2"
            />
          </>
        )}

        {/* Y axis labels */}
        {yTicks.map(tick => (
          <text
            key={tick}
            x={(ML - 6).toFixed(1)} y={(toY(tick) + 4).toFixed(1)}
            fill="rgb(125 125 160)" fontSize="10"
            textAnchor="end" fontFamily="sans-serif"
          >
            {tick}x
          </text>
        ))}

        {/* X axis labels */}
        {xLabels.map(i => (
          <text
            key={i}
            x={toX(i).toFixed(1)} y={(MT + CH + 22).toFixed(1)}
            fill="rgb(125 125 160)" fontSize="10"
            textAnchor="middle" fontFamily="sans-serif"
          >
            {fmtDate(data[i].date)}
          </text>
        ))}

        {/* Bottom axis line */}
        <line
          x1={ML} y1={MT + CH}
          x2={ML + CW} y2={MT + CH}
          stroke="rgb(26 26 40)" strokeWidth="1"
        />
      </svg>

      {/* Tooltip */}
      {hovered && (
        <div className="absolute top-2 right-2 bg-surface border border-border rounded-lg px-3 py-2 text-xs pointer-events-none">
          <p className="text-text-dim font-display font-bold uppercase tracking-wide mb-1">
            {fmtDate(hovered.date)}
          </p>
          <div className="flex gap-4">
            <span>
              <span className="text-text-dim">ROAS </span>
              <span className={`font-display font-bold ${hovered.roas >= roasTarget ? 'text-accent' : 'text-loser'}`}>
                {hovered.roas.toFixed(2)}x
              </span>
            </span>
            <span>
              <span className="text-text-dim">Spend </span>
              <span className="font-display font-bold text-text">{fmtSpend(hovered.spend)}</span>
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
