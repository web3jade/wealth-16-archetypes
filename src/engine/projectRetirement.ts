import { getRiskBand } from './riskBands'
import type {
  AssumptionOverrides,
  MarketPack,
  ProjectionResult,
  WizardInput,
} from './types'

const DEFAULT_WITHDRAWAL_RATE = 0.04

function futureValueAnnuity(monthlyPayment: number, annualRate: number, years: number): number {
  if (years <= 0) return 0
  const r = annualRate / 12
  const n = Math.round(years * 12)
  if (Math.abs(r) < 1e-12) return monthlyPayment * n
  return monthlyPayment * ((Math.pow(1 + r, n) - 1) / r)
}

function futureValueLump(present: number, annualRate: number, years: number): number {
  if (years <= 0) return present
  return present * Math.pow(1 + annualRate, years)
}

function lifestyleSpendMultiplier(goal: WizardInput['lifestyleGoal']): number {
  switch (goal) {
    case 'lean':
      return 0.8
    case 'upgrade':
      return 1.25
    default:
      return 1
  }
}

function cityCol(market: MarketPack, cityId: string): number {
  const city = market.cities.find((c) => c.id === cityId)
  if (city) return city.colIndex
  // other-cities / legacy "other" → national baseline
  if (cityId === 'other-cities' || cityId === 'other') return 1
  return 1
}

function annualStatutoryContribution(input: WizardInput, market: MarketPack): number {
  const s = market.statutory
  if (!s) return 0
  const capped =
    s.wageCapAnnual != null ? Math.min(input.annualSalary, s.wageCapAnnual) : input.annualSalary
  return capped * (s.employeeRate + s.employerRate)
}

function projectAt(
  input: WizardInput,
  market: MarketPack,
  yearsToRetire: number,
  realReturn: number,
  inflation: number,
  withdrawalRate: number,
): Pick<
  ProjectionResult,
  | 'projectedNestEggNominal'
  | 'projectedNestEggReal'
  | 'requiredNestEgg'
  | 'monthlyRetirementSpend'
  | 'sustainableMonthlyIncome'
  | 'gap'
  | 'surplus'
  | 'extraMonthlySavingsNeeded'
  | 'statutoryProjected'
  | 'privateProjected'
  | 'impliedSavingsRate'
  | 'readiness'
> {
  const nominalReturn = (1 + realReturn) * (1 + inflation) - 1
  const col = cityCol(market, input.cityId)
  const spendMult = lifestyleSpendMultiplier(input.lifestyleGoal)
  const monthlyRetirementSpend = input.monthlySpend * spendMult * col
  const annualRetirementSpend = monthlyRetirementSpend * 12

  const statutoryAnnual = annualStatutoryContribution(input, market)
  const statutoryMonthly = statutoryAnnual / 12
  const privateMonthly = Math.max(0, input.monthlySavings)

  const statutoryProjected = futureValueLump(input.statutoryBalance, nominalReturn, yearsToRetire)
    + futureValueAnnuity(statutoryMonthly, nominalReturn, yearsToRetire)

  const privateProjected = futureValueLump(input.currentSavings, nominalReturn, yearsToRetire)
    + futureValueAnnuity(privateMonthly, nominalReturn, yearsToRetire)
    - futureValueLump(input.oneOffGoals, inflation, Math.max(0, yearsToRetire * 0.5))

  const projectedNestEggNominal = Math.max(0, statutoryProjected + privateProjected)
  const projectedNestEggReal = projectedNestEggNominal / Math.pow(1 + inflation, Math.max(yearsToRetire, 0))

  const requiredNestEgg = withdrawalRate > 0 ? annualRetirementSpend / withdrawalRate : Infinity
  const gap = Math.max(0, requiredNestEgg - projectedNestEggNominal)
  const surplus = Math.max(0, projectedNestEggNominal - requiredNestEgg)
  const sustainableMonthlyIncome = (projectedNestEggNominal * withdrawalRate) / 12

  let extraMonthlySavingsNeeded = 0
  if (gap > 0 && yearsToRetire > 0) {
    const r = nominalReturn / 12
    const n = Math.round(yearsToRetire * 12)
    if (Math.abs(r) < 1e-12) {
      extraMonthlySavingsNeeded = gap / n
    } else {
      extraMonthlySavingsNeeded = (gap * r) / (Math.pow(1 + r, n) - 1)
    }
  }

  const totalMonthlySave = privateMonthly + statutoryMonthly
  const impliedSavingsRate =
    input.annualSalary > 0 ? (totalMonthlySave * 12) / input.annualSalary : 0

  const ratio = requiredNestEgg > 0 ? projectedNestEggNominal / requiredNestEgg : 1
  const readiness: ProjectionResult['readiness'] =
    ratio >= 1.1 ? 'ahead' : ratio >= 0.9 ? 'on_track' : 'gap'

  return {
    projectedNestEggNominal,
    projectedNestEggReal,
    requiredNestEgg,
    monthlyRetirementSpend,
    sustainableMonthlyIncome,
    gap,
    surplus,
    extraMonthlySavingsNeeded,
    statutoryProjected: Math.max(0, statutoryProjected),
    privateProjected: Math.max(0, privateProjected),
    impliedSavingsRate,
    readiness,
  }
}

export function projectRetirement(
  input: WizardInput,
  market: MarketPack,
  overrides: AssumptionOverrides = {},
): ProjectionResult {
  const yearsToRetire = Math.max(0, input.retireAge - input.currentAge)
  const yearsInRetirement = Math.max(1, market.lifeExpectancy - input.retireAge)
  const inflation = overrides.inflation ?? input.inflationOverride ?? market.inflation
  const realReturn =
    overrides.realReturn
    ?? input.returnOverride
    ?? getRiskBand(input.riskBand).expectedRealReturn
  const withdrawalRate = overrides.withdrawalRate ?? DEFAULT_WITHDRAWAL_RATE
  const nominalReturn = (1 + realReturn) * (1 + inflation) - 1

  const base = projectAt(input, market, yearsToRetire, realReturn, inflation, withdrawalRate)

  const sensitivity = {
    returnPlus1: projectAt(input, market, yearsToRetire, realReturn + 0.01, inflation, withdrawalRate)
      .projectedNestEggNominal,
    returnMinus1: projectAt(input, market, yearsToRetire, realReturn - 0.01, inflation, withdrawalRate)
      .projectedNestEggNominal,
    retirePlus2: projectAt(input, market, yearsToRetire + 2, realReturn, inflation, withdrawalRate)
      .projectedNestEggNominal,
    retireMinus2: projectAt(
      input,
      market,
      Math.max(0, yearsToRetire - 2),
      realReturn,
      inflation,
      withdrawalRate,
    ).projectedNestEggNominal,
    spendPlus10: projectAt(
      { ...input, monthlySpend: input.monthlySpend * 1.1 },
      market,
      yearsToRetire,
      realReturn,
      inflation,
      withdrawalRate,
    ).gap,
    spendMinus10: projectAt(
      { ...input, monthlySpend: input.monthlySpend * 0.9 },
      market,
      yearsToRetire,
      realReturn,
      inflation,
      withdrawalRate,
    ).gap,
  }

  return {
    yearsToRetire,
    yearsInRetirement,
    nominalReturn,
    realReturn,
    inflation,
    ...base,
    sensitivity,
  }
}

export function formatMoney(amount: number, currencySymbol: string, compact = false): string {
  const abs = Math.abs(amount)
  if (compact && abs >= 1_000_000) {
    return `${currencySymbol}${(amount / 1_000_000).toFixed(1)}M`
  }
  if (compact && abs >= 1_000) {
    return `${currencySymbol}${(amount / 1_000).toFixed(0)}k`
  }
  return `${currencySymbol}${Math.round(amount).toLocaleString('en-US')}`
}
