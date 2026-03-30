'use client'
import { useState } from 'react'
import { CreativeCard, BriefStatus, AwarenessStage, ScriptRow } from '@/lib/supabase'
import { X, ExternalLink, Save, Trophy } from 'lucide-react'
import ScriptTable from './ScriptTable'
import TrendChart from './TrendChart'

interface Props {
  card: CreativeCard
  onClose: () => void
  onSaved: () => void
}

const STATUSES: BriefStatus[] = ['idea', 'script', 'production', 'review', 'ready', 'live', 'active']
const AWARENESS_STAGES: AwarenessStage[] = ['Unaware', 'Problem Aware', 'Solution Aware', 'Product Aware', 'Most Aware']
const STATUS_COLORS: Record<BriefStatus, string> = {
  idea: 'bg-yellow-400/20 text-yellow-400 border-yellow-400/30',
  script: 'bg-blue-400/20 text-blue-400 border-blue-400/30',
  production: 'bg-purple-400/20 text-purple-400 border-purple-400/30',
  review: 'bg-orange-400/20 text-orange-400 border-orange-400/30',
  ready: 'bg-green-400/20 text-green-400 border-green-400/30',
  live: 'bg-cyan-400/20 text-cyan-400 border-cyan-400/30',
  active: 'bg-accent/20 text-accent border-accent/30',
}

export default function BriefDetailModal({ card, onClose, onSaved }: Props) {
  const { brief, blended, is_winner } = card
  const [form, setForm] = useState({
    concept: brief.concept || '',
    offer: brief.offer || '',
    inspiration_url: brief.inspiration_url || '',
    briefing_url: brief.briefing_url || '',
    content_url: brief.content_url || '',
    assignee: brief.assignee || '',
    due_date: brief.due_date || '',
    script: brief.script || '',
    script_rows: (brief.script_rows || []) as ScriptRow[],
    status: brief.status,
    awareness_stage: brief.awareness_stage,
  })
  const [scriptTab, setScriptTab] = useState<'table' | 'legacy'>('table')
  const [saving, setSaving] = useState(false)
  const hasPerf = blended.spend > 0

  const handleSave = async () => {
    setSaving(true)
    const res = await fetch('/api/briefs', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: brief.id, ...form }),
    })
    if (res.ok) { onSaved(); onClose() }
    else setSaving(false)
  }

  const inputCls = "w-full bg-bg border border-border rounded-lg px-3 py-2 text-text text-sm outline-none focus:border-accent/50 transition-colors"
  const labelCls = "text-text-dim text-xs font-display font-bold uppercase tracking-wide block mb-1"

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-2xl p-6 animate-in max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <span className="font-display font-bold text-accent text-lg">{brief.concept_id}</span>
            <span className="text-muted text-xs bg-border px-2 py-1 rounded font-display font-bold uppercase tracking-wide">
              {brief.format}
            </span>
            {is_winner && <Trophy size={16} className="text-accent" />}
          </div>
          <button onClick={onClose} className="text-muted hover:text-text transition-colors"><X size={18} /></button>
        </div>

        {/* Brief info (read-only) */}
        <div className="grid grid-cols-2 gap-4 mb-5">
          <div>
            <span className={labelCls}>Angle</span>
            <p className="text-text text-sm font-display font-bold">{brief.angle}</p>
          </div>
          <div>
            <span className={labelCls}>Hook</span>
            <p className="text-text text-sm">{brief.hook}</p>
          </div>
        </div>

        {/* Performance stats (if active) */}
        {hasPerf && (
          <div className="mb-5 bg-bg rounded-xl border border-border overflow-hidden">
            <div className="grid grid-cols-4 gap-3 p-3 border-b border-border">
              <div>
                <span className="text-text-dim text-[11px] font-display font-bold uppercase tracking-widest">ROAS</span>
                <p className={`font-display font-bold text-xl leading-tight mt-0.5 ${is_winner ? 'text-accent' : 'text-text'}`}>{blended.roas.toFixed(2)}x</p>
              </div>
              <div>
                <span className="text-text-dim text-[11px] font-display font-bold uppercase tracking-widest">CPA</span>
                <p className="font-display font-bold text-xl leading-tight mt-0.5 text-text">€{blended.cpa.toFixed(0)}</p>
              </div>
              <div>
                <span className="text-text-dim text-[11px] font-display font-bold uppercase tracking-widest">Hook%</span>
                <p className="font-display font-bold text-xl leading-tight mt-0.5 text-text">{(blended.thumbstop_rate * 100).toFixed(1)}%</p>
              </div>
              <div>
                <span className="text-text-dim text-[11px] font-display font-bold uppercase tracking-widest">Spend</span>
                <p className="font-display font-bold text-xl leading-tight mt-0.5 text-text">
                  €{blended.spend >= 1000 ? `${(blended.spend / 1000).toFixed(1)}k` : blended.spend.toFixed(0)}
                </p>
              </div>
            </div>
            {card.trend && card.trend.length >= 2 && (
              <div className="px-3 pt-3 pb-2">
                <p className="text-text-dim text-[11px] font-display font-bold uppercase tracking-widest mb-2">ROAS Trend</p>
                <TrendChart data={card.trend} roasTarget={2.5} height={120} />
              </div>
            )}
          </div>
        )}

        {/* Status pipeline */}
        <div className="mb-5">
          <span className={labelCls}>Status</span>
          <div className="flex gap-1.5 mt-1 overflow-x-auto">
            {STATUSES.map(s => (
              <button key={s} onClick={() => setForm(f => ({ ...f, status: s }))}
                className={`px-3 py-1.5 rounded-lg text-xs font-display font-bold border transition-colors capitalize whitespace-nowrap ${
                  form.status === s ? STATUS_COLORS[s] : 'bg-bg border-border text-text-dim hover:text-text'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Awareness Stage */}
        <div className="mb-5">
          <span className={labelCls}>Awareness Stage</span>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {AWARENESS_STAGES.map(s => (
              <button key={s} onClick={() => setForm(f => ({ ...f, awareness_stage: s }))}
                className={`px-3 py-1.5 rounded-lg text-xs font-display font-bold border transition-colors ${
                  form.awareness_stage === s
                    ? 'bg-accent text-white border-accent'
                    : 'bg-bg border-border text-text-dim hover:text-text'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Editable fields */}
        <div className="space-y-4 mb-5">
          <label className="block">
            <span className={labelCls}>Concept</span>
            <textarea className={`${inputCls} resize-none`} rows={2}
              placeholder="Describe the creative concept..."
              value={form.concept}
              onChange={e => setForm(f => ({ ...f, concept: e.target.value }))}
            />
          </label>

          <label className="block">
            <span className={labelCls}>Offer</span>
            <input className={inputCls} placeholder="e.g. 20% off first order"
              value={form.offer}
              onChange={e => setForm(f => ({ ...f, offer: e.target.value }))}
            />
          </label>

          <label className="block">
            <span className={labelCls}>Inspiration Link</span>
            <div className="flex gap-2">
              <input className={`${inputCls} flex-1`} placeholder="https://..."
                value={form.inspiration_url}
                onChange={e => setForm(f => ({ ...f, inspiration_url: e.target.value }))}
              />
              {form.inspiration_url && (
                <a href={form.inspiration_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center w-9 bg-bg border border-border rounded-lg text-text-dim hover:text-accent transition-colors"
                >
                  <ExternalLink size={14} />
                </a>
              )}
            </div>
          </label>

          {/* Assignee + Due Date */}
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className={labelCls}>Assignee</span>
              <input className={inputCls} placeholder="e.g. John Smith"
                value={form.assignee}
                onChange={e => setForm(f => ({ ...f, assignee: e.target.value }))}
              />
            </label>
            <label className="block">
              <span className={labelCls}>Due Date</span>
              <input type="date" className={inputCls}
                value={form.due_date}
                onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
              />
            </label>
          </div>

          <label className="block">
            <span className={labelCls}>Briefing Link</span>
            <div className="flex gap-2">
              <input className={`${inputCls} flex-1`} placeholder="https://notion.so/... or Google Doc"
                value={form.briefing_url}
                onChange={e => setForm(f => ({ ...f, briefing_url: e.target.value }))}
              />
              {form.briefing_url && (
                <a href={form.briefing_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center w-9 bg-bg border border-border rounded-lg text-text-dim hover:text-accent transition-colors">
                  <ExternalLink size={14} />
                </a>
              )}
            </div>
          </label>

          <label className="block">
            <span className={labelCls}>Content Link</span>
            <div className="flex gap-2">
              <input className={`${inputCls} flex-1`} placeholder="https://drive.google.com/..."
                value={form.content_url}
                onChange={e => setForm(f => ({ ...f, content_url: e.target.value }))}
              />
              {form.content_url && (
                <a href={form.content_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center w-9 bg-bg border border-border rounded-lg text-text-dim hover:text-accent transition-colors">
                  <ExternalLink size={14} />
                </a>
              )}
            </div>
          </label>

          {/* Script — multilingual table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className={labelCls}>Script</span>
              <div className="flex gap-1 bg-bg border border-border rounded-lg p-0.5">
                <button
                  onClick={() => setScriptTab('table')}
                  className={`px-2.5 py-1 rounded text-xs font-display font-bold transition-colors ${
                    scriptTab === 'table' ? 'bg-surface text-accent' : 'text-text-dim hover:text-text'
                  }`}
                >
                  Table
                </button>
                <button
                  onClick={() => setScriptTab('legacy')}
                  className={`px-2.5 py-1 rounded text-xs font-display font-bold transition-colors ${
                    scriptTab === 'legacy' ? 'bg-surface text-accent' : 'text-text-dim hover:text-text'
                  }`}
                >
                  Plain text
                </button>
              </div>
            </div>
            {scriptTab === 'table' ? (
              <ScriptTable
                rows={form.script_rows}
                markets={brief.markets}
                onChange={rows => setForm(f => ({ ...f, script_rows: rows }))}
              />
            ) : (
              <textarea
                className={`${inputCls} resize-none font-mono text-xs leading-relaxed`}
                rows={8}
                placeholder={"[HOOK - 0-3s]\nOpening line...\n\n[PROBLEM - 3-8s]\nPain point...\n\n[CTA - 20-25s]\nCall to action..."}
                value={form.script}
                onChange={e => setForm(f => ({ ...f, script: e.target.value }))}
              />
            )}
          </div>
        </div>

        {/* Save */}
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg border border-border text-text-dim hover:text-text text-sm font-display font-bold transition-colors"
          >
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-accent text-white text-sm font-display font-bold hover:bg-accent-dim transition-colors disabled:opacity-50"
          >
            <Save size={14} />
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
