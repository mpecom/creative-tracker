'use client'
import { useState } from 'react'
import { BriefStatus, CreativeCard } from '@/lib/supabase'
import {
  Lightbulb, FileText, Video, Eye, Rocket, Radio, TrendingUp,
  ChevronRight, ChevronLeft, GripVertical, ExternalLink, Tag, Trash2,
} from 'lucide-react'

interface Props {
  cards: CreativeCard[]
  onStatusChange: (briefId: string, newStatus: BriefStatus) => void
  onCardClick: (card: CreativeCard) => void
  onRefresh: () => void
}

const COLUMNS: { status: BriefStatus; label: string; icon: React.ElementType; color: string }[] = [
  { status: 'idea',       label: 'Idea',       icon: Lightbulb,  color: 'text-yellow-400' },
  { status: 'script',     label: 'Script',     icon: FileText,   color: 'text-blue-400' },
  { status: 'production', label: 'Production', icon: Video,      color: 'text-purple-400' },
  { status: 'review',     label: 'Review',     icon: Eye,        color: 'text-orange-400' },
  { status: 'ready',      label: 'Ready',      icon: Rocket,     color: 'text-green-400' },
  { status: 'live',       label: 'Live',       icon: Radio,      color: 'text-cyan-400' },
  { status: 'active',     label: 'Active',     icon: TrendingUp, color: 'text-accent' },
]

const MARKET_FLAGS: Record<string, string> = { NL: '🇳🇱', FR: '🇫🇷', DE: '🇩🇪', ES: '🇪🇸', IT: '🇮🇹' }

function KanbanCard({ card, onMove, onClick, onDelete }: {
  card: CreativeCard
  onMove: (dir: 'left' | 'right') => void
  onClick: () => void
  onDelete: () => void
}) {
  const { brief, blended, is_winner, creative } = card
  const hasPerf = blended.spend > 0
  const isLinked = !!creative
  const statusIdx = COLUMNS.findIndex(c => c.status === brief.status)
  const canLeft = statusIdx > 0
  const canRight = statusIdx < COLUMNS.length - 1
  const [confirming, setConfirming] = useState(false)

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirming) { setConfirming(true); return }
    onDelete()
  }

  return (
    <div
      className={`bg-bg border rounded-xl p-3 space-y-2 cursor-pointer transition-all group ${
        is_winner
          ? 'border-accent/50 border-l-2 border-l-accent'
          : 'border-border hover:border-accent/30'
      }`}
      onClick={() => { setConfirming(false); onClick() }}
      onMouseLeave={() => setConfirming(false)}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <GripVertical size={12} className="text-muted flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
          <span className="font-display font-extrabold text-accent text-xs">{brief.concept_id}</span>
          <span className="text-muted text-[10px] bg-border px-1.5 py-0.5 rounded font-display font-bold uppercase tracking-wide flex-shrink-0">
            {brief.format}
          </span>
        </div>

        {/* Controls: delete + move arrows */}
        <div className="flex items-center gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Delete — only for unlinked briefs */}
          {!isLinked && (
            <button
              onClick={handleDelete}
              className={`h-5 flex items-center justify-center rounded px-1.5 text-xs transition-colors ${
                confirming
                  ? 'bg-loser text-white font-display font-bold'
                  : 'text-muted hover:text-loser hover:bg-border'
              }`}
            >
              {confirming ? 'Sure?' : <Trash2 size={11} />}
            </button>
          )}
          {canLeft && (
            <button
              onClick={e => { e.stopPropagation(); onMove('left') }}
              className="w-5 h-5 flex items-center justify-center rounded text-text-dim hover:text-text hover:bg-border transition-colors"
            >
              <ChevronLeft size={12} />
            </button>
          )}
          {canRight && (
            <button
              onClick={e => { e.stopPropagation(); onMove('right') }}
              className="w-5 h-5 flex items-center justify-center rounded text-text-dim hover:text-text hover:bg-border transition-colors"
            >
              <ChevronRight size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Angle + Hook */}
      <div>
        <p className="text-text text-sm font-display font-bold leading-snug truncate">{brief.angle}</p>
        <p className="text-text-dim text-xs truncate">{brief.hook}</p>
      </div>

      {/* Concept snippet */}
      {brief.concept && (
        <p className="text-muted text-xs line-clamp-2">{brief.concept}</p>
      )}

      {/* Tags row */}
      <div className="flex flex-wrap items-center gap-1.5">
        <div className="flex gap-0.5">
          {brief.markets.slice(0, 3).map(m => (
            <span key={m} className="text-xs">{MARKET_FLAGS[m]}</span>
          ))}
          {brief.markets.length > 3 && (
            <span className="text-muted text-xs">+{brief.markets.length - 3}</span>
          )}
        </div>
        {brief.script && (
          <span className="flex items-center gap-0.5 text-muted text-[10px]">
            <FileText size={10} />
          </span>
        )}
        {brief.offer && (
          <span className="flex items-center gap-0.5 text-muted text-[10px]" title={brief.offer}>
            <Tag size={10} />
          </span>
        )}
        {brief.inspiration_url && (
          <a
            href={brief.inspiration_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="flex items-center gap-0.5 text-muted text-[10px] hover:text-accent transition-colors"
          >
            <ExternalLink size={10} />
          </a>
        )}
      </div>

      {/* Performance mini-stats */}
      {hasPerf && (
        <div className="flex gap-3 pt-1.5 border-t border-border">
          <span className={`text-xs font-display font-bold tabular-nums ${is_winner ? 'text-accent' : 'text-text'}`}>
            {blended.roas.toFixed(1)}x
          </span>
          <span className="text-xs text-text-dim tabular-nums">€{blended.cpa.toFixed(0)} CPA</span>
          <span className="text-xs text-muted tabular-nums">
            €{blended.spend >= 1000 ? `${(blended.spend / 1000).toFixed(1)}k` : blended.spend.toFixed(0)}
          </span>
        </div>
      )}
    </div>
  )
}

export default function KanbanBoard({ cards, onStatusChange, onCardClick, onRefresh }: Props) {
  const getCardsForStatus = (status: BriefStatus) =>
    cards.filter(c => c.brief.status === status)

  const moveCard = (briefId: string, currentStatus: BriefStatus, dir: 'left' | 'right') => {
    const idx = COLUMNS.findIndex(c => c.status === currentStatus)
    const newIdx = dir === 'right' ? idx + 1 : idx - 1
    if (newIdx < 0 || newIdx >= COLUMNS.length) return
    onStatusChange(briefId, COLUMNS[newIdx].status)
  }

  const deleteCard = async (briefId: string) => {
    await fetch(`/api/briefs?id=${briefId}`, { method: 'DELETE' })
    onRefresh()
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-4 -mx-6 px-6">
      {COLUMNS.map(col => {
        const colCards = getCardsForStatus(col.status)
        const isActive = col.status === 'active'
        return (
          <div key={col.status} className="flex-shrink-0 w-64">
            {/* Column header */}
            <div className={`flex items-center gap-2 mb-3 px-1 py-1 rounded-lg ${isActive ? 'bg-accent/10' : ''}`}>
              <col.icon size={13} className={col.color} />
              <span className={`text-[11px] font-display font-extrabold uppercase tracking-widest ${
                isActive ? 'text-accent' : 'text-text-dim'
              }`}>
                {col.label}
              </span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-display font-bold ml-auto ${
                isActive ? 'bg-accent/20 text-accent' : 'text-muted bg-border'
              }`}>
                {colCards.length}
              </span>
            </div>

            {/* Cards */}
            <div className="space-y-2 min-h-[120px] bg-surface/50 border border-border border-dashed rounded-xl p-2">
              {colCards.length === 0 ? (
                <div className="flex items-center justify-center h-20 text-muted text-xs font-display">
                  Empty
                </div>
              ) : (
                colCards.map(card => (
                  <KanbanCard
                    key={card.brief.id}
                    card={card}
                    onMove={dir => moveCard(card.brief.id, card.brief.status, dir)}
                    onClick={() => onCardClick(card)}
                    onDelete={() => deleteCard(card.brief.id)}
                  />
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
