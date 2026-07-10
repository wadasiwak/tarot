// 決定性亂數：每日一牌用日期字串當 seed，同一天全球同結果。
import { CARD_COUNT } from '../content/registry'
import { REVERSED_P, type DrawnCard } from './draw'

export function hashStr(s: string): number {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0
  return h
}

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function todayStr(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// 每日一牌：date 格式 YYYY-MM-DD；同名字＋同日期永遠回同一張（含正逆位）。
// 不填名字＝全站共用的當日牌；填了名字就是專屬於這個人的今日運勢。
export function dailyDraw(date: string, name = ''): DrawnCard {
  const who = name.trim()
  const rng = mulberry32(hashStr(who ? `tarot:${who}:${date}` : `tarot:${date}`))
  const index = Math.floor(rng() * CARD_COUNT)
  const reversed = rng() < REVERSED_P
  return { index, reversed }
}
