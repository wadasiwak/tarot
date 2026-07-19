import { REGISTRY } from '../content/registry'
import { getSpreads } from '../content/positions'
import { useApp } from '../state'
import { STRINGS } from '../lib/i18n'
import { entryKey, loadDailyHistory } from '../lib/storage'
import type { DrawableSpread } from '../lib/share'

const MODES: { spread: DrawableSpread; emoji: string }[] = [
  { spread: 'three', emoji: '🃏' },
  { spread: 'relation', emoji: '💞' },
  { spread: 'yesno', emoji: '⚖️' },
  { spread: 'choice', emoji: '🔀' },
]

const MODE_DESC = {
  zh: {
    three: '過去・現在・未來，看一件事的來龍去脈',
    relation: '我・對方・走向，看一段關係的兩端',
    yesno: '心裡想好一個是非題，抽一張看傾向',
    choice: '兩個選項各抽一張，比較兩邊能量',
  },
  en: {
    three: 'Past, present, future — the arc of one thing',
    relation: 'You, them, and where it heads',
    yesno: 'Hold a yes-or-no question, draw one card',
    choice: 'One card for each option — compare the energy',
  },
} as const

export function Home() {
  const go = useApp((s) => s.go)
  const recent = useApp((s) => s.recent)
  const saved = useApp((s) => s.saved)
  const clearHistory = useApp((s) => s.clearHistory)
  const removeRecent = useApp((s) => s.removeRecent)
  const toggleSaved = useApp((s) => s.toggleSaved)
  const lang = useApp((s) => s.lang)
  const T = STRINGS[lang]
  const spreads = getSpreads(lang)

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

      <div className="mode-cards">
        {MODES.map((m) => (
          <div className="mode-card" key={m.spread}>
            <h3>
              {m.emoji} {spreads[m.spread].name}
            </h3>
            <p className="mode-desc">{MODE_DESC[lang][m.spread]}</p>
            <div className="mode-actions">
              <button type="button" className="btn primary" onClick={() => go({ name: 'draw', spread: m.spread })}>
                {T.drawOnline}
              </button>
              <button type="button" className="btn" onClick={() => go({ name: 'manual', spread: m.spread })}>
                {T.enterPhysical}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="home-links">
        <button type="button" className="browse-link" onClick={() => go({ name: 'browse' })}>
          {T.browseLink}
        </button>
        <button type="button" className="browse-link" onClick={() => go({ name: 'learn' })}>
          {T.learnLink}
        </button>
        <button type="button" className="browse-link" onClick={() => go({ name: 'journal' })}>
          {T.journalLink}
        </button>
      </div>

      {recent.length > 0 && (
        <div className="recent">
          <div className="recent-head">
            <h3>{T.recentTitle}</h3>
            <button type="button" className="btn subtle" onClick={clearHistory}>
              {T.clear}
            </button>
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
