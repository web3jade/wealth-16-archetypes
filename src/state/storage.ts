import type { WizardInput } from '../engine/types'
import type { AssumptionOverrides } from '../engine/types'
import type { Lang } from '../i18n/messages'

const KEY = 'retire-type:v1'
const TERMS_KEY = 'retire-type:terms-v1'
const LANG_KEY = 'retire-type:lang'

export interface PersistedState {
  step: number
  input: WizardInput
  assumptions: AssumptionOverrides
  lang?: Lang
}

export function hasAcceptedTerms(): boolean {
  try {
    return localStorage.getItem(TERMS_KEY) === '1'
  } catch {
    return false
  }
}

export function saveTermsAccepted(): void {
  localStorage.setItem(TERMS_KEY, '1')
}

export function loadLangPreference(): Lang | null {
  try {
    const raw = localStorage.getItem(LANG_KEY)
    if (raw && ['en', 'zh', 'ja', 'ko'].includes(raw)) return raw as Lang
    return null
  } catch {
    return null
  }
}

export function saveLangPreference(lang: Lang): void {
  localStorage.setItem(LANG_KEY, lang)
}

/** Blank numeric fields — NumberInput renders these as empty. */
const blank = Number.NaN

/** Fresh quiz defaults: selects only; all fillable numbers start empty. */
export const defaultInput = (): WizardInput => ({
  marketId: 'hk',
  cityId: 'hong-kong',
  lifeStage: 'mid_career',
  currentAge: blank,
  retireAge: blank,
  annualSalary: blank,
  monthlySpend: blank,
  currentSavings: blank,
  statutoryBalance: blank,
  monthlySavings: blank,
  riskBand: 'balanced',
  lifestyleGoal: 'same',
  oneOffGoals: blank,
})

/** Coerce blank (NaN) fields to finite numbers for the projection engine. */
export function normalizeInput(input: WizardInput): WizardInput {
  const n = (v: number, fallback = 0) => (Number.isFinite(v) ? v : fallback)
  return {
    ...input,
    currentAge: n(input.currentAge),
    retireAge: n(input.retireAge),
    annualSalary: n(input.annualSalary),
    monthlySpend: n(input.monthlySpend),
    currentSavings: n(input.currentSavings),
    statutoryBalance: n(input.statutoryBalance),
    monthlySavings: n(input.monthlySavings),
    oneOffGoals: n(input.oneOffGoals),
  }
}

/** Required money fields (one-off goals stay optional). */
export function moneyFieldsReady(input: WizardInput): boolean {
  return [
    input.annualSalary,
    input.monthlySpend,
    input.currentSavings,
    input.statutoryBalance,
    input.monthlySavings,
  ].every(Number.isFinite)
}

export function loadState(): PersistedState | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    return JSON.parse(raw) as PersistedState
  } catch {
    return null
  }
}

export function saveState(state: PersistedState): void {
  localStorage.setItem(KEY, JSON.stringify(state))
}

export function clearState(): void {
  localStorage.removeItem(KEY)
}
