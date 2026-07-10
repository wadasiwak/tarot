// 是非/二選一的傾向計分與文案。
import type { Verdict } from '../content/types'

export const VERDICT_SCORE: Record<Verdict, number> = {
  yes: 2,
  leanYes: 1,
  neutral: 0,
  leanNo: -1,
  no: -2,
}

// 二選一：比較 A/B 兩張牌的 verdict 分數
export function compareChoice(a: Verdict, b: Verdict): string {
  const diff = VERDICT_SCORE[a] - VERDICT_SCORE[b]
  if (diff > 0) return '牌面能量偏向選項 A，但請把兩邊的理由都讀完再問自己的心。'
  if (diff < 0) return '牌面能量偏向選項 B，但請把兩邊的理由都讀完再問自己的心。'
  return '兩邊勢均力敵——這時候答案不在牌裡，在你讀完兩段理由後心裡浮現的那個直覺。'
}
