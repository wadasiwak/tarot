import { useState } from 'react'
import { REGISTRY } from '../content/registry'
import { useApp } from '../state'
import { STRINGS } from '../lib/i18n'

// 牌圖：逆位整張旋轉 180°；size 由外層 CSS 控。
// alt 跟介面語言走；圖載不到時退成牌背樣式的佔位（不出現破圖 icon）。
export function CardFace({ index, reversed, className = '' }: { index: number; reversed: boolean; className?: string }) {
  const lang = useApp((s) => s.lang)
  const T = STRINGS[lang]
  const entry = REGISTRY[index]
  const [broken, setBroken] = useState(false)
  const name = lang === 'en' ? entry.nameEn : entry.name
  const alt = `${name}${reversed ? (lang === 'en' ? ' (reversed)' : '（逆位）') : ''}`
  if (broken) {
    return (
      <span className={`card-face card-face-fallback ${reversed ? 'is-reversed' : ''} ${className}`} role="img" aria-label={`${alt} — ${T.imgFallback}`}>
        <span className="card-back-star">✦</span>
        <span className="fallback-name">{name}</span>
      </span>
    )
  }
  return (
    <img
      className={`card-face ${reversed ? 'is-reversed' : ''} ${className}`}
      src={`${import.meta.env.BASE_URL}cards/${entry.id}.jpg`}
      alt={alt}
      width={480}
      height={800}
      loading="lazy"
      onError={() => setBroken(true)}
    />
  )
}

// 牌背（純 CSS 圖樣，避開 1971 版權牌背）
export function CardBack({ onClick, className = '', label }: { onClick?: () => void; className?: string; label?: string }) {
  const lang = useApp((s) => s.lang)
  const T = STRINGS[lang]
  return (
    <button type="button" className={`card-back ${className}`} onClick={onClick} aria-label={label ?? T.cardBackLabel} tabIndex={onClick ? 0 : -1}>
      <span className="card-back-star">✦</span>
    </button>
  )
}
