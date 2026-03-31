'use client'
import { useCallback } from 'react'
import { ScriptRow, Market } from '@/lib/supabase'
import { Plus, Trash2 } from 'lucide-react'

interface Props {
  rows: ScriptRow[]
  markets: Market[]
  onChange: (rows: ScriptRow[]) => void
}

const LANG_LABELS: Record<string, string> = {
  NL: '🇳🇱 Dutch (NL)',
  FR: '🇫🇷 French (FR)',
  DE: '🇩🇪 German (DE)',
  ES: '🇪🇸 Spanish (ES)',
  IT: '🇮🇹 Italian (IT)',
}

const FIXED_COLS = [
  { key: 'proofreader', label: 'Proofreader\ninstructions', width: 'w-36' },
  { key: 'editor',      label: 'Editor\ninstructions',      width: 'w-36' },
  { key: 'script',      label: 'Script',                    width: 'w-52' },
]

function newRow(): ScriptRow {
  return { id: crypto.randomUUID(), script: '', proofreader: '', editor: '' }
}

function Cell({ value, onChange, placeholder, accent }: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  accent?: boolean
}) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={3}
      className={`w-full h-full min-h-[80px] bg-transparent resize-none text-xs outline-none leading-relaxed p-2
        placeholder:text-muted/50
        ${accent ? 'text-text font-medium' : 'text-text-dim'}`}
    />
  )
}

export default function ScriptTable({ rows, markets, onChange }: Props) {
  const updateCell = useCallback((rowId: string, field: string, value: string) => {
    onChange(rows.map(r => r.id === rowId ? { ...r, [field]: value } : r))
  }, [rows, onChange])

  const addRow = () => onChange([...rows, newRow()])

  const deleteRow = (id: string) => onChange(rows.filter(r => r.id !== id))

  const langCols = markets.filter(m => LANG_LABELS[m])

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full border-collapse text-xs" style={{ minWidth: `${300 + langCols.length * 180}px` }}>
          {/* Header */}
          <thead>
            <tr className="bg-surface border-b border-border">
              <th className="w-8 px-2 py-2 text-muted font-display font-bold text-center border-r border-border">#</th>
              {FIXED_COLS.map(col => (
                <th key={col.key} className={`${col.width} px-3 py-2 text-left text-text-dim font-display font-bold uppercase tracking-wide border-r border-border whitespace-pre-line`}>
                  {col.label}
                </th>
              ))}
              {langCols.map(m => (
                <th key={m} className="w-44 px-3 py-2 text-left text-text-dim font-display font-bold uppercase tracking-wide border-r border-border last:border-r-0">
                  {LANG_LABELS[m]}
                </th>
              ))}
              <th className="w-8 border-l border-border" />
            </tr>
          </thead>

          {/* Rows */}
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={FIXED_COLS.length + langCols.length + 2} className="text-center py-8 text-muted text-xs">
                  No script lines yet — click &quot;Add Line&quot; to start
                </td>
              </tr>
            ) : rows.map((row, i) => (
              <tr key={row.id} className="border-b border-border last:border-b-0 group hover:bg-surface/50 transition-colors align-top">
                {/* Row number */}
                <td className="w-8 px-2 py-2 text-center text-muted border-r border-border">
                  <span className="text-xs">{i + 1}</span>
                </td>

                {/* Proofreader */}
                <td className="border-r border-border">
                  <Cell
                    value={row.proofreader || ''}
                    onChange={v => updateCell(row.id, 'proofreader', v)}
                    placeholder="Proofreader notes..."
                  />
                </td>

                {/* Editor */}
                <td className="border-r border-border">
                  <Cell
                    value={row.editor || ''}
                    onChange={v => updateCell(row.id, 'editor', v)}
                    placeholder="Editor notes..."
                  />
                </td>

                {/* Main script */}
                <td className="border-r border-border bg-surface/30">
                  <Cell
                    value={row.script}
                    onChange={v => updateCell(row.id, 'script', v)}
                    placeholder="Script line..."
                    accent
                  />
                </td>

                {/* Language columns */}
                {langCols.map(m => (
                  <td key={m} className="border-r border-border last:border-r-0">
                    <Cell
                      value={(row[m as keyof ScriptRow] as string) || ''}
                      onChange={v => updateCell(row.id, m, v)}
                      placeholder={`${m} translation...`}
                    />
                  </td>
                ))}

                {/* Delete */}
                <td className="w-8 border-l border-border">
                  <div className="flex items-start justify-center pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => deleteRow(row.id)}
                      className="p-1 text-muted hover:text-red-400 transition-colors rounded"
                      title="Delete row"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        onClick={addRow}
        className="flex items-center gap-2 text-xs text-accent hover:text-accent-dim font-display font-bold transition-colors px-2 py-1.5 rounded-lg border border-accent/30 hover:border-accent/60"
      >
        <Plus size={12} />
        Add Line
      </button>
    </div>
  )
}
