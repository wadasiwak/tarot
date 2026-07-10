// 是非/二選一的傾向計分。
import type { Verdict } from '../content/types'

export const VERDICT_SCORE: Record<Verdict, number> = {
  yes: 2,
  leanYes: 1,
  neutral: 0,
  leanNo: -1,
  no: -2,
}

// 二選一：比較 A/B 兩張牌的 verdict 分數（文案由 UI 依語言決定）
export function compareChoice(a: Verdict, b: Verdict): 'A' | 'B' | 'tie' {
  const diff = VERDICT_SCORE[a] - VERDICT_SCORE[b]
  if (diff > 0) return 'A'
  if (diff < 0) return 'B'
  return 'tie'
}
