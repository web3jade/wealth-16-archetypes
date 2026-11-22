/** Minimum legal working age used for current-age validation. */
export const MIN_WORKING_AGE = 16

/** Maximum allowed target retirement age. */
export const MAX_RETIRE_AGE = 80

export type AgeErrorKey =
  | 'life.error.currentLow'
  | 'life.error.currentHigh'
  | 'life.error.retireHigh'
  | 'life.error.retireLow'
  | 'life.error.retireOrder'

export function validateAges(
  currentAge: number,
  retireAge: number,
): AgeErrorKey[] {
  const errors: AgeErrorKey[] = []
  const current = Number(currentAge)
  const retire = Number(retireAge)

  if (!Number.isFinite(current) || current < MIN_WORKING_AGE) {
    errors.push('life.error.currentLow')
  } else if (current > MAX_RETIRE_AGE - 1) {
    errors.push('life.error.currentHigh')
  }

  if (!Number.isFinite(retire) || retire > MAX_RETIRE_AGE) {
    errors.push('life.error.retireHigh')
  } else if (retire < MIN_WORKING_AGE + 1) {
    errors.push('life.error.retireLow')
  }

  if (
    Number.isFinite(current)
    && Number.isFinite(retire)
    && current >= MIN_WORKING_AGE
    && retire <= MAX_RETIRE_AGE
    && retire <= current
  ) {
    errors.push('life.error.retireOrder')
  }

  return errors
}

export function agesAreValid(currentAge: number, retireAge: number): boolean {
  return validateAges(currentAge, retireAge).length === 0
}
