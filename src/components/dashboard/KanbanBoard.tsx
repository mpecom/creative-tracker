'use client'
import { useState, useRef, ComponentType } from 'react'
import { BriefStatus, CreativeCard } from '@/lib/supabase'
import {
  Lightbulb, FileText, Video, Eye, ArrowRight, Wifi, TrendingUp,
  ChevronRight, ChevronLeft, ExternalLink, Tag, Trophy, Link2, Trash2,
} from 'lucide-react'

interface Props {
  cards: CreativeCard[]
  onStatusChange: (briefId: string, newStatus: BriefStatus) => void
  onCardClick: (card: CreativeCard) => void
  onRefresh: () => void
}

type Column = {
  status: BriefStatus
  label: string
  icon: ComponentType<{ size?: number | string; className?: string }>
  headerBg: string
  headerBorder: string
  headerText: string
  dot: string
}

const COLUMNS: Column[] = [
  { status: 'idea',       label: 'Idea',       icon: Lightbulb,  headerBg: 'bg-yellow-500/10', headerBorder: 'border-yellow-500/30', headerText: 'text-yellow-400', dot: 'bg-yellow-400' },
  { status: 'script',     label: 'Script',     icon: FileText,   headerBg: 'bg-blue-500/10',   headerBorder: 'border-blue-500/30',   headerText: 'text-blue-400',   dot: 'bg-blue-400' },
  { status: 'production', label: 'Production', icon: Video,      headerBg: 'bg-purple-500/10', headerBorder: 'border-purple-500/30', headerText: 'text-purple-400', dot: 'bg-purple-400' },
  { status: 'review',     label: 'Review',     icon: Eye,        headerBg: 'bg-orange-500/10', headerBorder: 'border-orange-500/30', headerText: 'text-orange-400', dot: 'bg-orange-400' },
  { status: 'ready',      label: 'Ready',      icon: ArrowRight, headerBg: 'bg-green-500/10',  headerBorder: 'border-green-500/30',  headerText: 'text-green-400',  dot: 'bg-green-400' },
  { status: 'live',       label: 'Live',       icon: Wifi,       headerBg: 'bg-cyan-500/10',   headerBorder: 'border-cyan-500/30',   headerText: 'text-cyan-400',   dot: 'bg-cyan-400' },
  { status: 'active',     label: 'Active',     icon: TrendingUp, headerBg: 'bg-accent/10',     headerBorder: 'border-accent/30',     headerText: 'text-accent',     dot: 'bg-accent' },
]

const MARKET_FLAGS: Record<string, string> = { NL: '🇳🇱', FR: '🇫🇷', DE: '🇩🇪', ES: '🇪🇸', IT: '🇮🇹' }

function formatDate(iso?: string) {
  if (!iso) return null
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

function AvatarInitials({ name }: { name: string }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const colors = ['bg-pink-500', 'bg-violet-500', 'bg-blue-500', 'bg-teal-500', 'bg-orange-500']
  const color = colors[name.charCodeAt(0) % colors.length]
  return (
    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-white text-xs font-bold flex-shrink-0 ${color}`}>
      {initials}
    </span>
  )
}

function KanbanCard({ card, col, onMove, onClick, onDelete, onDragStart }: {
  card: CreativeCard
  col: Column
  onMove: (dir: 'left' | 'right') => void
  onClick: () => void
  onDelete: () => void
  onDragStart: (e: React.DragEvent) => void
}) {
  const { brief, blended, is_winner, creative } = card
  const hasPerf = blended.spend > 0
  const isLinked = !!creative
  const statusIdx = COLUMNS.findIndex(c => c.status === brief.status)
  const canLeft = statusIdx > 0
  const canRight = statusIdx < COLUMNS.length - 1
  const [confirming, setConfirming] = useState(false)
  const hasDragged = useRef(false)
  const isOverdue = brief.due_date && new Date(brief.due_date) < new Date()

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirming) { setConfirming(true); return }
    onDelete()
  }

  return (
    <div
      draggable
      onDragStart={e => { hasDragged.current = true; onDragStart(e) }}
      onDragEnd={() => { /* hasDragged stays true until click fires and resets */ }}
      className={`bg-surface border rounded-xl overflow-hidden cursor-grab active:cursor-grabbing hover:shadow-md transition-all group ${
        is_winner ? 'border-accent/50 border-l-2 border-l-accent' : 'border-border hover:border-accent/20'
      }`}
      onClick={() => {
        if (hasDragged.current) { hasDragged.current = false; return }
        setConfirming(false); onClick()
      }}
      onMouseLeave={() => setConfirming(false)}
    >
      {/* Colored top bar */}
      <div className={`h-1 w-full ${col.dot}`} />

      <div className="p-3 space-y-2">
        {/* Title row */}
        <div className="flex items-start justify-between gap-1">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className={`font-display font-extrabold text-xs ${col.headerText}`}>{brief.concept_id}</span>
              {is_winner && <Trophy size={10} className="text-accent flex-shrink-0" />}
            </div>
            <p className="text-text text-sm font-display font-bold leading-tight truncate">{brief.angle}</p>
          </div>
          {/* Controls: delete + move arrows */}
          <div className="flex items-center gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5">
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
              <button onClick={e => { e.stopPropagation(); onMove('left') }}
                className="w-5 h-5 flex items-center justify-center rounded text-text-dim hover:text-text hover:bg-border transition-colors">
                <ChevronLeft size={11} />
              </button>
            )}
            {canRight && (
              <button onClick={e => { e.stopPropagation(); onMove('right') }}
                className="w-5 h-5 flex items-center justify-center rounded text-text-dim hover:text-text hover:bg-border transition-colors">
                <ChevronRight size={11} />
              </button>
            )}
          </div>
        </div>

        {/* Hook */}
        <p className="text-text-dim text-xs leading-snug line-clamp-1 font-body">{brief.hook}</p>

        {/* Format + Awareness row */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-muted text-[11px] bg-border px-1.5 py-0.5 rounded font-display font-bold uppercase tracking-wide">
            {brief.format}
          </span>
          <span className="text-muted text-[11px] bg-border px-1.5 py-0.5 rounded">
            {brief.awareness_stage}
          </span>
        </div>

        {/* Offer */}
        {brief.offer && (
          <div className="flex items-center gap-1.5">
            <Tag size={10} className="text-text-dim flex-shrink-0" />
            <span className="text-text-dim text-xs truncate font-body">{brief.offer}</span>
          </div>
        )}

        {/* Links row */}
        {(brief.briefing_url || brief.content_url || brief.inspiration_url) && (
          <div className="flex flex-col gap-1">
            {brief.briefing_url && (
              <a href={brief.briefing_url} target="_blank" rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors truncate"
              >
                <FileText size={10} className="flex-shrink-0" />
                <span className="truncate">Brief doc</span>
                <ExternalLink size={9} className="flex-shrink-0 ml-auto" />
              </a>
            )}
            {brief.content_url && (
              <a href={brief.content_url} target="_blank" rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 transition-colors truncate"
              >
                <Link2 size={10} className="flex-shrink-0" />
                <span className="truncate">Content file</span>
                <ExternalLink size={9} className="flex-shrink-0 ml-auto" />
              </a>
            )}
            {brief.inspiration_url && !brief.content_url && (
              <a href={brief.inspiration_url} target="_blank" rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="flex items-center gap-1.5 text-xs text-text-dim hover:text-text transition-colors truncate"
              >
                <ExternalLink size={10} className="flex-shrink-0" />
                <span className="truncate">Inspiration</span>
              </a>
            )}
          </div>
        )}

        {/* Footer: assignee + markets + due date */}
        <div className="flex items-center justify-between pt-1 border-t border-border">
          <div className="flex items-center gap-1.5">
            {brief.assignee && <AvatarInitials name={brief.assignee} />}
            <div className="flex gap-0.5">
              {brief.markets.slice(0, 3).map(m => (
                <span key={m} className="text-xs">{MARKET_FLAGS[m]}</span>
              ))}
              {brief.markets.length > 3 && <span className="text-muted text-xs">+{brief.markets.length - 3}</span>}
            </div>
          </div>
          {brief.due_date && (
            <span className={`text-xs font-medium ${isOverdue ? 'text-loser' : 'text-text-dim'}`}>
              {formatDate(brief.due_date)}
            </span>
          )}
        </div>

        {/* Performance mini-stats */}
        {hasPerf && (
          <div className="flex gap-3 pt-1 border-t border-border">
            <span className={`text-xs font-display font-bold tabular-nums ${is_winner ? 'text-accent' : 'text-text'}`}>
              {blended.roas.toFixed(2)}x
            </span>
            <span className="text-xs text-text-dim tabular-nums">€{blended.cpa.toFixed(0)} CPA</span>
            <span className="text-xs text-muted tabular-nums">
              €{blended.spend >= 1000 ? `${(blended.spend / 1000).toFixed(1)}k` : blended.spend.toFixed(0)}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

export default function KanbanBoard({ cards, onStatusChange, onCardClick, onRefresh }: Props) {
  const draggingId = useRef<string | null>(null)
  const [dragOverCol, setDragOverCol] = useState<BriefStatus | null>(null)

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

  const handleDrop = (e: React.DragEvent, targetStatus: BriefStatus) => {
    e.preventDefault()
    if (draggingId.current) {
      onStatusChange(draggingId.current, targetStatus)
      draggingId.current = null
    }
    setDragOverCol(null)
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-6 -mx-6 px-6 min-h-[calc(100vh-180px)]">
      {COLUMNS.map(col => {
        const colCards = getCardsForStatus(col.status)
        const isOver = dragOverCol === col.status
        return (
          <div key={col.status} className="flex-shrink-0 w-72">
            {/* Column header */}
            <div className={`flex items-center gap-2 mb-2 px-3 py-2 rounded-lg border ${col.headerBg} ${col.headerBorder}`}>
              <col.icon size={13} className={col.headerText} />
              <span className={`text-xs font-display font-extrabold uppercase tracking-widest ${col.headerText}`}>
                {col.label}
              </span>
              <span className="ml-auto text-xs bg-surface text-text-dim px-1.5 py-0.5 rounded-full font-medium border border-border/50">
                {colCards.length}
              </span>
            </div>

            {/* Drop zone */}
            <div
              className={`space-y-2 min-h-[80px] rounded-xl border transition-colors p-1 ${
                isOver
                  ? 'border-accent bg-accent/5'
                  : 'border-dashed border-border'
              }`}
              onDragOver={e => { e.preventDefault(); setDragOverCol(col.status) }}
              onDragLeave={e => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverCol(null)
              }}
              onDrop={e => handleDrop(e, col.status)}
            >
              {colCards.map(card => (
                <KanbanCard
                  key={card.brief.id}
                  card={card}
                  col={col}
                  onMove={dir => moveCard(card.brief.id, card.brief.status, dir)}
                  onClick={() => onCardClick(card)}
                  onDelete={() => deleteCard(card.brief.id)}
                  onDragStart={e => {
                    draggingId.current = card.brief.id
                    e.dataTransfer.effectAllowed = 'move'
                  }}
                />
              ))}
              {colCards.length === 0 && (
                <div className={`h-20 flex items-center justify-center text-xs rounded-lg transition-colors ${
                  isOver ? 'text-accent' : 'text-muted'
                }`}>
                  {isOver ? 'Drop here' : 'Empty'}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
