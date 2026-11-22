import type { RiskBand, RiskReturnBand } from './types'

export const RISK_RETURN_BANDS: Record<RiskBand, RiskReturnBand> = {
  conservative: {
    band: 'conservative',
    expectedRealReturn: 0.02,
    volatilityLabel: 'Low',
  },
  balanced: {
    band: 'balanced',
    expectedRealReturn: 0.04,
    volatilityLabel: 'Medium',
  },
  growth: {
    band: 'growth',
    expectedRealReturn: 0.06,
    volatilityLabel: 'Higher',
  },
}

export function getRiskBand(band: RiskBand): RiskReturnBand {
  return RISK_RETURN_BANDS[band]
}
