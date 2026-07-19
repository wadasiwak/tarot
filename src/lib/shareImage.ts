// 分享圖卡：把抽牌結果畫成一張 900×1200 的圖（canvas），
// 手機優先走系統分享面板（navigator.share，可直傳 LINE/IG），否則下載 PNG。
import { REGISTRY } from '../content/registry'
import { getCard } from '../content'
import type { DrawnCard } from './draw'
import { STRINGS, type Lang } from './i18n'

interface ShareImageOpts {
  title: string // 牌陣名或「OO 的今日一牌」
  subtitle: string // 日期或位置摘要
  cards: DrawnCard[] // 1–3 張並排；4 張以上（凱爾特十字 10 張）改 5 欄網格
  positionTitles?: string[] // 各張的位置名（多張時標示）
  lang?: Lang
}

const W = 900
const H = 1200

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

export async function makeShareImage(opts: ShareImageOpts): Promise<Blob> {
  const lang: Lang = opts.lang ?? 'zh'
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!

  // 背景
  ctx.fillStyle = '#131022'
  ctx.fillRect(0, 0, W, H)
  const g1 = ctx.createRadialGradient(W * 0.85, -50, 0, W * 0.85, -50, 700)
  g1.addColorStop(0, 'rgba(143,123,216,0.20)')
  g1.addColorStop(1, 'rgba(143,123,216,0)')
  ctx.fillStyle = g1
  ctx.fillRect(0, 0, W, H)
  const g2 = ctx.createRadialGradient(0, H, 0, 0, H, 700)
  g2.addColorStop(0, 'rgba(201,168,76,0.14)')
  g2.addColorStop(1, 'rgba(201,168,76,0)')
  ctx.fillStyle = g2
  ctx.fillRect(0, 0, W, H)

  const font = "'PingFang TC','Noto Sans TC',sans-serif"

  // 標題
  ctx.textAlign = 'center'
  ctx.fillStyle = '#e8c96a'
  ctx.font = `600 44px ${font}`
  ctx.fillText(`✦ ${opts.title}`, W / 2, 96)
  ctx.fillStyle = '#a396c4'
  ctx.font = `26px ${font}`
  ctx.fillText(opts.subtitle, W / 2, 146)

  // 文字過長時縮字級塞進欄寬（網格模式的英文牌名用）
  const fitFont = (text: string, maxW: number, base: number, weight = '600') => {
    let size = base
    ctx.font = `${weight} ${size}px ${font}`
    while (size > 13 && ctx.measureText(text).width > maxW) {
      size -= 1
      ctx.font = `${weight} ${size}px ${font}`
    }
  }

  // 牌面（1 張置中大圖；2–3 張並排；4 張以上改 5 欄網格）
  const n = opts.cards.length
  const grid = n > 3
  const cols = grid ? 5 : n
  const cardW = n === 1 ? 340 : grid ? 148 : 240
  const cardH = cardW * (830 / 480)
  const marginX = grid ? 30 : 40
  const gap = cols === 1 ? 0 : (W - marginX * 2 - cols * cardW) / (cols - 1)
  const rowH = cardH + (grid ? 92 : 0)
  const y0 = 200
  for (let i = 0; i < n; i++) {
    const c = opts.cards[i]
    const entry = REGISTRY[c.index]
    const col = i % cols
    const x = n === 1 ? (W - cardW) / 2 : marginX + col * (cardW + gap)
    const yy = y0 + Math.floor(i / cols) * rowH
    const img = await loadImage(`${import.meta.env.BASE_URL}cards/${entry.id}.jpg`)

    ctx.save()
    ctx.shadowColor = 'rgba(0,0,0,0.6)'
    ctx.shadowBlur = 30
    ctx.shadowOffsetY = 12
    roundRect(ctx, x, yy, cardW, cardH, 14)
    ctx.clip()
    if (c.reversed) {
      ctx.translate(x + cardW / 2, yy + cardH / 2)
      ctx.rotate(Math.PI)
      ctx.drawImage(img, -cardW / 2, -cardH / 2, cardW, cardH)
    } else {
      ctx.drawImage(img, x, yy, cardW, cardH)
    }
    ctx.restore()

    const labelMaxW = grid ? cardW + gap - 8 : cardW + 60
    // 位置名（多張時）
    if (opts.positionTitles?.[i]) {
      ctx.fillStyle = '#e8c96a'
      if (grid) fitFont(opts.positionTitles[i], labelMaxW, 19)
      else ctx.font = `600 26px ${font}`
      ctx.fillText(opts.positionTitles[i], x + cardW / 2, yy + cardH + (grid ? 32 : 46))
    }
    // 牌名＋正逆位（網格模式縮字級、逆位用短標）
    ctx.fillStyle = '#e6ddf2'
    const cardName = lang === 'en' ? entry.nameEn : entry.name
    const ori = grid
      ? lang === 'en'
        ? c.reversed
          ? ' (rev)'
          : ''
        : c.reversed
          ? '（逆）'
          : ''
      : lang === 'en'
        ? c.reversed
          ? ' (Reversed)'
          : ' (Upright)'
        : c.reversed
          ? '（逆位）'
          : '（正位）'
    const nameLine = `${cardName}${ori}`
    if (grid) fitFont(nameLine, labelMaxW, 19)
    else ctx.font = `600 ${lang === 'en' ? 26 : 30}px ${font}`
    ctx.fillText(nameLine, x + cardW / 2, yy + cardH + (grid ? (opts.positionTitles?.[i] ? 58 : 32) : opts.positionTitles?.[i] ? 88 : 52))
  }

  // 關鍵字（單張時顯示）
  if (n === 1) {
    const c = opts.cards[0]
    const card = getCard(REGISTRY[c.index].id, lang)
    if (card) {
      const r = c.reversed ? card.reversed : card.upright
      ctx.fillStyle = '#8f7bd8'
      ctx.font = `28px ${font}`
      ctx.fillText(r.keywords.map((k) => `#${k}`).join('  '), W / 2, y0 + cardH + 120)
    }
  }

  // 底部站名
  ctx.fillStyle = '#a396c4'
  ctx.font = `24px ${font}`
  ctx.fillText(STRINGS[lang].shareImgSite, W / 2, H - 60)

  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png'),
  )
}

// 手機走系統分享面板，桌機直接下載
export async function shareOrDownload(blob: Blob, filename: string): Promise<void> {
  const file = new File([blob], filename, { type: 'image/png' })
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] })
      return
    } catch {
      // 用戶取消分享面板就退回下載
    }
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}
