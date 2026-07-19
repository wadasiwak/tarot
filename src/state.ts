import { create } from 'zustand'
import type { DrawnCard } from './lib/draw'
import { decodeCards, encodeCards, isDrawableSpread, type DrawableSpread } from './lib/share'
import { REGISTRY } from './content/registry'
import {
  loadRecent,
  addRecent,
  clearRecent,
  removeRecentEntry,
  entryKey,
  loadSaved,
  addSaved,
  removeSaved,
  updateSavedNote,
  type RecentEntry,
  type SavedReading,
} from './lib/storage'
import { loadLang, saveLang, type Lang } from './lib/i18n'

// 小學堂章節錨點（#learn/<section>；順序與 Learn.tsx 的 SECTIONS 對齊）
export const LEARN_SECTIONS = ['what', 'ask', 'suits', 'numbers', 'court', 'reversed', 'how'] as const
export type LearnSection = (typeof LEARN_SECTIONS)[number]
const isLearnSection = (s: string): s is LearnSection => (LEARN_SECTIONS as readonly string[]).includes(s)

export type View =
  | { name: 'home' }
  | { name: 'daily'; date?: string } // #daily 或 #daily/2026-07-10
  | { name: 'draw'; spread: DrawableSpread } // 洗牌抽牌流程
  | { name: 'manual'; spread: DrawableSpread } // 手動輸入實體抽到的牌
  | { name: 'reading'; spread: DrawableSpread; cards: DrawnCard[]; question?: string }
  | { name: 'browse' } // 78 張牌庫
  | { name: 'detail'; id: string; reversed: boolean }
  | { name: 'journal' } // 每日一牌月曆回顧＋連續打卡
  | { name: 'learn'; section?: LearnSection } // 塔羅小學堂（可帶章節錨點 #learn/reversed）
  | { name: 'study' } // 牌義學習（SRS 記憶卡＋測驗；進度只存本機，不進 URL）
  | { name: 'mycard' } // 生日牌／年度牌（生日只存本機，絕不進 URL / analytics）

// URL hash 同步。⚠️ question 絕不進 URL（個資）。
export function viewToHash(view: View): string {
  switch (view.name) {
    case 'home':
      return ''
    case 'daily':
      return view.date ? `#daily/${view.date}` : '#daily'
    case 'draw':
      return `#draw/${view.spread}`
    case 'manual':
      return `#manual/${view.spread}`
    case 'reading':
      return `#r/${view.spread}/${encodeCards(view.cards)}`
    case 'browse':
      return '#cards'
    case 'detail':
      return `#card/${view.id}${view.reversed ? '/r' : ''}`
    case 'journal':
      return '#journal'
    case 'learn':
      return view.section ? `#learn/${view.section}` : '#learn'
    case 'study':
      return '#study'
    case 'mycard':
      return '#mycard'
  }
}

const validId = (id: string) => REGISTRY.some((e) => e.id === id)

// 嚴格還原：任何不合法 hash 一律回 home
export function hashToView(hash: string): View {
  const parts = hash.replace(/^#/, '').split('/')
  const [head, a, b] = parts
  if (!head) return { name: 'home' }
  if (head === 'daily') {
    if (a === undefined) return { name: 'daily' }
    if (/^\d{4}-\d{2}-\d{2}$/.test(a) && !Number.isNaN(new Date(a).getTime())) return { name: 'daily', date: a }
    return { name: 'daily' } // 壞日期 fallback 今天
  }
  if (head === 'draw' && a && isDrawableSpread(a) && b === undefined) return { name: 'draw', spread: a }
  if (head === 'manual' && a && isDrawableSpread(a) && b === undefined) return { name: 'manual', spread: a }
  if (head === 'r' && a && isDrawableSpread(a) && b) {
    const cards = decodeCards(a, b)
    if (cards) return { name: 'reading', spread: a, cards }
    return { name: 'home' }
  }
  if (head === 'cards' && a === undefined) return { name: 'browse' }
  if (head === 'journal' && a === undefined) return { name: 'journal' }
  if (head === 'study' && a === undefined) return { name: 'study' }
  if (head === 'mycard' && a === undefined) return { name: 'mycard' }
  if (head === 'learn' && a === undefined) return { name: 'learn' }
  if (head === 'learn' && a && isLearnSection(a) && b === undefined) return { name: 'learn', section: a }
  if (head === 'card' && a && validId(a) && (b === undefined || b === 'r'))
    return { name: 'detail', id: a, reversed: b === 'r' }
  return { name: 'home' }
}

interface AppState {
  view: View
  recent: RecentEntry[]
  saved: SavedReading[]
  lang: Lang
  go: (view: View) => void
  openReading: (spread: DrawableSpread, cards: DrawnCard[], question?: string) => void
  clearHistory: () => void
  removeRecent: (key: string) => void
  toggleSaved: (entry: Omit<SavedReading, 'id' | 'note'>) => void
  deleteSaved: (id: string) => void
  setSavedNote: (id: string, note: string) => void
  setLang: (lang: Lang) => void
}

export const useApp = create<AppState>((set) => ({
  view: hashToView(location.hash),
  recent: loadRecent(),
  saved: loadSaved(),
  lang: loadLang(),
  go: (view) => {
    history.replaceState(null, '', viewToHash(view) || location.pathname)
    set({ view })
  },
  openReading: (spread, cards, question) => {
    const recent = addRecent({ spread, cards, at: new Date().toISOString().slice(0, 10), question })
    history.replaceState(null, '', `#r/${spread}/${encodeCards(cards)}`)
    set({ view: { name: 'reading', spread, cards, question }, recent })
  },
  clearHistory: () => {
    clearRecent()
    set({ recent: [] })
  },
  removeRecent: (key) => {
    set({ recent: removeRecentEntry(key) })
  },
  toggleSaved: (entry) => {
    const existing = loadSaved().find((e) => entryKey(e) === entryKey(entry))
    set({ saved: existing ? removeSaved(existing.id) : addSaved(entry) })
  },
  deleteSaved: (id) => {
    set({ saved: removeSaved(id) })
  },
  setSavedNote: (id, note) => {
    set({ saved: updateSavedNote(id, note) })
  },
  setLang: (lang) => {
    saveLang(lang)
    document.documentElement.lang = lang === 'en' ? 'en' : 'zh-Hant-TW'
    set({ lang })
  },
}))
