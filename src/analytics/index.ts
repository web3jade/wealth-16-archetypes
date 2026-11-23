import posthog from 'posthog-js'
import type { Lang } from '../i18n/messages'
import type { PersonalityResult } from '../personality/classify'
import { getRiskBand } from '../engine/riskBands'
import type { AssumptionOverrides, WizardInput } from '../engine/types'

const TOKEN = import.meta.env.VITE_POSTHOG_PROJECT_TOKEN as string | undefined
const HOST = (import.meta.env.VITE_POSTHOG_HOST as string | undefined) || 'https://us.i.posthog.com'

let ready = false

export function initAnalytics(): void {
  if (ready || typeof window === 'undefined') return
  if (!TOKEN) {
    if (import.meta.env.DEV) {
      console.info('[analytics] PostHog token missing — events will be no-ops until VITE_POSTHOG_PROJECT_TOKEN is set.')
    }
    return
  }

  posthog.init(TOKEN, {
    api_host: HOST,
    person_profiles: 'identified_only',
    capture_pageview: true,
    capture_pageleave: true,
    persistence: 'localStorage+cookie',
  })
  ready = true
}

export function track(event: string, properties?: Record<string, string | number | boolean | null | undefined>): void {
  if (!ready) return
  const cleaned: Record<string, string | number | boolean | null> = {}
  if (properties) {
    for (const [k, v] of Object.entries(properties)) {
      if (v !== undefined) cleaned[k] = v
    }
  }
  posthog.capture(event, cleaned)
}

export function ageBucket(age: number): string {
  if (age < 25) return '16-24'
  if (age < 35) return '25-34'
  if (age < 45) return '35-44'
  if (age < 55) return '45-54'
  if (age < 65) return '55-64'
  return '65+'
}

/** Round finite money inputs for analytics; omit blanks. */
function moneyValue(n: number): number | null {
  return Number.isFinite(n) ? Math.round(n) : null
}

function pctValue(fraction: number | undefined): number | null {
  if (fraction === undefined || !Number.isFinite(fraction)) return null
  return Math.round(fraction * 1000) / 10
}

export function trackLandingView(lang: Lang): void {
  track('landing_view', { lang })
}

export function trackCtaClick(lang: Lang): void {
  track('cta_click', { lang, cta: 'find_my_type' })
}

export function trackTerms(action: 'shown' | 'accepted' | 'cancelled', lang: Lang): void {
  track(`terms_${action}`, { lang })
}

export function trackLangChange(lang: Lang): void {
  track('lang_change', { lang })
}

export function trackWizardStep(step: number, stepKey: string, lang: Lang): void {
  track('wizard_step_view', { step, step_key: stepKey, lang })
}

export function trackTypeRevealed(
  lang: Lang,
  input: WizardInput,
  personality: PersonalityResult,
  assumptions?: AssumptionOverrides,
): void {
  track('type_revealed', {
    lang,
    type_code: personality.code,
    horizon: personality.letters.horizon,
    risk_letter: personality.letters.risk,
    lifestyle_letter: personality.letters.lifestyle,
    style_letter: personality.letters.style,
    readiness: personality.readinessLabel,
    market_id: input.marketId,
    city_id: input.cityId,
    life_stage: input.lifeStage,
    risk_band: input.riskBand,
    /** Risk-page choice: 2 / 4 / 6 */
    expected_return_pct: getRiskBand(input.riskBand).expectedRealReturn * 100,
    lifestyle_goal: input.lifestyleGoal,
    age_bucket: ageBucket(Number.isFinite(input.currentAge) ? input.currentAge : 0),
    retire_age_bucket: ageBucket(input.retireAge),
    current_age: Number.isFinite(input.currentAge) ? Math.round(input.currentAge) : null,
    retire_age: Number.isFinite(input.retireAge) ? Math.round(input.retireAge) : null,
    annual_salary: moneyValue(input.annualSalary),
    monthly_spend: moneyValue(input.monthlySpend),
    current_savings: moneyValue(input.currentSavings),
    statutory_balance: moneyValue(input.statutoryBalance),
    monthly_savings: moneyValue(input.monthlySavings),
    one_off_goals: moneyValue(input.oneOffGoals),
    inflation_pct: pctValue(assumptions?.inflation),
    asset_return_pct: pctValue(assumptions?.realReturn),
  })
}

export function trackShare(
  channel: 'x' | 'site_copy' | 'agent_copy' | 'download_png',
  lang: Lang,
  typeCode: string,
): void {
  track('share_action', { channel, lang, type_code: typeCode })
}

export function getPosthogClient() {
  return ready ? posthog : null
}
