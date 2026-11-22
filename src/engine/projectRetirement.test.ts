import { describe, expect, it } from 'vitest'
import { projectRetirement } from './projectRetirement'
import { getMarket } from '../markets'
import type { WizardInput } from './types'

const baseInput = (overrides: Partial<WizardInput> = {}): WizardInput => ({
  marketId: 'hk',
  cityId: 'hong-kong',
  lifeStage: 'mid_career',
  currentAge: 35,
  retireAge: 60,
  annualSalary: 600_000,
  monthlySpend: 25_000,
  currentSavings: 400_000,
  statutoryBalance: 200_000,
  monthlySavings: 8_000,
  riskBand: 'balanced',
  lifestyleGoal: 'same',
  oneOffGoals: 0,
  ...overrides,
})

describe('projectRetirement', () => {
  it('projects a positive nest egg for a mid-career HK saver', () => {
    const market = getMarket('hk')!
    const result = projectRetirement(baseInput(), market)
    expect(result.yearsToRetire).toBe(25)
    expect(result.projectedNestEggNominal).toBeGreaterThan(1_000_000)
    expect(result.requiredNestEgg).toBeGreaterThan(0)
    expect(['ahead', 'on_track', 'gap']).toContain(result.readiness)
  })

  it('marks early freedom seekers with higher gap when under-saving', () => {
    const market = getMarket('hk')!
    const result = projectRetirement(
      baseInput({
        retireAge: 45,
        monthlySavings: 1_000,
        currentSavings: 50_000,
        statutoryBalance: 20_000,
        lifestyleGoal: 'upgrade',
        riskBand: 'conservative',
      }),
      market,
    )
    expect(result.yearsToRetire).toBe(10)
    expect(result.gap).toBeGreaterThan(0)
    expect(result.extraMonthlySavingsNeeded).toBeGreaterThan(0)
    expect(result.readiness).toBe('gap')
  })

  it('increases projected nest egg with higher risk returns', () => {
    const market = getMarket('sg')!
    const conservative = projectRetirement(baseInput({ marketId: 'sg', cityId: 'singapore', riskBand: 'conservative' }), market)
    const growth = projectRetirement(baseInput({ marketId: 'sg', cityId: 'singapore', riskBand: 'growth' }), market)
    expect(growth.projectedNestEggNominal).toBeGreaterThan(conservative.projectedNestEggNominal)
  })

  it('includes sensitivity scenarios', () => {
    const market = getMarket('jp')!
    const result = projectRetirement(
      baseInput({ marketId: 'jp', cityId: 'tokyo', annualSalary: 8_000_000, monthlySpend: 300_000 }),
      market,
    )
    expect(result.sensitivity.returnPlus1).toBeGreaterThan(result.projectedNestEggNominal)
    expect(result.sensitivity.returnMinus1).toBeLessThan(result.projectedNestEggNominal)
  })

  it('handles already-retired edge (yearsToRetire = 0)', () => {
    const market = getMarket('hk')!
    const result = projectRetirement(baseInput({ currentAge: 65, retireAge: 65 }), market)
    expect(result.yearsToRetire).toBe(0)
    expect(result.projectedNestEggNominal).toBeGreaterThan(0)
  })
})
