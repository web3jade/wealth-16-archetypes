import type { MarketPack } from '../engine/types'

/** Tier 1 — full local model (statutory + city COL). Rates are illustrative educational defaults. */
export const TIER1_MARKETS: MarketPack[] = [
  {
    id: 'hk',
    name: 'Hong Kong',
    tier: 1,
    region: 'asia',
    currency: 'HKD',
    currencySymbol: 'HK$',
    inflation: 0.025,
    salaryGrowth: 0.03,
    lifeExpectancy: 85,
    normalRetirementAge: 65,
    cities: [{ id: 'hong-kong', name: 'Hong Kong', colIndex: 1 }],
    statutory: {
      label: 'MPF',
      employeeRate: 0.05,
      employerRate: 0.05,
      wageCapAnnual: 360_000,
      note: 'Simplified MPF: 5% employee + 5% employer on relevant income, capped for modelling.',
    },
    disclaimer:
      'Educational MPF-lite model only. Actual MPF rules, offsets, and investment choices differ. Not financial advice.',
  },
  {
    id: 'sg',
    name: 'Singapore',
    tier: 1,
    region: 'asia',
    currency: 'SGD',
    currencySymbol: 'S$',
    inflation: 0.02,
    salaryGrowth: 0.03,
    lifeExpectancy: 85,
    normalRetirementAge: 65,
    cities: [{ id: 'singapore', name: 'Singapore', colIndex: 1 }],
    statutory: {
      label: 'CPF',
      employeeRate: 0.2,
      employerRate: 0.17,
      wageCapAnnual: 102_000,
      note: 'Simplified CPF Ordinary/Special framing as a combined retirement contribution for modelling.',
    },
    disclaimer:
      'Educational CPF-lite model only. Actual CPF allocation, interest, and withdrawal ages differ. Not financial advice.',
  },
  {
    id: 'jp',
    name: 'Japan',
    tier: 1,
    region: 'asia',
    currency: 'JPY',
    currencySymbol: '¥',
    inflation: 0.015,
    salaryGrowth: 0.02,
    lifeExpectancy: 87,
    normalRetirementAge: 65,
    cities: [
      { id: 'tokyo', name: 'Tokyo', colIndex: 1.15 },
      { id: 'osaka', name: 'Osaka', colIndex: 1.0 },
    ],
    statutory: {
      label: 'Nenkin (lite)',
      employeeRate: 0.0915,
      employerRate: 0.0915,
      wageCapAnnual: 7_800_000,
      note: 'Simplified Employees’ Pension modelling; public pension income is not fully simulated as an annuity.',
    },
    disclaimer:
      'Educational nenkin-lite model only. Actual Japanese pension formulas and eligibility differ. Not financial advice.',
  },
]
