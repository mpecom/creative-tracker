'use client'
import { useState } from 'react'
import { X, ExternalLink } from 'lucide-react'
import { Market, AwarenessStage, ScriptRow } from '@/lib/supabase'
import ScriptTable from './ScriptTable'

interface Props {
  onClose: () => void
  onSaved: () => void
}

const MARKETS: Market[] = ['NL', 'FR', 'DE', 'ES', 'IT']
const FORMATS = ['UGC', 'Static', 'Carousel', 'Video', 'Collection', 'DPA']
const AWARENESS_STAGES: AwarenessStage[] = ['Unaware', 'Problem Aware', 'Solution Aware', 'Product Aware', 'Most Aware']
const MARKET_FLAGS: Record<string, string> = { NL: '🇳🇱', FR: '🇫🇷', DE: '🇩🇪', ES: '🇪🇸', IT: '🇮🇹' }

export default function AddBriefModal({ onClose, onSaved }: Props) {
  const [form, setForm] = useState({
    concept_id: '',
    angle: '',
    format: 'UGC',
    hook: '',
    markets: ['NL'] as Market[],
    awareness_stage: 'Problem Aware' as AwarenessStage,
    concept: '',
    offer: '',
    inspiration_url: '',
    script: '',
    script_rows: [] as ScriptRow[],
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<'brief' | 'script'>('brief')

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
      body: JSON.stringify({ ...form, status: 'idea' }),
    })
    if (res.ok) { onSaved(); onClose() }
    else { setError('Failed to save. Check Supabase connection.'); setSaving(false) }
  }

  const inputCls = "mt-1 w-full bg-bg border border-border rounded-lg px-3 py-2 text-text text-sm outline-none focus:border-accent/50 transition-colors"
  const labelCls = "text-text-dim text-xs font-display font-bold uppercase tracking-wide"

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-lg p-6 space-y-4 animate-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-lg text-text">New Creative Brief</h2>
          <button onClick={onClose} className="text-muted hover:text-text transition-colors"><X size={18} /></button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-bg rounded-lg p-1">
          <button
            onClick={() => setTab('brief')}
            className={`flex-1 px-3 py-1.5 rounded-md text-sm font-display font-bold transition-colors ${
              tab === 'brief' ? 'bg-surface text-text' : 'text-text-dim hover:text-text'
            }`}
          >
            Brief
          </button>
          <button
            onClick={() => setTab('script')}
            className={`flex-1 px-3 py-1.5 rounded-md text-sm font-display font-bold transition-colors ${
              tab === 'script' ? 'bg-surface text-text' : 'text-text-dim hover:text-text'
            }`}
          >
            Script
          </button>
        </div>

        {error && <p className="text-loser text-sm">{error}</p>}

        {tab === 'brief' ? (
          <div className="space-y-3">
            {/* Row: Concept ID + Format */}
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className={labelCls}>Concept ID *</span>
                <input className={inputCls} placeholder="C013"
                  value={form.concept_id}
                  onChange={e => setForm(f => ({ ...f, concept_id: e.target.value }))}
                />
              </label>
              <label className="block">
                <span className={labelCls}>Format *</span>
                <select className={inputCls}
                  value={form.format}
                  onChange={e => setForm(f => ({ ...f, format: e.target.value }))}
                >
                  {FORMATS.map(f => <option key={f}>{f}</option>)}
                </select>
              </label>
            </div>

            {/* Angle */}
            <label className="block">
              <span className={labelCls}>Angle *</span>
              <input className={inputCls} placeholder="e.g. Upgrade, Diagnostic, Scarcity"
                value={form.angle}
                onChange={e => setForm(f => ({ ...f, angle: e.target.value }))}
              />
            </label>

            {/* Hook */}
            <label className="block">
              <span className={labelCls}>Hook *</span>
              <input className={inputCls} placeholder="Opening line / visual hook"
                value={form.hook}
                onChange={e => setForm(f => ({ ...f, hook: e.target.value }))}
              />
            </label>

            {/* Concept (was Notes) */}
            <label className="block">
              <span className={labelCls}>Concept</span>
              <textarea className={`${inputCls} resize-none`} rows={2}
                placeholder="Describe the creative concept..."
                value={form.concept}
                onChange={e => setForm(f => ({ ...f, concept: e.target.value }))}
              />
            </label>

            {/* Offer */}
            <label className="block">
              <span className={labelCls}>Offer</span>
              <input className={inputCls} placeholder="e.g. 20% off first order, Free trial 14 days"
                value={form.offer}
                onChange={e => setForm(f => ({ ...f, offer: e.target.value }))}
              />
            </label>

            {/* Inspiration URL */}
            <label className="block">
              <span className={labelCls}>Inspiration Link</span>
              <div className="flex gap-2 mt-1">
                <input
                  className="flex-1 bg-bg border border-border rounded-lg px-3 py-2 text-text text-sm outline-none focus:border-accent/50 transition-colors"
                  placeholder="https://..."
                  value={form.inspiration_url}
                  onChange={e => setForm(f => ({ ...f, inspiration_url: e.target.value }))}
                />
                {form.inspiration_url && (
                  <a href={form.inspiration_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center w-9 h-9 mt-0 bg-bg border border-border rounded-lg text-text-dim hover:text-accent transition-colors"
                  >
                    <ExternalLink size={14} />
                  </a>
                )}
              </div>
            </label>

            {/* Markets */}
            <div>
              <span className={labelCls}>Markets</span>
              <div className="flex gap-2 mt-1">
                {MARKETS.map(m => (
                  <button key={m} onClick={() => toggleMarket(m)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-display font-bold border transition-colors ${
                      form.markets.includes(m)
                        ? 'bg-accent text-white border-accent'
                        : 'bg-bg border-border text-text-dim hover:text-text'
                    }`}
                  >
                    {MARKET_FLAGS[m]} {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Awareness Stage */}
            <div>
              <span className={labelCls}>Awareness Stage</span>
              <div className="flex flex-wrap gap-2 mt-1">
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
          </div>
        ) : (
          /* Script tab */
          <div className="space-y-3">
            <p className="text-text-dim text-xs">Add script lines with per-language translations. Language columns match your selected markets.</p>
            <ScriptTable
              rows={form.script_rows}
              markets={form.markets}
              onChange={rows => setForm(f => ({ ...f, script_rows: rows }))}
            />
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg border border-border text-text-dim hover:text-text text-sm font-display font-bold transition-colors"
          >
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex-1 px-4 py-2 rounded-lg bg-accent text-white text-sm font-display font-bold hover:bg-accent-dim transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save Brief'}
          </button>
        </div>
      </div>
    </div>
  )
}
