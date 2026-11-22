import type { TypeCode } from './archetypes'

/**
 * Character art pairing (filename code → persona).
 * Validated against prop symbolism, not only filename casing.
 *
 * ESMP 堡垒架构师 — fortress platter + key
 * ESMF 逃生舱领航员 — EXIT suitcase + lever
 * ESAP 软着陆生活家 — coffee + ticket / crosswalk
 * ESAF 顺风退场者 — passport + clovers
 * EVMP 复利极客 — coin hourglass + stopwatch
 * EVMF 风口捕手 — compass + crystal portal
 * EVAP 火箭推进器 — rocket + checklist
 * EVAF 自由代理人 — keys + flipping coin
 * LSMP 稳健大管家 — ledger/book + blueprints
 * LSMF 海岸巡航者 — sailor + lifebuoy
 * LSAP 传承园丁 — bonsai + shears
 * LSAF 云端漫步者 — tea on cloud seat
 * LVMP 时间猎手 — telescope + sapling
 * LVMF 周期冲浪手 — surf wave + candlesticks
 * LVAP 家族蓝图师 — building blueprint
 * LVAF 破局狂想家 — joker cards + paint
 */
export function personalityArtUrl(code: TypeCode): string {
  return `/personalities/${code}.png`
}

export function loadPersonalityArt(code: TypeCode): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Failed to load art for ${code}`))
    img.src = personalityArtUrl(code)
  })
}
