import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase, Brief, Creative, AdPerformance } from '@/lib/supabase'
import { aggregateCreativeCard } from '@/lib/aggregate'

export const dynamic = 'force-dynamic'

function buildTrend(adIds: string[], performances: AdPerformance[]) {
  const byDate: Record<string, { spend: number; revenue: number }> = {}
  performances
    .filter(p => adIds.includes(p.meta_ad_id))
    .forEach(p => {
      if (!byDate[p.date]) byDate[p.date] = { spend: 0, revenue: 0 }
      byDate[p.date].spend += p.spend
      byDate[p.date].revenue += p.revenue
    })
  return Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, { spend, revenue }]) => ({
      date,
      roas: spend > 0 ? revenue / spend : 0,
      spend,
    }))
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const days = parseInt(searchParams.get('days') || '14')
  const market = searchParams.get('market') || 'all'
  const angle = searchParams.get('angle') || 'all'

  const since = new Date()
  since.setDate(since.getDate() - days)
  const sinceStr = since.toISOString().split('T')[0]

  const { data: briefs, error: bErr } = await supabase.from('briefs').select('*')
  if (bErr) return NextResponse.json({ error: bErr.message }, { status: 500 })

  const { data: creatives, error: cErr } = await supabase.from('creatives').select('*')
  if (cErr) return NextResponse.json({ error: cErr.message }, { status: 500 })

  let perfQuery = supabase.from('ad_performance').select('*').gte('date', sinceStr)
  if (market !== 'all') perfQuery = perfQuery.eq('market', market)
  const { data: performances, error: pErr } = await perfQuery
  if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 })

  const cards = (briefs as Brief[])
    .filter(b => angle === 'all' || b.angle === angle)
    .map(brief => {
      const creative = (creatives as Creative[]).find(c => c.brief_id === brief.id)
      const adIds = (creatives as Creative[])
        .filter(c => c.brief_id === brief.id)
        .map(c => c.meta_ad_id)
      const perfs = (performances as AdPerformance[]).filter(p => adIds.includes(p.meta_ad_id))
      const trend = buildTrend(adIds, performances as AdPerformance[])
      return { ...aggregateCreativeCard(brief, creative, perfs), trend }
    })

  const angles = Array.from(new Set((briefs as Brief[]).map(b => b.angle))).filter(Boolean)

  return NextResponse.json({ cards, angles })
}
