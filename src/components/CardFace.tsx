import { REGISTRY } from '../content/registry'

// 牌圖：逆位整張旋轉 180°；size 由外層 CSS 控
export function CardFace({ index, reversed, className = '' }: { index: number; reversed: boolean; className?: string }) {
  const entry = REGISTRY[index]
  return (
    <img
      className={`card-face ${reversed ? 'is-reversed' : ''} ${className}`}
      src={`${import.meta.env.BASE_URL}cards/${entry.id}.jpg`}
      alt={`${entry.name}${reversed ? '（逆位）' : ''}`}
      loading="lazy"
    />
  )
}

// 牌背（純 CSS 圖樣，避開 1971 版權牌背）
export function CardBack({ onClick, className = '' }: { onClick?: () => void; className?: string }) {
  return (
    <button type="button" className={`card-back ${className}`} onClick={onClick} aria-label="牌背">
      <span className="card-back-star">✦</span>
    </button>
  )
}
