import { NextRequest, NextResponse } from 'next/server'
import { supabase, Brief, Creative, AdPerformance, Market } from '@/lib/supabase'

interface GroupStats {
  key: string
  count: number
  winners: number
  spend: number
  revenue: number
  conversions: number
  impressions: number
  clicks: number
  thumbstop_sum: number
  thumbstop_imp: number
}

function emptyStats(key: string): GroupStats {
  return { key, count: 0, winners: 0, spend: 0, revenue: 0, conversions: 0, impressions: 0, clicks: 0, thumbstop_sum: 0, thumbstop_imp: 0 }
}

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

  const byFormat: Record<string, GroupStats> = {}
  const byAngle: Record<string, GroupStats> = {}
  const byCountry: Record<string, GroupStats> = {}

  // Per-country totals (not brief-aggregated — direct from ad_performance)
  for (const p of allPerfs) {
    const mk = p.market
    if (!byCountry[mk]) byCountry[mk] = emptyStats(mk)
    const c = byCountry[mk]
    c.spend += p.spend
    c.revenue += p.revenue
    c.conversions += p.conversions
    c.impressions += p.impressions
    c.clicks += p.clicks
    if (p.thumbstop_rate != null) {
      c.thumbstop_sum += p.thumbstop_rate * p.impressions
      c.thumbstop_imp += p.impressions
    }
  }
  // Count distinct creatives per country
  for (const mk of Object.keys(byCountry)) {
    byCountry[mk].count = new Set(allPerfs.filter(p => p.market === mk).map(p => p.meta_ad_id)).size
  }

  // Per-brief aggregation for format + angle
  for (const brief of allBriefs) {
    const briefCreatives = allCreatives.filter(c => c.brief_id === brief.id)
    const adIds = briefCreatives.map(c => c.meta_ad_id)
    if (adIds.length === 0) continue

    const perfs = allPerfs.filter(p => adIds.includes(p.meta_ad_id))
    if (perfs.length === 0) continue

    const totalSpend = perfs.reduce((s, p) => s + p.spend, 0)
    const totalRevenue = perfs.reduce((s, p) => s + p.revenue, 0)
    const totalConversions = perfs.reduce((s, p) => s + p.conversions, 0)
    const totalImpressions = perfs.reduce((s, p) => s + p.impressions, 0)
    const totalClicks = perfs.reduce((s, p) => s + p.clicks, 0)
    const thumbRows = perfs.filter(p => p.thumbstop_rate != null)
    const thumbImp = thumbRows.reduce((s, p) => s + p.impressions, 0)
    const thumbSum = thumbRows.reduce((s, p) => s + (p.thumbstop_rate ?? 0) * p.impressions, 0)
    const roas = totalSpend > 0 ? totalRevenue / totalSpend : 0
    const isWinner = roas >= ROAS_TARGET

    // By format
    const fmt = brief.format || 'Unknown'
    if (!byFormat[fmt]) byFormat[fmt] = emptyStats(fmt)
    byFormat[fmt].count++
    if (isWinner) byFormat[fmt].winners++
    byFormat[fmt].spend += totalSpend
    byFormat[fmt].revenue += totalRevenue
    byFormat[fmt].conversions += totalConversions
    byFormat[fmt].impressions += totalImpressions
    byFormat[fmt].clicks += totalClicks
    byFormat[fmt].thumbstop_sum += thumbSum
    byFormat[fmt].thumbstop_imp += thumbImp

    // By angle
    const ang = brief.angle || 'Unknown'
    if (!byAngle[ang]) byAngle[ang] = emptyStats(ang)
    byAngle[ang].count++
    if (isWinner) byAngle[ang].winners++
    byAngle[ang].spend += totalSpend
    byAngle[ang].revenue += totalRevenue
    byAngle[ang].conversions += totalConversions
    byAngle[ang].impressions += totalImpressions
    byAngle[ang].clicks += totalClicks
    byAngle[ang].thumbstop_sum += thumbSum
    byAngle[ang].thumbstop_imp += thumbImp
  }

  function finalize(map: Record<string, GroupStats>) {
    return Object.values(map).map(g => ({
      key: g.key,
      count: g.count,
      winners: g.winners,
      win_rate: g.count > 0 ? g.winners / g.count : 0,
      roas: g.spend > 0 ? g.revenue / g.spend : 0,
      cpa: g.conversions > 0 ? g.spend / g.conversions : 0,
      ctr: g.impressions > 0 ? (g.clicks / g.impressions) * 100 : 0,
      thumbstop_rate: g.thumbstop_imp > 0 ? g.thumbstop_sum / g.thumbstop_imp : 0,
      spend: g.spend,
      conversions: g.conversions,
    })).sort((a, b) => b.roas - a.roas)
  }

  return NextResponse.json({
    by_format: finalize(byFormat),
    by_angle: finalize(byAngle),
    by_country: finalize(byCountry),
  })
}
