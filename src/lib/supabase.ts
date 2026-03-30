import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

export type Market = 'NL' | 'FR' | 'DE' | 'ES' | 'IT'
export type CampaignType = 'ABO' | 'CBO'
export type AwarenessStage = 'Unaware' | 'Problem Aware' | 'Solution Aware' | 'Product Aware' | 'Most Aware'
export type BriefStatus = 'idea' | 'script' | 'production' | 'review' | 'ready' | 'live' | 'active'

export interface Brief {
  id: string
  concept_id: string      // e.g. C001
  angle: string           // e.g. "Upgrade", "Diagnostic"
  format: string          // e.g. "UGC", "Static", "Carousel"
  hook: string
  markets: Market[]
  awareness_stage: AwarenessStage
  concept?: string        // creative concept description
  offer?: string          // the offer / CTA
  inspiration_url?: string
  script?: string
  status: BriefStatus
  assignee?: string       // person responsible
  due_date?: string       // ISO date string
  content_url?: string    // link to actual creative file (Drive, etc.)
  briefing_url?: string   // link to brief doc (Notion, Google Doc)
  created_at: string
}

export interface Creative {
  id: string
  brief_id: string
  meta_ad_id: string
  meta_ad_name: string
  market: Market
  thumbnail_url?: string
  linked_at: string
}

export interface AdPerformance {
  id: string
  meta_ad_id: string
  market: Market
  campaign_type: CampaignType
  date: string
  spend: number
  revenue: number
  conversions: number
  impressions: number
  clicks: number
  thumbstop_rate?: number
  roas: number
  cpa: number
  ctr: number
}

// Aggregated view for display
export interface CreativeCard {
  brief: Brief
  creative?: Creative
  blended: {
    roas: number
    cpa: number
    spend: number
    conversions: number
    ctr: number
    thumbstop_rate: number
  }
  by_campaign: {
    ABO?: { roas: number; cpa: number; spend: number }
    CBO?: { roas: number; cpa: number; spend: number }
  }
  by_market: Partial<Record<Market, { roas: number; cpa: number; spend: number; is_outlier: boolean }>>
  is_winner: boolean
}
