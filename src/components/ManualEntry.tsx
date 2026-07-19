import { useMemo, useState } from 'react'
import { REGISTRY, indexOfCard, type RegistryEntry } from '../content/registry'
import { getSpreads, SPREAD_SIZE } from '../content/positions'
import { SUIT_NAMES, SUIT_NAMES_EN } from '../content/types'
import type { DrawnCard } from '../lib/draw'
import type { DrawableSpread } from '../lib/share'
import { searchCards } from '../lib/search'
import { useApp } from '../state'
import { STRINGS } from '../lib/i18n'
import { CardFace } from './CardFace'

const TAB_KEYS = ['major', 'wands', 'cups', 'swords', 'pentacles'] as const

// 手動輸入：現實中抽了實體牌，逐位置選牌（含正逆位）後進共用結果頁
export function ManualEntry({ spread }: { spread: DrawableSpread }) {
  const openReading = useApp((s) => s.openReading)
  const lang = useApp((s) => s.lang)
  const T = STRINGS[lang]
  const def = getSpreads(lang)[spread]
  const need = SPREAD_SIZE[spread]

  const [question, setQuestion] = useState('')
  const [chosen, setChosen] = useState<DrawnCard[]>([])
  const [tab, setTab] = useState<(typeof TAB_KEYS)[number]>('major')
  const [query, setQuery] = useState('')
  const [pendingId, setPendingId] = useState<string | null>(null) // 已點牌、待選正逆位

  const usedIndexes = new Set(chosen.map((c) => c.index))
  const list: RegistryEntry[] = useMemo(
    () => (query.trim() ? searchCards(query) : REGISTRY.filter((e) => e.id.startsWith(tab))),
    [query, tab],
  )

  const tabLabel = (key: (typeof TAB_KEYS)[number]) =>
    key === 'major' ? T.tabMajor : lang === 'en' ? SUIT_NAMES_EN[key] : SUIT_NAMES[key]

  const cardName = (e: RegistryEntry) => (lang === 'en' ? e.nameEn : e.name)

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
      <h2 className="reading-title">{T.manualTitle}</h2>
      <p className="reading-intro">{T.manualIntro(def.name)}</p>
      <input
        className="question-input"
        placeholder={T.manualQuestionPlaceholder}
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
                {cardName(REGISTRY[chosen[i].index])}
                <span className={`ori-badge ${chosen[i].reversed ? 'rev' : 'up'}`}>
                  {chosen[i].reversed ? T.reversed : T.upright}
                </span>
              </span>
            ) : (
              <span className="slot-empty">{i === chosen.length ? T.pickForSlot : '—'}</span>
            )}
          </div>
        ))}
        {chosen.length > 0 && (
          <button type="button" className="btn subtle" onClick={() => setChosen(chosen.slice(0, -1))}>
            {T.undoPick}
          </button>
        )}
      </div>

      {chosen.length < need && (
        // 進度指示：多張牌陣（尤其凱爾特十字 10 張）逐張挑選時的定位感
        <p className="pick-progress">{T.pickProgress(chosen.length + 1, need)}</p>
      )}

      {pendingId ? (
        <div className="orientation-pick">
          <p className="pick-hint">{T.orientationAsk(cardName(REGISTRY[indexOfCard(pendingId)]))}</p>
          <div className="orientation-options">
            <button type="button" className="orientation-btn" onClick={() => confirmOrientation(false)}>
              <CardFace index={indexOfCard(pendingId)} reversed={false} />
              <span>{T.upright}</span>
            </button>
            <button type="button" className="orientation-btn" onClick={() => confirmOrientation(true)}>
              <CardFace index={indexOfCard(pendingId)} reversed={true} />
              <span>{T.reversed}</span>
            </button>
          </div>
          <button type="button" className="btn subtle" onClick={() => setPendingId(null)}>
            {T.switchCard}
          </button>
        </div>
      ) : (
        <>
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
                  key={t}
                  className={`btn tab ${tab === t ? 'active' : ''}`}
                  onClick={() => setTab(t)}
                >
                  {tabLabel(t)}
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
                  <span className="grid-name">{cardName(e)}</span>
                </button>
              )
            })}
            {list.length === 0 && <p className="pending-note">{T.noSearchHit}</p>}
          </div>
        </>
      )}
    </div>
  )
}
