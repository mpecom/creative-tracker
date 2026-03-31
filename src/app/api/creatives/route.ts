import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase'

export async function GET() {
  const { data, error } = await supabase.from('creatives').select('*')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  // body: { brief_id, meta_ad_id, meta_ad_name, market, thumbnail_url? }
  const { data, error } = await supabase.from('creatives').insert([{
    ...body,
    linked_at: new Date().toISOString(),
  }]).select().maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
