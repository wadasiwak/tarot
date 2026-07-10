// 抽牌結果 ↔ hash 編解碼，與「複製給 AI 深度解讀」的 prompt 組裝。
// token = 十進位 registry index + 可選 'r' 後綴（逆位），如 #r/three/34r-7-61。
// ⚠️ 問題文字絕不進 URL（可能含個資），只進剪貼簿的 AI prompt。
import { CARD_COUNT, REGISTRY } from '../content/registry'
import { getCard } from '../content'
import { SPREADS, SPREAD_SIZE, type SpreadId } from '../content/positions'
import { VERDICT_LABELS } from '../content/types'
import type { DrawnCard } from './draw'

export type DrawableSpread = Exclude<SpreadId, 'daily'>

export function isDrawableSpread(s: string): s is DrawableSpread {
  return s === 'three' || s === 'yesno' || s === 'choice' || s === 'relation'
}

export function encodeCards(cards: DrawnCard[]): string {
  return cards.map((c) => `${c.index}${c.reversed ? 'r' : ''}`).join('-')
}

// 嚴格驗證：格式、界線、張數、不重複；不合法回 null
export function decodeCards(spread: DrawableSpread, tokenStr: string): DrawnCard[] | null {
  const tokens = tokenStr.split('-')
  if (tokens.length !== SPREAD_SIZE[spread]) return null
  const cards: DrawnCard[] = []
  const seen = new Set<number>()
  for (const t of tokens) {
    const m = /^(\d{1,2})(r?)$/.exec(t)
    if (!m) return null
    const index = Number(m[1])
    if (index >= CARD_COUNT || seen.has(index)) return null
    seen.add(index)
    cards.push({ index, reversed: m[2] === 'r' })
  }
  return cards
}

export function readingHash(spread: DrawableSpread, cards: DrawnCard[]): string {
  return `#r/${spread}/${encodeCards(cards)}`
}

export function shareUrl(spread: DrawableSpread, cards: DrawnCard[]): string {
  return `${location.origin}${location.pathname}${readingHash(spread, cards)}`
}

function cardLine(c: DrawnCard, label: string): string {
  const card = getCard(REGISTRY[c.index].id)
  const ori = c.reversed ? '逆位' : '正位'
  const kw = card ? (c.reversed ? card.reversed : card.upright).keywords.join('、') : ''
  return `${label}：${REGISTRY[c.index].name}（${ori}）— 關鍵字：${kw}`
}

// 一鍵複製給任意 LLM 的深度解讀 prompt（零 API 成本的 AI 外包）
export function buildAIPrompt(spread: SpreadId, cards: DrawnCard[], question?: string): string {
  const def = SPREADS[spread]
  const lines = cards.map((c, i) => cardLine(c, def.positions[i]?.title ?? `第 ${i + 1} 張`))
  const verdictNote =
    spread === 'yesno' || spread === 'choice'
      ? cards
          .map((c, i) => {
            const card = getCard(REGISTRY[c.index].id)
            if (!card) return ''
            const r = c.reversed ? card.reversed : card.upright
            return `${def.positions[i]?.title ?? ''}牌面傾向：${VERDICT_LABELS[r.verdict]}（${r.verdictReason}）`
          })
          .filter(Boolean)
          .join('\n') + '\n'
      : ''
  return [
    '請扮演一位溫暖而誠實的塔羅牌解讀者，用繁體中文（台灣用語）為我深入解讀這次抽牌。',
    question ? `我的問題：${question}` : '（我沒有輸入具體問題，請做整體指引解讀。）',
    `牌陣：${def.name}（${def.intro}）`,
    ...lines,
    verdictNote,
    '請整合所有牌面，給我一段完整的解讀，最後收在具體可行的建議。若有挑戰請誠實指出，但也給我面對的方法。',
  ]
    .filter(Boolean)
    .join('\n')
}
