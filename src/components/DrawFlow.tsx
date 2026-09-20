import { useEffect, useRef, useState } from 'react'
import { clearInflight, loadInflight, saveInflight } from '../lib/inflight'
import { getSpreads, SPREAD_SIZE } from '../content/positions'
import { shuffledDeck, drawFromDeck, type DrawnCard } from '../lib/draw'
import type { DrawableSpread } from '../lib/share'
import { useApp } from '../state'
import { cardNameAt } from '../lib/cardName'
import { STRINGS } from '../lib/i18n'
import { CardBack, CardFace } from './CardFace'

type Step = 'ask' | 'shuffle' | 'cut' | 'pick' | 'reveal'

// 中途重新整理可續抽的快照（sessionStorage）；洗牌動畫中斷就重洗，不存 deck 以外的中間態
interface DrawSnapshot {
  step: Step
  question: string
  cuts: number
  picked: number[]
  drawn: DrawnCard[]
  flipped: boolean[]
  deck: number[]
}

function cryptoInt(max: number): number {
  const buf = new Uint32Array(1)
  crypto.getRandomValues(buf)
  return buf[0] % max
}

// 儀式感抽牌流程：問題（選填）→ 洗牌 → 切三刀 → 弧形扇排親手點選 → 逐張翻牌 → 結果頁
export function DrawFlow({ spread }: { spread: DrawableSpread }) {
  const openReading = useApp((s) => s.openReading)
  const go = useApp((s) => s.go)
  const lang = useApp((s) => s.lang)
  const T = STRINGS[lang]
  const def = getSpreads(lang)[spread]
  const need = SPREAD_SIZE[spread]

  const snap = useRef(loadInflight<DrawSnapshot>('draw', spread)).current
  const resumed = !!snap && snap.step !== 'ask'
  const [step, setStep] = useState<Step>(snap?.step === 'shuffle' ? 'shuffle' : (snap?.step ?? 'ask'))
  const [question, setQuestion] = useState(snap?.question ?? '')
  const [cuts, setCuts] = useState(snap?.cuts ?? 0)
  const [picked, setPicked] = useState<number[]>(snap?.picked ?? []) // 被點的扇面位置（視覺用）
  const [drawn, setDrawn] = useState<DrawnCard[]>(snap?.drawn ?? [])
  const [flipped, setFlipped] = useState<boolean[]>(snap?.flipped ?? [])
  const deckRef = useRef<number[]>(snap?.deck ?? [])

  useEffect(() => {
    if (step !== 'shuffle') return
    deckRef.current = shuffledDeck()
    const t = setTimeout(() => setStep('cut'), 1800)
    return () => clearTimeout(t)
  }, [step])

  // 每個狀態變化都存快照；回到 ask（尚未開始）就不留東西
  useEffect(() => {
    if (step === 'ask') return
    saveInflight<DrawSnapshot>('draw', spread, { step, question, cuts, picked, drawn, flipped, deck: deckRef.current })
  }, [spread, step, question, cuts, picked, drawn, flipped])

  // 切牌：每刀在隨機位置把牌堆疊上去（真的影響牌序）
  const cut = () => {
    const deck = deckRef.current
    const at = 1 + cryptoInt(deck.length - 2)
    deckRef.current = [...deck.slice(at), ...deck.slice(0, at)]
    const n = cuts + 1
    setCuts(n)
    if (n >= 3) setTimeout(() => setStep('pick'), 400)
  }

  const pick = (fanIndex: number) => {
    if (picked.includes(fanIndex) || picked.length >= need) return
    const nextPicked = [...picked, fanIndex]
    setPicked(nextPicked)
    if (nextPicked.length === need) {
      // 實際牌序來自洗牌＋切牌結果；點的位置只是儀式
      const cards = drawFromDeck(deckRef.current, need)
      setDrawn(cards)
      setFlipped(cards.map(() => false))
      setTimeout(() => setStep('reveal'), 350)
    }
  }

  const flip = (i: number) => setFlipped((f) => f.map((v, k) => (k === i ? true : v)))
  const allFlipped = flipped.length > 0 && flipped.every(Boolean)

  // 弧形扇排角度：78 張攤在 ±45° 之間（角度再大，邊緣的牌會沉出可視範圍）
  const fanAngle = (i: number) => -45 + (90 * i) / 77

  return (
    <div className="draw-flow">
      <h2 className="reading-title">{def.name}</h2>
      {resumed && <p className="resumed-note">{T.resumedNote}</p>}

      {step === 'ask' && (
        <div className="draw-ask">
          <p className="reading-intro">{def.intro}</p>
          <input
            className="question-input"
            placeholder={T.questionPlaceholder}
            value={question}
            maxLength={60}
            onChange={(e) => setQuestion(e.target.value)}
          />
          <button type="button" className="btn primary big" onClick={() => setStep('shuffle')}>
            {T.startShuffle}
          </button>
          <button type="button" className="btn subtle manual-link" onClick={() => go({ name: 'manual', spread })}>
            {T.manualInDraw}
          </button>
        </div>
      )}

      {step === 'shuffle' && (
        <div className="shuffle-stage" aria-label="shuffling">
          <div className="shuffle-cards">
            {Array.from({ length: 7 }, (_, i) => (
              <div className="shuffle-card" style={{ animationDelay: `${i * 0.12}s` }} key={i}>
                <span className="card-back-star">✦</span>
              </div>
            ))}
          </div>
          <p className="shuffle-hint">{T.shuffling}</p>
        </div>
      )}

      {step === 'cut' && (
        <div className="cut-stage">
          <p className="pick-hint">{T.cutHint(cuts)}</p>
          <button type="button" className="cut-deck" onClick={cut} aria-label="cut the deck">
            {Array.from({ length: 5 }, (_, i) => (
              <div className="cut-card" key={`${cuts}-${i}`} style={{ animationDelay: `${i * 0.04}s` }}>
                <span className="card-back-star">✦</span>
              </div>
            ))}
          </button>
          <p className="shuffle-hint">{T.cutNote}</p>
        </div>
      )}

      {step === 'pick' && (
        <div className="pick-stage">
          <p className="pick-hint">{T.pickHint(need, need - picked.length)}</p>
          <p className="swipe-hint">{T.swipeHint}</p>
          <div className="fan-arc">
            {Array.from({ length: 78 }, (_, i) => (
              <div
                className={`fan-slot ${picked.includes(i) ? 'picked' : ''}`}
                style={{ transform: `translateX(-50%) rotate(${fanAngle(i)}deg)`, zIndex: i }}
                key={i}
              >
                <CardBack className="fan-card" onClick={() => pick(i)} label={T.fanCardLabel(i + 1)} />
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 'reveal' && (
        <div className="reveal-stage">
          <p className="pick-hint">{allFlipped ? T.allFlipped : T.flipEach}</p>
          <div className={`reveal-cards ${drawn.length > 5 ? 'many' : ''}`}>
            {drawn.map((c, i) => (
              <div className="reveal-slot" key={c.index}>
                <p className="reveal-pos">{def.positions[i].title}</p>
                <div
                  className={`flip-box ${flipped[i] ? 'flipped' : ''}`}
                  role="button"
                  tabIndex={flipped[i] ? -1 : 0}
                  aria-label={T.flipCardLabel(def.positions[i].title)}
                  onClick={() => flip(i)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      flip(i)
                    }
                  }}
                >
                  <div className="flip-inner">
                    <div className="flip-front">
                      <CardBack />
                    </div>
                    <div className="flip-back">
                      <CardFace index={c.index} reversed={c.reversed} />
                    </div>
                  </div>
                </div>
                {flipped[i] && (
                  <p className="card-caption small">
                    {cardNameAt(c.index, lang)}
                    <span className={`ori-badge ${c.reversed ? 'rev' : 'up'}`}>{c.reversed ? T.reversed : T.upright}</span>
                  </p>
                )}
              </div>
            ))}
          </div>
          {allFlipped && (
            <button
              type="button"
              className="btn primary big see-reading"
              onClick={() => {
                clearInflight()
                openReading(spread, drawn, question.trim() || undefined)
              }}
            >
              {T.seeReading}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
