// 最近的抽牌紀錄（localStorage，最多 12 筆，新的在前）
import type { DrawnCard } from './draw'
import type { DrawableSpread } from './share'
import { newEntry, review, type Rating, type SrsEntry } from './srs'

export interface RecentEntry {
  spread: DrawableSpread | 'daily'
  cards: DrawnCard[]
  at: string // ISO 日期
  question?: string
}

const KEY = 'tarot.recent.v1'
const MAX = 12

// 同一次抽牌的識別鍵（最近紀錄去重、收藏比對共用）
export function entryKey(e: { spread: string; cards: DrawnCard[] }): string {
  return `${e.spread}:${e.cards.map((c) => `${c.index}${c.reversed ? 'r' : ''}`).join('-')}`
}

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
  const list = loadRecent().filter((e) => entryKey(e) !== entryKey(entry))
  list.unshift(entry)
  const trimmed = list.slice(0, MAX)
  try {
    localStorage.setItem(KEY, JSON.stringify(trimmed))
  } catch {
    // 隱私模式等寫入失敗就算了
  }
  return trimmed
}

export function removeRecentEntry(key: string): RecentEntry[] {
  const list = loadRecent().filter((e) => entryKey(e) !== key)
  try {
    localStorage.setItem(KEY, JSON.stringify(list))
  } catch {
    // ignore
  }
  return list
}

// 永久收藏的解讀（含個人筆記；只存本機，絕不進 URL / analytics）
export interface SavedReading {
  id: string
  spread: DrawableSpread | 'daily'
  cards: DrawnCard[]
  at: string // ISO 日期
  question?: string
  note?: string
}

const SAVED_KEY = 'tarot.saved.v1'

export function loadSaved(): SavedReading[] {
  try {
    const raw = localStorage.getItem(SAVED_KEY)
    if (!raw) return []
    const list = JSON.parse(raw)
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

function persistSaved(list: SavedReading[]): SavedReading[] {
  try {
    localStorage.setItem(SAVED_KEY, JSON.stringify(list))
  } catch {
    // ignore
  }
  return list
}

export function addSaved(entry: Omit<SavedReading, 'id'>): SavedReading[] {
  const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`
  return persistSaved([{ id, ...entry }, ...loadSaved()])
}

export function removeSaved(id: string): SavedReading[] {
  return persistSaved(loadSaved().filter((e) => e.id !== id))
}

export function updateSavedNote(id: string, note: string): SavedReading[] {
  return persistSaved(loadSaved().map((e) => (e.id === id ? { ...e, note } : e)))
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

// 暱稱改名：把舊名的每日史整包搬到新名（新名已存在則合併，衝突日以既有為準），
// names 清單與當前暱稱同步。streak 只看日期集合，搬家後不會斷。
export function renameDailyName(oldName: string, newName: string): void {
  const from = oldName.trim() // '' 代表未命名
  const to = newName.trim()
  if (!to || from === to) return
  try {
    const all = loadDailyHistory()
    const merged = { ...all[from], ...all[to] } // 後展開的既有紀錄優先
    delete all[from]
    if (Object.keys(merged).length > 0) all[to] = merged
    localStorage.setItem(DAILY_KEY, JSON.stringify(all))
  } catch {
    // ignore
  }
  try {
    const names = [to, ...loadNames().filter((n) => n !== from && n !== to)].slice(0, 8)
    localStorage.setItem(NAMES_KEY, JSON.stringify(names))
  } catch {
    // ignore
  }
  if (loadName() === from) saveName(to)
}

// 牌義學習進度（SRS 排程＋測驗統計；只存本機，絕不進 URL / analytics）
export interface StudyState {
  srs: Record<string, SrsEntry> // cardId → 排程
  quiz: { answered: number; correct: number }
}

const STUDY_KEY = 'tarot.study.v1'

export function loadStudy(): StudyState {
  const empty: StudyState = { srs: {}, quiz: { answered: 0, correct: 0 } }
  try {
    const raw = localStorage.getItem(STUDY_KEY)
    if (!raw) return empty
    const obj = JSON.parse(raw)
    if (!obj || typeof obj !== 'object') return empty
    return {
      srs: obj.srs && typeof obj.srs === 'object' ? obj.srs : {},
      quiz: {
        answered: typeof obj.quiz?.answered === 'number' ? obj.quiz.answered : 0,
        correct: typeof obj.quiz?.correct === 'number' ? obj.quiz.correct : 0,
      },
    }
  } catch {
    return empty
  }
}

function persistStudy(s: StudyState): StudyState {
  try {
    localStorage.setItem(STUDY_KEY, JSON.stringify(s))
  } catch {
    // 隱私模式等寫入失敗就算了
  }
  return s
}

// 記憶卡評分：沒排程的卡先建新卡再評
export function rateStudy(id: string, rating: Rating, today: string): StudyState {
  const s = loadStudy()
  s.srs[id] = review(s.srs[id] ?? newEntry(today), rating, today)
  return persistStudy(s)
}

// 單牌詳情「加入學習」：建一張今天到期的新卡（已在學習中則不動）
export function addToStudy(id: string, today: string): StudyState {
  const s = loadStudy()
  if (!s.srs[id]) {
    s.srs[id] = newEntry(today)
    return persistStudy(s)
  }
  return s
}

// 測驗答題：累計統計；答錯的牌以 again 加重 SRS 權重（沒排程的卡直接進今日佇列）
export function recordQuizAnswer(id: string, correct: boolean, today: string): StudyState {
  const s = loadStudy()
  s.quiz.answered += 1
  if (correct) s.quiz.correct += 1
  else s.srs[id] = review(s.srs[id] ?? newEntry(today), 'again', today)
  return persistStudy(s)
}

export function clearRecent(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // ignore
  }
}
