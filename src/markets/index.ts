import type { MarketPack, MarketRegion } from '../engine/types'
import { GLOBAL_MARKETS } from './global'
import { TIER1_MARKETS } from './tier1'
import { TIER2_MARKETS } from './tier2'
import { TIER3_MARKETS } from './tier3'

export const MARKETS: MarketPack[] = [
  ...TIER1_MARKETS,
  ...TIER2_MARKETS,
  ...TIER3_MARKETS,
  ...GLOBAL_MARKETS,
]

/** Preferred display order for region optgroups. */
export const REGION_ORDER: MarketRegion[] = [
  'asia',
  'americas',
  'europe',
  'oceania',
  'middle_east',
  'other',
]

export function getMarket(id: string): MarketPack | undefined {
  // Legacy id from older Asia-only builds
  if (id === 'generic-asia') return MARKETS.find((m) => m.id === 'generic-global')
  return MARKETS.find((m) => m.id === id)
}

export function getCity(market: MarketPack, cityId: string) {
  return market.cities.find((c) => c.id === cityId) ?? market.cities[0]
}

export function marketsByTier(tier: 1 | 2 | 3): MarketPack[] {
  return MARKETS.filter((m) => m.tier === tier)
}

export function marketsByRegion(region: MarketRegion): MarketPack[] {
  return MARKETS.filter((m) => m.region === region).sort((a, b) => a.name.localeCompare(b.name))
}

export function marketsGroupedByRegion(): { region: MarketRegion; markets: MarketPack[] }[] {
  return REGION_ORDER.map((region) => ({
    region,
    markets: marketsByRegion(region),
  })).filter((g) => g.markets.length > 0)
}
