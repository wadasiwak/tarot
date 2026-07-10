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

// 每日一牌歷史（月曆回顧＋連續打卡用；key 為暱稱，'' 代表未填名字）
export interface DailyRecord {
  index: number
  reversed: boolean
}

const DAILY_KEY = 'tarot.daily.v1'

type DailyHistory = Record<string, Record<string, DailyRecord>> // name → date → record

export function loadDailyHistory(): DailyHistory {
  try {
    const raw = localStorage.getItem(DAILY_KEY)
    const obj = raw ? JSON.parse(raw) : {}
    return obj && typeof obj === 'object' ? obj : {}
  } catch {
    return {}
  }
}

export function recordDaily(name: string, date: string, rec: DailyRecord): void {
  try {
    const all = loadDailyHistory()
    const who = name.trim()
    all[who] = { ...all[who], [date]: rec }
    localStorage.setItem(DAILY_KEY, JSON.stringify(all))
  } catch {
    // ignore
  }
}

// 連續打卡天數：從 date 往回數連續有紀錄的天數
export function streakOf(name: string, date: string): number {
  const days = loadDailyHistory()[name.trim()] ?? {}
  let n = 0
  const d = new Date(`${date}T00:00:00`)
  while (!Number.isNaN(d.getTime())) {
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    if (!days[key]) break
    n++
    d.setDate(d.getDate() - 1)
  }
  return n
}

// 用過的名字清單（Daily 快切 chips 用）
const NAMES_KEY = 'tarot.names.v1'

export function loadNames(): string[] {
  try {
    const raw = localStorage.getItem(NAMES_KEY)
    const list = raw ? JSON.parse(raw) : []
    return Array.isArray(list) ? list.filter((s) => typeof s === 'string') : []
  } catch {
    return []
  }
}

export function rememberName(name: string): string[] {
  const who = name.trim()
  if (!who) return loadNames()
  const list = [who, ...loadNames().filter((n) => n !== who)].slice(0, 8)
  try {
    localStorage.setItem(NAMES_KEY, JSON.stringify(list))
  } catch {
    // ignore
  }
  return list
}

// 每日一牌的暱稱（只存本機，絕不進 URL）
const NAME_KEY = 'tarot.name.v1'

export function loadName(): string {
  try {
    return localStorage.getItem(NAME_KEY) ?? ''
  } catch {
    return ''
  }
}

export function saveName(name: string): void {
  try {
    if (name.trim()) localStorage.setItem(NAME_KEY, name.trim())
    else localStorage.removeItem(NAME_KEY)
  } catch {
    // ignore
  }
}

export function clearRecent(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // ignore
  }
}
