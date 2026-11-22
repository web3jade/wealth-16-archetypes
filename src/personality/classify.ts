import type { MarketPack, ProjectionResult, WizardInput } from '../engine/types'
import type {
  Archetype,
  HorizonLetter,
  LifestyleLetter,
  RiskLetter,
  StyleLetter,
  TypeCode,
} from './archetypes'
import { localizeArchetype, localizeReadiness } from './localize'
import type { Lang } from '../i18n/messages'

export interface PersonalityResult {
  code: TypeCode
  archetype: Archetype
  letters: {
    horizon: HorizonLetter
    risk: RiskLetter
    lifestyle: LifestyleLetter
    style: StyleLetter
  }
  readinessLabel: string
}

function classifyHorizon(input: WizardInput, market: MarketPack): HorizonLetter {
  const years = input.retireAge - input.currentAge
  const normYears = market.normalRetirementAge - input.currentAge
  // Early Freedom if targeting meaningfully sooner than local norm, or very short runway.
  if (input.retireAge < market.normalRetirementAge - 3) return 'E'
  if (years < Math.max(8, normYears * 0.7)) return 'E'
  if (input.lifeStage === 'early_career' && input.retireAge <= 55) return 'E'
  return 'L'
}

function classifyRisk(input: WizardInput): RiskLetter {
  return input.riskBand === 'growth' ? 'V' : 'S'
}

function classifyLifestyle(input: WizardInput): LifestyleLetter {
  return input.lifestyleGoal === 'upgrade' ? 'A' : 'M'
}

function classifyStyle(input: WizardInput, projection: ProjectionResult): StyleLetter {
  const detailed =
    input.statutoryBalance > 0
    || input.oneOffGoals > 0
    || input.monthlySavings > 0
  const highSave = projection.impliedSavingsRate >= 0.2
  const midSave = projection.impliedSavingsRate >= 0.12
  if ((detailed && midSave) || highSave) return 'P'
  if (input.lifeStage === 'near_retiree' && detailed) return 'P'
  return 'F'
}

export function readinessLabel(readiness: ProjectionResult['readiness']): string {
  switch (readiness) {
    case 'ahead':
      return 'Ahead of pace'
    case 'on_track':
      return 'On track'
    default:
      return 'Gap to close'
  }
}

export function classifyPersonality(
  input: WizardInput,
  market: MarketPack,
  projection: ProjectionResult,
  lang: Lang = 'en',
): PersonalityResult {
  const horizon = classifyHorizon(input, market)
  const risk = classifyRisk(input)
  const lifestyle = classifyLifestyle(input)
  const style = classifyStyle(input, projection)
  const code = `${horizon}${risk}${lifestyle}${style}` as TypeCode
  const archetype = localizeArchetype(code, lang)

  return {
    code,
    archetype,
    letters: { horizon, risk, lifestyle, style },
    readinessLabel: localizeReadiness(projection.readiness, lang),
  }
}
