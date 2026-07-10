import { useState } from 'react'
import { REGISTRY } from '../content/registry'
import { getCard } from '../content'
import { getSpreads } from '../content/positions'
import { VERDICT_LABELS, VERDICT_LABELS_EN } from '../content/types'
import type { DrawnCard } from '../lib/draw'
import { compareChoice } from '../lib/verdict'
import { shareUrl, type DrawableSpread } from '../lib/share'
import { useApp } from '../state'
import { STRINGS } from '../lib/i18n'
import { CardFace } from './CardFace'
import { CopyForAI } from './CopyForAI'
import { ShareCardButton } from './ShareCardButton'

// 結果頁：線上抽牌 / 手動輸入 / hash 直開三種來源共用
export function Reading({ spread, cards, question }: { spread: DrawableSpread; cards: DrawnCard[]; question?: string }) {
  const go = useApp((s) => s.go)
  const lang = useApp((s) => s.lang)
  const T = STRINGS[lang]
  const def = getSpreads(lang)[spread]
  const labels = lang === 'en' ? VERDICT_LABELS_EN : VERDICT_LABELS
  const [copied, setCopied] = useState(false)

  const share = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl(spread, cards))
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // ignore
    }
  }

  const readings = cards.map((c) => {
    const card = getCard(REGISTRY[c.index].id, lang)
    return card ? { card, r: c.reversed ? card.reversed : card.upright } : null
  })

  const choiceResult =
    spread === 'choice' && readings[0] && readings[1]
      ? compareChoice(readings[0].r.verdict, readings[1].r.verdict)
      : null

  return (
    <div className="reading">
      <h2 className="reading-title">{def.name}</h2>
      <p className="reading-intro">{def.intro}</p>
      {question && (
        <p className="asked-question">
          {T.askedPrefix}
          {question}
        </p>
      )}

      {choiceResult && (
        <p className="choice-banner">
          {choiceResult === 'A' ? T.choiceA_wins : choiceResult === 'B' ? T.choiceB_wins : T.choiceTie}
        </p>
      )}

      <div className={`reading-cards spread-${spread}`}>
        {cards.map((c, i) => {
          const pos = def.positions[i]
          const item = readings[i]
          const entry = REGISTRY[c.index]
          return (
            <section className="reading-card" key={c.index}>
              <header className="position-head">
                <h3>{pos.title}</h3>
                <p className="position-frame">{pos.frame}</p>
              </header>
              <div className="reading-card-body">
                <div className="reading-card-img">
                  <CardFace index={c.index} reversed={c.reversed} />
                  <p className="card-caption">
                    {lang === 'en' ? entry.nameEn : entry.name}
                    <span className={`ori-badge ${c.reversed ? 'rev' : 'up'}`}>{c.reversed ? T.reversed : T.upright}</span>
                  </p>
                </div>
                {item ? (
                  <div className="reading-card-text">
                    <p className="keywords">{item.r.keywords.map((k) => `#${k}`).join(' ')}</p>
                    {(spread === 'yesno' || spread === 'choice') && (
                      <p className={`verdict-badge v-${item.r.verdict}`}>
                        {T.verdictPrefix}
                        {labels[item.r.verdict]}
                        <span className="verdict-reason">{item.r.verdictReason}</span>
                      </p>
                    )}
                    <p className="core">{item.r.core}</p>
                    {(() => {
                      // 位置白話句：三張=過去/現在/建議；關係=我(present)/對方(other)/走向(建議)
                      const bridge =
                        spread === 'three'
                          ? [item.r.past, item.r.present, item.r.advice][i]
                          : spread === 'relation'
                            ? [item.r.present, item.r.other, item.r.advice][i]
                            : item.r.advice
                      return bridge ? <p className="advice">💡 {bridge}</p> : null
                    })()}
                    <button
                      type="button"
                      className="btn subtle"
                      onClick={() => go({ name: 'detail', id: item.card.id, reversed: c.reversed })}
                    >
                      {T.fullMeaningArrow}
                    </button>
                  </div>
                ) : (
                  <p className="pending-note">{T.pendingNote}</p>
                )}
              </div>
            </section>
          )
        })}
      </div>

      <div className="reading-actions">
        <button type="button" className="btn" onClick={share}>
          {copied ? T.linkCopied : T.shareReading}
        </button>
        <ShareCardButton
          title={def.name}
          subtitle={new Date().toISOString().slice(0, 10)}
          cards={cards}
          positionTitles={cards.length > 1 ? def.positions.map((p) => p.title) : undefined}
        />
        <CopyForAI spread={spread} cards={cards} question={question} />
        <button type="button" className="btn" onClick={() => go({ name: 'draw', spread })}>
          {T.drawAgain}
        </button>
      </div>
      <p className="disclaimer">{T.disclaimerShort}</p>
    </div>
  )
}
