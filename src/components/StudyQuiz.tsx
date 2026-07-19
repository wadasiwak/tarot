// 四選一測驗：偶數題看牌圖選正位關鍵字、奇數題看關鍵字選牌名，10 題一輪。
// ⚠️ 選項順序在「題目顯示時」才 shuffle（useMemo keyed by 題號），不在出題時預排。
// 答錯的牌以 again 加重 SRS 權重（recordQuizAnswer）。
import { useMemo, useState } from 'react'
import { REGISTRY, indexOfCard } from '../content/registry'
import { getCard } from '../content'
import { useApp } from '../state'
import { STRINGS } from '../lib/i18n'
import { todayStr } from '../lib/seed'
import { recordQuizAnswer } from '../lib/storage'
import { CardFace } from './CardFace'

const ROUND_SIZE = 10
const OPTION_COUNT = 4

function shuffle<T>(list: T[]): T[] {
  const a = [...list]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

interface QuizQ {
  id: string // 正解牌
  kind: 'kw' | 'name' // kw=看牌圖選關鍵字；name=看關鍵字選牌
  optionIds: string[] // 含正解共 4 張，未排序（顯示時才 shuffle）
}

function buildRound(): QuizQ[] {
  const ids = REGISTRY.map((e) => e.id).filter((id) => getCard(id))
  return shuffle(ids)
    .slice(0, ROUND_SIZE)
    .map((id, i) => {
      const distractors = shuffle(ids.filter((x) => x !== id)).slice(0, OPTION_COUNT - 1)
      return { id, kind: i % 2 === 0 ? ('kw' as const) : ('name' as const), optionIds: [id, ...distractors] }
    })
}

export function StudyQuiz({ onExit }: { onExit: () => void }) {
  const lang = useApp((s) => s.lang)
  const T = STRINGS[lang]
  const [round, setRound] = useState(buildRound)
  const [qi, setQi] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)

  const q = round[qi]
  // 選項顯示時才 shuffle：只跟「這一輪的這一題」綁定
  const options = useMemo(() => (q ? shuffle(q.optionIds) : []), [q])

  const kwOf = (id: string) => (getCard(id, lang)?.upright.keywords ?? []).join(lang === 'en' ? ' / ' : '・')
  const nameOf = (id: string) => {
    const e = REGISTRY[indexOfCard(id)]
    return lang === 'en' ? e.nameEn : e.name
  }

  if (finished) {
    const allRight = score === round.length
    return (
      <div className="study-session">
        <div className="study-done quiz-done">
          <p className="session-done-title">📝 {T.quizResult(score, round.length)}</p>
          <p className="session-done-note">{allRight ? T.quizAllRight : T.quizWrongNote}</p>
          <div className="quiz-done-actions">
            <button
              type="button"
              className="btn primary"
              onClick={() => {
                setRound(buildRound())
                setQi(0)
                setPicked(null)
                setScore(0)
                setFinished(false)
              }}
            >
              {T.quizAgain}
            </button>
            <button type="button" className="btn" onClick={onExit}>
              {T.backToStudy}
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!q) return null

  const pick = (id: string) => {
    if (picked) return // 已作答，鎖定
    setPicked(id)
    const correct = id === q.id
    if (correct) setScore((s) => s + 1)
    recordQuizAnswer(q.id, correct, todayStr())
  }

  const next = () => {
    setPicked(null)
    if (qi + 1 >= round.length) setFinished(true)
    else setQi(qi + 1)
  }

  return (
    <div className="study-session quiz">
      <div className="study-top">
        <button type="button" className="btn subtle" onClick={onExit}>
          {T.leave}
        </button>
        <span className="study-left">{T.quizQNum(qi + 1, round.length)}</span>
      </div>

      <div className="quiz-question">
        {q.kind === 'kw' ? (
          <>
            <p className="quiz-ask">{T.quizAskKw}</p>
            <div className="quiz-card-img">
              <CardFace index={indexOfCard(q.id)} reversed={false} />
            </div>
            <p className="study-card-name">{nameOf(q.id)}</p>
          </>
        ) : (
          <>
            <p className="quiz-ask">{T.quizAskName}</p>
            <p className="quiz-kw-prompt">{(getCard(q.id, lang)?.upright.keywords ?? []).map((k) => `#${k}`).join(' ')}</p>
          </>
        )}
      </div>

      <div className="quiz-options">
        {options.map((id) => {
          const cls =
            picked === null
              ? ''
              : id === q.id
                ? 'correct'
                : id === picked
                  ? 'wrong'
                  : 'dim'
          return (
            <button key={id} type="button" className={`quiz-option ${cls}`} onClick={() => pick(id)} disabled={picked !== null && id !== q.id && id !== picked}>
              {q.kind === 'kw' ? kwOf(id) : nameOf(id)}
            </button>
          )
        })}
      </div>

      {picked !== null && (
        <button type="button" className="btn primary quiz-next" onClick={next}>
          {qi + 1 >= round.length ? T.quizFinish : T.quizNext}
        </button>
      )}
    </div>
  )
}
