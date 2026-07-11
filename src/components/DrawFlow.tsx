import { useEffect, useRef, useState } from 'react'
import { getSpreads, SPREAD_SIZE } from '../content/positions'
import { REGISTRY } from '../content/registry'
import { shuffledDeck, drawFromDeck, type DrawnCard } from '../lib/draw'
import type { DrawableSpread } from '../lib/share'
import { useApp } from '../state'
import { STRINGS } from '../lib/i18n'
import { CardBack, CardFace } from './CardFace'

type Step = 'ask' | 'shuffle' | 'cut' | 'pick' | 'reveal'

function cryptoInt(max: number): number {
  const buf = new Uint32Array(1)
  crypto.getRandomValues(buf)
  return buf[0] % max
}

// 儀式感抽牌流程：問題（選填）→ 洗牌 → 切三刀 → 弧形扇排親手點選 → 逐張翻牌 → 結果頁
export function DrawFlow({ spread }: { spread: DrawableSpread }) {
  const openReading = useApp((s) => s.openReading)
  const lang = useApp((s) => s.lang)
  const T = STRINGS[lang]
  const def = getSpreads(lang)[spread]
  const need = SPREAD_SIZE[spread]

  const [step, setStep] = useState<Step>('ask')
  const [question, setQuestion] = useState('')
  const [cuts, setCuts] = useState(0)
  const [picked, setPicked] = useState<number[]>([]) // 被點的扇面位置（視覺用）
  const [drawn, setDrawn] = useState<DrawnCard[]>([])
  const [flipped, setFlipped] = useState<boolean[]>([])
  const deckRef = useRef<number[]>([])

  useEffect(() => {
    if (step !== 'shuffle') return
    deckRef.current = shuffledDeck()
    const t = setTimeout(() => setStep('cut'), 1800)
    return () => clearTimeout(t)
  }, [step])

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
                <CardBack className="fan-card" onClick={() => pick(i)} />
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 'reveal' && (
        <div className="reveal-stage">
          <p className="pick-hint">{allFlipped ? T.allFlipped : T.flipEach}</p>
          <div className="reveal-cards">
            {drawn.map((c, i) => (
              <div className="reveal-slot" key={c.index}>
                <p className="reveal-pos">{def.positions[i].title}</p>
                <div className={`flip-box ${flipped[i] ? 'flipped' : ''}`} onClick={() => flip(i)}>
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
                    {lang === 'en' ? REGISTRY[c.index].nameEn : REGISTRY[c.index].name}
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
              onClick={() => openReading(spread, drawn, question.trim() || undefined)}
            >
              {T.seeReading}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
