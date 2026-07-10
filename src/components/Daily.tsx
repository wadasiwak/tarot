import { useState } from 'react'
import { REGISTRY } from '../content/registry'
import { getCard } from '../content'
import { dailyDraw, todayStr } from '../lib/seed'
import { useApp } from '../state'
import { CardFace, CardBack } from './CardFace'
import { CopyForAI } from './CopyForAI'

// 每日一牌：同一天結果固定（日期 seed），儀式感在「親手翻開」
export function Daily({ date }: { date?: string }) {
  const go = useApp((s) => s.go)
  const day = date ?? todayStr()
  const drawn = dailyDraw(day)
  const [flipped, setFlipped] = useState(false)
  const entry = REGISTRY[drawn.index]
  const card = getCard(entry.id)
  const r = card ? (drawn.reversed ? card.reversed : card.upright) : null

  return (
    <div className="daily-view">
      <h2 className="reading-title">每日一牌</h2>
      <p className="reading-intro">{day} 的指引——今天再怎麼抽，都是同一張。</p>
      <div className="daily-stage">
        {!flipped ? (
          <div className="daily-back">
            <CardBack className="big" onClick={() => setFlipped(true)} />
            <button type="button" className="btn primary big" onClick={() => setFlipped(true)}>
              翻開今天的牌
            </button>
          </div>
        ) : (
          <div className="daily-front">
            <div className="daily-card-img flip-in">
              <CardFace index={drawn.index} reversed={drawn.reversed} />
            </div>
            <p className="card-caption">
              {entry.name}
              <span className={`ori-badge ${drawn.reversed ? 'rev' : 'up'}`}>{drawn.reversed ? '逆位' : '正位'}</span>
            </p>
            {r ? (
              <div className="daily-text">
                <p className="keywords">{r.keywords.map((k) => `#${k}`).join(' ')}</p>
                <p className="core">{r.daily}</p>
                <p className="advice">💡 {r.advice}</p>
                <div className="reading-actions">
                  <CopyForAI spread="daily" cards={[drawn]} />
                  <button type="button" className="btn" onClick={() => go({ name: 'detail', id: entry.id, reversed: drawn.reversed })}>
                    完整牌義
                  </button>
                </div>
              </div>
            ) : (
              <p className="pending-note">這張牌的解讀內容整備中。</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
