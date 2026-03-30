'use client'
import { useState, useEffect, useCallback } from 'react'

interface GroupRow {
  key: string
  count: number
  winners: number
  win_rate: number
  roas: number
  cpa: number
  ctr: number
  thumbstop_rate: number
  spend: number
  conversions: number
}

interface AnalyticsData {
  by_format: GroupRow[]
  by_angle: GroupRow[]
  by_country: GroupRow[]
}

const MARKET_FLAGS: Record<string, string> = {
  NL: '🇳🇱', FR: '🇫🇷', DE: '🇩🇪', ES: '🇪🇸', IT: '🇮🇹'
}

const DAYS_OPTIONS = [7, 14, 30, 60]
const ROAS_TARGET = 2.5

function fmt(n: number) {
  return n >= 1000 ? `€${(n / 1000).toFixed(1)}k` : `€${n.toFixed(0)}`
}

function RoasBar({ roas, max }: { roas: number; max: number }) {
  const pct = max > 0 ? Math.min((roas / max) * 100, 100) : 0
  const good = roas >= ROAS_TARGET
  return (
    <div className="flex items-center gap-3">
      <span className={`font-display font-bold text-sm w-12 text-right ${good ? 'text-accent' : 'text-loser'}`}>
        {roas.toFixed(2)}x
      </span>
      <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full bar-fill ${good ? 'bg-accent' : 'bg-loser'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function GroupTable({ title, rows, maxRoas }: { title: string; rows: GroupRow[]; maxRoas: number }) {
  if (rows.length === 0) return null
  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h2 className="font-display font-bold text-text">{title}</h2>
        <p className="text-text-dim text-xs mt-0.5">Sorted by ROAS · winner = ≥ {ROAS_TARGET}x</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-5 py-2.5 text-text-dim text-xs font-display font-bold uppercase tracking-wide">Name</th>
              <th className="text-left px-4 py-2.5 text-text-dim text-xs font-display font-bold uppercase tracking-wide">ROAS</th>
              <th className="text-right px-4 py-2.5 text-text-dim text-xs font-display font-bold uppercase tracking-wide">CPA</th>
              <th className="text-right px-4 py-2.5 text-text-dim text-xs font-display font-bold uppercase tracking-wide">CTR</th>
              <th className="text-right px-4 py-2.5 text-text-dim text-xs font-display font-bold uppercase tracking-wide">Hook%</th>
              <th className="text-right px-4 py-2.5 text-text-dim text-xs font-display font-bold uppercase tracking-wide">Spend</th>
              <th className="text-right px-4 py-2.5 text-text-dim text-xs font-display font-bold uppercase tracking-wide">Creatives</th>
              <th className="text-right px-5 py-2.5 text-text-dim text-xs font-display font-bold uppercase tracking-wide">Win%</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.key} className={`${i < rows.length - 1 ? 'border-b border-border' : ''} hover:bg-border/20 transition-colors`}>
                <td className="px-5 py-3">
                  <span className="font-display font-bold text-text text-sm">{row.key}</span>
                </td>
                <td className="px-4 py-3 min-w-[160px]">
                  <RoasBar roas={row.roas} max={maxRoas} />
                </td>
                <td className="px-4 py-3 text-right text-sm text-text-dim font-body">
                  {row.cpa > 0 ? fmt(row.cpa) : '—'}
                </td>
                <td className="px-4 py-3 text-right text-sm text-text-dim font-body">
                  {row.ctr > 0 ? `${row.ctr.toFixed(2)}%` : '—'}
                </td>
                <td className="px-4 py-3 text-right text-sm font-body">
                  <span className={row.thumbstop_rate > 0.25 ? 'text-accent font-display font-bold' : 'text-text-dim'}>
                    {row.thumbstop_rate > 0 ? `${(row.thumbstop_rate * 100).toFixed(1)}%` : '—'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-sm text-text-dim font-body">{fmt(row.spend)}</td>
                <td className="px-4 py-3 text-right text-sm text-text-dim font-body">{row.count}</td>
                <td className="px-5 py-3 text-right">
                  <span className={`font-display font-bold text-sm ${row.win_rate >= 0.5 ? 'text-accent' : 'text-text-dim'}`}>
                    {row.count > 0 ? `${Math.round(row.win_rate * 100)}%` : '—'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function CountryTable({ rows }: { rows: GroupRow[] }) {
  if (rows.length === 0) return null
  const maxSpend = Math.max(...rows.map(r => r.spend))
  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h2 className="font-display font-bold text-text">By Country</h2>
        <p className="text-text-dim text-xs mt-0.5">Total ad performance across all creatives</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-5 py-2.5 text-text-dim text-xs font-display font-bold uppercase tracking-wide">Market</th>
              <th className="text-left px-4 py-2.5 text-text-dim text-xs font-display font-bold uppercase tracking-wide">ROAS</th>
              <th className="text-right px-4 py-2.5 text-text-dim text-xs font-display font-bold uppercase tracking-wide">CPA</th>
              <th className="text-right px-4 py-2.5 text-text-dim text-xs font-display font-bold uppercase tracking-wide">CTR</th>
              <th className="text-right px-4 py-2.5 text-text-dim text-xs font-display font-bold uppercase tracking-wide">Hook%</th>
              <th className="text-right px-4 py-2.5 text-text-dim text-xs font-display font-bold uppercase tracking-wide">Spend</th>
              <th className="text-right px-5 py-2.5 text-text-dim text-xs font-display font-bold uppercase tracking-wide">Conv.</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.key} className={`${i < rows.length - 1 ? 'border-b border-border' : ''} hover:bg-border/20 transition-colors`}>
                <td className="px-5 py-3">
                  <span className="font-display font-bold text-text text-sm">
                    {MARKET_FLAGS[row.key] || ''} {row.key}
                  </span>
                </td>
                <td className="px-4 py-3 min-w-[160px]">
                  <RoasBar roas={row.roas} max={Math.max(...rows.map(r => r.roas), 0.1)} />
                </td>
                <td className="px-4 py-3 text-right text-sm text-text-dim font-body">
                  {row.cpa > 0 ? fmt(row.cpa) : '—'}
                </td>
                <td className="px-4 py-3 text-right text-sm text-text-dim font-body">
                  {row.ctr > 0 ? `${row.ctr.toFixed(2)}%` : '—'}
                </td>
                <td className="px-4 py-3 text-right text-sm font-body">
                  <span className={row.thumbstop_rate > 0.25 ? 'text-accent font-display font-bold' : 'text-text-dim'}>
                    {row.thumbstop_rate > 0 ? `${(row.thumbstop_rate * 100).toFixed(1)}%` : '—'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-16 h-1 bg-border rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent/60 rounded-full bar-fill"
                        style={{ width: `${maxSpend > 0 ? (row.spend / maxSpend) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-sm text-text-dim font-body">{fmt(row.spend)}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-right text-sm text-text-dim font-body">{row.conversions}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function Analytics() {
  const [days, setDays] = useState(14)
  const [market, setMarket] = useState('all')
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/analytics?days=${days}&market=${market}`)
    const json = await res.json()
    setData(json)
    setLoading(false)
  }, [days, market])

  useEffect(() => { fetchData() }, [fetchData])

  const maxFormatRoas = data && data.by_format.length > 0 ? Math.max(...data.by_format.map(r => r.roas), 0.1) : 1
  const maxAngleRoas = data && data.by_angle.length > 0 ? Math.max(...data.by_angle.map(r => r.roas), 0.1) : 1

  const MARKETS = ['all', 'NL', 'FR', 'DE', 'ES', 'IT']

  return (
    <div className="min-h-screen bg-bg">
      <header className="border-b border-border sticky top-0 z-20 bg-bg/95 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-display font-bold text-xl text-text">What&apos;s Working</h1>
            <p className="text-text-dim text-xs mt-0.5">Performance by format, angle, and market</p>
          </div>
          {/* Controls */}
          <div className="flex gap-2 items-center">
            {/* Days */}
            <div className="flex bg-surface border border-border rounded-lg overflow-hidden">
              {DAYS_OPTIONS.map(d => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={`px-3 py-1.5 text-sm font-display font-bold transition-colors ${
                    days === d ? 'bg-accent text-bg' : 'text-text-dim hover:text-text'
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>
            {/* Market */}
            <div className="flex bg-surface border border-border rounded-lg overflow-hidden">
              {MARKETS.map(m => (
                <button
                  key={m}
                  onClick={() => setMarket(m)}
                  className={`px-3 py-1.5 text-sm font-display font-bold transition-colors ${
                    market === m ? 'bg-accent text-bg' : 'text-text-dim hover:text-text'
                  }`}
                >
                  {m === 'all' ? 'All' : m}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-48 rounded-xl bg-surface border border-border animate-pulse" />
            ))}
          </div>
        ) : !data || (data.by_format.length === 0 && data.by_angle.length === 0) ? (
          <div className="text-center py-24 text-text-dim">
            <p className="font-display font-bold text-lg">No performance data yet</p>
            <p className="text-sm mt-1">Connect Facebook ads via naming convention or manual linking</p>
          </div>
        ) : (
          <>
            <GroupTable title="By Format" rows={data.by_format} maxRoas={maxFormatRoas} />
            <GroupTable title="By Angle" rows={data.by_angle} maxRoas={maxAngleRoas} />
            <CountryTable rows={data.by_country} />
          </>
        )}
      </div>
    </div>
  )
}
