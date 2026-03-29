'use client'
import { useState, useEffect, useCallback } from 'react'
import { CreativeCard } from '@/lib/supabase'
import CreativeCardComponent from '@/components/dashboard/CreativeCard'
import FilterBar from '@/components/dashboard/FilterBar'
import AddBriefModal from '@/components/dashboard/AddBriefModal'
import LinkAdModal from '@/components/dashboard/LinkAdModal'
import StatsBar from '@/components/dashboard/StatsBar'
import { Plus } from 'lucide-react'

export default function Dashboard() {
  const [cards, setCards] = useState<CreativeCard[]>([])
  const [angles, setAngles] = useState<string[]>([])
  const [days, setDays] = useState(14)
  const [market, setMarket] = useState('all')
  const [angle, setAngle] = useState('all')
  const [groupBy, setGroupBy] = useState<'concept' | 'angle'>('concept')
  const [loading, setLoading] = useState(true)
  const [showAddBrief, setShowAddBrief] = useState(false)
  const [linkTarget, setLinkTarget] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/dashboard?days=${days}&market=${market}&angle=${angle}`)
    const json = await res.json()
    setCards(json.cards || [])
    setAngles(json.angles || [])
    setLoading(false)
  }, [days, market, angle])

  useEffect(() => { fetchData() }, [fetchData])

  // Group cards by angle if needed
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

  const winners = cards.filter(c => c.is_winner).length
  const totalSpend = cards.reduce((s, c) => s + c.blended.spend, 0)
  const avgRoas = cards.length > 0
    ? cards.reduce((s, c) => s + c.blended.roas * c.blended.spend, 0) / (totalSpend || 1)
    : 0

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className="border-b border-border sticky top-0 z-40 bg-bg/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-text tracking-tight">
              Creative<span className="text-accent">Tracker</span>
            </h1>
            <p className="text-text-dim text-xs mt-0.5">Meta Ads · NL FR DE ES IT</p>
          </div>
          <button
            onClick={() => setShowAddBrief(true)}
            className="flex items-center gap-2 bg-accent text-bg px-4 py-2 rounded-lg text-sm font-display font-bold hover:bg-accent-dim transition-colors"
          >
            <Plus size={16} />
            New Brief
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Stats summary */}
        <StatsBar
          totalCreatives={cards.length}
          winners={winners}
          totalSpend={totalSpend}
          avgRoas={avgRoas}
        />

        {/* Filters */}
        <FilterBar
          days={days} setDays={setDays}
          market={market} setMarket={setMarket}
          angle={angle} setAngle={setAngle}
          angles={angles}
          groupBy={groupBy} setGroupBy={setGroupBy}
        />

        {/* Cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 rounded-xl bg-surface border border-border animate-pulse" />
            ))}
          </div>
        ) : cards.length === 0 ? (
          <div className="text-center py-24 text-text-dim">
            <p className="text-lg font-display">No creatives yet</p>
            <p className="text-sm mt-2">Add your first brief to get started</p>
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
      </div>

      {showAddBrief && (
        <AddBriefModal onClose={() => setShowAddBrief(false)} onSaved={fetchData} />
      )}
      {linkTarget && (
        <LinkAdModal briefId={linkTarget} onClose={() => setLinkTarget(null)} onSaved={fetchData} />
      )}
    </div>
  )
}
