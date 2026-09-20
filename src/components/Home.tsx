import { useState } from 'react'
import { REGISTRY } from '../content/registry'
import { getSpreads } from '../content/positions'
import { useApp, type HomeNotice, type View } from '../state'
import { STRINGS, type Strings } from '../lib/i18n'
import { entryKey, loadDailyHistory } from '../lib/storage'
import type { DrawableSpread } from '../lib/share'

// 牌陣卡：整張可點＝線上抽牌；「輸入實體牌」移到抽牌流程第一步，首頁少一半按鈕
const MODES: { spread: DrawableSpread; emoji: string; advanced?: boolean }[] = [
  { spread: 'three', emoji: '🃏' },
  { spread: 'relation', emoji: '💞' },
  { spread: 'tree', emoji: '🌳' },
  { spread: 'yesno', emoji: '⚖️' },
  { spread: 'choice', emoji: '🔀' },
  { spread: 'month', emoji: '🗓️' },
  { spread: 'celtic', emoji: '🕯️', advanced: true },
]

export const MODE_DESC = {
  zh: {
    three: '過去・現在・未來，看一件事的來龍去脈',
    relation: '我・對方・走向，看一段關係的兩端',
    tree: '六張牌把關係看成一棵樹——根基、養分、心結與走向',
    yesno: '心裡想好一個是非題，抽一張看傾向',
    choice: '兩個選項各抽一張，比較兩邊能量',
    month: '月初抽一次，看這個月的主題、工作、感情與身心',
    celtic: '十張牌看一件事的全貌，適合醞釀已久的大哉問',
  },
  en: {
    three: 'Past, present, future — the arc of one thing',
    relation: 'You, them, and where it heads',
    tree: 'Six cards read a relationship as a tree — roots, nourishment, knots and growth',
    yesno: 'Hold a yes-or-no question, draw one card',
    choice: 'One card for each option — compare the energy',
    month: 'Draw at the start of the month — theme, work, love, body and mind',
    celtic: 'Ten cards for the full picture — made for the big questions',
  },
} as const

// 工具列：牌庫／小學堂／牌義學習／我的牌／回顧，一列 chips 取代五個同樣的虛線大框
const TOOLS: { view: View; emoji: string; label: keyof Strings; cls: string }[] = [
  { view: { name: 'browse' }, emoji: '📖', label: 'toolBrowse', cls: 'browse' },
  { view: { name: 'learn' }, emoji: '🎓', label: 'toolLearn', cls: 'learn' },
  { view: { name: 'study' }, emoji: '🧠', label: 'toolStudy', cls: 'study' },
  { view: { name: 'mycard' }, emoji: '🎂', label: 'toolMyCard', cls: 'mycard' },
  { view: { name: 'journal' }, emoji: '📅', label: 'toolJournal', cls: 'journal' },
]

export function Home({ notice }: { notice?: HomeNotice }) {
  const go = useApp((s) => s.go)
  const recent = useApp((s) => s.recent)
  const saved = useApp((s) => s.saved)
  const clearHistory = useApp((s) => s.clearHistory)
  const removeRecent = useApp((s) => s.removeRecent)
  const toggleSaved = useApp((s) => s.toggleSaved)
  const lang = useApp((s) => s.lang)
  const T = STRINGS[lang]
  const spreads = getSpreads(lang)
  const [confirmClear, setConfirmClear] = useState(false)

  // 首訪判斷：沒有任何最近紀錄、收藏與每日牌史才顯示入門卡
  const firstVisit =
    recent.length === 0 &&
    saved.length === 0 &&
    !Object.values(loadDailyHistory()).some((days) => Object.keys(days).length > 0)

  return (
    <div className="home">
      <div className="hero">
        <p className="hero-title">{T.heroTitle}</p>
        <p className="hero-sub">{T.heroSub}</p>
      </div>

      {notice === 'badLink' && (
        <p className="home-notice" role="status">
          {T.badLinkNotice}
        </p>
      )}

      {firstVisit && (
        <button type="button" className="first-visit-card" onClick={() => go({ name: 'learn' })}>
          <span className="fv-title">{T.firstVisitTitle}</span>
          <span className="fv-sub">{T.firstVisitSub}</span>
        </button>
      )}

      <button type="button" className="daily-card" onClick={() => go({ name: 'daily' })}>
        <span className="daily-label">{T.dailyLabel}</span>
        <span className="daily-line">{T.dailyLine}</span>
      </button>

      <div className="tool-row" aria-label={T.navLabel}>
        {TOOLS.map((t) => (
          <button type="button" className={`tool-chip tool-${t.cls}`} key={t.cls} onClick={() => go(t.view)}>
            <span className="tool-emoji" aria-hidden="true">
              {t.emoji}
            </span>
            <span className="tool-label">{T[t.label] as string}</span>
          </button>
        ))}
      </div>

      <h3 className="section-title">{T.spreadsTitle}</h3>
      <div className="mode-cards">
        {MODES.map((m) => (
          <button type="button" className={`mode-card tone-${m.spread}`} key={m.spread} onClick={() => go({ name: 'draw', spread: m.spread })}>
            <span className="mode-head">
              <span className="mode-emoji" aria-hidden="true">
                {m.emoji}
              </span>
              <span className="mode-name">
                {spreads[m.spread].name}
                {m.advanced && <span className="adv-badge">{T.advBadge}</span>}
              </span>
            </span>
            <span className="mode-desc">{MODE_DESC[lang][m.spread]}</span>
          </button>
        ))}
      </div>

      {recent.length > 0 && (
        <div className="recent">
          <div className="recent-head">
            <h3>{T.recentTitle}</h3>
            {confirmClear ? (
              <button
                type="button"
                className="btn danger confirm-clear"
                onClick={() => {
                  clearHistory()
                  setConfirmClear(false)
                }}
              >
                {T.clearConfirm}
              </button>
            ) : (
              <button type="button" className="btn subtle" onClick={() => setConfirmClear(true)}>
                {T.clear}
              </button>
            )}
          </div>
          {recent.map((e) => {
            const k = entryKey(e)
            const isSaved = saved.some((s) => entryKey(s) === k)
            return (
              <div className="recent-item" key={k}>
                <button
                  type="button"
                  className="recent-main"
                  onClick={() =>
                    e.spread === 'daily'
                      ? go({ name: 'daily', date: e.at })
                      : go({ name: 'reading', spread: e.spread, cards: e.cards, question: e.question })
                  }
                >
                  <span className="recent-date">{e.at}</span>
                  <span className="recent-spread">{spreads[e.spread].name}</span>
                  <span className="recent-cards">
                    {e.cards
                      .map((c) => `${lang === 'en' ? REGISTRY[c.index].nameEn : REGISTRY[c.index].name}${c.reversed ? T.revShort : ''}`)
                      .join(lang === 'en' ? ', ' : '、')}
                  </span>
                  {e.question && <span className="recent-q">「{e.question}」</span>}
                </button>
                <div className="recent-side">
                  <button
                    type="button"
                    className={`icon-btn star ${isSaved ? 'on' : ''}`}
                    title={isSaved ? T.unsave : T.saveReading}
                    aria-label={isSaved ? T.unsave : T.saveReading}
                    onClick={() => toggleSaved({ spread: e.spread, cards: e.cards, at: e.at, question: e.question })}
                  >
                    {isSaved ? '★' : '☆'}
                  </button>
                  <button
                    type="button"
                    className="icon-btn"
                    title={T.deleteEntry}
                    aria-label={T.deleteEntry}
                    onClick={() => removeRecent(k)}
                  >
                    ✕
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
