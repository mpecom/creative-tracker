'use client'
import { useState } from 'react'
import { X } from 'lucide-react'
import { Market } from '@/lib/supabase'

interface Props {
  briefId: string
  onClose: () => void
  onSaved: () => void
}

const MARKETS: Market[] = ['NL', 'FR', 'DE', 'ES', 'IT']
const MARKET_FLAGS: Record<string, string> = { NL: '🇳🇱', FR: '🇫🇷', DE: '🇩🇪', ES: '🇪🇸', IT: '🇮🇹' }

export default function LinkAdModal({ briefId, onClose, onSaved }: Props) {
  const [form, setForm] = useState({
    meta_ad_id: '',
    meta_ad_name: '',
    market: 'NL' as Market,
    thumbnail_url: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!form.meta_ad_id || !form.meta_ad_name) {
      setError('Meta Ad ID and name are required.')
      return
    }
    setSaving(true)
    const res = await fetch('/api/creatives', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, brief_id: briefId }),
    })
    if (res.ok) { onSaved(); onClose() }
    else { setError('Failed to link. Check Supabase.'); setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-md p-6 space-y-4 animate-in">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-lg text-text">Link Meta Ad</h2>
          <button onClick={onClose} className="text-muted hover:text-text transition-colors"><X size={18} /></button>
        </div>

        <p className="text-text-dim text-sm">
          Connect a live Meta ad to this brief. n8n will automatically pull performance data for this ad ID.
        </p>

        {error && <p className="text-loser text-sm">{error}</p>}

        <div className="space-y-3">
          <label className="block">
            <span className="text-text-dim text-xs font-display font-bold uppercase tracking-wide">Meta Ad ID *</span>
            <input
              className="mt-1 w-full bg-bg border border-border rounded-lg px-3 py-2 text-text text-sm outline-none focus:border-accent/50 font-mono"
              placeholder="123456789012345"
              value={form.meta_ad_id}
              onChange={e => setForm(f => ({ ...f, meta_ad_id: e.target.value }))}
            />
            <p className="text-muted text-xs mt-1">Find this in Meta Ads Manager → Columns → Ad ID</p>
          </label>

          <label className="block">
            <span className="text-text-dim text-xs font-display font-bold uppercase tracking-wide">Ad Name *</span>
            <input
              className="mt-1 w-full bg-bg border border-border rounded-lg px-3 py-2 text-text text-sm outline-none focus:border-accent/50"
              placeholder="C013_UGC_Upgrade_NL"
              value={form.meta_ad_name}
              onChange={e => setForm(f => ({ ...f, meta_ad_name: e.target.value }))}
            />
          </label>

          <div>
            <span className="text-text-dim text-xs font-display font-bold uppercase tracking-wide">Market</span>
            <div className="flex gap-2 mt-1">
              {MARKETS.map(m => (
                <button
                  key={m}
                  onClick={() => setForm(f => ({ ...f, market: m }))}
                  className={`px-3 py-1.5 rounded-lg text-sm font-display font-bold border transition-colors ${
                    form.market === m
                      ? 'bg-accent text-white border-accent'
                      : 'bg-bg border-border text-text-dim hover:text-text'
                  }`}
                >
                  {MARKET_FLAGS[m]} {m}
                </button>
              ))}
            </div>
          </div>

          <label className="block">
            <span className="text-text-dim text-xs font-display font-bold uppercase tracking-wide">Thumbnail URL (optional)</span>
            <input
              className="mt-1 w-full bg-bg border border-border rounded-lg px-3 py-2 text-text text-sm outline-none focus:border-accent/50"
              placeholder="https://..."
              value={form.thumbnail_url}
              onChange={e => setForm(f => ({ ...f, thumbnail_url: e.target.value }))}
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
            className="flex-1 px-4 py-2 rounded-lg bg-accent text-white text-sm font-display font-bold hover:bg-accent-dim transition-colors disabled:opacity-50"
          >
            {saving ? 'Linking…' : 'Link Ad'}
          </button>
        </div>
      </div>
    </div>
  )
}
