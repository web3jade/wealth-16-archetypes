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
