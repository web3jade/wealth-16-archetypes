import type { MarketPack } from '../engine/types'

/** Tier 3 — light Asia fallback (currency + inflation + COL only). */
export const TIER3_MARKETS: MarketPack[] = [
  {
    id: 'vn',
    name: 'Vietnam',
    tier: 3,
    region: 'asia',
    currency: 'VND',
    currencySymbol: '₫',
    inflation: 0.035,
    salaryGrowth: 0.05,
    lifeExpectancy: 75,
    normalRetirementAge: 60,
    cities: [
      { id: 'ho-chi-minh', name: 'Ho Chi Minh City', colIndex: 1.1 },
      { id: 'hanoi', name: 'Hanoi', colIndex: 1.05 },
    ],
    disclaimer: 'Generic COL model — no detailed statutory pension. Not financial advice.',
  },
  {
    id: 'ph',
    name: 'Philippines',
    tier: 3,
    region: 'asia',
    currency: 'PHP',
    currencySymbol: '₱',
    inflation: 0.03,
    salaryGrowth: 0.04,
    lifeExpectancy: 72,
    normalRetirementAge: 60,
    cities: [{ id: 'manila', name: 'Manila', colIndex: 1.1 }],
    disclaimer: 'Generic COL model — no detailed statutory pension. Not financial advice.',
  },
]
