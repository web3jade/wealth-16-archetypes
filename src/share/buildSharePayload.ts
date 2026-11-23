import type { Lang } from '../i18n/messages'
import { t } from '../i18n/messages'
import { ARCHETYPES } from '../personality/archetypes'
import type { PersonalityResult } from '../personality/classify'
import { renderSocialCardBlob, triggerBlobDownload } from './downloadCard'

export interface SharePayload {
  text: string
  url: string
  title: string
  xIntentUrl: string
}

export type ShareToXResult = 'shared_with_image' | 'intent_with_preview' | 'intent_with_download' | 'intent_only'

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

/** Static share page with OG/Twitter preview image (crawler-readable HTML). */
export function sharePageUrl(
  code: string,
  lang: Lang,
  origin = typeof window !== 'undefined' ? window.location.origin : '',
): string {
  const base = `${origin}${import.meta.env.BASE_URL}`.replace(/([^:]\/)\/+/g, '$1')
  const root = base.endsWith('/') ? base : `${base}/`
  return `${root}t/${code}/?lang=${lang}`
}

export function buildSharePayload(
  personality: PersonalityResult,
  lang: Lang,
  origin = typeof window !== 'undefined' ? window.location.origin : '',
): SharePayload {
  const url = sharePageUrl(personality.code, lang, origin)
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
  // Keep this synchronous and inside the click gesture so popup blockers allow it.
  const win = window.open(payload.xIntentUrl, '_blank')
  if (win) {
    try {
      win.opener = null
    } catch {
      // ignore
    }
    return
  }
  // Popup blocked (or in-app browser): fall back to same-tab jump.
  window.location.assign(payload.xIntentUrl)
}

/**
 * Share to X. Opens the composer immediately (sync) so browsers don't block it.
 * Link preview on the share URL carries the personality art.
 */
export function shareToXWithCard(
  personality: PersonalityResult,
  lang: Lang,
): ShareToXResult {
  const payload = buildSharePayload(personality, lang)
  openShareToX(payload)
  return 'intent_with_preview'
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

/** Optional helper if a caller still wants the PNG downloaded. */
export async function downloadShareCard(
  personality: PersonalityResult,
  lang: Lang,
): Promise<void> {
  const blob = await renderSocialCardBlob(personality, lang)
  if (!blob) return
  triggerBlobDownload(blob, `wealth16-${personality.code}.png`)
}
