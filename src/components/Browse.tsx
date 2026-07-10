import { useMemo, useState } from 'react'
import { REGISTRY, indexOfCard, type RegistryEntry } from '../content/registry'
import { searchCards } from '../lib/search'
import { useApp } from '../state'
import { CardFace } from './CardFace'

const TABS = [
  { key: '', label: '全部' },
  { key: 'major', label: '大牌' },
  { key: 'wands', label: '權杖' },
  { key: 'cups', label: '聖杯' },
  { key: 'swords', label: '寶劍' },
  { key: 'pentacles', label: '錢幣' },
] as const

// 78 張牌庫
export function Browse() {
  const go = useApp((s) => s.go)
  const [tab, setTab] = useState('')
  const [query, setQuery] = useState('')

  const list: RegistryEntry[] = useMemo(() => {
    if (query.trim()) return searchCards(query)
    return tab ? REGISTRY.filter((e) => e.id.startsWith(tab)) : REGISTRY
  }, [query, tab])

  return (
    <div className="browse">
      <h2 className="reading-title">塔羅牌庫</h2>
      <p className="reading-intro">偉特塔羅 78 張，點任何一張看完整牌義（含正逆位）。</p>
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
      <div className="card-grid browse-grid">
        {list.map((e) => (
          <button
            type="button"
            key={e.id}
            className="grid-cell"
            onClick={() => go({ name: 'detail', id: e.id, reversed: false })}
          >
            <CardFace index={indexOfCard(e.id)} reversed={false} />
            <span className="grid-name">{e.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
