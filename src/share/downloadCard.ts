import { t, type Lang } from '../i18n/messages'
import { loadPersonalityArt } from '../personality/art'
import type { PersonalityResult } from '../personality/classify'

export async function renderSocialCardBlob(
  personality: PersonalityResult,
  lang: Lang,
): Promise<Blob | null> {
  const width = 1080
  const height = 1350
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  const grad = ctx.createLinearGradient(0, 0, width, height)
  grad.addColorStop(0, '#ffffff')
  grad.addColorStop(0.55, '#f3f7ff')
  grad.addColorStop(1, '#e8f0ff')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, width, height)

  const wash = ctx.createRadialGradient(width / 2, 390, 20, width / 2, 390, 420)
  wash.addColorStop(0, 'rgba(53, 196, 232, 0.22)')
  wash.addColorStop(0.35, 'rgba(59, 124, 255, 0.12)')
  wash.addColorStop(1, 'rgba(59, 124, 255, 0)')
  ctx.fillStyle = wash
  ctx.fillRect(0, 60, width, 760)

  ctx.fillStyle = '#4f7fe0'
  ctx.font = '600 28px DM Sans, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(t(lang, 'brand.title'), width / 2, 78)

  try {
    const art = await loadPersonalityArt(personality.code)
    const artH = 720
    const artW = Math.round((art.width / art.height) * artH)
    const artX = (width - artW) / 2
    const artY = 110
    ctx.drawImage(art, artX, artY, artW, artH)

    const textY = artY + artH + 40
    const titleGrad = ctx.createLinearGradient(width * 0.2, 0, width * 0.8, 0)
    titleGrad.addColorStop(0, '#1a2b55')
    titleGrad.addColorStop(0.55, '#3b7cff')
    titleGrad.addColorStop(1, '#35c4e8')
    ctx.fillStyle = titleGrad
    ctx.font = '700 84px Outfit, DM Sans, sans-serif'
    ctx.fillText(personality.code, width / 2, textY)

    ctx.fillStyle = '#121826'
    ctx.font = '700 48px Outfit, DM Sans, sans-serif'
    ctx.fillText(personality.archetype.title, width / 2, textY + 64)

    ctx.fillStyle = '#5c6b86'
    ctx.font = '500 28px DM Sans, sans-serif'
    wrapTextCentered(ctx, personality.archetype.blurb, width / 2, textY + 120, 860, 40)
  } catch {
    ctx.fillStyle = '#121826'
    ctx.font = '700 96px Outfit, DM Sans, sans-serif'
    ctx.fillText(personality.code, width / 2, 520)
    ctx.font = '700 56px Outfit, DM Sans, sans-serif'
    ctx.fillText(personality.archetype.title, width / 2, 600)
  }

  ctx.fillStyle = '#7b8aa5'
  ctx.font = '500 22px DM Sans, sans-serif'
  ctx.fillText(t(lang, 'results.disclaimerExtra'), width / 2, height - 48)

  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
}

export function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export async function downloadSocialCardPng(
  personality: PersonalityResult,
  lang: Lang,
): Promise<void> {
  const blob = await renderSocialCardBlob(personality, lang)
  if (!blob) return
  triggerBlobDownload(blob, `wealth16-${personality.code}.png`)
}

function wrapTextCentered(
  ctx: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const words = text.split(' ')
  const tokens = words.length > 1 ? words : [...text]
  let line = ''
  let yy = y
  const joiner = words.length > 1 ? ' ' : ''
  for (const word of tokens) {
    const test = line ? `${line}${joiner}${word}` : word
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, centerX, yy)
      line = word
      yy += lineHeight
    } else {
      line = test
    }
  }
  if (line) ctx.fillText(line, centerX, yy)
}
