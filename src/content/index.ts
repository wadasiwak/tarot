// 內容 registry 組裝：串接 10 個批次檔，依 registry.ts 順序排序。
// 批次檔還沒產完時自動跳過缺的牌（骨架先行、內容漸進）。
import type { TarotCard } from './types'
import { REGISTRY, indexOfCard } from './registry'
import { major0010 } from './major-00-10'
import { major1121 } from './major-11-21'
import { wands0107 } from './wands-01-07'
import { wands0814 } from './wands-08-14'
import { cups0107 } from './cups-01-07'
import { cups0814 } from './cups-08-14'
import { swords0107 } from './swords-01-07'
import { swords0814 } from './swords-08-14'
import { pentacles0107 } from './pentacles-01-07'
import { pentacles0814 } from './pentacles-08-14'

const all: TarotCard[] = [
  ...major0010,
  ...major1121,
  ...wands0107,
  ...wands0814,
  ...cups0107,
  ...cups0814,
  ...swords0107,
  ...swords0814,
  ...pentacles0107,
  ...pentacles0814,
].sort((a, b) => indexOfCard(a.id) - indexOfCard(b.id))

const byId = new Map(all.map((c) => [c.id, c]))

export const CARDS = all

export function getCard(id: string): TarotCard | undefined {
  return byId.get(id)
}

// 依 registry index（0–77，分享連結編碼用）取牌；內容未到齊時可能回 undefined
export function byIndex(index: number): TarotCard | undefined {
  const entry = REGISTRY[index]
  return entry ? byId.get(entry.id) : undefined
}
