import type { Lang } from '../i18n/messages'
import { t } from '../i18n/messages'
import { ARCHETYPES } from '../personality/archetypes'
import type { PersonalityResult } from '../personality/classify'

export interface SharePayload {
  text: string
  url: string
  title: string
  xIntentUrl: string
}

function formatResultLabel(personality: PersonalityResult, lang: Lang): string {
  const enTitle = ARCHETYPES[personality.code].title
  const localTitle = personality.archetype.title
  const titleShown =
    lang === 'en' || localTitle === enTitle ? enTitle : `${enTitle} · ${localTitle}`

  if (lang === 'zh') return `我的结果是 ${personality.code}（${titleShown}）`
  if (lang === 'ja') return `私の結果は ${personality.code}（${titleShown}）`
  if (lang === 'ko') return `내 결과는 ${personality.code}（${titleShown}）`
  return `My result is ${personality.code} (${titleShown})`
}

export function buildSharePayload(
  personality: PersonalityResult,
  lang: Lang,
  origin = typeof window !== 'undefined' ? window.location.origin : '',
): SharePayload {
  const url = `${origin}/?type=${personality.code}&lang=${lang}`
  const text = [
    t(lang, 'share.x.headline'),
    '',
    formatResultLabel(personality, lang),
    personality.archetype.blurb,
    '',
    t(lang, 'share.x.cta'),
    '#16WealthArchetypes #财富16型',
    url,
  ].join('\n')

  const xIntentUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}`

  return {
    title: `${personality.code} — ${personality.archetype.title}`,
    text,
    url,
    xIntentUrl,
  }
}

export function openShareToX(payload: SharePayload): void {
  window.open(payload.xIntentUrl, '_blank', 'noopener,noreferrer')
}

export async function shareOrCopy(payload: SharePayload): Promise<'shared' | 'copied'> {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ title: payload.title, text: payload.text, url: payload.url })
      return 'shared'
    } catch {
      // fall through
    }
  }
  await navigator.clipboard.writeText(payload.text)
  return 'copied'
}
