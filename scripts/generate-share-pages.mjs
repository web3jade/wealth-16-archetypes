/**
 * Emits:
 * 1) static /t/{CODE}/index.html with Open Graph + Twitter Card meta
 * 2) /og/{CODE}.png text result cards (the SocialCard copy block) for X previews
 *
 * Crawlers do not run the SPA — pages + images must be real files on disk.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Resvg } from '@resvg/resvg-js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const SITE_ORIGIN = (process.env.VITE_SITE_ORIGIN || 'https://web3jade.github.io').replace(/\/$/, '')
const BASE_PATH = (process.env.VITE_BASE_PATH || '/wealth-16-archetypes/').replace(/\/?$/, '/')

/** Chinese card copy — matches in-app SocialCard / archetypes.zh */
const TYPES = [
  {
    code: 'ESMP',
    en: 'The Fortress',
    title: '堡垒架构师',
    tagline: '提前自由 · 稳健 · 简约 · 有计划',
    blurb: '极简生活 + 清晰规划作护城河，早日自由、不折腾。',
    strength: '压力下的自律与结构感',
    blindSpot: '可能低估成长与生活乐趣',
  },
  {
    code: 'ESMF',
    en: 'The Escape Hatch',
    title: '逃生舱领航员',
    tagline: '提前自由 · 稳健 · 简约 · 随性',
    blurb: '备好安全垫与简单生活，时机一到就能优雅离场。',
    strength: '有下行保护的选择权',
    blindSpot: '时间线太模糊会拖延真正退出',
  },
  {
    code: 'ESAP',
    en: 'The Soft Launch',
    title: '软着陆生活家',
    tagline: '提前自由 · 稳健 · 丰盛 · 有计划',
    blurb: '提前结束主线、生活品质升级，走稳健轨道而非赌博。',
    strength: '有计划的平衡野心',
    blindSpot: '舒适目标可能拉长资金压力',
  },
  {
    code: 'ESAF',
    en: 'The Lucky Exit',
    title: '顺风退场者',
    tagline: '提前自由 · 稳健 · 丰盛 · 随性',
    blurb: '低风险、宽松计划，早早迈向更丰盈的生活。',
    strength: '乐观且有韧性',
    blindSpot: '运气终究不能代替策略',
  },
  {
    code: 'EVMP',
    en: 'The Compounder',
    title: '复利极客',
    tagline: '提前自由 · 进取 · 简约 · 有计划',
    blurb: '死磕复利、保持轻资产生活，紧盯每一年提前的退休时间。',
    strength: '聚焦的强储蓄与复利意识',
    blindSpot: '波动可能冲击紧张的时间表',
  },
  {
    code: 'EVMF',
    en: 'The Opportunist',
    title: '风口捕手',
    tagline: '提前自由 · 进取 · 简约 · 随性',
    blurb: '狩猎高弹性机会、压低日常成本，市场开窗就果断切换。',
    strength: '速度与适应力',
    blindSpot: '没有轨道的机会主义容易漂移',
  },
  {
    code: 'EVAP',
    en: 'The Rocket',
    title: '火箭推进器',
    tagline: '提前自由 · 进取 · 丰盛 · 有计划',
    blurb: '大目标、早退场、重增长资产，再配上一份严密执行清单。',
    strength: '高能动性的愿景与执行欲',
    blindSpot: '短周期上叠加太多风险',
  },
  {
    code: 'EVAF',
    en: 'The Free Agent',
    title: '自由代理人',
    tagline: '提前自由 · 进取 · 丰盛 · 随性',
    blurb: '追求自由、高上限与富足生活，相信自己随时能搞定一切。',
    strength: '大胆的能量与自信',
    blindSpot: '没有地图的大胆会烧掉跑道',
  },
  {
    code: 'LSMP',
    en: 'The Steward',
    title: '稳健大管家',
    tagline: '长跑道 · 稳健 · 简约 · 有计划',
    blurb: '稳扎稳打打长局，持续投入、克制需求、账目清晰。',
    strength: '可靠与耐心',
    blindSpot: '可能错过可观的成长机会',
  },
  {
    code: 'LSMF',
    en: 'The Coast Guard',
    title: '海岸巡航者',
    tagline: '长跑道 · 稳健 · 简约 · 随性',
    blurb: '简单安全，靠惯性与时间向后半程滑行，不过度内耗。',
    strength: '低压力的一致性',
    blindSpot: '巡航模式可能掩盖安静的缺口',
  },
  {
    code: 'LSAP',
    en: 'The Legacy Builder',
    title: '传承园丁',
    tagline: '长跑道 · 稳健 · 丰盛 · 有计划',
    blurb: '用耐心、结构和持久力，打理出从容体面的后半生。',
    strength: '长周期的托管与照料力',
    blindSpot: '过度保守可能拖慢传承目标',
  },
  {
    code: 'LSAF',
    en: 'The Soft Landing',
    title: '云端漫步者',
    tagline: '长跑道 · 稳健 · 丰盛 · 随性',
    blurb: '不冲刺、不慌乱，以温柔舒适的节奏平稳着陆。',
    strength: '平静的生活愿景',
    blindSpot: '柔软的计划也需要硬数字',
  },
  {
    code: 'LVMP',
    en: 'The Patient Hunter',
    title: '时间猎手',
    tagline: '长跑道 · 进取 · 简约 · 有计划',
    blurb: '时间就是最大优势，保持精简开支，让复利跨十年发酵。',
    strength: '跨十年的复利耐心',
    blindSpot: '可能把享受推迟太久',
  },
  {
    code: 'LVMF',
    en: 'The Wave Rider',
    title: '周期冲浪手',
    tagline: '长跑道 · 进取 · 简约 · 随性',
    blurb: '在漫长职业周期中顺势起伏，同时把生活成本控制在低位。',
    strength: '适应市场周期的性情',
    blindSpot: '有浪没航线仍会漂',
  },
  {
    code: 'LVAP',
    en: 'The Dynasty Architect',
    title: '家族蓝图师',
    tagline: '长跑道 · 进取 · 丰盛 · 有计划',
    blurb: '依托增长引擎与完整蓝图，构建长周期、高丰度的资产结构。',
    strength: '战略性的丰盛与结构感',
    blindSpot: '复杂度可能跑赢执行力',
  },
  {
    code: 'LVAF',
    en: 'The Wild Card',
    title: '破局狂想家',
    tagline: '长跑道 · 进取 · 丰盛 · 随性',
    blurb: '大格局、偏重增长、跑道够长，中途随时重写游戏规则。',
    strength: '开阔的可能性与改写力',
    blindSpot: '王牌也需要检查点',
  },
]

function esc(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

/** Word-ish wrap for Chinese / mixed strings into tspans. */
function wrapLines(text, maxChars) {
  const chars = [...text]
  if (chars.length <= maxChars) return [text]
  const lines = []
  let buf = ''
  for (const ch of chars) {
    buf += ch
    if (buf.length >= maxChars) {
      lines.push(buf)
      buf = ''
    }
  }
  if (buf) lines.push(buf)
  return lines
}

function textLines(lines, startY, fontSize, fill, lineGap) {
  const font = 'PingFang SC, Hiragino Sans GB, Noto Sans CJK SC, sans-serif'
  return lines
    .map(
      (line, i) =>
        `<text x="600" y="${startY + i * lineGap}" text-anchor="middle" fill="${fill}" font-size="${fontSize}" font-weight="500" font-family="${font}">${esc(line)}</text>`,
    )
    .join('\n  ')
}

function cardSvg(t) {
  // 1200×630 matches X/Twitter summary_large_image — avoids top/bottom crop of tall cards.
  const W = 1200
  const H = 630
  const blurbLines = wrapLines(t.blurb, 28)
  const strengthLines = wrapLines(`优势  ${t.strength}`, 36)
  const blindLines = wrapLines(`盲点  ${t.blindSpot}`, 36)

  const blurbY = 392
  const metaY = blurbY + blurbLines.length * 34 + 24

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="55%" stop-color="#f3f7ff"/>
      <stop offset="100%" stop-color="#e8f0ff"/>
    </linearGradient>
    <linearGradient id="code" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#1a2b55"/>
      <stop offset="55%" stop-color="#3b7cff"/>
      <stop offset="100%" stop-color="#35c4e8"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <circle cx="600" cy="340" r="270" fill="#3b7cff" fill-opacity="0.06"/>

  <text x="600" y="108" text-anchor="middle" fill="#4f7fe0" font-size="26" font-weight="600"
    font-family="PingFang SC, Hiragino Sans GB, Noto Sans CJK SC, sans-serif">财富16型</text>

  <text x="600" y="198" text-anchor="middle" fill="url(#code)" font-size="78" font-weight="800"
    font-family="Avenir Next, Helvetica Neue, sans-serif" letter-spacing="4">${esc(t.code)}</text>

  <text x="600" y="262" text-anchor="middle" fill="#121826" font-size="42" font-weight="700"
    font-family="PingFang SC, Hiragino Sans GB, Noto Sans CJK SC, sans-serif">${esc(t.title)}</text>

  <text x="600" y="314" text-anchor="middle" fill="#5c6b86" font-size="24" font-weight="500"
    font-family="PingFang SC, Hiragino Sans GB, Noto Sans CJK SC, sans-serif">${esc(t.tagline)}</text>

  ${textLines(blurbLines, blurbY, 26, '#3a4a66', 34)}
  ${textLines(strengthLines, metaY, 22, '#5c6b86', 30)}
  ${textLines(blindLines, metaY + strengthLines.length * 30 + 6, 22, '#5c6b86', 30)}

  <text x="600" y="592" text-anchor="middle" fill="#9aa8c0" font-size="17"
    font-family="PingFang SC, Hiragino Sans GB, Noto Sans CJK SC, sans-serif">16 Wealth Archetypes · 仅供教育娱乐</text>
</svg>`
}

function pageHtml(t) {
  const pageUrl = `${SITE_ORIGIN}${BASE_PATH}t/${t.code}/`
  const imageUrl = `${SITE_ORIGIN}${BASE_PATH}og/${t.code}.png`
  const appUrl = `${BASE_PATH}?fresh=1`
  const title = `${t.code} — ${t.title} · ${t.en}`
  const description = `${t.blurb} ｜ 财富16型 · 16 Wealth Archetypes`
  const titleEsc = esc(title)
  const descEsc = esc(description)

  return `<!doctype html>
<html lang="zh-Hans">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${titleEsc} ｜ 财富16型</title>
    <meta name="description" content="${descEsc}" />
    <link rel="canonical" href="${esc(pageUrl)}" />

    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="财富16型" />
    <meta property="og:title" content="${titleEsc}" />
    <meta property="og:description" content="${descEsc}" />
    <meta property="og:url" content="${esc(pageUrl)}" />
    <meta property="og:image" content="${esc(imageUrl)}" />
    <meta property="og:image:alt" content="${esc(`${t.code} ${t.title}`)}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:locale" content="zh_CN" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${titleEsc}" />
    <meta name="twitter:description" content="${descEsc}" />
    <meta name="twitter:image" content="${esc(imageUrl)}" />
    <meta name="twitter:image:alt" content="${esc(`${t.code} ${t.title}`)}" />

    <meta http-equiv="refresh" content="0;url=${esc(appUrl)}" />
    <script>
      (function () {
        var lang = 'zh';
        try {
          var q = new URLSearchParams(location.search);
          var raw = q.get('lang');
          if (raw && ['en', 'zh', 'ja', 'ko'].indexOf(raw) !== -1) lang = raw;
        } catch (e) {}
        location.replace(${JSON.stringify(BASE_PATH)} + '?fresh=1&lang=' + encodeURIComponent(lang));
      })();
    </script>
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        font-family: system-ui, sans-serif;
        background: linear-gradient(180deg, #f8faff, #e8f0ff);
        color: #1a2b55;
      }
      a { color: #3b7cff; font-weight: 600; }
      img { width: min(320px, 70vw); height: auto; border-radius: 16px; box-shadow: 0 12px 40px rgba(40,70,140,.12); }
    </style>
  </head>
  <body>
    <main style="text-align:center;padding:2rem">
      <img src="${esc(`${BASE_PATH}og/${t.code}.png`)}" alt="${esc(t.code)}" />
      <h1 style="font-size:1.25rem;margin:1rem 0 0.35rem">${titleEsc}</h1>
      <p style="color:#5c6b86;max-width:28rem;margin:0 auto 1.25rem">${descEsc}</p>
      <p><a href="${esc(appUrl)}">测出你的财富16型 →</a></p>
    </main>
  </body>
</html>
`
}

const ogDir = join(root, 'public', 'og')
mkdirSync(ogDir, { recursive: true })

let count = 0
for (const t of TYPES) {
  const dir = join(root, 'public', 't', t.code)
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'index.html'), pageHtml(t), 'utf8')

  const svg = cardSvg(t)
  writeFileSync(join(ogDir, `${t.code}.svg`), svg, 'utf8')
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: 1200 },
    font: { loadSystemFonts: true },
  })
  const png = resvg.render().asPng()
  writeFileSync(join(ogDir, `${t.code}.png`), png)
  count += 1
}

console.log(
  `Generated ${count} share pages + OG cards → public/t/{CODE}/ + public/og/{CODE}.png (origin=${SITE_ORIGIN}${BASE_PATH})`,
)
