import { useMemo, useState } from 'react'
import { REGISTRY, indexOfCard, type RegistryEntry } from '../content/registry'
import { SPREADS, SPREAD_SIZE } from '../content/positions'
import type { DrawnCard } from '../lib/draw'
import type { DrawableSpread } from '../lib/share'
import { searchCards } from '../lib/search'
import { useApp } from '../state'
import { CardFace } from './CardFace'

const TABS = [
  { key: 'major', label: '大牌' },
  { key: 'wands', label: '權杖' },
  { key: 'cups', label: '聖杯' },
  { key: 'swords', label: '寶劍' },
  { key: 'pentacles', label: '錢幣' },
] as const

// 手動輸入：現實中抽了實體牌，逐位置選牌（含正逆位）後進共用結果頁
export function ManualEntry({ spread }: { spread: DrawableSpread }) {
  const openReading = useApp((s) => s.openReading)
  const def = SPREADS[spread]
  const need = SPREAD_SIZE[spread]

  const [question, setQuestion] = useState('')
  const [chosen, setChosen] = useState<DrawnCard[]>([])
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('major')
  const [query, setQuery] = useState('')
  const [pendingId, setPendingId] = useState<string | null>(null) // 已點牌、待選正逆位

  const usedIndexes = new Set(chosen.map((c) => c.index))
  const list: RegistryEntry[] = useMemo(
    () => (query.trim() ? searchCards(query) : REGISTRY.filter((e) => e.id.startsWith(tab))),
    [query, tab],
  )

  const confirmOrientation = (reversed: boolean) => {
    if (!pendingId) return
    const index = indexOfCard(pendingId)
    const next = [...chosen, { index, reversed }]
    setPendingId(null)
    setQuery('')
    if (next.length === need) openReading(spread, next, question.trim() || undefined)
    else setChosen(next)
  }

  return (
    <div className="manual-entry">
      <h2 className="reading-title">輸入你抽到的牌</h2>
      <p className="reading-intro">
        {def.name}——在現實中抽好了牌？照抽牌順序在下面選出來，馬上看解讀。
      </p>
      <input
        className="question-input"
        placeholder="你問的問題（選填，不會出現在分享連結裡）"
        value={question}
        maxLength={60}
        onChange={(e) => setQuestion(e.target.value)}
      />

      <div className="manual-slots">
        {def.positions.map((p, i) => (
          <div className={`manual-slot ${i === chosen.length ? 'current' : ''}`} key={p.title}>
            <span className="slot-pos">{p.title}</span>
            {chosen[i] ? (
              <span className="slot-card">
                {REGISTRY[chosen[i].index].name}
                <span className={`ori-badge ${chosen[i].reversed ? 'rev' : 'up'}`}>
                  {chosen[i].reversed ? '逆位' : '正位'}
                </span>
              </span>
            ) : (
              <span className="slot-empty">{i === chosen.length ? '請選牌' : '—'}</span>
            )}
          </div>
        ))}
        {chosen.length > 0 && (
          <button type="button" className="btn subtle" onClick={() => setChosen(chosen.slice(0, -1))}>
            退回上一張
          </button>
        )}
      </div>

      {pendingId ? (
        <div className="orientation-pick">
          <p className="pick-hint">「{REGISTRY[indexOfCard(pendingId)].name}」是正位還是逆位？</p>
          <div className="orientation-options">
            <button type="button" className="orientation-btn" onClick={() => confirmOrientation(false)}>
              <CardFace index={indexOfCard(pendingId)} reversed={false} />
              <span>正位</span>
            </button>
            <button type="button" className="orientation-btn" onClick={() => confirmOrientation(true)}>
              <CardFace index={indexOfCard(pendingId)} reversed={true} />
              <span>逆位</span>
            </button>
          </div>
          <button type="button" className="btn subtle" onClick={() => setPendingId(null)}>
            換一張
          </button>
        </div>
      ) : (
        <>
          <input
            className="search-input"
            placeholder="搜尋：愚者 / fool / 權杖3⋯⋯"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {!query.trim() && (
            <div className="suit-tabs">
              {TABS.map((t) => (
                <button
                  type="button"
                  key={t.key}
                  className={`btn tab ${tab === t.key ? 'active' : ''}`}
                  onClick={() => setTab(t.key)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}
          <div className="card-grid">
            {list.map((e) => {
              const idx = indexOfCard(e.id)
              const used = usedIndexes.has(idx)
              return (
                <button
                  type="button"
                  key={e.id}
                  className={`grid-cell ${used ? 'used' : ''}`}
                  disabled={used}
                  onClick={() => setPendingId(e.id)}
                >
                  <CardFace index={idx} reversed={false} />
                  <span className="grid-name">{e.name}</span>
                </button>
              )
            })}
            {list.length === 0 && <p className="pending-note">找不到符合的牌，換個關鍵字試試。</p>}
          </div>
        </>
      )}
    </div>
  )
}
