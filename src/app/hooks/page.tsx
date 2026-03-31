'use client'
import { useState, useEffect, useCallback } from 'react'
import { Zap } from 'lucide-react'

interface HookRow {
  hook: string
  count: number
  winners: number
  win_rate: number
  roas: number
  cpa: number
  ctr: number
  thumbstop_rate: number
  spend: number
}

const DAYS_OPTIONS = [7, 14, 30, 60]
const ROAS_TARGET = 2.5
const MARKETS = ['all', 'NL', 'FR', 'DE', 'ES', 'IT']

function fmt(n: number) {
  return n >= 1000 ? `€${(n / 1000).toFixed(1)}k` : `€${n.toFixed(0)}`
}

function StatPill({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="bg-surface border border-border rounded-xl px-4 py-3 flex-1 min-w-0">
      <p className="text-text-dim text-[11px] font-display font-bold uppercase tracking-widest mb-1">{label}</p>
      <p className={`font-display font-extrabold text-xl leading-none ${accent ? 'text-accent' : 'text-text'}`}>{value}</p>
    </div>
  )
}

function ThumbstopBar({ rate, max }: { rate: number; max: number }) {
  const pct = max > 0 ? Math.min((rate / max) * 100, 100) : 0
  const good = rate >= 0.25
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 bg-border rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full bar-fill ${good ? 'bg-accent' : 'bg-text-dim/40'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`font-display font-bold text-sm tabular-nums ${good ? 'text-accent' : 'text-text-dim'}`}>
        {rate > 0 ? `${(rate * 100).toFixed(1)}%` : '—'}
      </span>
    </div>
  )
}

export default function Hooks() {
  const [days, setDays] = useState(14)
  const [market, setMarket] = useState('all')
  const [hooks, setHooks] = useState<HookRow[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/hooks?days=${days}&market=${market}`)
    const json = await res.json()
    setHooks(json.hooks || [])
    setLoading(false)
  }, [days, market])

  useEffect(() => { fetchData() }, [fetchData])

  const maxThumbstop = hooks.length > 0 ? Math.max(...hooks.map(h => h.thumbstop_rate), 0.01) : 0.01
  const withData = hooks.filter(h => h.spend > 0)
  const noData = hooks.filter(h => h.spend === 0)

  const totalSpend = withData.reduce((s, h) => s + h.spend, 0)
  const topHook = withData[0]
  const avgThumbstop = withData.length > 0
    ? withData.reduce((s, h) => s + h.thumbstop_rate, 0) / withData.length
    : 0
  const winners = withData.filter(h => h.roas >= ROAS_TARGET).length

  return (
    <div className="min-h-screen bg-bg">
      <header className="border-b border-border sticky top-0 z-20 bg-bg/95 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-display font-extrabold text-2xl text-text uppercase tracking-tight">Hook Analysis</h1>
            <p className="text-text-dim text-[11px] mt-0.5 font-display font-bold uppercase tracking-widest">
              Thumbstop rate · ROAS · CTR by hook
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
              {MARKETS.map(m => (
                <button key={m} onClick={() => setMarket(m)}
                  className={`px-3 py-1.5 text-xs font-display font-bold uppercase tracking-wide transition-colors ${
                    market === m ? 'bg-accent text-white' : 'text-text-dim hover:text-text'
                  }`}>{m === 'all' ? 'All' : m}</button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-6 space-y-5">
        {loading ? (
          <div className="space-y-4">
            <div className="h-14 rounded-xl bg-surface border border-border animate-pulse" />
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-14 rounded-xl bg-surface border border-border animate-pulse" />
            ))}
          </div>
        ) : hooks.length === 0 ? (
          <div className="text-center py-24 text-text-dim">
            <Zap size={36} className="mx-auto mb-4 opacity-20" />
            <p className="font-display font-extrabold text-xl uppercase">No hook data yet</p>
            <p className="text-sm mt-1 font-display">Add briefs with hooks, then connect them to running Facebook ads</p>
          </div>
        ) : (
          <>
            {/* Summary stats */}
            {withData.length > 0 && (
              <div className="flex gap-3">
                <StatPill label="Hooks Tested" value={String(withData.length)} />
                <StatPill
                  label={`Avg Hook% (${days}d)`}
                  value={avgThumbstop > 0 ? `${(avgThumbstop * 100).toFixed(1)}%` : '—'}
                  accent={avgThumbstop >= 0.25}
                />
                <StatPill label="Winners" value={`${winners} / ${withData.length}`} accent={winners > 0} />
                {topHook && (
                  <StatPill
                    label="Best Hook Rate"
                    value={`${(topHook.thumbstop_rate * 100).toFixed(1)}%`}
                    accent
                  />
                )}
                <StatPill label="Total Spend" value={fmt(totalSpend)} />
              </div>
            )}

            {/* Hooks with performance data */}
            {withData.length > 0 && (
              <div className="bg-surface border border-border rounded-xl overflow-hidden">
                <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
                  <h2 className="font-display font-extrabold text-text uppercase tracking-tight">Tested Hooks</h2>
                  <span className="text-text-dim text-[11px] font-display font-bold uppercase tracking-widest">
                    {withData.length} hooks · sorted by thumbstop
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        {['#', 'Hook Text', 'Hook%', 'ROAS', 'CTR', 'CPA', 'Spend', 'Ads', 'Win%'].map(h => (
                          <th key={h} className={`py-2.5 text-[11px] font-display font-bold text-text-dim uppercase tracking-wider ${
                            h === '#' ? 'text-left px-5 w-8' :
                            h === 'Hook Text' ? 'text-left px-4' :
                            h === 'Hook%' ? 'text-left px-4' :
                            h === 'Win%' ? 'text-right px-5' :
                            'text-right px-4'
                          }`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {withData.map((row, i) => (
                        <tr key={row.hook} className={`${i < withData.length - 1 ? 'border-b border-border' : ''} hover:bg-border/20 transition-colors`}>
                          <td className="px-5 py-3 text-text-dim text-[11px] font-display font-bold">{i + 1}</td>
                          <td className="px-4 py-3 max-w-xs">
                            <p className="text-text text-sm leading-snug">{row.hook}</p>
                          </td>
                          <td className="px-4 py-3">
                            <ThumbstopBar rate={row.thumbstop_rate} max={maxThumbstop} />
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className={`font-display font-bold text-sm tabular-nums ${row.roas >= ROAS_TARGET ? 'text-accent' : row.roas > 0 ? 'text-loser' : 'text-text-dim'}`}>
                              {row.roas > 0 ? `${row.roas.toFixed(2)}x` : '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-text-dim tabular-nums">
                            {row.ctr > 0 ? `${row.ctr.toFixed(2)}%` : '—'}
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-text-dim tabular-nums">
                            {row.cpa > 0 ? fmt(row.cpa) : '—'}
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-text-dim tabular-nums">{fmt(row.spend)}</td>
                          <td className="px-4 py-3 text-right text-sm text-text-dim tabular-nums">{row.count}</td>
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
            )}

            {/* Untested hooks */}
            {noData.length > 0 && (
              <div className="bg-surface border border-border rounded-xl overflow-hidden">
                <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
                  <h2 className="font-display font-extrabold text-text-dim uppercase tracking-tight">Untested Hooks</h2>
                  <span className="text-text-dim text-[11px] font-display font-bold uppercase tracking-widest">
                    {noData.length} hooks · no ad data yet
                  </span>
                </div>
                <div className="divide-y divide-border">
                  {noData.map(row => (
                    <div key={row.hook} className="px-5 py-3 flex items-center justify-between">
                      <p className="text-text-dim text-sm">{row.hook}</p>
                      <span className="text-text-dim text-[11px] font-display font-bold uppercase tracking-wider">
                        {row.count} brief{row.count !== 1 ? 's' : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
