'use client'
import { Trophy, TrendingUp, Euro, Layers } from 'lucide-react'

interface Props {
  totalCreatives: number
  winners: number
  totalSpend: number
  avgRoas: number
}

export default function StatsBar({ totalCreatives, winners, totalSpend, avgRoas }: Props) {
  const fmt = (n: number) => n >= 1000 ? `€${(n / 1000).toFixed(1)}k` : `€${n.toFixed(0)}`

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {[
        { icon: Layers, label: 'Creatives', value: totalCreatives.toString(), sub: 'tracked' },
        { icon: Trophy, label: 'Winners', value: winners.toString(), sub: `of ${totalCreatives}`, accent: true },
        { icon: Euro, label: 'Total Spend', value: fmt(totalSpend), sub: 'in period' },
        { icon: TrendingUp, label: 'Avg ROAS', value: `${avgRoas.toFixed(2)}x`, sub: 'blended', accent: avgRoas >= 2.5 },
      ].map(({ icon: Icon, label, value, sub, accent }) => (
        <div key={label} className={`bg-surface border rounded-xl px-4 py-3 ${accent ? 'border-accent/30' : 'border-border'}`}>
          <div className="flex items-center gap-2 text-text-dim text-xs mb-1">
            <Icon size={12} className={accent ? 'text-accent' : ''} />
            {label}
          </div>
          <div className={`font-display font-bold text-xl ${accent ? 'text-accent' : 'text-text'}`}>{value}</div>
          <div className="text-text-dim text-xs">{sub}</div>
        </div>
      ))}
    </div>
  )
}
