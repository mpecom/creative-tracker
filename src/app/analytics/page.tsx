'use client'
import { useState, useEffect, useCallback } from 'react'
import TrendChart from '@/components/dashboard/TrendChart'

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

interface TrendPoint {
  date: string
  roas: number
  spend: number
}

interface AnalyticsData {
  by_format: GroupRow[]
  by_angle: GroupRow[]
  by_country: GroupRow[]
  trend: TrendPoint[]
}

const MARKET_FLAGS: Record<string, string> = { NL: '🇳🇱', FR: '🇫🇷', DE: '🇩🇪', ES: '🇪🇸', IT: '🇮🇹' }
const DAYS_OPTIONS = [7, 14, 30, 60]
const ROAS_TARGET = 2.5

function fmt(n: number) {
  return n >= 1000 ? `€${(n / 1000).toFixed(1)}k` : `€${n.toFixed(0)}`
}

function RoasBar({ roas, max }: { roas: number; max: number }) {
  const pct = max > 0 ? Math.min((roas / max) * 100, 100) : 0
  const good = roas >= ROAS_TARGET
  return (
    <div className="flex items-center gap-2">
      <span className={`font-display font-bold text-sm w-12 text-right ${good ? 'text-accent' : 'text-loser'}`}>
        {roas.toFixed(2)}x
      </span>
      <div className="flex-1 h-1 bg-border rounded-full overflow-hidden">
        <div className={`h-full rounded-full bar-fill ${good ? 'bg-accent' : 'bg-loser'}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function StatPill({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="bg-surface border border-border rounded-xl px-4 py-3 flex-1 min-w-0">
      <p className="text-text-dim text-[11px] font-display font-bold uppercase tracking-widest mb-1">{label}</p>
      <p className={`font-display font-extrabold text-xl leading-none ${accent ? 'text-accent' : 'text-text'}`}>{value}</p>
    </div>
  )
}

function GroupTable({ title, rows, maxRoas }: { title: string; rows: GroupRow[]; maxRoas: number }) {
  if (rows.length === 0) return null
  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
        <h2 className="font-display font-extrabold text-text uppercase tracking-tight">{title}</h2>
        <span className="text-text-dim text-[11px] font-display font-bold uppercase tracking-widest">
          Target ≥ {ROAS_TARGET}x
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {['Name','ROAS','CPA','CTR','Hook%','Spend','Ads','Win%'].map(h => (
                <th key={h} className={`py-2.5 text-[11px] font-display font-bold text-text-dim uppercase tracking-wider ${h === 'Name' ? 'text-left px-5' : h === 'Win%' ? 'text-right px-5' : 'text-right px-4'}`}>
                  {h}
                </th>
              ))}
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
                <td className="px-4 py-3 text-right text-sm text-text-dim">
                  {row.cpa > 0 ? fmt(row.cpa) : '—'}
                </td>
                <td className="px-4 py-3 text-right text-sm text-text-dim">
                  {row.ctr > 0 ? `${row.ctr.toFixed(2)}%` : '—'}
                </td>
                <td className="px-4 py-3 text-right text-sm">
                  <span className={row.thumbstop_rate >= 0.25 ? 'text-accent font-display font-bold' : 'text-text-dim'}>
                    {row.thumbstop_rate > 0 ? `${(row.thumbstop_rate * 100).toFixed(1)}%` : '—'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-sm text-text-dim">{fmt(row.spend)}</td>
                <td className="px-4 py-3 text-right text-sm text-text-dim">{row.count}</td>
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
  const maxRoas  = Math.max(...rows.map(r => r.roas), 0.1)
  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
        <h2 className="font-display font-extrabold text-text uppercase tracking-tight">By Market</h2>
        <span className="text-text-dim text-[11px] font-display font-bold uppercase tracking-widest">
          All active creatives
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {['Market','ROAS','CPA','CTR','Hook%','Spend','Conv.'].map(h => (
                <th key={h} className={`py-2.5 text-[11px] font-display font-bold text-text-dim uppercase tracking-wider ${h === 'Market' ? 'text-left px-5' : h === 'Conv.' ? 'text-right px-5' : 'text-right px-4'}`}>
                  {h}
                </th>
              ))}
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
                  <RoasBar roas={row.roas} max={maxRoas} />
                </td>
                <td className="px-4 py-3 text-right text-sm text-text-dim">{row.cpa > 0 ? fmt(row.cpa) : '—'}</td>
                <td className="px-4 py-3 text-right text-sm text-text-dim">{row.ctr > 0 ? `${row.ctr.toFixed(2)}%` : '—'}</td>
                <td className="px-4 py-3 text-right text-sm">
                  <span className={row.thumbstop_rate >= 0.25 ? 'text-accent font-display font-bold' : 'text-text-dim'}>
                    {row.thumbstop_rate > 0 ? `${(row.thumbstop_rate * 100).toFixed(1)}%` : '—'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-16 h-1 bg-border rounded-full overflow-hidden">
                      <div className="h-full bg-accent/50 rounded-full bar-fill"
                        style={{ width: `${maxSpend > 0 ? (row.spend / maxSpend) * 100 : 0}%` }} />
                    </div>
                    <span className="text-sm text-text-dim">{fmt(row.spend)}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-right text-sm text-text-dim">{row.conversions}</td>
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

  const maxFormatRoas = data?.by_format.length ? Math.max(...data.by_format.map(r => r.roas), 0.1) : 1
  const maxAngleRoas  = data?.by_angle.length  ? Math.max(...data.by_angle.map(r => r.roas), 0.1)  : 1

  // Summary stats
  const totalSpend = data ? [...data.by_format].reduce((s, r) => s + r.spend, 0) : 0
  const allRows    = data ? [...data.by_format] : []
  const avgRoas    = totalSpend > 0 && allRows.length > 0
    ? allRows.reduce((s, r) => s + r.roas * r.spend, 0) / totalSpend
    : 0
  const bestFormat = data?.by_format[0]
  const bestAngle  = data?.by_angle[0]

  return (
    <div className="min-h-screen bg-bg">
      <header className="border-b border-border sticky top-0 z-20 bg-bg/95 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-display font-extrabold text-2xl text-text uppercase tracking-tight">Analytics</h1>
            <p className="text-text-dim text-[11px] mt-0.5 font-display font-bold uppercase tracking-widest">
              Performance by format · angle · market
            </p>
          </div>
          <div className="flex gap-2 items-center">
            <div className="flex bg-surface border border-border rounded-lg overflow-hidden">
              {DAYS_OPTIONS.map(d => (
                <button key={d} onClick={() => setDays(d)}
                  className={`px-3 py-1.5 text-xs font-display font-bold uppercase tracking-wide transition-colors ${
                    days === d ? 'bg-accent text-white' : 'text-text-dim hover:text-text'
                  }`}>{d}d</button>
              ))}
            </div>
            <div className="flex bg-surface border border-border rounded-lg overflow-hidden">
              {['all','NL','FR','DE','ES','IT'].map(m => (
                <button key={m} onClick={() => setMarket(m)}
                  className={`px-3 py-1.5 text-xs font-display font-bold uppercase tracking-wide transition-colors ${
                    market === m ? 'bg-accent text-white' : 'text-text-dim hover:text-text'
                  }`}>{m === 'all' ? 'All' : m}</button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-5">
        {loading ? (
          <div className="space-y-4">
            <div className="h-14 rounded-xl bg-surface border border-border animate-pulse" />
            <div className="h-52 rounded-xl bg-surface border border-border animate-pulse" />
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-48 rounded-xl bg-surface border border-border animate-pulse" />
            ))}
          </div>
        ) : !data || (data.by_format.length === 0 && data.by_angle.length === 0) ? (
          <div className="text-center py-24 text-text-dim">
            <p className="font-display font-extrabold text-xl uppercase">No performance data yet</p>
            <p className="text-sm mt-1">Connect Facebook ads via naming convention or manual linking</p>
          </div>
        ) : (
          <>
            {/* Summary stats */}
            <div className="flex gap-3">
              <StatPill label="Total Spend" value={fmt(totalSpend)} />
              <StatPill label={`Avg ROAS (${days}d)`} value={`${avgRoas.toFixed(2)}x`} accent={avgRoas >= ROAS_TARGET} />
              {bestFormat && <StatPill label="Best Format" value={bestFormat.key} accent />}
              {bestAngle  && <StatPill label="Best Angle"  value={bestAngle.key}  accent />}
            </div>

            {/* Trend chart */}
            {data.trend && data.trend.length >= 2 && (
              <div className="bg-surface border border-border rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display font-extrabold text-text uppercase tracking-tight">ROAS Over Time</h2>
                  <div className="flex items-center gap-3 text-[11px] font-display font-bold uppercase tracking-wider">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-0.5 bg-accent rounded" />
                      <span className="text-text-dim">ROAS</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-2 bg-accent/20 rounded-sm" />
                      <span className="text-text-dim">Spend</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-0.5 bg-accent/50 rounded" style={{ borderTop: '1px dashed' }} />
                      <span className="text-text-dim">{ROAS_TARGET}x target</span>
                    </div>
                  </div>
                </div>
                <TrendChart data={data.trend} roasTarget={ROAS_TARGET} height={200} />
              </div>
            )}

            <GroupTable title="By Format" rows={data.by_format} maxRoas={maxFormatRoas} />
            <GroupTable title="By Angle"  rows={data.by_angle}  maxRoas={maxAngleRoas}  />
            <CountryTable rows={data.by_country} />
          </>
        )}
      </div>
    </div>
  )
}
