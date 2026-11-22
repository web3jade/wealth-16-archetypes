import { getRiskBand } from './riskBands'
import { projectRetirement } from './projectRetirement'
import type { AssumptionOverrides, MarketPack, ProjectionResult, RiskBand, WizardInput } from './types'

export interface PortfolioSlice {
  key: 'equity' | 'bonds' | 'cash' | 'alts'
  pct: number
}

/** Educational asset-class real return assumptions for weighted portfolio reference. */
const SLICE_REAL_RETURN: Record<PortfolioSlice['key'], number> = {
  equity: 0.07,
  bonds: 0.02,
  cash: 0.0,
  alts: 0.05,
}

export interface PlanAdvice {
  /** Positive = need to save more each month; negative = can save less and still be on track */
  monthlySaveDelta: number
  /** Rough income change if ~35% of extra/less income goes to savings */
  monthlyEarnDelta: number
  /** Earliest age where nest egg meets required (null if never within search range) */
  breakEvenRetireAge: number | null
  portfolio: {
    slices: PortfolioSlice[]
    riskBand: RiskBand
    yearsToRetire: number
    /** Weighted educational real return for the suggested mix (e.g. 0.045) */
    expectedRealReturn: number
  }
}

export function portfolioExpectedRealReturn(slices: PortfolioSlice[]): number {
  const weighted = slices.reduce((sum, s) => sum + (s.pct / 100) * SLICE_REAL_RETURN[s.key], 0)
  return Math.round(weighted * 1000) / 1000
}

const SAVE_FROM_RAISE = 0.35

function projectAtAge(
  input: WizardInput,
  market: MarketPack,
  retireAge: number,
  overrides: AssumptionOverrides,
): ProjectionResult {
  return projectRetirement({ ...input, retireAge }, market, overrides)
}

export function findBreakEvenRetireAge(
  input: WizardInput,
  market: MarketPack,
  overrides: AssumptionOverrides = {},
): number | null {
  const maxAge = Math.min(market.lifeExpectancy - 5, 85)

  // Prefer earliest feasible age at or after current age
  for (let age = input.currentAge; age <= maxAge; age += 1) {
    const result = projectAtAge(input, market, age, overrides)
    if (result.gap <= 0) return age
  }
  return null
}

function maxMonthlySaveWhileFunded(
  input: WizardInput,
  market: MarketPack,
  overrides: AssumptionOverrides,
): number {
  // Binary search the lowest monthly savings that still closes the gap at target retire age
  let lo = 0
  let hi = Math.max(input.monthlySavings, 1)
  // Expand upper bound until funded or cap
  for (let i = 0; i < 12 && projectAtAge({ ...input, monthlySavings: hi }, market, input.retireAge, overrides).gap > 0; i++) {
    hi *= 2
  }
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2
    const gap = projectAtAge({ ...input, monthlySavings: mid }, market, input.retireAge, overrides).gap
    if (gap > 0) lo = mid
    else hi = mid
  }
  return hi
}

export function suggestPortfolio(
  riskBand: RiskBand,
  yearsToRetire: number,
): PortfolioSlice[] {
  const shortRunway = yearsToRetire <= 10
  const midRunway = yearsToRetire <= 20

  if (riskBand === 'conservative') {
    return shortRunway
      ? [
          { key: 'equity', pct: 20 },
          { key: 'bonds', pct: 65 },
          { key: 'cash', pct: 15 },
          { key: 'alts', pct: 0 },
        ]
      : [
          { key: 'equity', pct: 30 },
          { key: 'bonds', pct: 55 },
          { key: 'cash', pct: 10 },
          { key: 'alts', pct: 5 },
        ]
  }

  if (riskBand === 'growth') {
    return shortRunway
      ? [
          { key: 'equity', pct: 55 },
          { key: 'bonds', pct: 25 },
          { key: 'cash', pct: 10 },
          { key: 'alts', pct: 10 },
        ]
      : midRunway
        ? [
            { key: 'equity', pct: 70 },
            { key: 'bonds', pct: 15 },
            { key: 'cash', pct: 5 },
            { key: 'alts', pct: 10 },
          ]
        : [
            { key: 'equity', pct: 80 },
            { key: 'bonds', pct: 10 },
            { key: 'cash', pct: 0 },
            { key: 'alts', pct: 10 },
          ]
  }

  // balanced
  return shortRunway
    ? [
        { key: 'equity', pct: 40 },
        { key: 'bonds', pct: 45 },
        { key: 'cash', pct: 10 },
        { key: 'alts', pct: 5 },
      ]
    : [
        { key: 'equity', pct: 55 },
        { key: 'bonds', pct: 30 },
        { key: 'cash', pct: 5 },
        { key: 'alts', pct: 10 },
      ]
}

export function buildPlanAdvice(
  input: WizardInput,
  market: MarketPack,
  projection: ProjectionResult,
  overrides: AssumptionOverrides = {},
): PlanAdvice {
  let monthlySaveDelta = 0
  if (projection.gap > 0) {
    monthlySaveDelta = projection.extraMonthlySavingsNeeded
  } else if (projection.surplus > 0) {
    const minSave = maxMonthlySaveWhileFunded(input, market, overrides)
    monthlySaveDelta = minSave - input.monthlySavings // typically negative
  }

  const monthlyEarnDelta = monthlySaveDelta / SAVE_FROM_RAISE
  const breakEvenRetireAge = findBreakEvenRetireAge(input, market, overrides)

  const slices = suggestPortfolio(input.riskBand, projection.yearsToRetire)

  return {
    monthlySaveDelta,
    monthlyEarnDelta,
    breakEvenRetireAge,
    portfolio: {
      slices,
      riskBand: input.riskBand,
      yearsToRetire: projection.yearsToRetire,
      expectedRealReturn: portfolioExpectedRealReturn(slices),
    },
  }
}

export function portfolioRiskLabel(band: RiskBand): string {
  return getRiskBand(band).band
}
