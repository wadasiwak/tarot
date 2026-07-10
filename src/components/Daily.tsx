import { useState } from 'react'
import { REGISTRY } from '../content/registry'
import { getCard } from '../content'
import { dailyDraw, todayStr } from '../lib/seed'
import { loadName, saveName } from '../lib/storage'
import { useApp } from '../state'
import { CardFace, CardBack } from './CardFace'
import { CopyForAI } from './CopyForAI'

// 每日一牌：同名字＋同一天結果固定（日期+暱稱 seed），儀式感在「親手翻開」。
// 暱稱只存本機 localStorage，不進 URL。
export function Daily({ date }: { date?: string }) {
  const go = useApp((s) => s.go)
  const day = date ?? todayStr()
  const [name, setName] = useState(loadName())
  const [flipped, setFlipped] = useState(false)

  const drawn = dailyDraw(day, name)
  const entry = REGISTRY[drawn.index]
  const card = getCard(entry.id)
  const r = card ? (drawn.reversed ? card.reversed : card.upright) : null

  const flip = () => {
    saveName(name)
    setFlipped(true)
  }

  return (
    <div className="daily-view">
      <h2 className="reading-title">每日一牌</h2>
      <p className="reading-intro">
        {day} 的指引——同一個名字、同一天，翻到的都是同一張；寫上名字，這張牌就專屬於你。
      </p>
      <div className="daily-stage">
        {!flipped ? (
          <div className="daily-back">
            <input
              className="question-input name-input"
              placeholder="你的名字或暱稱（選填，讓這張牌專屬於你）"
              value={name}
              maxLength={20}
              onChange={(e) => setName(e.target.value)}
            />
            <CardBack className="big" onClick={flip} />
            <button type="button" className="btn primary big" onClick={flip}>
              翻開今天的牌
            </button>
          </div>
        ) : (
          <div className="daily-front">
            {name.trim() && <p className="daily-owner">🌙 {name.trim()} 的今日一牌</p>}
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
                  <button type="button" className="btn subtle" onClick={() => setFlipped(false)}>
                    換個名字
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
