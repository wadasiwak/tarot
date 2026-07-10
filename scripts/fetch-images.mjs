// 從 Wikimedia Commons 抓 78 張 RWS 1909 公版牌圖，存 public/cards/<id>.jpg。
// 斷點續跑：目標檔已存在且 >10KB 就跳過。429/5xx 重試≤3（讀 retry-after），4xx 記失敗清單。
// 跑完斷言恰 78 檔，並用 MD5 掃重複（擋佔位圖/檔名錯位）。
import { existsSync, statSync, writeFileSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { createHash } from 'node:crypto'

const root = new URL('..', import.meta.url).pathname
const outDir = join(root, 'public/cards')
const { REGISTRY } = await import(join(root, 'src/content/registry.ts'))

const UA = 'tarot-side-project/1.0 (https://wadasiwak.github.io/tarot/; personal hobby site)'
const WIDTH = 600
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const failures = []

async function fetchOne(entry) {
  const dest = join(outDir, `${entry.id}.jpg`)
  if (existsSync(dest) && statSync(dest).size > 10_000) return 'skip'
  const url = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(entry.wikimediaFile)}?width=${WIDTH}`
  for (let attempt = 1; attempt <= 4; attempt++) {
    let res
    try {
      res = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow' })
    } catch (e) {
      if (attempt === 4) { failures.push(`${entry.id}: 網路錯誤 ${e.message}`); return 'fail' }
      await sleep(2000 * attempt)
      continue
    }
    if (res.status === 429 || res.status >= 500) {
      const retryAfter = Number(res.headers.get('retry-after')) || 2 * attempt
      if (attempt === 4) { failures.push(`${entry.id}: HTTP ${res.status} 重試耗盡`); return 'fail' }
      await sleep((retryAfter + 1) * 1000)
      continue
    }
    if (!res.ok) { failures.push(`${entry.id}: HTTP ${res.status}（${entry.wikimediaFile}）`); return 'fail' }
    const type = res.headers.get('content-type') ?? ''
    if (!type.startsWith('image/')) { failures.push(`${entry.id}: content-type ${type} 非圖片`); return 'fail' }
    const buf = Buffer.from(await res.arrayBuffer())
    if (buf.length < 10_000) { failures.push(`${entry.id}: 檔案僅 ${buf.length}B，疑似錯誤頁`); return 'fail' }
    writeFileSync(dest, buf)
    return 'ok'
  }
}

let ok = 0, skip = 0
for (const entry of REGISTRY) {
  const r = await fetchOne(entry)
  if (r === 'ok') { ok++; console.log(`ok   ${entry.id} ← ${entry.wikimediaFile}`) }
  else if (r === 'skip') skip++
  else console.error(`FAIL ${entry.id}`)
  if (r === 'ok') await sleep(1000) // 禮貌間隔（skip 不用等）
}

console.log(`\n下載 ${ok}、跳過 ${skip}、失敗 ${failures.length}`)
if (failures.length) { console.error('失敗清單：'); for (const f of failures) console.error(`  ${f}`) }

// MD5 掃重複（不同牌抓到同一張圖＝檔名錯位或佔位圖）
const hashes = new Map()
for (const f of readdirSync(outDir).filter((f) => f.endsWith('.jpg'))) {
  const md5 = createHash('md5').update(readFileSync(join(outDir, f))).digest('hex')
  if (hashes.has(md5)) console.error(`DUP: ${f} 與 ${hashes.get(md5)} 內容相同（MD5 重複）`)
  else hashes.set(md5, f)
}

const count = readdirSync(outDir).filter((f) => f.endsWith('.jpg')).length
console.log(`public/cards/ 共 ${count}/78 張`)
process.exit(count === 78 && failures.length === 0 ? 0 : 1)
