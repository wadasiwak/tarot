// 自由抽牌：crypto 真隨機洗全副 78 張（Fisher–Yates），結構上保證同次不重複。
import { CARD_COUNT } from '../content/registry'

// 逆位機率（1/3 貼近實體洗牌手感；50% 體驗偏凶）
export const REVERSED_P = 1 / 3

export interface DrawnCard {
  index: number // 0–77，registry 順序
  reversed: boolean
}

function cryptoFloat(): number {
  const buf = new Uint32Array(1)
  crypto.getRandomValues(buf)
  return buf[0] / 4294967296
}

// Fisher–Yates（crypto 亂數）；抽牌與測驗選項共用同一份
export function shuffle<T>(list: T[]): T[] {
  const a = [...list]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(cryptoFloat() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function shuffledDeck(): number[] {
  return shuffle(Array.from({ length: CARD_COUNT }, (_, i) => i))
}

export function drawFromDeck(deck: number[], count: number): DrawnCard[] {
  return deck.slice(0, count).map((index) => ({ index, reversed: cryptoFloat() < REVERSED_P }))
}
