import { REGISTRY } from '../content/registry'
import { SPREADS } from '../content/positions'
import { useApp } from '../state'
import type { DrawableSpread } from '../lib/share'

const MODES: { spread: DrawableSpread; emoji: string; desc: string }[] = [
  { spread: 'three', emoji: '🃏', desc: '過去・現在・未來，看一件事的來龍去脈' },
  { spread: 'relation', emoji: '💞', desc: '我・對方・走向，看一段關係的兩端' },
  { spread: 'yesno', emoji: '⚖️', desc: '心裡想好一個是非題，抽一張看傾向' },
  { spread: 'choice', emoji: '🔀', desc: '兩個選項各抽一張，比較兩邊能量' },
]

export function Home() {
  const go = useApp((s) => s.go)
  const recent = useApp((s) => s.recent)
  const clearHistory = useApp((s) => s.clearHistory)

  return (
    <div className="home">
      <div className="hero">
        <p className="hero-title">想問什麼，就讓牌說話</p>
        <p className="hero-sub">線上抽牌，或輸入你實體抽到的牌——78 張偉特塔羅全收錄，含正逆位解讀。</p>
      </div>

      <button type="button" className="daily-card" onClick={() => go({ name: 'daily' })}>
        <span className="daily-label">🌙 每日一牌</span>
        <span className="daily-line">翻開今天專屬於你的指引</span>
      </button>

      <div className="mode-cards">
        {MODES.map((m) => (
          <div className="mode-card" key={m.spread}>
            <h3>
              {m.emoji} {SPREADS[m.spread].name}
            </h3>
            <p className="mode-desc">{m.desc}</p>
            <div className="mode-actions">
              <button type="button" className="btn primary" onClick={() => go({ name: 'draw', spread: m.spread })}>
                線上抽牌
              </button>
              <button type="button" className="btn" onClick={() => go({ name: 'manual', spread: m.spread })}>
                輸入實體牌
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="home-links">
        <button type="button" className="browse-link" onClick={() => go({ name: 'browse' })}>
          📖 塔羅牌庫——78 張牌義隨時查
        </button>
        <button type="button" className="browse-link" onClick={() => go({ name: 'learn' })}>
          🎓 塔羅小學堂——十分鐘看懂花色與正逆位
        </button>
        <button type="button" className="browse-link" onClick={() => go({ name: 'journal' })}>
          📅 每日回顧——月曆看你翻過的牌
        </button>
      </div>

      {recent.length > 0 && (
        <div className="recent">
          <div className="recent-head">
            <h3>最近的抽牌</h3>
            <button type="button" className="btn subtle" onClick={clearHistory}>
              清除
            </button>
          </div>
          {recent.map((e, i) => (
            <button
              type="button"
              className="recent-item"
              key={i}
              onClick={() =>
                e.spread === 'daily'
                  ? go({ name: 'daily', date: e.at })
                  : go({ name: 'reading', spread: e.spread, cards: e.cards, question: e.question })
              }
            >
              <span className="recent-date">{e.at}</span>
              <span className="recent-spread">{e.spread === 'daily' ? '每日一牌' : SPREADS[e.spread].name}</span>
              <span className="recent-cards">
                {e.cards.map((c) => `${REGISTRY[c.index].name}${c.reversed ? '(逆)' : ''}`).join('、')}
              </span>
              {e.question && <span className="recent-q">「{e.question}」</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
