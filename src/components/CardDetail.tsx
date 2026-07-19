import { useEffect, useState } from 'react'
import { REGISTRY, indexOfCard } from '../content/registry'
import { getCard } from '../content'
import { SUIT_NAMES, SUIT_NAMES_EN, VERDICT_LABELS, VERDICT_LABELS_EN, type CardReading } from '../content/types'
import { useApp } from '../state'
import { STRINGS, type Strings, type Lang } from '../lib/i18n'
import { todayStr } from '../lib/seed'
import { addToStudy, loadStudy } from '../lib/storage'
import { CardFace } from './CardFace'

function ReadingBlock({ r, T, lang }: { r: CardReading; T: Strings; lang: Lang }) {
  const labels = lang === 'en' ? VERDICT_LABELS_EN : VERDICT_LABELS
  return (
    <div className="detail-reading">
      <p className="keywords">{r.keywords.map((k) => `#${k}`).join(' ')}</p>
      <p className="core">{r.core}</p>
      <dl className="detail-cats">
        <dt>{T.catDaily}</dt>
        <dd>{r.daily}</dd>
        <dt>{T.catLove}</dt>
        <dd>{r.love}</dd>
        <dt>{T.catCareer}</dt>
        <dd>{r.career}</dd>
        <dt>{T.catMoney}</dt>
        <dd>{r.money}</dd>
        <dt>{T.catVerdict}</dt>
        <dd>
          <span className={`verdict-badge v-${r.verdict}`}>{labels[r.verdict]}</span> {r.verdictReason}
        </dd>
      </dl>
      <p className="advice">💡 {r.advice}</p>
    </div>
  )
}

// 單牌詳情：正逆位切換同步 hash（#card/id 或 #card/id/r）
export function CardDetail({ id, reversed }: { id: string; reversed: boolean }) {
  const go = useApp((s) => s.go)
  const lang = useApp((s) => s.lang)
  const T = STRINGS[lang]
  const index = indexOfCard(id)
  const entry = REGISTRY[index]
  const card = getCard(id, lang)

  // 「加入學習」快捷：建一張今天到期的記憶卡（進度只存本機）
  const [inStudy, setInStudy] = useState(false)
  useEffect(() => {
    setInStudy(!!loadStudy().srs[id])
  }, [id])

  const subtitle = card
    ? card.arcana === 'major'
      ? T.majorSub(card.number)
      : T.suitSub(lang === 'en' ? SUIT_NAMES_EN[card.suit!] : SUIT_NAMES[card.suit!])
    : ''

  return (
    <div className="card-detail">
      <button type="button" className="btn subtle" onClick={() => go({ name: 'browse' })}>
        {T.backToBrowse}
      </button>
      <div className="detail-head">
        <div className="detail-img">
          <CardFace index={index} reversed={reversed} />
        </div>
        <div className="detail-title">
          <h2>
            {lang === 'en' ? entry.nameEn : entry.name}{' '}
            <span className="name-en">{lang === 'en' ? entry.name : entry.nameEn}</span>
          </h2>
          {card && card.arcana !== 'major' ? (
            <button
              type="button"
              className="detail-sub as-link"
              title={T.aboutSuit}
              onClick={() => go({ name: 'learn', section: 'suits' })}
            >
              {subtitle} →
            </button>
          ) : (
            <p className="detail-sub">{subtitle}</p>
          )}
          {card && <p className="scene">{card.scene}</p>}
          <div className="ori-toggle">
            <button
              type="button"
              className={`btn tab ${!reversed ? 'active' : ''}`}
              onClick={() => go({ name: 'detail', id, reversed: false })}
            >
              {T.upright}
            </button>
            <button
              type="button"
              className={`btn tab ${reversed ? 'active' : ''}`}
              onClick={() => go({ name: 'detail', id, reversed: true })}
            >
              {T.reversed}
            </button>
            <button
              type="button"
              className="btn subtle learn-reversed"
              onClick={() => go({ name: 'learn', section: 'reversed' })}
            >
              {T.whatIsReversed}
            </button>
          </div>
          {inStudy ? (
            <button type="button" className="btn subtle add-study added" onClick={() => go({ name: 'study' })}>
              {T.addedStudy}
            </button>
          ) : (
            <button
              type="button"
              className="btn add-study"
              onClick={() => {
                addToStudy(id, todayStr())
                setInStudy(true)
              }}
            >
              {T.addStudy}
            </button>
          )}
        </div>
      </div>
      {card ? <ReadingBlock r={reversed ? card.reversed : card.upright} T={T} lang={lang} /> : <p className="pending-note">{T.pendingNote}</p>}
    </div>
  )
}
