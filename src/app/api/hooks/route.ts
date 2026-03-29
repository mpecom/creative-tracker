import { NextRequest, NextResponse } from 'next/server'
import { supabase, Brief, Creative, AdPerformance } from '@/lib/supabase'

const ROAS_TARGET = 2.5

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const days = parseInt(searchParams.get('days') || '14')
  const market = searchParams.get('market') || 'all'

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

  const allBriefs = briefs as Brief[]
  const allCreatives = creatives as Creative[]
  const allPerfs = performances as AdPerformance[]

  // Aggregate by hook text
  const hookMap: Record<string, {
    hook: string
    count: number
    winners: number
    spend: number
    revenue: number
    conversions: number
    impressions: number
    clicks: number
    thumbstop_sum: number
    thumbstop_imp: number
  }> = {}

  for (const brief of allBriefs) {
    const hook = brief.hook?.trim() || 'Unknown'
    const briefCreatives = allCreatives.filter(c => c.brief_id === brief.id)
    const adIds = briefCreatives.map(c => c.meta_ad_id)

    const perfs = adIds.length > 0 ? allPerfs.filter(p => adIds.includes(p.meta_ad_id)) : []

    if (!hookMap[hook]) {
      hookMap[hook] = {
        hook,
        count: 0,
        winners: 0,
        spend: 0,
        revenue: 0,
        conversions: 0,
        impressions: 0,
        clicks: 0,
        thumbstop_sum: 0,
        thumbstop_imp: 0,
      }
    }

    const h = hookMap[hook]
    h.count++

    if (perfs.length > 0) {
      const spend = perfs.reduce((s, p) => s + p.spend, 0)
      const revenue = perfs.reduce((s, p) => s + p.revenue, 0)
      const convs = perfs.reduce((s, p) => s + p.conversions, 0)
      const imps = perfs.reduce((s, p) => s + p.impressions, 0)
      const clks = perfs.reduce((s, p) => s + p.clicks, 0)
      const thumbRows = perfs.filter(p => p.thumbstop_rate != null)

      h.spend += spend
      h.revenue += revenue
      h.conversions += convs
      h.impressions += imps
      h.clicks += clks
      h.thumbstop_sum += thumbRows.reduce((s, p) => s + (p.thumbstop_rate ?? 0) * p.impressions, 0)
      h.thumbstop_imp += thumbRows.reduce((s, p) => s + p.impressions, 0)

      const roas = spend > 0 ? revenue / spend : 0
      if (roas >= ROAS_TARGET) h.winners++
    }
  }

  const hooks = Object.values(hookMap).map(h => ({
    hook: h.hook,
    count: h.count,
    winners: h.winners,
    win_rate: h.count > 0 ? h.winners / h.count : 0,
    roas: h.spend > 0 ? h.revenue / h.spend : 0,
    cpa: h.conversions > 0 ? h.spend / h.conversions : 0,
    ctr: h.impressions > 0 ? (h.clicks / h.impressions) * 100 : 0,
    thumbstop_rate: h.thumbstop_imp > 0 ? h.thumbstop_sum / h.thumbstop_imp : 0,
    spend: h.spend,
  })).sort((a, b) => {
    // Sort by thumbstop_rate if available, else by roas
    if (b.thumbstop_rate !== a.thumbstop_rate) return b.thumbstop_rate - a.thumbstop_rate
    return b.roas - a.roas
  })

  return NextResponse.json({ hooks })
}
