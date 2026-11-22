export type LifeStage = 'early_career' | 'mid_career' | 'pre_retiree' | 'near_retiree'

export type RiskBand = 'conservative' | 'balanced' | 'growth'

export type LifestyleGoal = 'lean' | 'same' | 'upgrade'

export type MarketTier = 1 | 2 | 3

export type MarketRegion =
  | 'asia'
  | 'americas'
  | 'europe'
  | 'oceania'
  | 'middle_east'
  | 'other'

export interface CityPack {
  id: string
  name: string
  /** Cost of living multiplier vs national baseline (1.0 = baseline) */
  colIndex: number
}

export interface StatutoryDefaults {
  label: string
  /** Employee contribution rate as fraction of gross (0–1) */
  employeeRate: number
  /** Employer contribution rate as fraction of gross (0–1) */
  employerRate: number
  /** Optional contribution wage cap (annual), null = uncapped */
  wageCapAnnual: number | null
  note: string
}

export interface MarketPack {
  id: string
  name: string
  tier: MarketTier
  region: MarketRegion
  currency: string
  currencySymbol: string
  inflation: number
  salaryGrowth: number
  lifeExpectancy: number
  normalRetirementAge: number
  cities: CityPack[]
  statutory?: StatutoryDefaults
  disclaimer: string
}

export interface WizardInput {
  marketId: string
  cityId: string
  lifeStage: LifeStage
  currentAge: number
  retireAge: number
  annualSalary: number
  monthlySpend: number
  currentSavings: number
  /** Existing statutory / MPF / CPF / pension balance */
  statutoryBalance: number
  monthlySavings: number
  riskBand: RiskBand
  lifestyleGoal: LifestyleGoal
  /** Optional one-off goals (education, housing buffer, etc.) */
  oneOffGoals: number
  /** Override assumptions; if omitted, market defaults + risk band apply */
  inflationOverride?: number
  returnOverride?: number
}

export interface RiskReturnBand {
  band: RiskBand
  expectedRealReturn: number
  volatilityLabel: string
}

export interface ProjectionResult {
  yearsToRetire: number
  yearsInRetirement: number
  nominalReturn: number
  realReturn: number
  inflation: number
  projectedNestEggNominal: number
  projectedNestEggReal: number
  requiredNestEgg: number
  monthlyRetirementSpend: number
  sustainableMonthlyIncome: number
  gap: number
  surplus: number
  extraMonthlySavingsNeeded: number
  impliedSavingsRate: number
  readiness: 'ahead' | 'on_track' | 'gap'
  statutoryProjected: number
  privateProjected: number
  sensitivity: {
    returnPlus1: number
    returnMinus1: number
    retirePlus2: number
    retireMinus2: number
    spendPlus10: number
    spendMinus10: number
  }
}

export interface AssumptionOverrides {
  inflation?: number
  realReturn?: number
  withdrawalRate?: number
}
