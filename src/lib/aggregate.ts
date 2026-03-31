import { Brief, Creative, AdPerformance, CreativeCard, Market, CampaignType } from './supabase'

const ROAS_TARGET = 2.5  // unified target

function weightedAvg(values: { value: number; weight: number }[]) {
  const totalWeight = values.reduce((s, v) => s + v.weight, 0)
  if (totalWeight === 0) return 0
  return values.reduce((s, v) => s + v.value * v.weight, 0) / totalWeight
}

function isOutlier(marketRoas: number, blendedRoas: number) {
  return Math.abs(marketRoas - blendedRoas) / (blendedRoas || 1) > 0.3
}

export function aggregateCreativeCard(
  brief: Brief,
  creative: Creative | undefined,
  performances: AdPerformance[]
): CreativeCard {
  if (performances.length === 0) {
    return {
      brief,
      creative,
      blended: { roas: 0, cpa: 0, spend: 0, conversions: 0, ctr: 0, thumbstop_rate: 0 },
      by_campaign: {},
      by_market: {},
      is_winner: false,
      trend: [],
    }
  }

  // Blended
  const totalSpend = performances.reduce((s, p) => s + p.spend, 0)
  const totalRevenue = performances.reduce((s, p) => s + p.revenue, 0)
  const totalConversions = performances.reduce((s, p) => s + p.conversions, 0)
  const totalClicks = performances.reduce((s, p) => s + p.clicks, 0)
  const totalImpressions = performances.reduce((s, p) => s + p.impressions, 0)
  const blendedRoas = totalSpend > 0 ? totalRevenue / totalSpend : 0
  const blendedCpa = totalConversions > 0 ? totalSpend / totalConversions : 0
  const blendedCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0
  const thumbstopRows = performances.filter(p => p.thumbstop_rate != null)
  const blendedThumbstop = thumbstopRows.length > 0
    ? thumbstopRows.reduce((s, p) => s + (p.thumbstop_rate ?? 0) * p.impressions, 0) /
      (thumbstopRows.reduce((s, p) => s + p.impressions, 0) || 1)
    : 0

  // By campaign type
  const byCampaign: CreativeCard['by_campaign'] = {}
  for (const ct of ['ABO', 'CBO'] as CampaignType[]) {
    const ps = performances.filter(p => p.campaign_type === ct)
    if (ps.length === 0) continue
    const spend = ps.reduce((s, p) => s + p.spend, 0)
    const revenue = ps.reduce((s, p) => s + p.revenue, 0)
    const convs = ps.reduce((s, p) => s + p.conversions, 0)
    byCampaign[ct] = {
      spend,
      roas: spend > 0 ? revenue / spend : 0,
      cpa: convs > 0 ? spend / convs : 0,
    }
  }

  // By market
  const byMarket: CreativeCard['by_market'] = {}
  for (const market of ['NL', 'FR', 'DE', 'ES', 'IT'] as Market[]) {
    const ps = performances.filter(p => p.market === market)
    if (ps.length === 0) continue
    const spend = ps.reduce((s, p) => s + p.spend, 0)
    const revenue = ps.reduce((s, p) => s + p.revenue, 0)
    const convs = ps.reduce((s, p) => s + p.conversions, 0)
    const roas = spend > 0 ? revenue / spend : 0
    byMarket[market] = {
      spend,
      roas,
      cpa: convs > 0 ? spend / convs : 0,
      is_outlier: isOutlier(roas, blendedRoas),
    }
  }

  return {
    brief,
    creative,
    blended: {
      roas: blendedRoas,
      cpa: blendedCpa,
      spend: totalSpend,
      conversions: totalConversions,
      ctr: blendedCtr,
      thumbstop_rate: blendedThumbstop,
    },
    by_campaign: byCampaign,
    by_market: byMarket,
    is_winner: blendedRoas >= ROAS_TARGET,
    trend: [],
  }
}

export { ROAS_TARGET }
