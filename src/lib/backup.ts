// 備份與還原：把 8 個 localStorage key 打包成一個 JSON 檔（下載到用戶自己手上），
// 換手機／瀏覽器清資料後可整包還原。全程本機，不經任何伺服器。
import { entryKey, isDrawnCard, loadDailyHistory, loadNames, loadRecent, loadSaved, loadStudy, STORAGE_KEYS, type RecentEntry, type SavedReading } from './storage'
import type { SrsEntry } from './srs'

const LANG_KEY = 'tarot.lang.v1'
export const BACKUP_VERSION = 1

interface Backup {
  app: 'tarot'
  version: number
  exportedAt: string
  data: Record<string, unknown>
}

const ALL_KEYS: string[] = [...Object.values(STORAGE_KEYS), LANG_KEY]

function readRaw(key: string): unknown {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return undefined
    // name / birthday / lang 是純字串，其餘是 JSON
    if (key === STORAGE_KEYS.name || key === STORAGE_KEYS.birthday || key === STORAGE_KEYS.count || key === LANG_KEY) return raw
    return JSON.parse(raw)
  } catch {
    return undefined
  }
}

export function exportBackup(today: string): string {
  const data: Record<string, unknown> = {}
  for (const k of ALL_KEYS) {
    const v = readRaw(k)
    if (v !== undefined) data[k] = v
  }
  const b: Backup = { app: 'tarot', version: BACKUP_VERSION, exportedAt: today, data }
  return JSON.stringify(b, null, 2)
}

export function backupFilename(today: string): string {
  return `tarot-backup-${today.replaceAll('-', '')}.json`
}

function write(key: string, value: unknown): void {
  const raw = typeof value === 'string' ? value : JSON.stringify(value)
  localStorage.setItem(key, raw)
}

// 合併規則：本機已有的優先，備份只補缺（每日史補沒翻過的日子、收藏補沒有的 id、
// SRS 補沒排程的卡、測驗統計相加、暱稱清單聯集、單值欄位本機為空才採用）。
function mergeInto(data: Record<string, unknown>): void {
  const K = STORAGE_KEYS
  if (Array.isArray(data[K.recent])) {
    const mine = loadRecent()
    const seen = new Set(mine.map(entryKey))
    const extra = (data[K.recent] as RecentEntry[]).filter((e) => !seen.has(entryKey(e)))
    // 新的在前：合併後依日期排序再截 12 筆，備份裡較新的不會先被砍掉
    write(K.recent, [...mine, ...extra].sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0)).slice(0, 12))
  }
  if (Array.isArray(data[K.saved])) {
    const mine = loadSaved()
    const ids = new Set(mine.map((e) => e.id))
    const keys = new Set(mine.map(entryKey))
    const extra = (data[K.saved] as SavedReading[]).filter((e) => !ids.has(e.id) && !keys.has(entryKey(e)))
    write(K.saved, [...mine, ...extra])
  }
  if (data[K.daily] && typeof data[K.daily] === 'object') {
    const mine = loadDailyHistory()
    for (const [name, days] of Object.entries(data[K.daily] as Record<string, Record<string, unknown>>)) {
      if (!days || typeof days !== 'object') continue
      mine[name] = { ...Object.fromEntries(Object.entries(days).filter(([, r]) => isDrawnCard(r))), ...mine[name] } as typeof mine[string]
    }
    write(K.daily, mine)
  }
  if (Array.isArray(data[K.names])) {
    const merged = [...new Set([...loadNames(), ...(data[K.names] as unknown[]).filter((n) => typeof n === 'string')])].slice(0, 8)
    write(K.names, merged)
  }
  if (data[K.study] && typeof data[K.study] === 'object') {
    const mine = loadStudy()
    const theirs = data[K.study] as { srs?: Record<string, SrsEntry>; quiz?: { answered?: number; correct?: number } }
    for (const [id, e] of Object.entries(theirs.srs ?? {})) if (!mine.srs[id]) mine.srs[id] = e
    mine.quiz.answered += theirs.quiz?.answered ?? 0
    mine.quiz.correct += theirs.quiz?.correct ?? 0
    write(K.study, mine)
  }
  if (typeof data[K.count] === 'string' || typeof data[K.count] === 'number') {
    const mine = Number(localStorage.getItem(K.count)) || 0
    write(K.count, String(Math.max(mine, Number(data[K.count]) || 0)))
  }
  for (const k of [K.name, K.birthday, LANG_KEY]) {
    if (typeof data[k] === 'string' && !localStorage.getItem(k)) write(k, data[k])
  }
}

// 'bad'＝不是本站備份；'writeFail'＝瀏覽拒絕寫入（覆蓋模式會把本機資料復原回去）；'ok'＝完成
export type ImportResult = 'ok' | 'bad' | 'writeFail'
export function importBackup(text: string, mode: 'merge' | 'replace'): ImportResult {
  let obj: unknown
  try {
    obj = JSON.parse(text)
  } catch {
    return 'bad'
  }
  if (!obj || typeof obj !== 'object') return 'bad'
  const b = obj as Partial<Backup>
  if (b.app !== 'tarot' || typeof b.version !== 'number' || !b.data || typeof b.data !== 'object') return 'bad'
  const data = Object.fromEntries(Object.entries(b.data).filter(([k]) => ALL_KEYS.includes(k)))
  // 先把本機現況留一份：寫入途中丟例外（空間不足／私密模式）就整包復原，不留半套
  const snapshot = new Map<string, string | null>(ALL_KEYS.map((k) => [k, localStorage.getItem(k)]))
  try {
    if (mode === 'replace') {
      for (const k of ALL_KEYS) localStorage.removeItem(k)
      for (const [k, v] of Object.entries(data)) write(k, v)
    } else {
      mergeInto(data)
    }
    return 'ok'
  } catch {
    for (const [k, v] of snapshot) {
      try {
        if (v === null) localStorage.removeItem(k)
        else localStorage.setItem(k, v)
      } catch {
        // 連復原都寫不進去，只能放棄
      }
    }
    return 'writeFail'
  }
}
