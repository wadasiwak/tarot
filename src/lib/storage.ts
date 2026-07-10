// 最近的抽牌紀錄（localStorage，最多 12 筆，新的在前）
import type { DrawnCard } from './draw'
import type { DrawableSpread } from './share'

export interface RecentEntry {
  spread: DrawableSpread | 'daily'
  cards: DrawnCard[]
  at: string // ISO 日期
  question?: string
}

const KEY = 'tarot.recent.v1'
const MAX = 12

export function loadRecent(): RecentEntry[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const list = JSON.parse(raw)
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

export function addRecent(entry: RecentEntry): RecentEntry[] {
  const key = (e: RecentEntry) => `${e.spread}:${e.cards.map((c) => `${c.index}${c.reversed ? 'r' : ''}`).join('-')}`
  const list = loadRecent().filter((e) => key(e) !== key(entry))
  list.unshift(entry)
  const trimmed = list.slice(0, MAX)
  try {
    localStorage.setItem(KEY, JSON.stringify(trimmed))
  } catch {
    // 隱私模式等寫入失敗就算了
  }
  return trimmed
}

export function clearRecent(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // ignore
  }
}
