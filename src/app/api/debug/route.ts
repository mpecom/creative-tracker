import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const { data, error } = await supabase
    .from('briefs')
    .select('id, concept_id, created_at')
    .order('created_at')

  return NextResponse.json({
    supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    row_count: data?.length ?? 0,
    rows: data ?? [],
    error: error?.message ?? null,
  })
}
