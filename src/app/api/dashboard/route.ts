import { NextRequest, NextResponse } from 'next/server'
import { supabase, Brief, Creative, AdPerformance } from '@/lib/supabase'
import { aggregateCreativeCard } from '@/lib/aggregate'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const days = parseInt(searchParams.get('days') || '14')
  const market = searchParams.get('market') || 'all'
  const angle = searchParams.get('angle') || 'all'

  const since = new Date()
  since.setDate(since.getDate() - days)
  const sinceStr = since.toISOString().split('T')[0]

  // Fetch all briefs
  const { data: briefs, error: bErr } = await supabase.from('briefs').select('*')
  if (bErr) return NextResponse.json({ error: bErr.message }, { status: 500 })

  // Fetch all creatives
  const { data: creatives, error: cErr } = await supabase.from('creatives').select('*')
  if (cErr) return NextResponse.json({ error: cErr.message }, { status: 500 })

  // Fetch performance for date range
  let perfQuery = supabase.from('ad_performance').select('*').gte('date', sinceStr)
  if (market !== 'all') perfQuery = perfQuery.eq('market', market)
  const { data: performances, error: pErr } = await perfQuery
  if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 })

  // Build creative cards
  const cards = (briefs as Brief[])
    .filter(b => angle === 'all' || b.angle === angle)
    .map(brief => {
      const creative = (creatives as Creative[]).find(c => c.brief_id === brief.id)
      const adIds = creative ? [(creatives as Creative[]).filter(c => c.brief_id === brief.id).map(c => c.meta_ad_id)].flat() : []
      const perfs = (performances as AdPerformance[]).filter(p => adIds.includes(p.meta_ad_id))
      return aggregateCreativeCard(brief, creative, perfs)
    })

  // Unique angles for filter
  const angles = [...new Set((briefs as Brief[]).map(b => b.angle))].filter(Boolean)

  return NextResponse.json({ cards, angles })
}
