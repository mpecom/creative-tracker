'use client'
import { useState } from 'react'
import { CreativeCard } from '@/lib/supabase'
import { ChevronDown, ChevronUp, Link2, Trophy, AlertTriangle, ImageOff, FileText, Tag } from 'lucide-react'
import { ROAS_TARGET } from '@/lib/aggregate'

interface Props {
  card: CreativeCard
  onLinkAd: () => void
  onRefresh: () => void
}

const MARKET_FLAGS: Record<string, string> = {
  NL: '🇳🇱', FR: '🇫🇷', DE: '🇩🇪', ES: '🇪🇸', IT: '🇮🇹'
}

function Metric({ label, value, accent, sub }: { label: string; value: string; accent?: boolean; sub?: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-text-dim text-xs">{label}</span>
      <span className={`font-display font-bold text-base leading-tight ${accent ? 'text-accent' : 'text-text'}`}>{value}</span>
      {sub && <span className="text-muted text-xs">{sub}</span>}
    </div>
  )
}

function CampaignRow({ type, data }: { type: string; data: { roas: number; cpa: number; spend: number } }) {
  const good = data.roas >= ROAS_TARGET
  return (
    <div className="flex items-center justify-between text-sm py-1.5 border-b border-border last:border-0">
      <span className="text-text-dim font-display font-bold text-xs uppercase tracking-wide">{type}</span>
      <div className="flex gap-4">
        <span className={`font-display font-bold ${good ? 'text-accent' : 'text-loser'}`}>{data.roas.toFixed(2)}x</span>
        <span className="text-text-dim">€{data.cpa.toFixed(0)} CPA</span>
        <span className="text-muted text-xs">€{data.spend >= 1000 ? `${(data.spend/1000).toFixed(1)}k` : data.spend.toFixed(0)}</span>
      </div>
    </div>
  )
}

function MarketRow({ market, data }: { market: string; data: { roas: number; cpa: number; spend: number; is_outlier: boolean } }) {
  const good = data.roas >= ROAS_TARGET
  return (
    <div className="flex items-center justify-between text-sm py-1.5 border-b border-border last:border-0">
      <span className="flex items-center gap-1.5 text-text-dim text-xs">
        {MARKET_FLAGS[market]} {market}
        {data.is_outlier && <span title="Outlier vs blended"><AlertTriangle size={10} className="text-yellow-400" /></span>}
      </span>
      <div className="flex gap-4">
        <span className={`font-display font-bold ${good ? 'text-accent' : 'text-loser'}`}>{data.roas.toFixed(2)}x</span>
        <span className="text-text-dim">€{data.cpa.toFixed(0)} CPA</span>
        <span className="text-muted text-xs">€{data.spend >= 1000 ? `${(data.spend/1000).toFixed(1)}k` : data.spend.toFixed(0)}</span>
      </div>
    </div>
  )
}

export default function CreativeCardComponent({ card, onLinkAd }: Props) {
  const [expanded, setExpanded] = useState(false)
  const { brief, creative, blended, by_campaign, by_market, is_winner } = card
  const hasData = blended.spend > 0
  const hasCampaignData = Object.keys(by_campaign).length > 0
  const hasMarketData = Object.keys(by_market).length > 0

  return (
    <div
      className={`bg-surface border rounded-xl overflow-hidden card-hover animate-in ${
        is_winner ? 'border-accent/40 winner-glow' : 'border-border'
      }`}
    >
      {/* Top: thumbnail + concept */}
      <div className="flex gap-3 p-4">
        {/* Thumbnail */}
        <div className="w-16 h-16 rounded-lg bg-border flex-shrink-0 overflow-hidden flex items-center justify-center">
          {creative?.thumbnail_url ? (
            <img src={creative.thumbnail_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <ImageOff size={20} className="text-muted" />
          )}
        </div>

        {/* Header info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-accent text-sm">{brief.concept_id}</span>
                {is_winner && <Trophy size={12} className="text-accent" />}
                <span className="text-muted text-xs bg-border px-1.5 py-0.5 rounded font-display font-bold uppercase tracking-wide">
                  {brief.format}
                </span>
              </div>
              <p className="text-text text-sm font-display font-bold truncate">{brief.angle}</p>
              <p className="text-text-dim text-xs truncate">{brief.hook}</p>
            </div>
          </div>
          {/* Markets + indicators */}
          <div className="flex items-center gap-2 mt-1">
            <div className="flex gap-1">
              {brief.markets.map(m => (
                <span key={m} className="text-xs text-muted">{MARKET_FLAGS[m] || m}</span>
              ))}
            </div>
            {brief.script && <FileText size={10} className="text-muted" title="Has script" />}
            {brief.offer && <Tag size={10} className="text-muted" title={brief.offer} />}
          </div>
        </div>
      </div>

      {/* Metrics row */}
      {hasData ? (
        <div className="px-4 pb-3 grid grid-cols-4 gap-2 border-t border-border pt-3">
          <Metric label="ROAS" value={`${blended.roas.toFixed(2)}x`} accent={is_winner} />
          <Metric label="CPA" value={`€${blended.cpa.toFixed(0)}`} />
          <Metric
            label="Hook"
            value={blended.thumbstop_rate > 0 ? `${(blended.thumbstop_rate * 100).toFixed(1)}%` : '—'}
          />
          <Metric
            label="CTR"
            value={blended.ctr > 0 ? `${blended.ctr.toFixed(2)}%` : '—'}
          />
        </div>
      ) : (
        <div className="px-4 pb-3 border-t border-border pt-3">
          {!creative ? (
            <button
              onClick={onLinkAd}
              className="flex items-center gap-1.5 text-xs text-accent hover:text-accent-dim transition-colors font-display font-bold"
            >
              <Link2 size={12} /> Link Facebook Ad
            </button>
          ) : (
            <p className="text-muted text-xs">Waiting for data from n8n…</p>
          )}
        </div>
      )}

      {/* Spend sub-line */}
      {hasData && (
        <div className="px-4 pb-2 -mt-1">
          <span className="text-muted text-xs">
            €{blended.spend >= 1000 ? `${(blended.spend/1000).toFixed(1)}k` : blended.spend.toFixed(0)} spend
            · {blended.conversions} conv
          </span>
        </div>
      )}

      {/* Expand toggle */}
      {hasData && (hasCampaignData || hasMarketData) && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between px-4 py-2 border-t border-border text-text-dim hover:text-text transition-colors text-xs font-display font-bold uppercase tracking-wide"
        >
          <span>Breakdown</span>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      )}

      {/* Expanded breakdown */}
      {expanded && (
        <div className="expand-down border-t border-border">
          {hasCampaignData && (
            <div className="px-4 py-3">
              <p className="text-text-dim text-xs font-display font-bold uppercase tracking-wide mb-2">By Campaign Type</p>
              {Object.entries(by_campaign).map(([type, data]) => (
                <CampaignRow key={type} type={type} data={data!} />
              ))}
            </div>
          )}
          {hasMarketData && (
            <div className="px-4 py-3 border-t border-border">
              <p className="text-text-dim text-xs font-display font-bold uppercase tracking-wide mb-2">By Market</p>
              {Object.entries(by_market).map(([market, data]) => (
                <MarketRow key={market} market={market} data={data!} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Footer: link ad if no creative */}
      {hasData && !creative && (
        <div className="px-4 pb-3">
          <button
            onClick={onLinkAd}
            className="flex items-center gap-1.5 text-xs text-accent hover:text-accent-dim transition-colors font-display font-bold"
          >
            <Link2 size={12} /> Link Facebook Ad
          </button>
        </div>
      )}
    </div>
  )
}
