import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase'

// n8n posts to this endpoint with Meta ad performance data.
// Protect with a shared secret set in n8n workflow headers.
//
// Auto-connection by naming convention:
//   Ad name format: {CONCEPT_ID}_{FORMAT}_{ANGLE}_{MARKET}[_{anything}]
//   Example: C013_UGC_Upgrade_NL  or  C013_Static_Diagnostic_FR_v2
//   The webhook will automatically create a creative record linking the
//   brief to the meta_ad_id if no link exists yet.

const MARKETS = ['NL', 'FR', 'DE', 'ES', 'IT']

function parseAdName(adName: string): { concept_id: string; format: string; angle: string; market: string } | null {
  if (!adName) return null
  const parts = adName.split('_')
  if (parts.length < 4) return null

  // concept_id is always first part (e.g. C013)
  const concept_id = parts[0]
  if (!/^C\d+$/i.test(concept_id)) return null

  // Market is the last of the first 4 parts that matches a known market code
  // Try parts[3] first, then search
  let marketIdx = -1
  for (let i = 1; i < parts.length; i++) {
    if (MARKETS.includes(parts[i].toUpperCase())) {
      marketIdx = i
      break
    }
  }
  if (marketIdx < 2) return null

  // Format is parts[1], angle is everything between format and market joined by _
  const format = parts[1]
  const angle = parts.slice(2, marketIdx).join('_')
  const market = parts[marketIdx].toUpperCase()

  return { concept_id: concept_id.toUpperCase(), format, angle, market }
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-webhook-secret')
  if (secret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Expected payload from n8n:
  // { records: [{ meta_ad_id, meta_ad_name, market, campaign_type, date, spend, revenue, conversions, impressions, clicks, thumbstop_rate }] }

  const records = body.records
  if (!Array.isArray(records) || records.length === 0) {
    return NextResponse.json({ error: 'No records' }, { status: 400 })
  }

  // ── 1. Upsert performance rows ───────────────────────────────
  const toUpsert = records.map((r: any) => ({
    meta_ad_id: r.meta_ad_id,
    market: r.market,
    campaign_type: r.campaign_type,
    date: r.date,
    spend: Number(r.spend) || 0,
    revenue: Number(r.revenue) || 0,
    conversions: Number(r.conversions) || 0,
    impressions: Number(r.impressions) || 0,
    clicks: Number(r.clicks) || 0,
    thumbstop_rate: r.thumbstop_rate != null ? Number(r.thumbstop_rate) : null,
    roas: r.spend > 0 ? Number(r.revenue) / Number(r.spend) : 0,
    cpa: r.conversions > 0 ? Number(r.spend) / Number(r.conversions) : 0,
    ctr: r.impressions > 0 ? (Number(r.clicks) / Number(r.impressions)) * 100 : 0,
  }))

  const { error: upsertErr } = await supabase
    .from('ad_performance')
    .upsert(toUpsert, { onConflict: 'meta_ad_id,market,campaign_type,date' })

  if (upsertErr) {
    console.error('Supabase upsert error:', upsertErr)
    return NextResponse.json({ error: upsertErr.message }, { status: 500 })
  }

  // ── 2. Auto-connect ads to briefs by naming convention ───────
  const { data: existingCreatives } = await supabase.from('creatives').select('meta_ad_id')
  const linkedAdIds = new Set((existingCreatives ?? []).map((c: any) => c.meta_ad_id))

  const { data: allBriefs } = await supabase.from('briefs').select('id, concept_id, format, angle, markets')
  const briefs = allBriefs ?? []

  const newCreatives: any[] = []
  const seen = new Set<string>()

  for (const r of records) {
    const adId: string = r.meta_ad_id
    const adName: string = r.meta_ad_name || ''
    if (linkedAdIds.has(adId) || seen.has(adId)) continue

    const parsed = parseAdName(adName)
    if (!parsed) continue

    // Find best-matching brief
    const match = briefs.find((b: any) =>
      b.concept_id.toUpperCase() === parsed.concept_id &&
      b.format?.toLowerCase() === parsed.format.toLowerCase() &&
      b.angle?.toLowerCase() === parsed.angle.toLowerCase()
    )
    if (!match) continue

    seen.add(adId)
    newCreatives.push({
      brief_id: match.id,
      meta_ad_id: adId,
      meta_ad_name: adName,
      market: parsed.market,
      linked_at: new Date().toISOString(),
    })
  }

  let autoLinked = 0
  if (newCreatives.length > 0) {
    const { error: linkErr } = await supabase.from('creatives').insert(newCreatives)
    if (!linkErr) autoLinked = newCreatives.length
    else console.error('Auto-link error:', linkErr)
  }

  return NextResponse.json({ success: true, count: toUpsert.length, auto_linked: autoLinked })
}
