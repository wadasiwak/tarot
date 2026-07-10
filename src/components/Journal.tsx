import { useState } from 'react'
import { REGISTRY } from '../content/registry'
import { loadDailyHistory, loadName, loadNames, streakOf } from '../lib/storage'
import { todayStr } from '../lib/seed'
import { useApp } from '../state'

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

function monthKey(y: number, m: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}`
}

// 每日一牌回顧：月曆看過去每天翻到什麼＋連續打卡天數（資料都在本機）
export function Journal() {
  const go = useApp((s) => s.go)
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
      <h2 className="reading-title">每日一牌回顧</h2>
      <p className="reading-intro">
        看看這陣子每天翻到什麼牌。紀錄只存在這台裝置上。
        {streak > 0 && (
          <span className="streak-badge">🔥 已連續 {streak} 天</span>
        )}
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
              {n || '（未填名字）'}
            </button>
          ))}
        </div>
      )}

      <div className="cal-head">
        <button type="button" className="btn subtle" onClick={() => setCursor(({ y, m }) => (m === 0 ? { y: y - 1, m: 11 } : { y, m: m - 1 }))}>
          ← 上個月
        </button>
        <span className="cal-title">
          {cursor.y} 年 {cursor.m + 1} 月
        </span>
        <button type="button" className="btn subtle" onClick={() => setCursor(({ y, m }) => (m === 11 ? { y: y + 1, m: 0 } : { y, m: m + 1 }))}>
          下個月 →
        </button>
      </div>

      <div className="cal-grid">
        {WEEKDAYS.map((w) => (
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
                  {REGISTRY[rec.index].name}
                  {rec.reversed ? '·逆' : ''}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div className="reading-actions">
        <button type="button" className="btn primary" onClick={() => go({ name: 'daily' })}>
          去翻今天的牌
        </button>
      </div>
    </div>
  )
}
