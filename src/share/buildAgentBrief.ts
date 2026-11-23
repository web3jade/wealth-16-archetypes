import type { PlanAdvice } from '../engine/advice'
import { formatMoney } from '../engine/projectRetirement'
import type { MarketPack, ProjectionResult, WizardInput } from '../engine/types'
import { t, type Lang } from '../i18n/messages'
import { cityLabel, marketLabel, statutoryLabel } from '../i18n/places'
import type { PersonalityResult } from '../personality/classify'

export interface AgentBriefInput {
  lang: Lang
  input: WizardInput
  market: MarketPack
  projection: ProjectionResult
  advice: PlanAdvice
  personality: PersonalityResult
}

/** Structured retirement summary for pasting into ChatGPT / Claude / Grok / etc. */
export function buildAgentBrief(ctx: AgentBriefInput): string {
  const { lang, input, market, projection, advice, personality } = ctx
  const sym = market.currencySymbol
  const cityRaw = market.cities.find((c) => c.id === input.cityId)?.name ?? input.cityId
  const city = cityLabel(lang, input.cityId, cityRaw)
  const marketName = marketLabel(lang, market.id, market.name)
  const money = (n: number, compact = false) => formatMoney(n, sym, compact)

  const intro = t(lang, 'agent.intro')
  const ask = t(lang, 'agent.ask')

  const lines = [
    intro,
    '',
    `## ${t(lang, 'agent.section.profile')}`,
    `- ${t(lang, 'brand.title')}: ${personality.code} — ${personality.archetype.title}`,
    `- ${personality.archetype.tagline}`,
    `- ${t(lang, 'results.letters.horizon')}: ${t(lang, `results.letters.horizon.${personality.letters.horizon}`)}`,
    `- ${t(lang, 'results.letters.risk')}: ${t(lang, `results.letters.risk.${personality.letters.risk}`)}`,
    `- ${t(lang, 'results.letters.lifestyle')}: ${t(lang, `results.letters.lifestyle.${personality.letters.lifestyle}`)}`,
    `- ${t(lang, 'results.letters.style')}: ${t(lang, `results.letters.style.${personality.letters.style}`)}`,
    `- ${t(lang, 'agent.readiness')}: ${personality.readinessLabel}`,
    '',
    `## ${t(lang, 'agent.section.inputs')}`,
    `- ${t(lang, 'locale.market')}: ${marketName} / ${city} (${market.currency})`,
    `- ${t(lang, 'life.age')}: ${input.currentAge}`,
    `- ${t(lang, 'life.retireAge')}: ${input.retireAge}`,
    `- ${t(lang, 'money.salary')}: ${money(input.annualSalary)}`,
    `- ${t(lang, 'money.spend')}: ${money(input.monthlySpend)}`,
    `- ${t(lang, 'money.savings')}: ${money(input.currentSavings)}`,
    `- ${statutoryLabel(lang, market.id, market.statutory?.label)}: ${money(input.statutoryBalance)}`,
    `- ${t(lang, 'money.monthlySave')}: ${money(input.monthlySavings)}`,
    `- ${t(lang, 'money.oneOff')}: ${money(input.oneOffGoals)}`,
    `- ${t(lang, 'risk.title')}: ${input.riskBand}`,
    `- ${t(lang, 'goals.title')}: ${input.lifestyleGoal}`,
    '',
    `## ${t(lang, 'agent.section.projection')}`,
    `- ${t(lang, 'agent.yearsToRetire')}: ${projection.yearsToRetire}`,
    `- ${t(lang, 'results.projected')}: ${money(projection.projectedNestEggNominal, true)}`,
    `- ${t(lang, 'results.required')}: ${money(projection.requiredNestEgg, true)}`,
    projection.gap > 0
      ? `- ${t(lang, 'results.extra')}: ${money(projection.extraMonthlySavingsNeeded)}`
      : `- ${t(lang, 'results.surplus')}: ${money(projection.surplus, true)}`,
    `- ${t(lang, 'results.inflation')}: ${(projection.inflation * 100).toFixed(1)}%`,
    `- ${t(lang, 'results.return')}: ${(projection.realReturn * 100).toFixed(1)}%`,
    '',
    `## ${t(lang, 'agent.section.advice')}`,
    `- ${t(lang, 'agent.saveDelta')}: ${money(advice.monthlySaveDelta)}`,
    `- ${t(lang, 'agent.breakEven')}: ${advice.breakEvenRetireAge ?? t(lang, 'agent.breakEven.none')}`,
    `- ${t(lang, 'results.portfolio')}: ${advice.portfolio.slices
      .filter((s) => s.pct > 0)
      .map((s) => `${t(lang, `results.portfolio.${s.key}`)} ${s.pct}%`)
      .join(' · ')}`,
    `- ${t(lang, 'results.portfolio.return', {
      pct: (advice.portfolio.expectedRealReturn * 100).toFixed(1),
    })}`,
    '',
    `## ${t(lang, 'agent.section.request')}`,
    ask,
  ]

  return lines.join('\n')
}

export async function copyAgentBrief(text: string): Promise<void> {
  await navigator.clipboard.writeText(text)
}
