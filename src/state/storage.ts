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

export const defaultInput = (): WizardInput => ({
  marketId: 'hk',
  cityId: 'hong-kong',
  lifeStage: 'mid_career',
  currentAge: 32,
  retireAge: 60,
  annualSalary: 480_000,
  monthlySpend: 22_000,
  currentSavings: 250_000,
  statutoryBalance: 120_000,
  monthlySavings: 6_000,
  riskBand: 'balanced',
  lifestyleGoal: 'same',
  oneOffGoals: 0,
})

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
