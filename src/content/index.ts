// 內容 registry 組裝：中英文各串接 10 個批次檔，依 registry.ts 順序排序。
// 批次檔還沒產完時自動跳過缺的牌（骨架先行、內容漸進）；英文缺牌時 fallback 中文。
import type { TarotCard } from './types'
import type { Lang } from '../lib/i18n'
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
import { major0010 as enMajor0010 } from './en/major-00-10'
import { major1121 as enMajor1121 } from './en/major-11-21'
import { wands0107 as enWands0107 } from './en/wands-01-07'
import { wands0814 as enWands0814 } from './en/wands-08-14'
import { cups0107 as enCups0107 } from './en/cups-01-07'
import { cups0814 as enCups0814 } from './en/cups-08-14'
import { swords0107 as enSwords0107 } from './en/swords-01-07'
import { swords0814 as enSwords0814 } from './en/swords-08-14'
import { pentacles0107 as enPentacles0107 } from './en/pentacles-01-07'
import { pentacles0814 as enPentacles0814 } from './en/pentacles-08-14'

function assemble(batches: TarotCard[][]): { list: TarotCard[]; byId: Map<string, TarotCard> } {
  const list = batches.flat().sort((a, b) => indexOfCard(a.id) - indexOfCard(b.id))
  return { list, byId: new Map(list.map((c) => [c.id, c])) }
}

const zh = assemble([
  major0010, major1121,
  wands0107, wands0814,
  cups0107, cups0814,
  swords0107, swords0814,
  pentacles0107, pentacles0814,
])

const en = assemble([
  enMajor0010, enMajor1121,
  enWands0107, enWands0814,
  enCups0107, enCups0814,
  enSwords0107, enSwords0814,
  enPentacles0107, enPentacles0814,
])

export const CARDS = zh.list

export function getCard(id: string, lang: Lang = 'zh'): TarotCard | undefined {
  if (lang === 'en') return en.byId.get(id) ?? zh.byId.get(id) // 英文缺牌 fallback 中文
  return zh.byId.get(id)
}

// 依 registry index（0–77，分享連結編碼用）取牌；內容未到齊時可能回 undefined
export function byIndex(index: number, lang: Lang = 'zh'): TarotCard | undefined {
  const entry = REGISTRY[index]
  return entry ? getCard(entry.id, lang) : undefined
}
