// 抽牌統計：純聚合既有 localStorage（每日一牌史＋最近紀錄＋收藏），不新增任何寫入。
// 去重規則：最近與收藏可能是同一次抽牌 → 以 entryKey 去重；
// 每日一牌以 daily 史為準（每個名字×日期算一次），recent/saved 裡的 daily 條目跳過防重複計。
import type { SpreadId } from '../content/positions'
import { entryKey, loadDailyHistory, loadRecent, loadSaved } from './storage'

export interface DrawStats {
  readings: number // 累計抽牌次數（一次牌陣＝一次）
  cardsTotal: number // 翻過的牌張數
  upright: number
  reversed: number
  top: { index: number; count: number }[] // 最常抽到的牌 Top 5
  spreads: Partial<Record<SpreadId, number>> // 各牌陣使用次數
}

export function computeStats(): DrawStats {
  const cardCount = new Map<number, number>()
  const spreads: Partial<Record<SpreadId, number>> = {}
  let readings = 0
  let upright = 0
  let reversed = 0

  const countCard = (index: number, rev: boolean) => {
    cardCount.set(index, (cardCount.get(index) ?? 0) + 1)
    if (rev) reversed++
    else upright++
  }

  // 每日一牌：所有名字的所有日期
  for (const days of Object.values(loadDailyHistory())) {
    for (const rec of Object.values(days)) {
      readings++
      spreads.daily = (spreads.daily ?? 0) + 1
      countCard(rec.index, rec.reversed)
    }
  }

  // 最近＋收藏（entryKey 去重；daily 條目由上面計）
  const seen = new Set<string>()
  for (const e of [...loadRecent(), ...loadSaved()]) {
    if (e.spread === 'daily') continue
    const k = entryKey(e)
    if (seen.has(k)) continue
    seen.add(k)
    readings++
    spreads[e.spread] = (spreads[e.spread] ?? 0) + 1
    for (const c of e.cards) countCard(c.index, c.reversed)
  }

  const top = [...cardCount.entries()]
    .map(([index, count]) => ({ index, count }))
    .sort((a, b) => b.count - a.count || a.index - b.index)
    .slice(0, 5)

  return { readings, cardsTotal: upright + reversed, upright, reversed, top, spreads }
}
