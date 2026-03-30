'use client'
import { useState, useEffect, useCallback } from 'react'
import { CreativeCard, BriefStatus } from '@/lib/supabase'
import CreativeCardComponent from '@/components/dashboard/CreativeCard'
import KanbanBoard from '@/components/dashboard/KanbanBoard'
import BriefDetailModal from '@/components/dashboard/BriefDetailModal'
import FilterBar from '@/components/dashboard/FilterBar'
import AddBriefModal from '@/components/dashboard/AddBriefModal'
import LinkAdModal from '@/components/dashboard/LinkAdModal'
import { Plus, LayoutGrid, Columns } from 'lucide-react'

type ViewMode = 'board' | 'grid'

export default function Creatives() {
  const [cards, setCards] = useState<CreativeCard[]>([])
  const [angles, setAngles] = useState<string[]>([])
  const [days, setDays] = useState(14)
  const [market, setMarket] = useState('all')
  const [angle, setAngle] = useState('all')
  const [groupBy, setGroupBy] = useState<'concept' | 'angle'>('concept')
  const [view, setView] = useState<ViewMode>('board')
  const [loading, setLoading] = useState(true)
  const [showAddBrief, setShowAddBrief] = useState(false)
  const [linkTarget, setLinkTarget] = useState<string | null>(null)
  const [detailCard, setDetailCard] = useState<CreativeCard | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/dashboard?days=${days}&market=${market}&angle=${angle}`)
    const json = await res.json()
    setCards(json.cards || [])
    setAngles(json.angles || [])
    setLoading(false)
  }, [days, market, angle])

  useEffect(() => { fetchData() }, [fetchData])

  const handleStatusChange = async (briefId: string, newStatus: BriefStatus) => {
    // Optimistic update
    setCards(prev => prev.map(c =>
      c.brief.id === briefId ? { ...c, brief: { ...c.brief, status: newStatus } } : c
    ))
    await fetch('/api/briefs', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: briefId, status: newStatus }),
    })
  }

  // Stats
  const byStatus = (s: BriefStatus) => cards.filter(c => c.brief.status === s).length
  const prelaunch = byStatus('idea') + byStatus('script') + byStatus('production') + byStatus('review') + byStatus('ready')
  const launched = byStatus('live') + byStatus('active')

  // Grid view: group by status
  const grouped = groupBy === 'angle'
    ? Object.entries(
        cards.reduce((acc, c) => {
          const key = c.brief.angle || 'Untagged'
          if (!acc[key]) acc[key] = []
          acc[key].push(c)
          return acc
        }, {} as Record<string, CreativeCard[]>)
      )
    : null

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className="border-b border-border sticky top-0 z-20 bg-bg/95 backdrop-blur-sm">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-display font-bold text-xl text-text">Creatives</h1>
            <p className="text-text-dim text-xs mt-0.5">
              {prelaunch} in pipeline · {launched} launched
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* View toggle */}
            <div className="flex bg-bg border border-border rounded-lg p-0.5">
              <button
                onClick={() => setView('board')}
                className={`p-1.5 rounded-md transition-colors ${
                  view === 'board' ? 'bg-surface text-accent' : 'text-text-dim hover:text-text'
                }`}
                title="Board view"
              >
                <Columns size={16} />
              </button>
              <button
                onClick={() => setView('grid')}
                className={`p-1.5 rounded-md transition-colors ${
                  view === 'grid' ? 'bg-surface text-accent' : 'text-text-dim hover:text-text'
                }`}
                title="Grid view"
              >
                <LayoutGrid size={16} />
              </button>
            </div>

            <button
              onClick={() => setShowAddBrief(true)}
              className="flex items-center gap-2 bg-accent text-bg px-4 py-2 rounded-lg text-sm font-display font-bold hover:bg-accent-dim transition-colors"
            >
              <Plus size={16} />
              New Brief
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-6 py-6 space-y-5">
        {view === 'board' ? (
          /* ── Kanban Board View ── */
          loading ? (
            <div className="flex gap-3 overflow-x-auto">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="flex-shrink-0 w-64">
                  <div className="h-6 w-20 bg-border rounded animate-pulse mb-3" />
                  <div className="h-40 bg-surface/50 border border-border border-dashed rounded-xl animate-pulse" />
                </div>
              ))}
            </div>
          ) : (
            <KanbanBoard
              cards={cards}
              onStatusChange={handleStatusChange}
              onCardClick={setDetailCard}
            />
          )
        ) : (
          /* ── Grid/List View ── */
          <>
            <FilterBar
              days={days} setDays={setDays}
              market={market} setMarket={setMarket}
              angle={angle} setAngle={setAngle}
              angles={angles}
              groupBy={groupBy} setGroupBy={setGroupBy}
            />

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-48 rounded-xl bg-surface border border-border animate-pulse" />
                ))}
              </div>
            ) : cards.length === 0 ? (
              <div className="text-center py-20 text-text-dim">
                <p className="font-display font-bold">No creatives found</p>
                <p className="text-sm mt-1">Adjust filters or add a new brief</p>
              </div>
            ) : groupBy === 'angle' && grouped ? (
              <div className="space-y-8">
                {grouped.map(([angleName, angleCards]) => (
                  <div key={angleName}>
                    <h2 className="font-display font-bold text-text-dim text-xs uppercase tracking-widest mb-3">
                      {angleName} <span className="text-muted">({angleCards.length})</span>
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {angleCards.map(card => (
                        <CreativeCardComponent
                          key={card.brief.id}
                          card={card}
                          onLinkAd={() => setLinkTarget(card.brief.id)}
                          onRefresh={fetchData}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {cards.map(card => (
                  <CreativeCardComponent
                    key={card.brief.id}
                    card={card}
                    onLinkAd={() => setLinkTarget(card.brief.id)}
                    onRefresh={fetchData}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {showAddBrief && (
        <AddBriefModal onClose={() => setShowAddBrief(false)} onSaved={fetchData} />
      )}
      {linkTarget && (
        <LinkAdModal briefId={linkTarget} onClose={() => setLinkTarget(null)} onSaved={fetchData} />
      )}
      {detailCard && (
        <BriefDetailModal card={detailCard} onClose={() => setDetailCard(null)} onSaved={fetchData} />
      )}
    </div>
  )
}
