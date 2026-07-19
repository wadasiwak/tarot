// 簡化 SM-2 間隔複習（移植自 nihongo-quest，改三鍵評分）——純函式，方便測試。
// 評分：again=忘了（回到今天）、hard=模糊（間隔微增）、good=記得（間隔 × ease）。

export type Rating = 'again' | 'hard' | 'good'

export interface SrsEntry {
  /** 難易係數，夾 1.3~2.8 */
  ease: number
  /** 間隔天數 */
  interval: number
  /** 下次到期日 YYYY-MM-DD */
  due: string
  reps: number
  lapses: number
}

export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + days)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

const clampEase = (e: number) => Math.min(2.8, Math.max(1.3, e))

export function newEntry(today: string): SrsEntry {
  return { ease: 2.5, interval: 0, due: today, reps: 0, lapses: 0 }
}

export function review(entry: SrsEntry, rating: Rating, today: string): SrsEntry {
  let { ease, interval } = entry
  let { reps, lapses } = entry
  reps += 1
  if (rating === 'again') {
    lapses += 1
    ease = clampEase(ease - 0.2)
    interval = 0 // 今天內重現
  } else if (rating === 'hard') {
    ease = clampEase(ease - 0.15)
    interval = Math.max(1, Math.round(Math.max(1, interval) * 1.2))
  } else {
    interval = interval <= 0 ? 1 : Math.max(interval + 1, Math.round(interval * ease))
  }
  return { ease, interval, due: addDays(today, interval), reps, lapses }
}

/** 掌握門檻：間隔撐過三週視為已掌握（進度儀表用） */
export const MASTERED_INTERVAL = 21
