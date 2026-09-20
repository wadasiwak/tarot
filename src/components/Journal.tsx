import { useMemo, useRef, useState } from 'react'
import { backupFilename, exportBackup, importBackup } from '../lib/backup'
import { REGISTRY } from '../content/registry'
import { getSpreads, SPREAD_SIZE, type SpreadId } from '../content/positions'
import { computeStats } from '../lib/stats'
import { lastWriteFailed, loadDailyHistory, loadName, loadNames, renameDailyName, setDailyNote, streakOf, type SavedReading } from '../lib/storage'
import { todayStr } from '../lib/seed'
import { useApp } from '../state'
import { STRINGS } from '../lib/i18n'
import { CardFace } from './CardFace'

function monthKey(y: number, m: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}`
}

// 統一日誌：每日一牌月曆回顧＋連續打卡＋已收藏解讀清單（資料都在本機）
export function Journal() {
  const go = useApp((s) => s.go)
  const lang = useApp((s) => s.lang)
  const saved = useApp((s) => s.saved)
  const deleteSaved = useApp((s) => s.deleteSaved)
  const setSavedNote = useApp((s) => s.setSavedNote)
  const T = STRINGS[lang]
  const spreads = getSpreads(lang)
  const [who, setWho] = useState(loadName())
  const today = todayStr()
  const [cursor, setCursor] = useState(() => {
    const d = new Date()
    return { y: d.getFullYear(), m: d.getMonth() }
  })

  // 月曆點某天：下方展開該日牌＋心情筆記
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [dayNote, setDayNote] = useState('')
  const [dayNoteSaved, setDayNoteSaved] = useState(false)
  const [tick, setTick] = useState(0) // 存筆記後重讀每日史

  // 暱稱改名
  const [renaming, setRenaming] = useState(false)
  const [newName, setNewName] = useState('')

  // 收藏清單的展開/筆記/刪除確認
  const [expanded, setExpanded] = useState<string | null>(null)
  const [confirmDel, setConfirmDel] = useState<string | null>(null)
  const [noteDraft, setNoteDraft] = useState('')
  const [noteSaved, setNoteSaved] = useState(false)

  // 備份與還原
  const fileRef = useRef<HTMLInputElement>(null)
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge')
  const [backupMsg, setBackupMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const doExport = () => {
    const blob = new Blob([exportBackup(today)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = backupFilename(today)
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const doImport = async (file: File | undefined) => {
    if (!file) return
    if (importMode === 'replace' && !window.confirm(T.importConfirmReplace)) {
      if (fileRef.current) fileRef.current.value = ''
      return
    }
    try {
      const ok = importBackup(await file.text(), importMode)
      if (ok) {
        setBackupMsg({ ok: true, text: T.importOk })
        setTimeout(() => location.reload(), 600)
      } else setBackupMsg({ ok: false, text: T.importBad })
    } catch {
      setBackupMsg({ ok: false, text: T.importReadFail })
    }
    if (fileRef.current) fileRef.current.value = ''
  }

  // 抽牌統計（聚合每日史＋最近＋收藏；saved 增刪時重算）
  const stats = useMemo(() => computeStats(), [saved]) // eslint-disable-line react-hooks/exhaustive-deps

  const allHistory = useMemo(() => loadDailyHistory(), [tick, who]) // eslint-disable-line react-hooks/exhaustive-deps
  const history = allHistory[who.trim()] ?? {}
  const names = ['', ...loadNames().filter(Boolean)]
  const streak = streakOf(who, today)
  const showChips = names.length > 1 || Object.keys(allHistory[''] ?? {}).length > 0

  const first = new Date(cursor.y, cursor.m, 1)
  const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate()
  const blanks = first.getDay()
  const prefix = monthKey(cursor.y, cursor.m)

  const doRename = () => {
    const to = newName.trim()
    if (!to) return
    renameDailyName(who, to)
    setWho(to)
    setRenaming(false)
  }

  const cardSummary = (e: SavedReading) =>
    e.cards
      .map((c) => `${lang === 'en' ? REGISTRY[c.index].nameEn : REGISTRY[c.index].name}${c.reversed ? T.revShort : ''}`)
      .join(lang === 'en' ? ', ' : '、')

  const openSaved = (e: SavedReading) =>
    e.spread === 'daily'
      ? go({ name: 'daily', date: e.at })
      : go({ name: 'reading', spread: e.spread, cards: e.cards, question: e.question })

  return (
    <div className="journal">
      <h2 className="reading-title">{T.journalTitle}</h2>
      <p className="reading-intro">
        {T.journalIntro}
        {streak > 0 && <span className="streak-badge">{T.journalStreak(streak)}</span>}
      </p>

      {showChips && (
        <div className="name-chips">
          {names.map((n) => (
            <button
              type="button"
              key={n || '_'}
              className={`btn tab ${who.trim() === n ? 'active' : ''}`}
              onClick={() => {
                setWho(n)
                setRenaming(false)
              }}
            >
              {n || T.noName}
            </button>
          ))}
          {!renaming && (
            <button
              type="button"
              className="btn subtle rename-btn"
              onClick={() => {
                setRenaming(true)
                setNewName(who.trim())
              }}
            >
              {T.renameBtn}
            </button>
          )}
        </div>
      )}

      {renaming && (
        <div className="rename-box">
          <div className="rename-row">
            <span className="rename-from">{who.trim() || T.noName} →</span>
            <input
              className="question-input rename-input"
              placeholder={T.renamePlaceholder}
              value={newName}
              maxLength={20}
              onChange={(e) => setNewName(e.target.value)}
            />
            <button type="button" className="btn primary" disabled={!newName.trim() || newName.trim() === who.trim()} onClick={doRename}>
              {T.renameOk}
            </button>
            <button type="button" className="btn" onClick={() => setRenaming(false)}>
              {T.renameCancel}
            </button>
          </div>
          <p className="rename-note">{T.renameNote}</p>
        </div>
      )}

      <div className="cal-head">
        <button type="button" className="btn subtle" onClick={() => setCursor(({ y, m }) => (m === 0 ? { y: y - 1, m: 11 } : { y, m: m - 1 }))}>
          {T.prevMonth}
        </button>
        <span className="cal-title">{T.monthTitle(cursor.y, cursor.m + 1)}</span>
        <button type="button" className="btn subtle" onClick={() => setCursor(({ y, m }) => (m === 11 ? { y: y + 1, m: 0 } : { y, m: m + 1 }))}>
          {T.nextMonth}
        </button>
      </div>

      <div className="cal-grid">
        {T.weekdays.map((w) => (
          <div className="cal-weekday" key={w}>
            {w}
          </div>
        ))}
        {Array.from({ length: blanks }, (_, i) => (
          <div className="cal-cell empty" key={`b${i}`} />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const date = `${prefix}-${String(i + 1).padStart(2, '0')}`
          const rec = history[date]
          const isToday = date === today
          return (
            <button
              type="button"
              className={`cal-cell ${rec ? 'has-card' : ''} ${isToday ? 'today' : ''}`}
              key={date}
              onClick={() => {
                if (!rec) return
                setSelectedDay(selectedDay === date ? null : date)
                setDayNote(rec.note ?? '')
                setDayNoteSaved(false)
              }}
              disabled={!rec}
              aria-expanded={selectedDay === date}
            >
              <span className="cal-day">{i + 1}</span>
              {rec && (
                <span className="cal-card-name">
                  {lang === 'en' ? REGISTRY[rec.index].nameEn : REGISTRY[rec.index].name}
                  {rec.reversed ? T.revShort : ''}
                </span>
              )}
              {rec?.note && <span className="cal-note-dot" aria-hidden="true" />}
            </button>
          )
        })}
      </div>
      {!Object.keys(history).some((d) => d.startsWith(prefix)) && <p className="saved-empty cal-empty">{T.calEmpty}</p>}

      {selectedDay && history[selectedDay] && (
        <div className="cal-day-panel">
          <div className="cal-day-thumb">
            <CardFace index={history[selectedDay].index} reversed={history[selectedDay].reversed} />
          </div>
          <div className="cal-day-body">
            <p className="card-caption small">
              <span className="recent-date">{selectedDay}</span>
              {lang === 'en' ? REGISTRY[history[selectedDay].index].nameEn : REGISTRY[history[selectedDay].index].name}
              <span className={`ori-badge ${history[selectedDay].reversed ? 'rev' : 'up'}`}>{history[selectedDay].reversed ? T.reversed : T.upright}</span>
            </p>
            <textarea
              className="note-input"
              placeholder={T.dailyNoteHint}
              value={dayNote}
              maxLength={500}
              rows={2}
              onChange={(ev) => {
                setDayNote(ev.target.value)
                setDayNoteSaved(false)
              }}
            />
            <div className="saved-actions">
              <button
                type="button"
                className="btn subtle save-note"
                onClick={() => {
                  setDailyNote(who, selectedDay, dayNote)
                  setDayNoteSaved(true)
                  setTick((t) => t + 1)
                }}
              >
                {dayNoteSaved ? (lastWriteFailed() ? T.saveFailed : T.noteSaved) : T.saveNote}
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => go({ name: 'detail', id: REGISTRY[history[selectedDay].index].id, reversed: history[selectedDay].reversed })}
              >
                {T.fullMeaning}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="reading-actions">
        <button type="button" className="btn primary" onClick={() => go({ name: 'daily' })}>
          {T.goDrawToday}
        </button>
      </div>

      <div className="stats-section">
        <h3 className="saved-title">{T.statsTitle}</h3>
        {stats.readings < 10 ? (
          <p className="saved-empty stats-few">{T.statsFew}</p>
        ) : (
          <div className="stats-body">
            <div className="study-stats stats-tiles">
              <div className="stat-box">
                <span className="stat-num">{stats.readings}</span>
                <span className="stat-label">{T.statsReadings}</span>
              </div>
              <div className="stat-box">
                <span className="stat-num">{stats.cardsTotal}</span>
                <span className="stat-label">{T.statsCardsFlipped}</span>
              </div>
            </div>

            <p className="stats-sub">{T.statsOriTitle}</p>
            <div className="ori-bar" role="img" aria-label={`${T.upright} ${stats.upright} / ${T.reversed} ${stats.reversed}`}>
              <span className="ori-bar-up" style={{ width: `${(stats.upright / Math.max(1, stats.cardsTotal)) * 100}%` }} />
            </div>
            <p className="ori-bar-legend">
              <span className="ori-up-text">
                {T.upright} {Math.round((stats.upright / Math.max(1, stats.cardsTotal)) * 100)}%（{stats.upright}）
              </span>
              <span className="ori-rev-text">
                {T.reversed} {Math.round((stats.reversed / Math.max(1, stats.cardsTotal)) * 100)}%（{stats.reversed}）
              </span>
            </p>

            <p className="stats-sub">{T.statsSpreadTitle}</p>
            <div className="spread-chips">
              {(Object.keys(SPREAD_SIZE) as SpreadId[])
                .filter((s) => (stats.spreads[s] ?? 0) > 0)
                .map((s) => (
                  <span className="spread-chip" key={s}>
                    {spreads[s].name} × {stats.spreads[s]}
                  </span>
                ))}
            </div>

            <p className="stats-sub">{T.statsTopTitle}</p>
            <div className="top-cards">
              {stats.top.map((t, rank) => (
                <button
                  type="button"
                  className="top-card-row"
                  key={t.index}
                  onClick={() => go({ name: 'detail', id: REGISTRY[t.index].id, reversed: false })}
                >
                  <span className="top-rank">{rank + 1}</span>
                  <span className="top-name">{lang === 'en' ? REGISTRY[t.index].nameEn : REGISTRY[t.index].name}</span>
                  <span className="top-bar-track">
                    <span className="top-bar" style={{ width: `${(t.count / stats.top[0].count) * 100}%` }} />
                  </span>
                  <span className="top-count">× {t.count}</span>
                </button>
              ))}
            </div>
            <p className="rename-note">{T.statsNote}</p>
          </div>
        )}
      </div>

      <div className="saved-list">
        <h3 className="saved-title">{T.savedListTitle}</h3>
        {saved.length === 0 && <p className="saved-empty">{T.savedEmpty}</p>}
        {saved.map((e) => {
          const open = expanded === e.id
          return (
            <div className={`saved-item ${open ? 'open' : ''}`} key={e.id}>
              <button
                type="button"
                className="saved-head"
                onClick={() => {
                  setExpanded(open ? null : e.id)
                  setConfirmDel(null)
                  if (!open) {
                    setNoteDraft(e.note ?? '')
                    setNoteSaved(false)
                  }
                }}
              >
                <span className="recent-date">{e.at}</span>
                <span className="recent-spread">{spreads[e.spread].name}</span>
                <span className="recent-cards">{cardSummary(e)}</span>
                <span className="saved-caret">{open ? '▾' : '▸'}</span>
              </button>
              {open && (
                <div className="saved-body">
                  {e.question && <p className="recent-q">「{e.question}」</p>}
                  <div className="saved-cards-row">
                    {e.cards.map((c) => (
                      <div className="saved-card-thumb" key={c.index}>
                        <CardFace index={c.index} reversed={c.reversed} />
                      </div>
                    ))}
                  </div>
                  <textarea
                    className="note-input"
                    placeholder={T.notePlaceholder}
                    value={noteDraft}
                    maxLength={500}
                    rows={3}
                    onChange={(ev) => {
                      setNoteDraft(ev.target.value)
                      setNoteSaved(false)
                    }}
                  />
                  <div className="saved-actions">
                    <button
                      type="button"
                      className="btn subtle save-note"
                      onClick={() => {
                        setSavedNote(e.id, noteDraft)
                        setNoteSaved(true)
                      }}
                    >
                      {noteSaved ? (lastWriteFailed() ? T.saveFailed : T.noteSaved) : T.saveNote}
                    </button>
                    <button type="button" className="btn open-saved" onClick={() => openSaved(e)}>
                      {T.openSaved}
                    </button>
                    {confirmDel === e.id ? (
                      <button
                        type="button"
                        className="btn danger confirm-delete"
                        onClick={() => {
                          deleteSaved(e.id)
                          setConfirmDel(null)
                          setExpanded(null)
                        }}
                      >
                        {T.confirmDelete}
                      </button>
                    ) : (
                      <button type="button" className="btn subtle delete-saved" onClick={() => setConfirmDel(e.id)}>
                        {T.deleteEntry}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="backup-section">
        <h3 className="saved-title">{T.backupTitle}</h3>
        <p className="saved-empty">{T.backupIntro}</p>
        <div className="reading-actions">
          <button type="button" className="btn export-backup" onClick={doExport}>
            {T.exportBtn}
          </button>
          <button type="button" className="btn import-backup" onClick={() => fileRef.current?.click()}>
            {T.importBtn}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="import-file"
            hidden
            onChange={(e) => void doImport(e.target.files?.[0])}
          />
        </div>
        <div className="import-modes">
          <label>
            <input type="radio" name="import-mode" checked={importMode === 'merge'} onChange={() => setImportMode('merge')} /> {T.importMerge}
          </label>
          <label>
            <input type="radio" name="import-mode" checked={importMode === 'replace'} onChange={() => setImportMode('replace')} /> {T.importReplace}
          </label>
        </div>
        {backupMsg && (
          <p className={`backup-msg ${backupMsg.ok ? 'ok' : 'bad'}`} role="status">
            {backupMsg.text}
          </p>
        )}
      </div>
    </div>
  )
}
