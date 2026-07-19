// 牌義學習：SM-2 記憶卡（正逆位同卡兩面：正面牌圖＋牌名，翻面正位關鍵字＋核心牌義＋逆位關鍵字）
// ＋四選一測驗。進度只存本機（tarot.study.v1），絕不進 URL / analytics。
import { useEffect, useMemo, useState } from 'react'
import { REGISTRY, indexOfCard } from '../content/registry'
import { getCard } from '../content'
import { useApp } from '../state'
import { STRINGS } from '../lib/i18n'
import { todayStr } from '../lib/seed'
import { MASTERED_INTERVAL, type Rating } from '../lib/srs'
import { loadStudy, rateStudy } from '../lib/storage'
import { CardFace } from './CardFace'
import { StudyQuiz } from './StudyQuiz'

const NEW_CARD_LIMIT = 10
const RATINGS: Rating[] = ['again', 'hard', 'good']

// 佇列＝到期卡（due 早→晚）＋新卡（registry 順序，本輪上限 10 張）
function buildQueue(): { queue: string[]; newIds: Set<string> } {
  const srs = loadStudy().srs
  const today = todayStr()
  const ids = REGISTRY.map((e) => e.id).filter((id) => getCard(id)) // 只收有內容的牌
  const due = ids.filter((id) => srs[id] && srs[id].due <= today).sort((a, b) => srs[a].due.localeCompare(srs[b].due))
  const fresh = ids.filter((id) => !srs[id]).slice(0, NEW_CARD_LIMIT)
  return { queue: [...due, ...fresh], newIds: new Set(fresh) }
}

function FlashcardSession({ onExit }: { onExit: () => void }) {
  const lang = useApp((s) => s.lang)
  const go = useApp((s) => s.go)
  const T = STRINGS[lang]
  const [init] = useState(buildQueue)
  const [queue, setQueue] = useState(init.queue)
  const [flipped, setFlipped] = useState(false)
  const [done, setDone] = useState({ review: 0, fresh: 0 })

  const id = queue[0]
  const card = id ? getCard(id, lang) : undefined

  const handleRate = (rating: Rating) => {
    if (!id) return
    rateStudy(id, rating, todayStr())
    setFlipped(false)
    if (rating === 'again') {
      setQueue((q) => [...q.slice(1), q[0]]) // 忘了的回佇列尾，今天再現
    } else {
      setQueue((q) => q.slice(1))
      setDone((d) => (init.newIds.has(id) ? { ...d, fresh: d.fresh + 1 } : { ...d, review: d.review + 1 }))
    }
  }

  // 鍵盤：空白／Enter 翻面，1~3 評分
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!id) return
      if (!flipped && (e.key === ' ' || e.key === 'Enter')) {
        e.preventDefault()
        setFlipped(true)
        return
      }
      if (flipped) {
        const i = ['1', '2', '3'].indexOf(e.key)
        if (i >= 0) handleRate(RATINGS[i])
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (init.queue.length === 0) {
    return (
      <div className="study-session">
        <div className="study-done">
          <p>{T.noCardsToday}</p>
          <button type="button" className="btn primary" onClick={onExit}>
            {T.backToStudy}
          </button>
        </div>
      </div>
    )
  }

  if (!id || !card) {
    return (
      <div className="study-session">
        <div className="study-done">
          <p className="session-done-title">{T.sessionDone}</p>
          <p className="session-done-num">
            {done.review}
            <small>{T.reviewedUnit}</small>　{done.fresh}
            <small>{T.freshUnit}</small>
          </p>
          <p className="session-done-note">{T.againNote}</p>
          <button type="button" className="btn primary" onClick={onExit}>
            {T.backToStudy}
          </button>
        </div>
      </div>
    )
  }

  const entry = REGISTRY[indexOfCard(id)]
  const RATE_LABEL: Record<Rating, string> = { again: T.rateAgain, hard: T.rateHard, good: T.rateGood }

  return (
    <div className="study-session">
      <div className="study-top">
        <button type="button" className="btn subtle" onClick={onExit}>
          {T.leave}
        </button>
        <span className="study-left">{T.deckLeft(queue.length)}</span>
      </div>

      <div
        className={`study-card ${flipped ? 'flipped' : ''}`}
        onClick={() => setFlipped((f) => !f)}
        role="button"
        aria-label={T.flipHint}
      >
        {!flipped ? (
          <div className="study-front">
            <div className="study-card-img">
              <CardFace index={indexOfCard(id)} reversed={false} />
            </div>
            <p className="study-card-name">
              {lang === 'en' ? entry.nameEn : entry.name} <span className="name-en">{lang === 'en' ? entry.name : entry.nameEn}</span>
            </p>
            <p className="study-flip-hint">{T.flipHint}</p>
          </div>
        ) : (
          <div className="study-back flip-in">
            <p className="study-card-name">
              {lang === 'en' ? entry.nameEn : entry.name} <span className="name-en">{lang === 'en' ? entry.name : entry.nameEn}</span>
            </p>
            <p className="study-kw">
              <span className="ori-badge up">{T.upright}</span> {card.upright.keywords.map((k) => `#${k}`).join(' ')}
            </p>
            <p className="study-core">{card.upright.core}</p>
            <p className="study-kw">
              <span className="ori-badge rev">{T.reversed}</span> {card.reversed.keywords.map((k) => `#${k}`).join(' ')}
            </p>
            <button
              type="button"
              className="btn subtle study-full"
              onClick={(e) => {
                e.stopPropagation()
                go({ name: 'detail', id, reversed: false })
              }}
            >
              {T.fullMeaningArrow}
            </button>
          </div>
        )}
      </div>

      {flipped ? (
        <div className="study-rates">
          {RATINGS.map((r, i) => (
            <button key={r} type="button" className={`btn rate-btn rate-${r}`} onClick={() => handleRate(r)}>
              {RATE_LABEL[r]}
              <small>{i + 1}</small>
            </button>
          ))}
        </div>
      ) : (
        <button type="button" className="btn primary big study-flip-btn" onClick={() => setFlipped(true)}>
          {T.flipToAnswer}
        </button>
      )}
    </div>
  )
}

// 學習首頁：進度儀表（已學/到期/掌握/未學＋測驗統計）＋兩種模式入口
export function Study() {
  const lang = useApp((s) => s.lang)
  const T = STRINGS[lang]
  const [mode, setMode] = useState<'home' | 'cards' | 'quiz'>('home')

  // 回到首頁時重讀進度（session 中的評分要反映在儀表上）
  const stats = useMemo(() => {
    const s = loadStudy()
    const today = todayStr()
    const entries = Object.values(s.srs)
    return {
      learned: entries.length,
      due: entries.filter((e) => e.due <= today).length,
      mastered: entries.filter((e) => e.interval >= MASTERED_INTERVAL).length,
      fresh: REGISTRY.length - entries.length,
      quiz: s.quiz,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  if (mode === 'cards') return <FlashcardSession onExit={() => setMode('home')} />
  if (mode === 'quiz') return <StudyQuiz onExit={() => setMode('home')} />

  const newInSession = Math.min(stats.fresh, NEW_CARD_LIMIT)

  return (
    <div className="study">
      <h2 className="reading-title">🧠 {T.studyTitle}</h2>
      <p className="reading-intro">{T.studyIntro}</p>

      <div className="study-stats">
        <div className="stat-box">
          <span className="stat-num">{stats.learned}</span>
          <span className="stat-label">{T.statLearned}</span>
        </div>
        <div className="stat-box stat-due">
          <span className="stat-num">{stats.due}</span>
          <span className="stat-label">{T.statDue}</span>
        </div>
        <div className="stat-box stat-mastered">
          <span className="stat-num">{stats.mastered}</span>
          <span className="stat-label">{T.statMastered}</span>
        </div>
        <div className="stat-box">
          <span className="stat-num">{stats.fresh}</span>
          <span className="stat-label">{T.statNew}</span>
        </div>
      </div>
      <div className="study-progress" aria-hidden="true">
        <div className="study-progress-fill" style={{ width: `${(stats.learned / REGISTRY.length) * 100}%` }} />
      </div>
      {stats.quiz.answered > 0 && <p className="quiz-stat">{T.quizStat(stats.quiz.correct, stats.quiz.answered)}</p>}

      <div className="study-modes">
        <button type="button" className="study-mode-card start-cards" onClick={() => setMode('cards')}>
          <span className="sm-title">{T.startCards}</span>
          <span className="sm-sub">{T.cardsStatus(stats.due, newInSession)}</span>
        </button>
        <button type="button" className="study-mode-card start-quiz" onClick={() => setMode('quiz')}>
          <span className="sm-title">{T.startQuiz}</span>
          <span className="sm-sub">{T.quizDesc}</span>
        </button>
      </div>
    </div>
  )
}
