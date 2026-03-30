'use client'

interface Props {
  days: number; setDays: (d: number) => void
  market: string; setMarket: (m: string) => void
  angle: string; setAngle: (a: string) => void
  angles: string[]
  groupBy: 'concept' | 'angle'; setGroupBy: (g: 'concept' | 'angle') => void
}

const DAYS = [3, 7, 14, 30]
const MARKETS = ['all', 'NL', 'FR', 'DE', 'ES', 'IT']

export default function FilterBar({ days, setDays, market, setMarket, angle, setAngle, angles, groupBy, setGroupBy }: Props) {
  return (
    <div className="flex flex-wrap gap-3 items-center">
      {/* Date range */}
      <div className="flex bg-surface border border-border rounded-lg overflow-hidden">
        {DAYS.map(d => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={`px-3 py-1.5 text-sm font-display font-bold transition-colors ${
              days === d ? 'bg-accent text-white' : 'text-text-dim hover:text-text'
            }`}
          >
            {d}d
          </button>
        ))}
      </div>

      {/* Market */}
      <div className="flex bg-surface border border-border rounded-lg overflow-hidden">
        {MARKETS.map(m => (
          <button
            key={m}
            onClick={() => setMarket(m)}
            className={`px-3 py-1.5 text-sm font-display font-bold transition-colors ${
              market === m ? 'bg-accent text-white' : 'text-text-dim hover:text-text'
            }`}
          >
            {m === 'all' ? 'All' : m}
          </button>
        ))}
      </div>

      {/* Angle filter */}
      {angles.length > 0 && (
        <select
          value={angle}
          onChange={e => setAngle(e.target.value)}
          className="bg-surface border border-border text-text text-sm rounded-lg px-3 py-1.5 font-body outline-none"
        >
          <option value="all">All angles</option>
          {angles.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      )}

      {/* Group by */}
      <div className="ml-auto flex bg-surface border border-border rounded-lg overflow-hidden">
        {(['concept', 'angle'] as const).map(g => (
          <button
            key={g}
            onClick={() => setGroupBy(g)}
            className={`px-3 py-1.5 text-xs font-display font-bold uppercase tracking-wide transition-colors ${
              groupBy === g ? 'bg-accent text-white' : 'text-text-dim hover:text-text'
            }`}
          >
            {g}
          </button>
        ))}
      </div>
    </div>
  )
}
