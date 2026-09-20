import { create } from 'zustand'
import type { DrawnCard } from './lib/draw'
import { decodeCards, encodeCards, isDrawableSpread, type DrawableSpread } from './lib/share'
import { REGISTRY } from './content/registry'
import { todayStr } from './lib/seed'
import {
  loadRecent,
  addRecent,
  clearRecent,
  removeRecentEntry,
  entryKey,
  loadSaved,
  addSaved,
  removeSaved,
  bumpReadingCount,
  updateSavedNote,
  type RecentEntry,
  type SavedReading,
} from './lib/storage'
import { loadLang, saveLang, type Lang } from './lib/i18n'

// 小學堂章節錨點（#learn/<section>；順序與 Learn.tsx 的 SECTIONS 對齊）
export const LEARN_SECTIONS = ['what', 'ask', 'suits', 'numbers', 'court', 'reversed', 'how'] as const
export type LearnSection = (typeof LEARN_SECTIONS)[number]
const isLearnSection = (s: string): s is LearnSection => (LEARN_SECTIONS as readonly string[]).includes(s)

// 首頁一次性提示（不進 URL）：壞分享連結被擋下時告訴用戶為什麼落到首頁
export type HomeNotice = 'badLink'

export type View =
  | { name: 'home'; notice?: HomeNotice }
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

// 每日一牌日期：必須是真實存在的日期（2026-02-31 會被 Date 滾成 3/3，round-trip 比對擋掉），
// 且不能在今天之後（未來的「固定」牌會破壞每日儀式，也能被拿來回填打卡）。
export function isValidDailyDate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false
  const d = new Date(`${s}T00:00:00`)
  if (Number.isNaN(d.getTime())) return false
  const pad = (n: number) => String(n).padStart(2, '0')
  const roundTrip = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  return roundTrip === s && s <= todayStr()
}

// 嚴格還原：任何不合法 hash 一律回 home（分享連結壞掉則帶提示）
export function hashToView(hash: string): View {
  const parts = hash.replace(/^#/, '').split('/')
  const [head, a, b] = parts
  if (!head) return { name: 'home' }
  if (head === 'daily') {
    if (a === undefined) return { name: 'daily' }
    if (isValidDailyDate(a)) return { name: 'daily', date: a }
    return { name: 'daily' } // 壞日期／未來日期 fallback 今天
  }
  if (head === 'draw' && a && isDrawableSpread(a) && b === undefined) return { name: 'draw', spread: a }
  if (head === 'manual' && a && isDrawableSpread(a) && b === undefined) return { name: 'manual', spread: a }
  if (head === 'r') {
    if (a && isDrawableSpread(a) && b) {
      const cards = decodeCards(a, b)
      if (cards) return { name: 'reading', spread: a, cards }
    }
    return { name: 'home', notice: 'badLink' }
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

// history.state 記站內導航深度：back() 據此決定「真的退一頁」或「已在起點就回首頁」。
// push（非 replace）讓手機返回鍵在畫面間往返，而不是直接離站。
const depthOf = () => (typeof history.state?.depth === 'number' ? (history.state.depth as number) : 0)

function navigate(hash: string) {
  const url = hash || location.pathname + location.search
  if (hash === location.hash) {
    history.replaceState({ depth: depthOf() }, '', url)
  } else {
    history.pushState({ depth: depthOf() + 1 }, '', url)
  }
}

interface AppState {
  view: View
  recent: RecentEntry[]
  saved: SavedReading[]
  lang: Lang
  go: (view: View) => void
  back: () => void
  openReading: (spread: DrawableSpread, cards: DrawnCard[], question?: string) => void
  clearHistory: () => void
  removeRecent: (key: string) => void
  toggleSaved: (entry: Omit<SavedReading, 'id' | 'note'>) => void
  deleteSaved: (id: string) => void
  setSavedNote: (id: string, note: string) => void
  setLang: (lang: Lang) => void
  refreshLists: () => void
}

export const useApp = create<AppState>((set) => ({
  view: hashToView(location.hash),
  recent: loadRecent(),
  saved: loadSaved(),
  lang: loadLang(),
  go: (view) => {
    navigate(viewToHash(view))
    set({ view })
    window.scrollTo(0, 0)
  },
  back: () => {
    if (depthOf() > 0) history.back()
    else {
      navigate('')
      set({ view: { name: 'home' } })
      window.scrollTo(0, 0)
    }
  },
  openReading: (spread, cards, question) => {
    const recent = addRecent({ spread, cards, at: todayStr(), question })
    bumpReadingCount()
    navigate(`#r/${spread}/${encodeCards(cards)}`)
    set({ view: { name: 'reading', spread, cards, question }, recent })
    window.scrollTo(0, 0)
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
  // 匯入備份後把 localStorage 重新讀回 store
  refreshLists: () => set({ recent: loadRecent(), saved: loadSaved() }),
}))

// 返回／前進／手改 hash：一律從網址重建畫面。
// 回到 reading 時 question 不在 URL，改從最近紀錄補回（問題只存本機）。
const syncFromLocation = () => {
  const view = hashToView(location.hash)
  if (view.name === 'reading') {
    const key = entryKey({ spread: view.spread, cards: view.cards })
    const hit = useApp.getState().recent.find((e) => entryKey(e) === key)
    if (hit?.question) view.question = hit.question
  }
  useApp.setState({ view })
}
window.addEventListener('popstate', syncFromLocation)
window.addEventListener('hashchange', syncFromLocation)
