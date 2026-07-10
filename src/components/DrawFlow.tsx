import { useEffect, useRef, useState } from 'react'
import { SPREADS, SPREAD_SIZE } from '../content/positions'
import { REGISTRY } from '../content/registry'
import { shuffledDeck, drawFromDeck, type DrawnCard } from '../lib/draw'
import type { DrawableSpread } from '../lib/share'
import { useApp } from '../state'
import { CardBack, CardFace } from './CardFace'

type Step = 'ask' | 'shuffle' | 'pick' | 'reveal'

// 儀式感抽牌流程：問題（選填）→ 洗牌動畫 → 牌背攤開親手點選 → 逐張翻牌 → 結果頁
export function DrawFlow({ spread }: { spread: DrawableSpread }) {
  const openReading = useApp((s) => s.openReading)
  const def = SPREADS[spread]
  const need = SPREAD_SIZE[spread]

  const [step, setStep] = useState<Step>('ask')
  const [question, setQuestion] = useState('')
  const [picked, setPicked] = useState<number[]>([]) // 被點的扇面位置（視覺用）
  const [drawn, setDrawn] = useState<DrawnCard[]>([])
  const [flipped, setFlipped] = useState<boolean[]>([])
  const deckRef = useRef<number[]>([])

  useEffect(() => {
    if (step !== 'shuffle') return
    deckRef.current = shuffledDeck()
    const t = setTimeout(() => setStep('pick'), 1800)
    return () => clearTimeout(t)
  }, [step])

  const pick = (fanIndex: number) => {
    if (picked.includes(fanIndex) || picked.length >= need) return
    const nextPicked = [...picked, fanIndex]
    setPicked(nextPicked)
    if (nextPicked.length === need) {
      // 實際牌序來自洗牌結果；點的位置只是儀式
      const cards = drawFromDeck(deckRef.current, need)
      setDrawn(cards)
      setFlipped(cards.map(() => false))
      setTimeout(() => setStep('reveal'), 350)
    }
  }

  const flip = (i: number) => setFlipped((f) => f.map((v, k) => (k === i ? true : v)))
  const allFlipped = flipped.length > 0 && flipped.every(Boolean)

  return (
    <div className="draw-flow">
      <h2 className="reading-title">{def.name}</h2>

      {step === 'ask' && (
        <div className="draw-ask">
          <p className="reading-intro">{def.intro}</p>
          <input
            className="question-input"
            placeholder="心裡想著你的問題（選填，不會出現在分享連結裡）"
            value={question}
            maxLength={60}
            onChange={(e) => setQuestion(e.target.value)}
          />
          <button type="button" className="btn primary big" onClick={() => setStep('shuffle')}>
            開始洗牌
          </button>
        </div>
      )}

      {step === 'shuffle' && (
        <div className="shuffle-stage" aria-label="洗牌中">
          <div className="shuffle-cards">
            {Array.from({ length: 7 }, (_, i) => (
              <div className="shuffle-card" style={{ animationDelay: `${i * 0.12}s` }} key={i}>
                <span className="card-back-star">✦</span>
              </div>
            ))}
          </div>
          <p className="shuffle-hint">洗牌中，心裡默想你的問題⋯⋯</p>
        </div>
      )}

      {step === 'pick' && (
        <div className="pick-stage">
          <p className="pick-hint">
            憑直覺點選 {need} 張牌（還差 {need - picked.length} 張）
          </p>
          <div className="fan">
            {Array.from({ length: 78 }, (_, i) => (
              <CardBack
                key={i}
                className={`fan-card ${picked.includes(i) ? 'picked' : ''}`}
                onClick={() => pick(i)}
              />
            ))}
          </div>
        </div>
      )}

      {step === 'reveal' && (
        <div className="reveal-stage">
          <p className="pick-hint">{allFlipped ? '牌都翻開了。' : '逐張點開你抽到的牌'}</p>
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
                    {REGISTRY[c.index].name}
                    <span className={`ori-badge ${c.reversed ? 'rev' : 'up'}`}>{c.reversed ? '逆位' : '正位'}</span>
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
              看完整解讀
            </button>
          )}
        </div>
      )}
    </div>
  )
}
