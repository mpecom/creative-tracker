'use client'
import { useState, useEffect, useCallback } from 'react'
import { CreativeCard } from '@/lib/supabase'
import CreativeCardComponent from '@/components/dashboard/CreativeCard'
import FilterBar from '@/components/dashboard/FilterBar'
import AddBriefModal from '@/components/dashboard/AddBriefModal'
import LinkAdModal from '@/components/dashboard/LinkAdModal'
import { Plus, Lightbulb, Play, TrendingUp } from 'lucide-react'

const MARKET_FLAGS: Record<string, string> = {
  NL: '🇳🇱', FR: '🇫🇷', DE: '🇩🇪', ES: '🇪🇸', IT: '🇮🇹'
}

type PipelineTab = 'all' | 'ideas' | 'live' | 'active'

function PipelineTabBtn({ id, label, icon: Icon, count, active, onClick }: {
  id: PipelineTab; label: string; icon: React.ElementType; count: number; active: boolean; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-display font-bold border transition-all ${
        active
          ? 'bg-accent text-bg border-accent'
          : 'bg-surface text-text-dim border-border hover:text-text'
      }`}
    >
      <Icon size={14} />
      {label}
      <span className={`text-xs px-1.5 py-0.5 rounded-full font-body ${
        active ? 'bg-bg/20 text-bg' : 'bg-border text-muted'
      }`}>{count}</span>
    </button>
  )
}

export default function Creatives() {
  const [cards, setCards] = useState<CreativeCard[]>([])
  const [angles, setAngles] = useState<string[]>([])
  const [days, setDays] = useState(14)
  const [market, setMarket] = useState('all')
  const [angle, setAngle] = useState('all')
  const [groupBy, setGroupBy] = useState<'concept' | 'angle'>('concept')
  const [tab, setTab] = useState<PipelineTab>('all')
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

  // Pipeline segments
  const ideas = cards.filter(c => !c.creative)
  const live = cards.filter(c => c.creative && c.blended.spend === 0)
  const active = cards.filter(c => c.blended.spend > 0)

  const visibleCards = tab === 'ideas' ? ideas
    : tab === 'live' ? live
    : tab === 'active' ? active
    : cards

  const grouped = groupBy === 'angle'
    ? Object.entries(
        visibleCards.reduce((acc, c) => {
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
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-display font-bold text-xl text-text">Creatives</h1>
            <p className="text-text-dim text-xs mt-0.5">
              {ideas.length} ideas · {live.length} live · {active.length} active
            </p>
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

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-5">
        {/* Pipeline tabs */}
        <div className="flex flex-wrap gap-2">
          <PipelineTabBtn id="all" label="All" icon={TrendingUp} count={cards.length} active={tab === 'all'} onClick={() => setTab('all')} />
          <PipelineTabBtn id="ideas" label="Ideas" icon={Lightbulb} count={ideas.length} active={tab === 'ideas'} onClick={() => setTab('ideas')} />
          <PipelineTabBtn id="live" label="Live – No Data" icon={Play} count={live.length} active={tab === 'live'} onClick={() => setTab('live')} />
          <PipelineTabBtn id="active" label="Active" icon={TrendingUp} count={active.length} active={tab === 'active'} onClick={() => setTab('active')} />
        </div>

        {/* Ideas tab: visual pipeline list */}
        {tab === 'ideas' && !loading && ideas.length > 0 && (
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-border/30">
              <p className="text-text-dim text-xs font-display font-bold uppercase tracking-widest">
                Creative ideas — add brief, then connect to a Facebook ad once launched
              </p>
            </div>
            {ideas.map((card, i) => (
              <div
                key={card.brief.id}
                className={`flex items-center justify-between px-4 py-3 hover:bg-border/20 transition-colors ${
                  i < ideas.length - 1 ? 'border-b border-border' : ''
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-center">
                    <span className="font-display font-bold text-accent text-sm">{card.brief.concept_id}</span>
                    <span className="text-muted text-xs bg-border px-1.5 py-0.5 rounded uppercase tracking-wide font-display font-bold">
                      {card.brief.format}
                    </span>
                  </div>
                  <div>
                    <p className="text-text text-sm font-display font-bold">{card.brief.angle}</p>
                    <p className="text-text-dim text-xs">{card.brief.hook.slice(0, 60)}{card.brief.hook.length > 60 ? '…' : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    {card.brief.markets.map(m => (
                      <span key={m} className="text-xs">{MARKET_FLAGS[m] || m}</span>
                    ))}
                  </div>
                  <span className="text-xs text-text-dim capitalize bg-border px-2 py-0.5 rounded font-display font-bold">
                    {card.brief.awareness_stage}
                  </span>
                  <button
                    onClick={() => setLinkTarget(card.brief.id)}
                    className="text-xs text-accent hover:text-accent-dim font-display font-bold transition-colors border border-accent/30 px-3 py-1 rounded-lg hover:border-accent"
                  >
                    Link Ad →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Filters (shown for non-ideas tabs or all tab) */}
        {tab !== 'ideas' && (
          <FilterBar
            days={days} setDays={setDays}
            market={market} setMarket={setMarket}
            angle={angle} setAngle={setAngle}
            angles={angles}
            groupBy={groupBy} setGroupBy={setGroupBy}
          />
        )}

        {/* Cards grid */}
        {tab !== 'ideas' && (
          loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 rounded-xl bg-surface border border-border animate-pulse" />
              ))}
            </div>
          ) : visibleCards.length === 0 ? (
            <div className="text-center py-20 text-text-dim">
              <p className="font-display font-bold">Nothing here yet</p>
              {tab === 'live' && (
                <p className="text-sm mt-1">Link a Facebook Ad ID to a brief, then n8n will pull data automatically</p>
              )}
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
              {visibleCards.map(card => (
                <CreativeCardComponent
                  key={card.brief.id}
                  card={card}
                  onLinkAd={() => setLinkTarget(card.brief.id)}
                  onRefresh={fetchData}
                />
              ))}
            </div>
          )
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
