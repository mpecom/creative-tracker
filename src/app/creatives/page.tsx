'use client'
import { useState, useEffect, useCallback } from 'react'
import { CreativeCard, BriefStatus } from '@/lib/supabase'
import KanbanBoard from '@/components/dashboard/KanbanBoard'
import BriefDetailModal from '@/components/dashboard/BriefDetailModal'
import AddBriefModal from '@/components/dashboard/AddBriefModal'
import LinkAdModal from '@/components/dashboard/LinkAdModal'
import { Plus, Layers, ImageOff, Trophy, ChevronUp, ChevronDown } from 'lucide-react'
import { ROAS_TARGET } from '@/lib/aggregate'
import Sparkline from '@/components/dashboard/Sparkline'

type ViewMode = 'board' | 'list'
type SortKey = 'roas' | 'cpa' | 'spend' | 'hook' | 'date'

const MARKET_FLAGS: Record<string, string> = { NL: '🇳🇱', FR: '🇫🇷', DE: '🇩🇪', ES: '🇪🇸', IT: '🇮🇹' }
const DAYS_OPTIONS = [7, 14, 30, 60]
const FORMATS = ['All', 'UGC', 'Video', 'Static', 'Carousel', 'DPA', 'Collection']
const STATUS_LIST = ['all', 'idea', 'script', 'production', 'review', 'ready', 'live', 'active']

const STATUS_COLORS: Record<string, string> = {
  idea:       'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  script:     'text-blue-400 bg-blue-400/10 border-blue-400/20',
  production: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  review:     'text-orange-400 bg-orange-400/10 border-orange-400/20',
  ready:      'text-green-400 bg-green-400/10 border-green-400/20',
  live:       'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
  active:     'text-accent bg-accent/10 border-accent/20',
}

function fmt(n: number) {
  return n >= 1000 ? `€${(n / 1000).toFixed(1)}k` : `€${n.toFixed(0)}`
}

function SortHeader({ label, col, sortBy, sortDir, onSort }: {
  label: string; col: SortKey; sortBy: SortKey; sortDir: 'asc' | 'desc'
  onSort: (col: SortKey) => void
}) {
  const active = sortBy === col
  return (
    <button
      onClick={() => onSort(col)}
      className={`flex items-center gap-0.5 text-[11px] font-display font-bold uppercase tracking-wider transition-colors whitespace-nowrap ml-auto ${
        active ? 'text-accent' : 'text-text-dim hover:text-text'
      }`}
    >
      {label}
      {active ? (sortDir === 'desc' ? <ChevronDown size={10} /> : <ChevronUp size={10} />) : null}
    </button>
  )
}

export default function Creatives() {
  const [cards, setCards] = useState<CreativeCard[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<ViewMode>('board')
  const [days, setDays] = useState(14)
  const [marketFilter, setMarketFilter] = useState('all')
  const [formatFilter, setFormatFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState<SortKey>('roas')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [showAddBrief, setShowAddBrief] = useState(false)
  const [linkTarget, setLinkTarget] = useState<string | null>(null)
  const [detailCard, setDetailCard] = useState<CreativeCard | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/dashboard?days=${days}&market=${marketFilter}&angle=all`)
    const json = await res.json()
    setCards(json.cards || [])
    setLoading(false)
  }, [days, marketFilter])

  useEffect(() => { fetchData() }, [fetchData])

  const handleStatusChange = async (briefId: string, newStatus: BriefStatus) => {
    setCards(prev => prev.map(c =>
      c.brief.id === briefId ? { ...c, brief: { ...c.brief, status: newStatus } } : c
    ))
    await fetch('/api/briefs', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: briefId, status: newStatus }),
    })
  }

  const handleSort = (col: SortKey) => {
    if (sortBy === col) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    } else {
      setSortBy(col)
      setSortDir(col === 'cpa' ? 'asc' : 'desc')
    }
  }

  let filtered = cards
  if (formatFilter !== 'all') filtered = filtered.filter(c => c.brief.format === formatFilter)
  if (statusFilter !== 'all') filtered = filtered.filter(c => c.brief.status === statusFilter)

  const sorted = [...filtered].sort((a, b) => {
    const aHas = a.blended.spend > 0
    const bHas = b.blended.spend > 0
    if (aHas && !bHas) return -1
    if (!aHas && bHas) return 1
    if (!aHas && !bHas) return new Date(b.brief.created_at).getTime() - new Date(a.brief.created_at).getTime()
    let va = 0, vb = 0
    switch (sortBy) {
      case 'roas':  va = a.blended.roas; vb = b.blended.roas; break
      case 'cpa':   va = a.blended.cpa || 9999; vb = b.blended.cpa || 9999; break
      case 'spend': va = a.blended.spend; vb = b.blended.spend; break
      case 'hook':  va = a.blended.thumbstop_rate; vb = b.blended.thumbstop_rate; break
      case 'date':  va = new Date(a.brief.created_at).getTime(); vb = new Date(b.brief.created_at).getTime(); break
    }
    return sortDir === 'desc' ? vb - va : va - vb
  })

  const pipeline = cards.filter(c => ['idea','script','production','review','ready'].includes(c.brief.status))
  const launched  = cards.filter(c => ['live','active'].includes(c.brief.status))
  const winners   = cards.filter(c => c.is_winner)

  return (
    <div className="min-h-screen bg-bg">
      <header className="border-b border-border sticky top-0 z-20 bg-bg/95 backdrop-blur-sm">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="font-display font-extrabold text-2xl text-text uppercase tracking-tight">Creatives</h1>
            <p className="text-text-dim text-[11px] mt-0.5 font-display font-bold uppercase tracking-widest">
              {pipeline.length} in pipeline · {launched.length} launched · {winners.length} winners
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-surface border border-border rounded-lg p-0.5">
              <button
                onClick={() => setView('board')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-display font-bold uppercase tracking-wide transition-colors ${
                  view === 'board' ? 'bg-accent text-white' : 'text-text-dim hover:text-text'
                }`}
              >
                <Layers size={12} /> Board
              </button>
              <button
                onClick={() => setView('list')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-display font-bold uppercase tracking-wide transition-colors ${
                  view === 'list' ? 'bg-accent text-white' : 'text-text-dim hover:text-text'
                }`}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
                  <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
                </svg>
                List
              </button>
            </div>
            <button
              onClick={() => setShowAddBrief(true)}
              className="flex items-center gap-2 bg-cta text-white px-4 py-2 rounded-lg text-sm font-display font-bold hover:opacity-90 transition-opacity uppercase tracking-wide"
            >
              <Plus size={14} /> New Brief
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-6 py-5">
        {/* Board */}
        {view === 'board' && (
          loading ? (
            <div className="flex gap-3 overflow-x-auto pt-1">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="flex-shrink-0 w-64">
                  <div className="h-6 w-20 bg-border rounded animate-pulse mb-3" />
                  <div className="h-40 bg-surface/50 border border-border border-dashed rounded-xl animate-pulse" />
                </div>
              ))}
            </div>
          ) : (
            <KanbanBoard cards={cards} onStatusChange={handleStatusChange} onCardClick={setDetailCard} />
          )
        )}

        {/* List */}
        {view === 'list' && (
          <>
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2 mb-5">
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
                  <button key={m} onClick={() => setMarketFilter(m)}
                    className={`px-3 py-1.5 text-xs font-display font-bold uppercase tracking-wide transition-colors ${
                      marketFilter === m ? 'bg-accent text-white' : 'text-text-dim hover:text-text'
                    }`}>{m === 'all' ? 'All' : m}</button>
                ))}
              </div>
              <select value={formatFilter} onChange={e => setFormatFilter(e.target.value)}
                className="bg-surface border border-border rounded-lg px-3 py-1.5 text-xs font-display font-bold text-text-dim outline-none cursor-pointer uppercase tracking-wide">
                {FORMATS.map(f => <option key={f} value={f === 'All' ? 'all' : f}>{f}</option>)}
              </select>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                className="bg-surface border border-border rounded-lg px-3 py-1.5 text-xs font-display font-bold text-text-dim outline-none cursor-pointer uppercase tracking-wide">
                {STATUS_LIST.map(s => (
                  <option key={s} value={s}>{s === 'all' ? 'All Status' : s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
              <span className="ml-auto text-text-dim text-xs font-display font-bold uppercase tracking-widest">
                {sorted.length} creatives
              </span>
            </div>

            {loading ? (
              <div className="space-y-1.5">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="h-16 rounded-xl bg-surface border border-border animate-pulse" />
                ))}
              </div>
            ) : sorted.length === 0 ? (
              <div className="text-center py-24 text-text-dim">
                <p className="font-display font-extrabold text-xl uppercase">No creatives found</p>
                <p className="text-sm mt-1">Adjust filters or add a new brief</p>
              </div>
            ) : (
              <div className="bg-surface border border-border rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <div style={{ minWidth: '860px' }}>
                    {/* Header */}
                    <div className="grid items-center px-4 py-2.5 border-b border-border bg-bg/60"
                      style={{ gridTemplateColumns: '32px 44px 1fr 76px 72px 88px 80px 76px 68px 82px 104px' }}>
                      <span className="text-[11px] font-display font-bold text-muted uppercase">#</span>
                      <span />
                      <span className="text-[11px] font-display font-bold text-text-dim uppercase tracking-wider pl-1">Creative</span>
                      <span className="text-[11px] font-display font-bold text-text-dim uppercase tracking-wider">Fmt</span>
                      <span className="text-[11px] font-display font-bold text-text-dim uppercase tracking-wider text-right">Trend</span>
                      <div className="flex justify-end">
                        <SortHeader label="ROAS" col="roas" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
                      </div>
                      <div className="flex justify-end">
                        <SortHeader label="CPA" col="cpa" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
                      </div>
                      <div className="flex justify-end">
                        <SortHeader label="Hook%" col="hook" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
                      </div>
                      <span className="text-[11px] font-display font-bold text-text-dim uppercase tracking-wider text-right">CTR</span>
                      <div className="flex justify-end">
                        <SortHeader label="Spend" col="spend" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
                      </div>
                      <span className="text-[11px] font-display font-bold text-text-dim uppercase tracking-wider text-right">Status</span>
                    </div>

                    {/* Rows */}
                    {sorted.map((card, i) => {
                      const { brief, creative, blended, is_winner } = card
                      const hasData = blended.spend > 0
                      const statusCls = STATUS_COLORS[brief.status] || 'text-text-dim bg-border border-border'
                      const roasBad = hasData && blended.roas < 1.5

                      return (
                        <div key={brief.id} onClick={() => setDetailCard(card)}
                          className={`grid items-center px-4 py-3 border-b border-border last:border-b-0 cursor-pointer transition-colors hover:bg-border/40 ${
                            is_winner ? 'border-l-2 border-l-accent' : 'border-l-2 border-l-transparent'
                          }`}
                          style={{ gridTemplateColumns: '32px 44px 1fr 76px 72px 88px 80px 76px 68px 82px 104px' }}>

                          {/* Rank */}
                          <span className={`text-xs font-display font-bold ${is_winner ? 'text-accent' : 'text-muted'}`}>
                            {hasData ? i + 1 : '—'}
                          </span>

                          {/* Thumbnail */}
                          <div className="w-9 h-9 rounded-lg bg-border overflow-hidden flex items-center justify-center">
                            {creative?.thumbnail_url
                              ? <img src={creative.thumbnail_url} alt="" className="w-full h-full object-cover" />
                              : <ImageOff size={12} className="text-muted" />}
                          </div>

                          {/* Creative */}
                          <div className="min-w-0 px-1">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="font-display font-bold text-[11px] text-accent uppercase tracking-wider">{brief.concept_id}</span>
                              {is_winner && <Trophy size={9} className="text-accent flex-shrink-0" />}
                              <div className="flex gap-0.5">
                                {brief.markets.slice(0, 3).map(m => <span key={m} className="text-[11px]">{MARKET_FLAGS[m]}</span>)}
                                {brief.markets.length > 3 && <span className="text-muted text-[11px]">+{brief.markets.length - 3}</span>}
                              </div>
                            </div>
                            <p className="text-text font-display font-bold text-sm leading-tight truncate">{brief.angle}</p>
                            <p className="text-text-dim text-xs truncate leading-tight">{brief.hook}</p>
                          </div>

                          {/* Format */}
                          <div>
                            <span className="text-[10px] font-display font-bold text-muted bg-border px-1.5 py-0.5 rounded uppercase tracking-wider">
                              {brief.format}
                            </span>
                          </div>

                          {/* Sparkline */}
                          <div className="flex justify-end items-center">
                            {hasData && card.trend.length >= 2
                              ? <Sparkline data={card.trend} width={64} height={22} />
                              : <span className="text-muted text-xs">—</span>}
                          </div>

                          {/* ROAS */}
                          <div className="text-right">
                            {hasData
                              ? <span className={`font-display font-bold text-sm ${is_winner ? 'text-accent' : roasBad ? 'text-loser' : 'text-text'}`}>
                                  {blended.roas.toFixed(2)}x
                                </span>
                              : <span className="text-muted text-xs">—</span>}
                          </div>

                          {/* CPA */}
                          <div className="text-right">
                            {hasData
                              ? <span className="text-sm text-text-dim">€{blended.cpa.toFixed(0)}</span>
                              : <span className="text-muted text-xs">—</span>}
                          </div>

                          {/* Hook% */}
                          <div className="text-right">
                            {hasData && blended.thumbstop_rate > 0
                              ? <span className={`text-sm font-display font-bold ${blended.thumbstop_rate >= 0.3 ? 'text-accent' : 'text-text-dim'}`}>
                                  {(blended.thumbstop_rate * 100).toFixed(1)}%
                                </span>
                              : <span className="text-muted text-xs">—</span>}
                          </div>

                          {/* CTR */}
                          <div className="text-right">
                            {hasData && blended.ctr > 0
                              ? <span className="text-sm text-text-dim">{blended.ctr.toFixed(2)}%</span>
                              : <span className="text-muted text-xs">—</span>}
                          </div>

                          {/* Spend */}
                          <div className="text-right">
                            {hasData
                              ? <span className="text-sm text-text-dim">{fmt(blended.spend)}</span>
                              : <span className="text-muted text-xs">—</span>}
                          </div>

                          {/* Status */}
                          <div className="flex justify-end">
                            <span className={`text-[10px] font-display font-bold px-2 py-0.5 rounded border capitalize uppercase tracking-wide ${statusCls}`}>
                              {brief.status}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Footer totals */}
                {sorted.some(c => c.blended.spend > 0) && (() => {
                  const withData = sorted.filter(c => c.blended.spend > 0)
                  const totalSpend = withData.reduce((s, c) => s + c.blended.spend, 0)
                  const avgRoas = totalSpend > 0
                    ? withData.reduce((s, c) => s + c.blended.roas * c.blended.spend, 0) / totalSpend
                    : 0
                  return (
                    <div className="px-4 py-2.5 border-t border-border bg-bg/40 flex gap-6 flex-wrap">
                      <span className="text-text-dim text-[11px] font-display font-bold uppercase tracking-wider">
                        Spend <span className="text-text">{fmt(totalSpend)}</span>
                      </span>
                      <span className="text-text-dim text-[11px] font-display font-bold uppercase tracking-wider">
                        Avg ROAS <span className={avgRoas >= ROAS_TARGET ? 'text-accent' : 'text-text'}>{avgRoas.toFixed(2)}x</span>
                      </span>
                      <span className="text-text-dim text-[11px] font-display font-bold uppercase tracking-wider">
                        Winners <span className="text-accent">{withData.filter(c => c.is_winner).length}/{withData.length}</span>
                      </span>
                    </div>
                  )
                })()}
              </div>
            )}
          </>
        )}
      </div>

      {showAddBrief && <AddBriefModal onClose={() => setShowAddBrief(false)} onSaved={fetchData} />}
      {linkTarget && <LinkAdModal briefId={linkTarget} onClose={() => setLinkTarget(null)} onSaved={fetchData} />}
      {detailCard && <BriefDetailModal card={detailCard} onClose={() => setDetailCard(null)} onSaved={fetchData} />}
    </div>
  )
}
