import { t, type Lang } from './messages'

/** Localized country / market display name. */
export function marketLabel(lang: Lang, marketId: string, fallback: string): string {
  const key = `market.name.${marketId}`
  const translated = t(lang, key)
  return translated === key ? fallback : translated
}

/** Localized city display name. */
export function cityLabel(lang: Lang, cityId: string, fallback: string): string {
  if (cityId === 'other-cities' || cityId === 'other') return t(lang, 'locale.city.other')
  const key = `city.name.${cityId}`
  const translated = t(lang, key)
  return translated === key ? fallback : translated
}

/** Localized statutory / pension account label for the money step. */
export function statutoryLabel(lang: Lang, marketId: string, fallback?: string): string {
  const key = `statutory.label.${marketId}`
  const translated = t(lang, key)
  if (translated !== key) return translated
  return fallback ?? t(lang, 'money.retirementAccount')
}

/** Localized hint for the statutory balance field (per market, with generic fallback). */
export function statutoryHint(lang: Lang, marketId: string): string {
  const key = `statutory.hint.${marketId}`
  const translated = t(lang, key)
  if (translated !== key) return translated
  return t(lang, 'money.statutory.hint')
}
