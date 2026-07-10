import { REGISTRY, indexOfCard } from '../content/registry'
import { getCard } from '../content'
import { SUIT_NAMES, VERDICT_LABELS, type CardReading } from '../content/types'
import { useApp } from '../state'
import { CardFace } from './CardFace'

function ReadingBlock({ r }: { r: CardReading }) {
  return (
    <div className="detail-reading">
      <p className="keywords">{r.keywords.map((k) => `#${k}`).join(' ')}</p>
      <p className="core">{r.core}</p>
      <dl className="detail-cats">
        <dt>今日指引</dt>
        <dd>{r.daily}</dd>
        <dt>愛情感情</dt>
        <dd>{r.love}</dd>
        <dt>事業工作</dt>
        <dd>{r.career}</dd>
        <dt>財運金錢</dt>
        <dd>{r.money}</dd>
        <dt>是非傾向</dt>
        <dd>
          <span className={`verdict-badge v-${r.verdict}`}>{VERDICT_LABELS[r.verdict]}</span> {r.verdictReason}
        </dd>
      </dl>
      <p className="advice">💡 {r.advice}</p>
    </div>
  )
}

// 單牌詳情：正逆位切換同步 hash（#card/id 或 #card/id/r）
export function CardDetail({ id, reversed }: { id: string; reversed: boolean }) {
  const go = useApp((s) => s.go)
  const index = indexOfCard(id)
  const entry = REGISTRY[index]
  const card = getCard(id)

  const subtitle = card
    ? card.arcana === 'major'
      ? `大牌 ${card.number}`
      : `${SUIT_NAMES[card.suit!]}牌組`
    : ''

  return (
    <div className="card-detail">
      <button type="button" className="btn subtle" onClick={() => go({ name: 'browse' })}>
        ← 回牌庫
      </button>
      <div className="detail-head">
        <div className="detail-img">
          <CardFace index={index} reversed={reversed} />
        </div>
        <div className="detail-title">
          <h2>
            {entry.name} <span className="name-en">{entry.nameEn}</span>
          </h2>
          <p className="detail-sub">{subtitle}</p>
          {card && <p className="scene">{card.scene}</p>}
          <div className="ori-toggle">
            <button
              type="button"
              className={`btn tab ${!reversed ? 'active' : ''}`}
              onClick={() => go({ name: 'detail', id, reversed: false })}
            >
              正位
            </button>
            <button
              type="button"
              className={`btn tab ${reversed ? 'active' : ''}`}
              onClick={() => go({ name: 'detail', id, reversed: true })}
            >
              逆位
            </button>
          </div>
        </div>
      </div>
      {card ? (
        <ReadingBlock r={reversed ? card.reversed : card.upright} />
      ) : (
        <p className="pending-note">這張牌的解讀內容整備中。</p>
      )}
    </div>
  )
}
