import { useState } from 'react'
import { REGISTRY } from '../content/registry'
import { getCard } from '../content'
import { getMyCard } from '../content/mycard'
import { birthCardNumber, parseBirthday, yearCardNumber } from '../lib/birthCard'
import { loadBirthday, saveBirthday } from '../lib/storage'
import { useApp } from '../state'
import { STRINGS } from '../lib/i18n'
import { CardFace } from './CardFace'
import { ShareCardButton } from './ShareCardButton'

// 我的牌：生日→生日牌（終身）＋年度牌（今年）。
// 大牌編號 0–21 恰為 registry index。生日只存本機 localStorage，絕不進 URL / analytics。
export function MyCard() {
  const go = useApp((s) => s.go)
  const lang = useApp((s) => s.lang)
  const T = STRINGS[lang]

  const [birthday, setBirthday] = useState(loadBirthday())
  const [shown, setShown] = useState(() => parseBirthday(loadBirthday()) !== null)
  const [bad, setBad] = useState(false)

  const parsed = shown ? parseBirthday(birthday) : null
  const thisYear = new Date().getFullYear()

  const reveal = () => {
    if (!parseBirthday(birthday)) {
      setBad(true)
      return
    }
    setBad(false)
    saveBirthday(birthday)
    setShown(true)
  }

  const sections = parsed
    ? (() => {
        const [y, m, d] = parsed
        return [
          { key: 'birth' as const, label: T.birthCardLabel, frame: T.birthFrame, sub: T.asBirthCard, index: birthCardNumber(y, m, d) },
          { key: 'year' as const, label: T.yearCardLabel(thisYear), frame: T.yearFrame(thisYear), sub: T.asYearCard, index: yearCardNumber(m, d, thisYear) },
        ]
      })()
    : null

  return (
    <div className="mycard-view">
      <h2 className="reading-title">🎂 {T.myCardTitle}</h2>
      <p className="reading-intro">{T.myCardIntro}</p>

      {!shown || !parsed ? (
        <div className="mycard-form">
          <label className="mycard-label" htmlFor="birthday-input">
            {T.birthdayLabel}
          </label>
          <input
            id="birthday-input"
            className="question-input birthday-input"
            type="date"
            min="1900-01-01"
            max={new Date().toISOString().slice(0, 10)}
            value={birthday}
            onChange={(e) => setBirthday(e.target.value)}
          />
          {bad && <p className="mycard-bad">{T.badBirthday}</p>}
          <button type="button" className="btn primary big mycard-show" onClick={reveal}>
            {T.showMyCards}
          </button>
        </div>
      ) : (
        <div className="mycard-results">
          <div className="reading-cards mycard-cards">
            {sections!.map((s) => {
              const entry = REGISTRY[s.index]
              const card = getCard(entry.id, lang)
              const text = getMyCard(entry.id, lang)
              return (
                <section className={`reading-card mycard-${s.key}`} key={s.key}>
                  <header className="position-head">
                    <h3>{s.label}</h3>
                    <p className="position-frame">{s.frame}</p>
                  </header>
                  <div className="reading-card-body">
                    <div className="reading-card-img">
                      <CardFace index={s.index} reversed={false} />
                      <p className="card-caption">{lang === 'en' ? entry.nameEn : entry.name}</p>
                    </div>
                    <div className="reading-card-text">
                      {card && <p className="keywords">{card.upright.keywords.map((k) => `#${k}`).join(' ')}</p>}
                      {card && <p className="core">{card.upright.core}</p>}
                      {text && (
                        <p className="advice mycard-context">
                          <span className="mycard-context-label">{s.sub}</span>
                          {s.key === 'birth' ? text.birth : text.year}
                        </p>
                      )}
                      <button type="button" className="btn subtle" onClick={() => go({ name: 'detail', id: entry.id, reversed: false })}>
                        {T.fullMeaningArrow}
                      </button>
                    </div>
                  </div>
                </section>
              )
            })}
          </div>

          <div className="reading-actions">
            <ShareCardButton
              title={T.myCardShareTitle}
              subtitle={String(thisYear)}
              cards={sections!.map((s) => ({ index: s.index, reversed: false }))}
              positionTitles={sections!.map((s) => s.label)}
            />
            <button type="button" className="btn" onClick={() => setShown(false)}>
              {T.changeBirthday}
            </button>
          </div>
        </div>
      )}

      <p className="disclaimer">{T.myCardAlgo}</p>
    </div>
  )
}
