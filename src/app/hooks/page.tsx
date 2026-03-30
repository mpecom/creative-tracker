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

function ThumbstopBar({ rate, max }: { rate: number; max: number }) {
  const pct = max > 0 ? Math.min((rate / max) * 100, 100) : 0
  const good = rate >= 0.25
  return (
    <div className="flex items-center gap-2">
      <div className="w-24 h-1.5 bg-border rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full bar-fill ${good ? 'bg-accent' : 'bg-text-dim'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`font-display font-bold text-sm ${good ? 'text-accent' : 'text-text-dim'}`}>
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

  return (
    <div className="min-h-screen bg-bg">
      <header className="border-b border-border sticky top-0 z-20 bg-bg/95 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-display font-bold text-xl text-text">Hook Analysis</h1>
            <p className="text-text-dim text-xs mt-0.5">Ranked by thumbstop (hook) rate · best hooks keep people watching</p>
          </div>
          <div className="flex gap-2">
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

      <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="h-14 rounded-xl bg-surface border border-border animate-pulse" />)}
          </div>
        ) : hooks.length === 0 ? (
          <div className="text-center py-24 text-text-dim">
            <Zap size={32} className="mx-auto mb-3 opacity-30" />
            <p className="font-display font-bold">No hook data yet</p>
            <p className="text-sm mt-1">Add briefs with hooks, then connect them to running Facebook ads</p>
          </div>
        ) : (
          <>
            {/* Hooks with performance data */}
            {withData.length > 0 && (
              <div className="bg-surface border border-border rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                  <Zap size={14} className="text-accent" />
                  <h2 className="font-display font-bold text-text">Hooks with Performance Data</h2>
                  <span className="text-muted text-xs ml-auto">{withData.length} hooks · sorted by thumbstop rate</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left px-5 py-2.5 text-text-dim text-xs font-display font-bold uppercase tracking-wide w-8">#</th>
                        <th className="text-left px-4 py-2.5 text-text-dim text-xs font-display font-bold uppercase tracking-wide">Hook text</th>
                        <th className="text-left px-4 py-2.5 text-text-dim text-xs font-display font-bold uppercase tracking-wide">Thumbstop</th>
                        <th className="text-right px-4 py-2.5 text-text-dim text-xs font-display font-bold uppercase tracking-wide">ROAS</th>
                        <th className="text-right px-4 py-2.5 text-text-dim text-xs font-display font-bold uppercase tracking-wide">CTR</th>
                        <th className="text-right px-4 py-2.5 text-text-dim text-xs font-display font-bold uppercase tracking-wide">CPA</th>
                        <th className="text-right px-4 py-2.5 text-text-dim text-xs font-display font-bold uppercase tracking-wide">Spend</th>
                        <th className="text-right px-5 py-2.5 text-text-dim text-xs font-display font-bold uppercase tracking-wide">Creatives</th>
                      </tr>
                    </thead>
                    <tbody>
                      {withData.map((row, i) => (
                        <tr key={row.hook} className={`${i < withData.length - 1 ? 'border-b border-border' : ''} hover:bg-border/20 transition-colors`}>
                          <td className="px-5 py-3 text-muted text-xs font-display font-bold">{i + 1}</td>
                          <td className="px-4 py-3 max-w-xs">
                            <p className="text-text text-sm font-body leading-snug">{row.hook}</p>
                          </td>
                          <td className="px-4 py-3">
                            <ThumbstopBar rate={row.thumbstop_rate} max={maxThumbstop} />
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className={`font-display font-bold text-sm ${row.roas >= ROAS_TARGET ? 'text-accent' : 'text-loser'}`}>
                              {row.roas > 0 ? `${row.roas.toFixed(2)}x` : '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-text-dim font-body">
                            {row.ctr > 0 ? `${row.ctr.toFixed(2)}%` : '—'}
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-text-dim font-body">
                            {row.cpa > 0 ? fmt(row.cpa) : '—'}
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-text-dim font-body">{fmt(row.spend)}</td>
                          <td className="px-5 py-3 text-right text-sm text-text-dim font-body">{row.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Hooks without data yet */}
            {noData.length > 0 && (
              <div className="bg-surface border border-border rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-border">
                  <h2 className="font-display font-bold text-text-dim">Untested Hooks</h2>
                  <p className="text-text-dim text-xs mt-0.5">These hooks haven&apos;t been linked to a running ad yet</p>
                </div>
                <div className="divide-y divide-border">
                  {noData.map(row => (
                    <div key={row.hook} className="px-5 py-3 flex items-center justify-between">
                      <p className="text-text-dim text-sm font-body">{row.hook}</p>
                      <span className="text-muted text-xs font-display font-bold">{row.count} brief{row.count !== 1 ? 's' : ''}</span>
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
