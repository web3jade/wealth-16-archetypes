import { describe, expect, it } from 'vitest'
import { agesAreValid, validateAges } from './ageLimits'

describe('validateAges', () => {
  it('accepts a normal working-age range', () => {
    expect(agesAreValid(32, 60)).toBe(true)
    expect(validateAges(16, 65)).toEqual([])
  })

  it('rejects current age below working age', () => {
    expect(validateAges(15, 60)).toContain('life.error.currentLow')
  })

  it('rejects retire age above 80', () => {
    expect(validateAges(40, 81)).toContain('life.error.retireHigh')
  })

  it('rejects retire age not after current age', () => {
    expect(validateAges(55, 55)).toContain('life.error.retireOrder')
    expect(validateAges(60, 50)).toContain('life.error.retireOrder')
  })
})
