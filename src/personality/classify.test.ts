import { describe, expect, it } from 'vitest'
import { projectRetirement } from '../engine/projectRetirement'
import type { WizardInput } from '../engine/types'
import { getMarket } from '../markets'
import { classifyPersonality } from './classify'
import { ALL_TYPE_CODES } from './archetypes'

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
  monthlySavings: 10_000,
  riskBand: 'balanced',
  lifestyleGoal: 'same',
  oneOffGoals: 0,
  ...overrides,
})

describe('classifyPersonality', () => {
  it('returns EVAP for early growth abundant planner', () => {
    const market = getMarket('hk')!
    const input = base({
      retireAge: 50,
      riskBand: 'growth',
      lifestyleGoal: 'upgrade',
      monthlySavings: 20_000,
      statutoryBalance: 200_000,
    })
    const projection = projectRetirement(input, market)
    const result = classifyPersonality(input, market, projection)
    expect(result.code).toBe('EVAP')
    expect(result.archetype.title).toBe('The Rocket')
  })

  it('returns LSMP for long steady modest planner', () => {
    const market = getMarket('sg')!
    const input = base({
      marketId: 'sg',
      cityId: 'singapore',
      retireAge: 65,
      riskBand: 'conservative',
      lifestyleGoal: 'lean',
      monthlySavings: 4_000,
      annualSalary: 120_000,
      statutoryBalance: 80_000,
    })
    const projection = projectRetirement(input, market)
    const result = classifyPersonality(input, market, projection)
    expect(result.code).toBe('LSMP')
    expect(result.archetype.title).toBe('The Steward')
  })

  it('covers all 16 codes as valid archetypes', () => {
    expect(ALL_TYPE_CODES).toHaveLength(16)
  })
})
