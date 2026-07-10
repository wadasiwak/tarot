// 選牌器/牌庫搜尋：中文名、英文名、編號（「愚者」「fool」「權杖3」「權杖三」都要命中）
import { REGISTRY, type RegistryEntry } from '../content/registry'

const NUM_ZH = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十']

function variants(e: RegistryEntry): string[] {
  const v = [e.name.toLowerCase(), e.nameEn.toLowerCase()]
  const m = /^(major|wands|cups|swords|pentacles)-(\d\d)$/.exec(e.id)
  if (m && m[1] !== 'major') {
    const n = Number(m[2])
    const suitZh = e.name.slice(0, 2)
    if (n <= 10) v.push(`${suitZh}${n}`) // 權杖3
    if (n <= 10 && NUM_ZH[n]) v.push(`${suitZh}${NUM_ZH[n]}`)
  }
  return v
}

export function searchCards(query: string): RegistryEntry[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  return REGISTRY.filter((e) => variants(e).some((s) => s.includes(q)))
}
