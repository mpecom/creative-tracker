'use client'
import { useState, useEffect, useCallback } from 'react'
import { CreativeCard } from '@/lib/supabase'
import CreativeCardComponent from '@/components/dashboard/CreativeCard'
import AddBriefModal from '@/components/dashboard/AddBriefModal'
import LinkAdModal from '@/components/dashboard/LinkAdModal'
import { Trophy, TrendingUp, Euro, Layers, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { ROAS_TARGET } from '@/lib/aggregate'

const MARKET_FLAGS: Record<string, string> = {
  NL: '🇳🇱', FR: '🇫🇷', DE: '🇩🇪', ES: '🇪🇸', IT: '🇮🇹'
}

function StatCard({
  icon: Icon, label, value, sub, accent
}: {
  icon: React.ElementType; label: string; value: string; sub: string; accent?: boolean
}) {
  return (
    <div className={`bg-surface border rounded-xl px-5 py-4 ${accent ? 'border-accent/30' : 'border-border'}`}>
      <div className="flex items-center gap-2 text-text-dim text-xs mb-2">
        <Icon size={13} className={accent ? 'text-accent' : ''} />
        {label}
      </div>
      <div className={`font-display font-bold text-2xl ${accent ? 'text-accent' : 'text-text'}`}>{value}</div>
      <div className="text-text-dim text-xs mt-0.5">{sub}</div>
    </div>
  )
}

export default function Dashboard() {
  const [cards, setCards] = useState<CreativeCard[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddBrief, setShowAddBrief] = useState(false)
  const [linkTarget, setLinkTarget] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/dashboard?days=14&market=all&angle=all')
    const json = await res.json()
    setCards(json.cards || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const withData = cards.filter(c => c.blended.spend > 0)
  const winners = withData.filter(c => c.is_winner)
  const totalSpend = withData.reduce((s, c) => s + c.blended.spend, 0)
  const avgRoas = withData.length > 0
    ? withData.reduce((s, c) => s + c.blended.roas * c.blended.spend, 0) / (totalSpend || 1)
    : 0
  const unlinked = cards.filter(c => !c.creative).length

  // Top 3 winners by ROAS
  const topWinners = [...winners].sort((a, b) => b.blended.roas - a.blended.roas).slice(0, 3)

  // Recent briefs without performance
  const ideas = cards.filter(c => c.blended.spend === 0).slice(0, 4)

  const fmt = (n: number) => n >= 1000 ? `€${(n / 1000).toFixed(1)}k` : `€${n.toFixed(0)}`

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className="border-b border-border sticky top-0 z-20 bg-bg/95 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-display font-bold text-xl text-text">Overview</h1>
            <p className="text-text-dim text-xs mt-0.5">Last 14 days · All markets</p>
          </div>
          <button
            onClick={() => setShowAddBrief(true)}
            className="flex items-center gap-2 bg-accent text-bg px-4 py-2 rounded-lg text-sm font-display font-bold hover:bg-accent-dim transition-colors"
          >
            + New Brief
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-6 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon={Layers} label="Total Briefs" value={cards.length.toString()} sub="in tracker" />
          <StatCard icon={Trophy} label="Winners" value={winners.length.toString()} sub={`≥ ${ROAS_TARGET}x ROAS`} accent />
          <StatCard icon={Euro} label="Total Spend" value={fmt(totalSpend)} sub="14d blended" />
          <StatCard icon={TrendingUp} label="Avg ROAS" value={`${avgRoas.toFixed(2)}x`} sub="spend-weighted" accent={avgRoas >= ROAS_TARGET} />
        </div>

        {/* Top performers */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <div key={i} className="h-28 rounded-xl bg-surface border border-border animate-pulse" />)}
          </div>
        ) : topWinners.length > 0 ? (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display font-bold text-sm text-text-dim uppercase tracking-widest">
                Top Performers
              </h2>
              <Link href="/creatives" className="flex items-center gap-1 text-xs text-accent hover:text-accent-dim font-display font-bold transition-colors">
                All creatives <ArrowRight size={12} />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {topWinners.map(card => (
                <CreativeCardComponent
                  key={card.brief.id}
                  card={card}
                  onLinkAd={() => setLinkTarget(card.brief.id)}
                  onRefresh={fetchData}
                />
              ))}
            </div>
          </section>
        ) : withData.length === 0 ? null : (
          <section>
            <h2 className="font-display font-bold text-sm text-text-dim uppercase tracking-widest mb-3">Active Creatives</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {withData.slice(0, 3).map(card => (
                <CreativeCardComponent
                  key={card.brief.id}
                  card={card}
                  onLinkAd={() => setLinkTarget(card.brief.id)}
                  onRefresh={fetchData}
                />
              ))}
            </div>
          </section>
        )}

        {/* Ideas pipeline snapshot */}
        {ideas.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display font-bold text-sm text-text-dim uppercase tracking-widest">
                Idea Pipeline
              </h2>
              <Link href="/creatives" className="flex items-center gap-1 text-xs text-accent hover:text-accent-dim font-display font-bold transition-colors">
                Manage <ArrowRight size={12} />
              </Link>
            </div>
            <div className="bg-surface border border-border rounded-xl divide-y divide-border">
              {ideas.map(card => (
                <div key={card.brief.id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="font-display font-bold text-accent text-sm">{card.brief.concept_id}</span>
                    <div>
                      <p className="text-text text-sm font-display font-bold">{card.brief.angle}</p>
                      <p className="text-text-dim text-xs">{card.brief.format} · {card.brief.hook.slice(0, 50)}{card.brief.hook.length > 50 ? '…' : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {card.brief.markets.map(m => (
                        <span key={m} className="text-xs">{MARKET_FLAGS[m] || m}</span>
                      ))}
                    </div>
                    {!card.creative ? (
                      <button
                        onClick={() => setLinkTarget(card.brief.id)}
                        className="text-xs text-accent hover:text-accent-dim font-display font-bold transition-colors whitespace-nowrap"
                      >
                        Link Ad →
                      </button>
                    ) : (
                      <span className="text-xs text-text-dim bg-border px-2 py-0.5 rounded font-display font-bold">Linked</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {unlinked > 4 && (
              <p className="text-text-dim text-xs mt-2 text-center">
                +{unlinked - 4} more ideas waiting to be linked
              </p>
            )}
          </section>
        )}

        {/* Empty state */}
        {!loading && cards.length === 0 && (
          <div className="text-center py-24 text-text-dim">
            <p className="text-lg font-display font-bold">No creatives yet</p>
            <p className="text-sm mt-2">Add your first brief to get started</p>
            <button
              onClick={() => setShowAddBrief(true)}
              className="mt-4 inline-flex items-center gap-2 bg-accent text-bg px-5 py-2.5 rounded-lg text-sm font-display font-bold hover:bg-accent-dim transition-colors"
            >
              + New Brief
            </button>
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
