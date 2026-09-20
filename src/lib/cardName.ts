// 牌名本地化：一處決定「中文介面顯示 name、英文介面顯示 nameEn」，
// 以及牌陣摘要（牌名＋逆位短標、依語言用「、」或「, 」串接）。
import { REGISTRY, type RegistryEntry } from '../content/registry'
import type { DrawnCard } from './draw'
import { STRINGS, type Lang } from './i18n'

export function cardName(entry: RegistryEntry, lang: Lang): string {
  return lang === 'en' ? entry.nameEn : entry.name
}

// 另一語言的牌名（詳情頁／記憶卡副標）
export function cardNameAlt(entry: RegistryEntry, lang: Lang): string {
  return lang === 'en' ? entry.name : entry.nameEn
}

export function cardNameAt(index: number, lang: Lang): string {
  return cardName(REGISTRY[index], lang)
}

// 「愚者、魔術師(逆)、女祭司」／「The Fool, The Magician (rev), The High Priestess」
export function cardSummary(cards: DrawnCard[], lang: Lang): string {
  const rev = STRINGS[lang].revShort
  return cards.map((c) => `${cardNameAt(c.index, lang)}${c.reversed ? rev : ''}`).join(lang === 'en' ? ', ' : '、')
}
