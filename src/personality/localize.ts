import type { Lang } from '../i18n/messages'
import { ARCHETYPES, type Archetype, type TypeCode } from './archetypes'
import { ARCHETYPES_JA } from './archetypes.ja'
import { ARCHETYPES_KO } from './archetypes.ko'
import { ARCHETYPES_ZH } from './archetypes.zh'

export function localizeArchetype(code: TypeCode, lang: Lang): Archetype {
  if (lang === 'zh') return ARCHETYPES_ZH[code]
  if (lang === 'ja') return ARCHETYPES_JA[code]
  if (lang === 'ko') return ARCHETYPES_KO[code]
  return ARCHETYPES[code]
}

export function localizeReadiness(readiness: 'ahead' | 'on_track' | 'gap', lang: Lang): string {
  const map: Record<Lang, Record<'ahead' | 'on_track' | 'gap', string>> = {
    en: { ahead: 'Ahead of pace', on_track: 'On track', gap: 'Gap to close' },
    zh: { ahead: '进度超前', on_track: '进度达标', gap: '尚有缺口' },
    ja: { ahead: 'ペース先行', on_track: '順調', gap: '不足あり' },
    ko: { ahead: '앞서 있음', on_track: '순조로움', gap: '부족함' },
  }
  return map[lang][readiness]
}
