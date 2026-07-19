import { useEffect, useState } from 'react'
import { REGISTRY } from '../content/registry'
import { getCard } from '../content'
import { getSpreads } from '../content/positions'
import { VERDICT_LABELS, VERDICT_LABELS_EN } from '../content/types'
import type { DrawnCard } from '../lib/draw'
import { compareChoice } from '../lib/verdict'
import { shareUrl, type DrawableSpread } from '../lib/share'
import { entryKey } from '../lib/storage'
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

  // 收藏與筆記（筆記只存本機，絕不進 URL / analytics）
  const saved = useApp((s) => s.saved)
  const toggleSaved = useApp((s) => s.toggleSaved)
  const setSavedNote = useApp((s) => s.setSavedNote)
  const key = entryKey({ spread, cards })
  const savedEntry = saved.find((e) => entryKey(e) === key)
  const [note, setNote] = useState(savedEntry?.note ?? '')
  const [noteSaved, setNoteSaved] = useState(false)
  useEffect(() => {
    setNote(savedEntry?.note ?? '')
    setNoteSaved(false)
    // 換到另一筆解讀（或收藏/取消）時同步筆記草稿
  }, [savedEntry?.id]) // eslint-disable-line react-hooks/exhaustive-deps

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

      {spread === 'celtic' && (
        // 經典十字＋權杖列的縮圖總覽：點任一張捲到對應段落（可讀性交給下方直列）
        <div className="celtic-map" aria-label="celtic cross overview">
          {cards.map((c, i) => (
            <button
              type="button"
              className={`celtic-cell pos-${i + 1}`}
              key={c.index}
              title={`${i + 1}・${def.positions[i].title}`}
              onClick={() => document.getElementById(`celtic-pos-${i + 1}`)?.scrollIntoView({ behavior: 'smooth' })}
            >
              <CardFace index={c.index} reversed={c.reversed} />
              <span className="celtic-num">{i + 1}</span>
            </button>
          ))}
        </div>
      )}

      <div className={`reading-cards spread-${spread}`}>
        {cards.map((c, i) => {
          const pos = def.positions[i]
          const item = readings[i]
          const entry = REGISTRY[c.index]
          return (
            <section className="reading-card" key={c.index} id={spread === 'celtic' ? `celtic-pos-${i + 1}` : undefined}>
              <header className="position-head">
                <h3>{spread === 'celtic' ? `${i + 1}・${pos.title}` : pos.title}</h3>
                <p className="position-frame">{pos.frame}</p>
              </header>
              <div className="reading-card-body">
                <div className="reading-card-img">
                  <CardFace index={c.index} reversed={c.reversed} />
                  <p className="card-caption">
                    {lang === 'en' ? entry.nameEn : entry.name}
                    <button
                      type="button"
                      className={`ori-badge clickable ${c.reversed ? 'rev' : 'up'}`}
                      title={T.oriLearnHint}
                      onClick={() => go({ name: 'learn', section: 'reversed' })}
                    >
                      {c.reversed ? T.reversed : T.upright}
                    </button>
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
                      // 位置白話句：三張=過去/現在/建議；關係=我(present)/對方(other)/走向(建議)；
                      // 凱爾特十字=位置層級銜接句（positions.ts），最後的「結果」位再補上這張牌的行動建議
                      const bridge =
                        spread === 'celtic'
                          ? pos.bridge
                          : spread === 'three'
                            ? [item.r.past, item.r.present, item.r.advice][i]
                            : spread === 'relation'
                              ? [item.r.present, item.r.other, item.r.advice][i]
                              : item.r.advice
                      return (
                        <>
                          {bridge && <p className="advice">💡 {bridge}</p>}
                          {spread === 'celtic' && i === cards.length - 1 && (
                            <p className="advice">💡 {item.r.advice}</p>
                          )}
                        </>
                      )
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
        <button
          type="button"
          className={`btn save-reading ${savedEntry ? 'saved' : ''}`}
          onClick={() => toggleSaved({ spread, cards, at: savedEntry?.at ?? new Date().toISOString().slice(0, 10), question })}
        >
          {savedEntry ? T.savedBadge : T.saveReading}
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

      {savedEntry && (
        <div className="note-box">
          <textarea
            className="note-input"
            placeholder={T.notePlaceholder}
            value={note}
            maxLength={500}
            rows={3}
            onChange={(e) => {
              setNote(e.target.value)
              setNoteSaved(false)
            }}
          />
          <button
            type="button"
            className="btn subtle save-note"
            onClick={() => {
              setSavedNote(savedEntry.id, note)
              setNoteSaved(true)
            }}
          >
            {noteSaved ? T.noteSaved : T.saveNote}
          </button>
        </div>
      )}

      <p className="disclaimer">{T.disclaimerShort}</p>
    </div>
  )
}
