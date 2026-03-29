'use client'
import { useState } from 'react'
import { X } from 'lucide-react'
import { Market, AwarenessStage } from '@/lib/supabase'

interface Props {
  onClose: () => void
  onSaved: () => void
}

const MARKETS: Market[] = ['NL', 'FR', 'DE', 'ES', 'IT']
const FORMATS = ['UGC', 'Static', 'Carousel', 'Video', 'Collection', 'DPA']
const STAGES: AwarenessStage[] = ['top', 'mid', 'bottom']
const MARKET_FLAGS: Record<string, string> = { NL: '🇳🇱', FR: '🇫🇷', DE: '🇩🇪', ES: '🇪🇸', IT: '🇮🇹' }

export default function AddBriefModal({ onClose, onSaved }: Props) {
  const [form, setForm] = useState({
    concept_id: '',
    angle: '',
    format: 'UGC',
    hook: '',
    markets: ['NL'] as Market[],
    awareness_stage: 'top' as AwarenessStage,
    notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const toggleMarket = (m: Market) => {
    setForm(f => ({
      ...f,
      markets: f.markets.includes(m) ? f.markets.filter(x => x !== m) : [...f.markets, m]
    }))
  }

  const handleSubmit = async () => {
    if (!form.concept_id || !form.angle || !form.hook) {
      setError('Concept ID, angle and hook are required.')
      return
    }
    setSaving(true)
    const res = await fetch('/api/briefs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) { onSaved(); onClose() }
    else { setError('Failed to save. Check Supabase connection.'); setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-md p-6 space-y-4 animate-in">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-lg text-text">New Creative Brief</h2>
          <button onClick={onClose} className="text-muted hover:text-text transition-colors"><X size={18} /></button>
        </div>

        {error && <p className="text-loser text-sm">{error}</p>}

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-text-dim text-xs font-display font-bold uppercase tracking-wide">Concept ID *</span>
              <input
                className="mt-1 w-full bg-bg border border-border rounded-lg px-3 py-2 text-text text-sm outline-none focus:border-accent/50 transition-colors"
                placeholder="C013"
                value={form.concept_id}
                onChange={e => setForm(f => ({ ...f, concept_id: e.target.value }))}
              />
            </label>
            <label className="block">
              <span className="text-text-dim text-xs font-display font-bold uppercase tracking-wide">Format *</span>
              <select
                className="mt-1 w-full bg-bg border border-border rounded-lg px-3 py-2 text-text text-sm outline-none focus:border-accent/50"
                value={form.format}
                onChange={e => setForm(f => ({ ...f, format: e.target.value }))}
              >
                {FORMATS.map(f => <option key={f}>{f}</option>)}
              </select>
            </label>
          </div>

          <label className="block">
            <span className="text-text-dim text-xs font-display font-bold uppercase tracking-wide">Angle *</span>
            <input
              className="mt-1 w-full bg-bg border border-border rounded-lg px-3 py-2 text-text text-sm outline-none focus:border-accent/50"
              placeholder="e.g. Upgrade, Diagnostic, Scarcity"
              value={form.angle}
              onChange={e => setForm(f => ({ ...f, angle: e.target.value }))}
            />
          </label>

          <label className="block">
            <span className="text-text-dim text-xs font-display font-bold uppercase tracking-wide">Hook *</span>
            <input
              className="mt-1 w-full bg-bg border border-border rounded-lg px-3 py-2 text-text text-sm outline-none focus:border-accent/50"
              placeholder="Opening line / visual hook"
              value={form.hook}
              onChange={e => setForm(f => ({ ...f, hook: e.target.value }))}
            />
          </label>

          <div>
            <span className="text-text-dim text-xs font-display font-bold uppercase tracking-wide">Markets</span>
            <div className="flex gap-2 mt-1">
              {MARKETS.map(m => (
                <button
                  key={m}
                  onClick={() => toggleMarket(m)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-display font-bold border transition-colors ${
                    form.markets.includes(m)
                      ? 'bg-accent text-bg border-accent'
                      : 'bg-bg border-border text-text-dim hover:text-text'
                  }`}
                >
                  {MARKET_FLAGS[m]} {m}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="text-text-dim text-xs font-display font-bold uppercase tracking-wide">Awareness Stage</span>
            <div className="flex gap-2 mt-1">
              {STAGES.map(s => (
                <button
                  key={s}
                  onClick={() => setForm(f => ({ ...f, awareness_stage: s }))}
                  className={`px-3 py-1.5 rounded-lg text-sm font-display font-bold border transition-colors capitalize ${
                    form.awareness_stage === s
                      ? 'bg-accent text-bg border-accent'
                      : 'bg-bg border-border text-text-dim hover:text-text'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <label className="block">
            <span className="text-text-dim text-xs font-display font-bold uppercase tracking-wide">Notes</span>
            <textarea
              className="mt-1 w-full bg-bg border border-border rounded-lg px-3 py-2 text-text text-sm outline-none focus:border-accent/50 resize-none"
              rows={2}
              placeholder="Any additional context..."
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            />
          </label>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg border border-border text-text-dim hover:text-text text-sm font-display font-bold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 px-4 py-2 rounded-lg bg-accent text-bg text-sm font-display font-bold hover:bg-accent-dim transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save Brief'}
          </button>
        </div>
      </div>
    </div>
  )
}
