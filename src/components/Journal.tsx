import { useState } from 'react'
import { REGISTRY } from '../content/registry'
import { loadDailyHistory, loadName, loadNames, streakOf } from '../lib/storage'
import { todayStr } from '../lib/seed'
import { useApp } from '../state'
import { STRINGS } from '../lib/i18n'

function monthKey(y: number, m: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}`
}

// 每日一牌回顧：月曆看過去每天翻到什麼＋連續打卡天數（資料都在本機）
export function Journal() {
  const go = useApp((s) => s.go)
  const lang = useApp((s) => s.lang)
  const T = STRINGS[lang]
  const [who, setWho] = useState(loadName())
  const today = todayStr()
  const [cursor, setCursor] = useState(() => {
    const d = new Date()
    return { y: d.getFullYear(), m: d.getMonth() }
  })

  const history = loadDailyHistory()[who.trim()] ?? {}
  const names = ['', ...loadNames().filter(Boolean)]
  const streak = streakOf(who, today)

  const first = new Date(cursor.y, cursor.m, 1)
  const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate()
  const blanks = first.getDay()
  const prefix = monthKey(cursor.y, cursor.m)

  return (
    <div className="journal">
      <h2 className="reading-title">{T.journalTitle}</h2>
      <p className="reading-intro">
        {T.journalIntro}
        {streak > 0 && <span className="streak-badge">{T.journalStreak(streak)}</span>}
      </p>

      {names.length > 1 && (
        <div className="name-chips">
          {names.map((n) => (
            <button
              type="button"
              key={n || '_'}
              className={`btn tab ${who.trim() === n ? 'active' : ''}`}
              onClick={() => setWho(n)}
            >
              {n || T.noName}
            </button>
          ))}
        </div>
      )}

      <div className="cal-head">
        <button type="button" className="btn subtle" onClick={() => setCursor(({ y, m }) => (m === 0 ? { y: y - 1, m: 11 } : { y, m: m - 1 }))}>
          {T.prevMonth}
        </button>
        <span className="cal-title">{T.monthTitle(cursor.y, cursor.m + 1)}</span>
        <button type="button" className="btn subtle" onClick={() => setCursor(({ y, m }) => (m === 11 ? { y: y + 1, m: 0 } : { y, m: m + 1 }))}>
          {T.nextMonth}
        </button>
      </div>

      <div className="cal-grid">
        {T.weekdays.map((w) => (
          <div className="cal-weekday" key={w}>
            {w}
          </div>
        ))}
        {Array.from({ length: blanks }, (_, i) => (
          <div className="cal-cell empty" key={`b${i}`} />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const date = `${prefix}-${String(i + 1).padStart(2, '0')}`
          const rec = history[date]
          const isToday = date === today
          return (
            <button
              type="button"
              className={`cal-cell ${rec ? 'has-card' : ''} ${isToday ? 'today' : ''}`}
              key={date}
              onClick={() => rec && go({ name: 'detail', id: REGISTRY[rec.index].id, reversed: rec.reversed })}
              disabled={!rec}
            >
              <span className="cal-day">{i + 1}</span>
              {rec && (
                <span className="cal-card-name">
                  {lang === 'en' ? REGISTRY[rec.index].nameEn : REGISTRY[rec.index].name}
                  {rec.reversed ? (lang === 'en' ? ' ↓' : '·逆') : ''}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div className="reading-actions">
        <button type="button" className="btn primary" onClick={() => go({ name: 'daily' })}>
          {T.goDrawToday}
        </button>
      </div>
    </div>
  )
}
