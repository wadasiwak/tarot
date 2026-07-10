import { useState } from 'react'
import { REGISTRY } from '../content/registry'
import { getCard } from '../content'
import { dailyDraw, todayStr } from '../lib/seed'
import { loadName, saveName, loadNames, rememberName, recordDaily, streakOf } from '../lib/storage'
import { useApp } from '../state'
import { STRINGS } from '../lib/i18n'
import { CardFace, CardBack } from './CardFace'
import { CopyForAI } from './CopyForAI'
import { ShareCardButton } from './ShareCardButton'

// 每日一牌：同名字＋同一天結果固定（日期+暱稱 seed），儀式感在「親手翻開」。
// 暱稱與抽牌紀錄都只存本機 localStorage，不進 URL。
export function Daily({ date }: { date?: string }) {
  const go = useApp((s) => s.go)
  const lang = useApp((s) => s.lang)
  const T = STRINGS[lang]
  const day = date ?? todayStr()
  const [name, setName] = useState(loadName())
  const [flipped, setFlipped] = useState(false)
  const [streak, setStreak] = useState(0)

  const drawn = dailyDraw(day, name)
  const entry = REGISTRY[drawn.index]
  const card = getCard(entry.id, lang)
  const r = card ? (drawn.reversed ? card.reversed : card.upright) : null
  const knownNames = loadNames()
  const displayName = lang === 'en' ? entry.nameEn : entry.name

  const flip = () => {
    saveName(name)
    rememberName(name)
    recordDaily(name, day, { index: drawn.index, reversed: drawn.reversed })
    setStreak(streakOf(name, day))
    setFlipped(true)
  }

  return (
    <div className="daily-view">
      <h2 className="reading-title">{T.dailyTitle}</h2>
      <p className="reading-intro">{T.dailyIntro(day)}</p>
      <div className="daily-stage">
        {!flipped ? (
          <div className="daily-back">
            <input
              className="question-input name-input"
              placeholder={T.namePlaceholder}
              value={name}
              maxLength={20}
              onChange={(e) => setName(e.target.value)}
            />
            {knownNames.length > 0 && (
              <div className="name-chips">
                {knownNames.map((n) => (
                  <button
                    type="button"
                    key={n}
                    className={`btn tab ${name.trim() === n ? 'active' : ''}`}
                    onClick={() => setName(n)}
                  >
                    {n}
                  </button>
                ))}
              </div>
            )}
            <CardBack className="big" onClick={flip} />
            <button type="button" className="btn primary big" onClick={flip}>
              {T.flipToday}
            </button>
          </div>
        ) : (
          <div className="daily-front">
            {name.trim() && (
              <p className="daily-owner">
                {T.ownerDaily(name.trim())}
                {streak > 1 && <span className="streak-badge">{T.streak(streak)}</span>}
              </p>
            )}
            <div className="daily-card-img flip-in">
              <CardFace index={drawn.index} reversed={drawn.reversed} />
            </div>
            <p className="card-caption">
              {displayName}
              <span className={`ori-badge ${drawn.reversed ? 'rev' : 'up'}`}>{drawn.reversed ? T.reversed : T.upright}</span>
            </p>
            {r ? (
              <div className="daily-text">
                <p className="keywords">{r.keywords.map((k) => `#${k}`).join(' ')}</p>
                <p className="core">{r.daily}</p>
                <p className="advice">💡 {r.advice}</p>
                <div className="reading-actions">
                  <ShareCardButton
                    title={name.trim() ? T.ownerCardTitle(name.trim()) : T.todayCardTitle}
                    subtitle={day}
                    cards={[drawn]}
                  />
                  <CopyForAI spread="daily" cards={[drawn]} />
                  <button type="button" className="btn" onClick={() => go({ name: 'detail', id: entry.id, reversed: drawn.reversed })}>
                    {T.fullMeaning}
                  </button>
                </div>
                <div className="reading-actions">
                  <button type="button" className="btn subtle" onClick={() => go({ name: 'journal' })}>
                    {T.journalShort}
                  </button>
                  <button type="button" className="btn subtle" onClick={() => setFlipped(false)}>
                    {T.changeName}
                  </button>
                </div>
              </div>
            ) : (
              <p className="pending-note">{T.pendingNote}</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
