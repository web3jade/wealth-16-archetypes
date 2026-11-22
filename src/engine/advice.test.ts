import { describe, expect, it } from 'vitest'
import { getMarket } from '../markets'
import { projectRetirement } from './projectRetirement'
import { buildPlanAdvice } from './advice'
import type { WizardInput } from './types'

const base = (overrides: Partial<WizardInput> = {}): WizardInput => ({
  marketId: 'hk',
  cityId: 'hong-kong',
  lifeStage: 'mid_career',
  currentAge: 35,
  retireAge: 60,
  annualSalary: 600_000,
  monthlySpend: 20_000,
  currentSavings: 300_000,
  statutoryBalance: 150_000,
  monthlySavings: 8_000,
  riskBand: 'balanced',
  lifestyleGoal: 'same',
  oneOffGoals: 0,
  ...overrides,
})

describe('buildPlanAdvice', () => {
  it('suggests more saving and later age when underfunded', () => {
    const market = getMarket('hk')!
    const input = base({
      monthlySavings: 500,
      currentSavings: 20_000,
      statutoryBalance: 10_000,
      retireAge: 50,
      lifestyleGoal: 'upgrade',
      riskBand: 'conservative',
    })
    const projection = projectRetirement(input, market)
    const advice = buildPlanAdvice(input, market, projection)
    expect(advice.monthlySaveDelta).toBeGreaterThan(0)
    expect(advice.monthlyEarnDelta).toBeGreaterThan(0)
    expect(advice.portfolio.slices.reduce((s, x) => s + x.pct, 0)).toBe(100)
    expect(advice.portfolio.expectedRealReturn).toBeGreaterThan(0)
    expect(advice.portfolio.expectedRealReturn).toBeLessThan(0.1)
  })

  it('can suggest earlier break-even age when well funded', () => {
    const market = getMarket('hk')!
    const input = base({
      monthlySavings: 25_000,
      currentSavings: 2_000_000,
      statutoryBalance: 800_000,
      retireAge: 65,
      riskBand: 'growth',
    })
    const projection = projectRetirement(input, market)
    const advice = buildPlanAdvice(input, market, projection)
    expect(advice.breakEvenRetireAge).not.toBeNull()
    expect(advice.breakEvenRetireAge!).toBeLessThanOrEqual(65)
  })
})
