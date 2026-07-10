import { create } from 'zustand'
import type { DrawnCard } from './lib/draw'
import { decodeCards, encodeCards, isDrawableSpread, type DrawableSpread } from './lib/share'
import { REGISTRY } from './content/registry'
import { loadRecent, addRecent, clearRecent, type RecentEntry } from './lib/storage'
import { loadLang, saveLang, type Lang } from './lib/i18n'

export type View =
  | { name: 'home' }
  | { name: 'daily'; date?: string } // #daily 或 #daily/2026-07-10
  | { name: 'draw'; spread: DrawableSpread } // 洗牌抽牌流程
  | { name: 'manual'; spread: DrawableSpread } // 手動輸入實體抽到的牌
  | { name: 'reading'; spread: DrawableSpread; cards: DrawnCard[]; question?: string }
  | { name: 'browse' } // 78 張牌庫
  | { name: 'detail'; id: string; reversed: boolean }
  | { name: 'journal' } // 每日一牌月曆回顧＋連續打卡
  | { name: 'learn' } // 塔羅小學堂

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
      return '#learn'
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
  if (head === 'learn' && a === undefined) return { name: 'learn' }
  if (head === 'card' && a && validId(a) && (b === undefined || b === 'r'))
    return { name: 'detail', id: a, reversed: b === 'r' }
  return { name: 'home' }
}

interface AppState {
  view: View
  recent: RecentEntry[]
  lang: Lang
  go: (view: View) => void
  openReading: (spread: DrawableSpread, cards: DrawnCard[], question?: string) => void
  clearHistory: () => void
  setLang: (lang: Lang) => void
}

export const useApp = create<AppState>((set) => ({
  view: hashToView(location.hash),
  recent: loadRecent(),
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
  setLang: (lang) => {
    saveLang(lang)
    document.documentElement.lang = lang === 'en' ? 'en' : 'zh-Hant-TW'
    set({ lang })
  },
}))
