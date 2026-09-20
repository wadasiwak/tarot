// 內容驗證：78 張完備性、欄位字數、枚舉白名單、簡體字（中文）、跨牌重複句、verdict 分布，
// 牌陣位置文案（長度＝SPREAD_SIZE、BRIDGE_FIELDS 對齊、zh/en bridge 一致）、生日牌／年度牌 44 則字數，
// 以及英文版（src/content/en/）的字數規範與「verdict 必須與中文一致」交叉檢查。
// 單檔模式（給內容 agent 自驗）：
//   中文：node scripts/check-content.mjs src/content/wands-01-07.ts
//   英文：node scripts/check-content.mjs src/content/en/wands-01-07.ts
// 全量模式（CI gate）：node scripts/check-content.mjs
import { existsSync } from 'node:fs'
import { join, basename } from 'node:path'

const root = new URL('..', import.meta.url).pathname

// Node 26 原生 type stripping：.ts 檔可直接 import
async function loadModule(relPath) {
  return import(join(root, relPath))
}

const { REGISTRY } = await loadModule('src/content/registry.ts')
const regById = new Map(REGISTRY.map((e) => [e.id, e]))

const BATCHES = {
  'major-00-10.ts': { prefix: 'major', from: 0, to: 10, varName: 'major0010' },
  'major-11-21.ts': { prefix: 'major', from: 11, to: 21, varName: 'major1121' },
  'wands-01-07.ts': { prefix: 'wands', from: 1, to: 7, varName: 'wands0107' },
  'wands-08-14.ts': { prefix: 'wands', from: 8, to: 14, varName: 'wands0814' },
  'cups-01-07.ts': { prefix: 'cups', from: 1, to: 7, varName: 'cups0107' },
  'cups-08-14.ts': { prefix: 'cups', from: 8, to: 14, varName: 'cups0814' },
  'swords-01-07.ts': { prefix: 'swords', from: 1, to: 7, varName: 'swords0107' },
  'swords-08-14.ts': { prefix: 'swords', from: 8, to: 14, varName: 'swords0814' },
  'pentacles-01-07.ts': { prefix: 'pentacles', from: 1, to: 7, varName: 'pentacles0107' },
  'pentacles-08-14.ts': { prefix: 'pentacles', from: 8, to: 14, varName: 'pentacles0814' },
}

function expectedIds(batch) {
  const ids = []
  for (let n = batch.from; n <= batch.to; n++) ids.push(`${batch.prefix}-${String(n).padStart(2, '0')}`)
  return ids
}

const VERDICTS = new Set(['yes', 'leanYes', 'neutral', 'leanNo', 'no'])
const SUITS = new Set(['wands', 'cups', 'swords', 'pentacles'])
// 常見簡體字抽樣（繁體文本不應出現；僅檢查中文內容）
const SIMPLIFIED_RE = /[个们关书发买卖东车马问题让说对时没这为过还进远运动应现实爱见观觉视质变体万与专业丰临义乐习乡产从众优伤价传债倾儿险则剧劝办务势区医历厉压厌县双叙号叶吓吗听启]/u

let errors = 0
let warns = 0
const err = (msg) => { console.error(`  ERROR: ${msg}`); errors++ }
const warn = (msg) => { console.warn(`  WARN:  ${msg}`); warns++ }

// 字數規範：[specMin, specMax]；超出 spec 給 WARN，超出硬界（0.7x / 1.6x）給 ERROR
const LEN = {
  zh: {
    scene: [40, 80], core: [80, 140], daily: [60, 100],
    love: [40, 70], career: [40, 70], money: [40, 70],
    advice: [20, 40], past: [30, 55], present: [30, 55], other: [30, 55],
    verdictReason: [30, 60],
  },
  // 英文以字元計（約中文 2–3 倍），上下限放寬
  en: {
    scene: [90, 240], core: [180, 420], daily: [130, 300],
    love: [90, 210], career: [90, 210], money: [90, 210],
    advice: [45, 120], past: [70, 165], present: [70, 165], other: [70, 165],
    verdictReason: [70, 180],
  },
}
const KEYWORD_LEN = { zh: [2, 6], en: [3, 24] }

function checkLen(lang, cardId, field, text) {
  if (typeof text !== 'string' || text.length === 0) return err(`${cardId} ${field} 缺漏或非字串`)
  const [min, max] = LEN[lang][field]
  const n = text.length
  if (n < Math.floor(min * 0.7) || n > Math.ceil(max * 1.6)) err(`${cardId} ${field} 長度 ${n} 超出硬界（規範 ${min}–${max}）`)
  else if (n < min || n > max) warn(`${cardId} ${field} 長度 ${n} 略出規範 ${min}–${max}`)
  if (lang === 'zh' && SIMPLIFIED_RE.test(text)) err(`${cardId} ${field} 疑似含簡體字：${text.match(SIMPLIFIED_RE)[0]}`)
}

function checkReading(lang, cardId, side, r) {
  if (!r || typeof r !== 'object') return err(`${cardId} 缺 ${side}`)
  const [kMin, kMax] = KEYWORD_LEN[lang]
  if (!Array.isArray(r.keywords) || r.keywords.length < 3 || r.keywords.length > 5)
    err(`${cardId} ${side}.keywords 應 3–5 個，實得 ${r.keywords?.length}`)
  else for (const k of r.keywords) {
    if (typeof k !== 'string' || k.length < kMin || k.length > kMax) warn(`${cardId} ${side}.keywords「${k}」長度應 ${kMin}–${kMax}`)
    if (lang === 'zh' && typeof k === 'string' && SIMPLIFIED_RE.test(k)) err(`${cardId} ${side}.keywords「${k}」疑似簡體字`)
  }
  for (const f of ['core', 'daily', 'love', 'career', 'money', 'advice', 'past', 'present', 'other', 'verdictReason'])
    checkLen(lang, `${cardId}.${side}`, f, r[f])
  if (!VERDICTS.has(r.verdict)) err(`${cardId} ${side}.verdict「${r.verdict}」不在白名單`)
}

function checkCard(lang, card, fileLabel) {
  const reg = regById.get(card.id)
  if (!reg) return err(`${fileLabel}: id「${card.id}」不在 registry`)
  if (card.name !== reg.name) err(`${card.id} name「${card.name}」應為「${reg.name}」`)
  if (card.nameEn !== reg.nameEn) err(`${card.id} nameEn「${card.nameEn}」應為「${reg.nameEn}」`)
  const isMajor = card.id.startsWith('major-')
  if (card.arcana !== (isMajor ? 'major' : 'minor')) err(`${card.id} arcana 錯誤`)
  const num = Number(card.id.split('-')[1])
  if (isMajor) {
    if (card.number !== num) err(`${card.id} number 應為 ${num}`)
    if (card.suit !== undefined || card.rank !== undefined) err(`${card.id} 大牌不應有 suit/rank`)
  } else {
    const suit = card.id.split('-')[0]
    if (!SUITS.has(suit) || card.suit !== suit) err(`${card.id} suit 應為 ${suit}`)
    if (card.rank !== num || card.number !== num) err(`${card.id} rank/number 應為 ${num}`)
  }
  checkLen(lang, card.id, 'scene', card.scene)
  checkReading(lang, card.id, 'upright', card.upright)
  checkReading(lang, card.id, 'reversed', card.reversed)
}

async function loadBatch(lang, file) {
  const rel = lang === 'en' ? `src/content/en/${file}` : `src/content/${file}`
  const mod = await loadModule(rel)
  return mod[BATCHES[file].varName]
}

// ── 主流程 ─────────────────────────────────────────────
const arg = process.argv[2]
const singleLang = arg ? (arg.includes('en/') ? 'en' : 'zh') : null
const singleFile = arg ? basename(arg) : null
if (singleFile && !BATCHES[singleFile]) {
  console.error(`未知批次檔：${singleFile}（應為 ${Object.keys(BATCHES).join(' / ')}）`)
  process.exit(1)
}

// 先載全部中文（en 的 verdict 交叉檢查要用）
const zhAll = []
for (const file of Object.keys(BATCHES)) {
  try {
    const cards = await loadBatch('zh', file)
    if (Array.isArray(cards)) zhAll.push(...cards)
  } catch {
    // 單檔模式下其他檔壞掉不擋路，全量模式會再報
  }
}
const zhVerdict = new Map()
for (const c of zhAll) {
  zhVerdict.set(`${c.id}:upright`, c.upright?.verdict)
  zhVerdict.set(`${c.id}:reversed`, c.reversed?.verdict)
}

const langsToCheck = singleLang ? [singleLang] : ['zh', 'en']
const targets = singleFile ? [singleFile] : Object.keys(BATCHES)
const allByLang = { zh: [], en: [] }
const pendingByLang = { zh: [], en: [] }

for (const lang of langsToCheck) {
  for (const file of targets) {
    const batch = BATCHES[file]
    console.log(`\n== [${lang}] ${file} ==`)
    let cards
    try {
      cards = await loadBatch(lang, file)
    } catch (e) {
      err(`載入失敗：${e.message}`)
      continue
    }
    if (!Array.isArray(cards)) { err(`找不到 export ${batch.varName}`); continue }
    if (cards.length === 0) {
      console.log('  （尚未填入，跳過）')
      pendingByLang[lang].push(file)
      continue
    }
    const expect = expectedIds(batch)
    const got = cards.map((c) => c.id)
    for (const id of expect) if (!got.includes(id)) err(`缺 ${id}`)
    for (const id of got) if (!expect.includes(id)) err(`多出不屬於本批的 ${id}`)
    if (new Set(got).size !== got.length) err('批內 id 重複')
    for (const card of cards) {
      checkCard(lang, card, file)
      if (lang === 'en') {
        // 英文 verdict 必須與中文一致（同一張牌不能兩種語言不同傾向）
        for (const side of ['upright', 'reversed']) {
          const zhV = zhVerdict.get(`${card.id}:${side}`)
          if (zhV && card[side]?.verdict !== zhV)
            err(`${card.id} ${side}.verdict「${card[side]?.verdict}」與中文版「${zhV}」不一致`)
        }
      }
    }
    allByLang[lang].push(...cards)
    console.log(`  ${cards.length} 張檢查完`)
  }
}

// ── 全量統計（僅全量模式）────────────────────────────
if (!singleFile) {
  for (const lang of ['zh', 'en']) {
    const allCards = allByLang[lang]
    console.log(`\n== [${lang}] 全量統計 ==`)
    console.log(`  已收錄 ${allCards.length}/78 張`)
    if (pendingByLang[lang].length) console.log(`  待補批次：${pendingByLang[lang].join(', ')}`)

    const dist = {}
    for (const c of allCards) for (const side of ['upright', 'reversed'])
      dist[c[side].verdict] = (dist[c[side].verdict] ?? 0) + 1
    const total = allCards.length * 2
    console.log(`  verdict 分布：${JSON.stringify(dist)}`)
    if (allCards.length === 78) {
      // 極端傾向（yes/no）本就較稀有：門檻 4%；中間三級 8%
      for (const v of VERDICTS) {
        const th = v === 'yes' || v === 'no' ? 0.04 : 0.08
        if ((dist[v] ?? 0) < Math.floor(total * th)) warn(`verdict「${v}」僅 ${dist[v] ?? 0}/${total}（<${th * 100}%），分布過偏`)
      }
      if ((dist.neutral ?? 0) > total * 0.4) warn(`neutral 佔 ${dist.neutral}/${total}（>40%），太多安全牌`)
    }

    // 跨牌重複句偵測（模板句）：取每欄位開頭當指紋
    const fpLen = lang === 'en' ? 24 : 12
    const seen = new Map()
    for (const c of allCards) for (const side of ['upright', 'reversed'])
      for (const f of ['core', 'daily', 'love', 'career', 'money', 'past', 'present', 'other']) {
        const fp = c[side][f]?.slice(0, fpLen)
        if (!fp) continue
        const key = `${f}:${fp}`
        if (seen.has(key)) warn(`模板句嫌疑：${c.id}.${side}.${f} 與 ${seen.get(key)} 開頭相同`)
        else seen.set(key, `${c.id}.${side}.${f}`)
      }
  }

  // ── 牌陣位置文案（positions.ts）與生日牌／年度牌文案（mycard.ts）────
  console.log('\n== 牌陣位置 positions.ts ==')
  const pos = await loadModule('src/content/positions.ts')
  for (const [lang, table] of [['zh', pos.SPREADS], ['en', pos.SPREADS_EN]]) {
    for (const [id, size] of Object.entries(pos.SPREAD_SIZE)) {
      const def = table[id]
      if (!def) { err(`[${lang}] positions 缺牌陣 ${id}`); continue }
      if (!def.name || !def.intro) err(`[${lang}] ${id} 缺 name/intro`)
      if (def.positions.length !== size) err(`[${lang}] ${id} positions 長度 ${def.positions.length} ≠ SPREAD_SIZE ${size}`)
      def.positions.forEach((p, i) => {
        if (!p.title) err(`[${lang}] ${id}[${i}] 缺 title`)
        if (typeof p.frame !== 'string' || p.frame.length < (lang === 'zh' ? 15 : 30)) err(`[${lang}] ${id}[${i}] frame 過短`)
        if (lang === 'zh') for (const t of [p.title, p.frame, p.bridge ?? '']) if (SIMPLIFIED_RE.test(t)) err(`${id}[${i}] 疑似簡體字：${t.match(SIMPLIFIED_RE)[0]}`)
      })
      if (id !== 'daily') {
        const fields = pos.BRIDGE_FIELDS[id]
        if (!fields) err(`BRIDGE_FIELDS 缺 ${id}`)
        else if (fields.length !== size) err(`BRIDGE_FIELDS.${id} 長度 ${fields.length} ≠ SPREAD_SIZE ${size}`)
        else fields.forEach((fs, i) => {
          if (fs.includes('bridge') && !def.positions[i]?.bridge) err(`[${lang}] ${id}[${i}] BRIDGE_FIELDS 要 bridge 但 positions 沒寫銜接句`)
        })
      }
    }
  }
  // zh/en 的 bridge 有無要一致（英文漏寫會靜默少一句 💡）
  for (const id of Object.keys(pos.SPREAD_SIZE)) {
    const zhB = pos.SPREADS[id].positions.map((p) => !!p.bridge)
    const enB = pos.SPREADS_EN[id]?.positions.map((p) => !!p.bridge) ?? []
    if (JSON.stringify(zhB) !== JSON.stringify(enB)) err(`${id} zh/en 的 bridge 有無不一致：${JSON.stringify(zhB)} vs ${JSON.stringify(enB)}`)
  }
  console.log(`  ${Object.keys(pos.SPREAD_SIZE).length} 個牌陣檢查完`)

  console.log('\n== 生日牌／年度牌 mycard.ts ==')
  const my = await loadModule('src/content/mycard.ts')
  const MY_LEN = { zh: [60, 100], en: [150, 320] }
  for (const [lang, table] of [['zh', my.MYCARD], ['en', my.MYCARD_EN]]) {
    for (let n = 0; n <= 21; n++) {
      const id = `major-${String(n).padStart(2, '0')}`
      const t = table[id]
      if (!t) { err(`[${lang}] mycard 缺 ${id}`); continue }
      for (const f of ['birth', 'year']) {
        const [min, max] = MY_LEN[lang]
        const len = t[f]?.length ?? 0
        if (len < Math.floor(min * 0.7) || len > Math.ceil(max * 1.6)) err(`[${lang}] mycard ${id}.${f} 長度 ${len} 超出硬界（規範 ${min}–${max}）`)
        else if (len < min || len > max) warn(`[${lang}] mycard ${id}.${f} 長度 ${len} 略出規範 ${min}–${max}`)
        if (lang === 'zh' && SIMPLIFIED_RE.test(t[f] ?? '')) err(`mycard ${id}.${f} 疑似簡體字`)
      }
    }
    const extra = Object.keys(table).filter((k) => !/^major-(0\d|1\d|2[01])$/.test(k))
    if (extra.length) err(`[${lang}] mycard 多出非大牌 id：${extra.join(', ')}`)
  }
  console.log('  22 張 × 2 語 × 2 欄檢查完')

  // 圖檔存在
  let missingImg = 0
  for (const e of REGISTRY) if (!existsSync(join(root, 'public/cards', `${e.id}.jpg`))) missingImg++
  if (missingImg > 0) (allByLang.zh.length === 78 ? err : warn)(`public/cards/ 缺 ${missingImg} 張牌圖`)
}

console.log(`\n${errors} errors, ${warns} warnings`)
process.exit(errors > 0 ? 1 : 0)
