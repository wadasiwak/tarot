import { useMemo, useState } from 'react'
import { REGISTRY, indexOfCard, type RegistryEntry } from '../content/registry'
import { SUIT_NAMES, SUIT_NAMES_EN } from '../content/types'
import { searchCards } from '../lib/search'
import { useApp } from '../state'
import { STRINGS } from '../lib/i18n'
import { CardFace } from './CardFace'

const TAB_KEYS = ['', 'major', 'wands', 'cups', 'swords', 'pentacles'] as const

// 78 張牌庫
export function Browse() {
  const go = useApp((s) => s.go)
  const lang = useApp((s) => s.lang)
  const T = STRINGS[lang]
  const [tab, setTab] = useState('')
  const [query, setQuery] = useState('')

  const list: RegistryEntry[] = useMemo(() => {
    if (query.trim()) return searchCards(query)
    return tab ? REGISTRY.filter((e) => e.id.startsWith(tab)) : REGISTRY
  }, [query, tab])

  const tabLabel = (key: (typeof TAB_KEYS)[number]) => {
    if (key === '') return T.tabAll
    if (key === 'major') return T.tabMajor
    return lang === 'en' ? SUIT_NAMES_EN[key] : SUIT_NAMES[key]
  }

  return (
    <div className="browse">
      <h2 className="reading-title">{T.browseTitle}</h2>
      <p className="reading-intro">{T.browseIntro}</p>
      <input
        className="search-input"
        placeholder={T.searchPlaceholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {!query.trim() && (
        <div className="suit-tabs">
          {TAB_KEYS.map((t) => (
            <button
              type="button"
              key={t || '_all'}
              className={`btn tab ${tab === t ? 'active' : ''}`}
              onClick={() => setTab(t)}
            >
              {tabLabel(t)}
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
            <span className="grid-name">{lang === 'en' ? e.nameEn : e.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
