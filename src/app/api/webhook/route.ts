import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// n8n posts to this endpoint with Meta ad performance data
// Protect with a shared secret set in n8n workflow headers

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
  // { records: [{ meta_ad_id, market, campaign_type, date, spend, revenue, conversions, impressions, clicks, thumbstop_rate }] }

  const records = body.records
  if (!Array.isArray(records) || records.length === 0) {
    return NextResponse.json({ error: 'No records' }, { status: 400 })
  }

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
    thumbstop_rate: r.thumbstop_rate ? Number(r.thumbstop_rate) : null,
    roas: r.spend > 0 ? Number(r.revenue) / Number(r.spend) : 0,
    cpa: r.conversions > 0 ? Number(r.spend) / Number(r.conversions) : 0,
    ctr: r.impressions > 0 ? (Number(r.clicks) / Number(r.impressions)) * 100 : 0,
  }))

  const { error } = await supabase
    .from('ad_performance')
    .upsert(toUpsert, { onConflict: 'meta_ad_id,market,campaign_type,date' })

  if (error) {
    console.error('Supabase upsert error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, count: toUpsert.length })
}
