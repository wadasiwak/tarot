// 截圖腳本（人工 Read 親眼看版面用）：桌機 1080 + 手機 390 寬各截主要頁面。
// 需先 npm run build；自起 vite preview port 5232。輸出到 scripts/shots/。
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { chromium } from 'playwright'

const PORT = 5232
const BASE_URL = `http://localhost:${PORT}/`
const outDir = new URL('./shots/', import.meta.url).pathname
mkdirSync(outDir, { recursive: true })

const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], {
  cwd: new URL('..', import.meta.url).pathname,
  stdio: 'ignore',
})

try {
  for (let i = 0; i < 30; i++) {
    try {
      await fetch(BASE_URL)
      break
    } catch {
      await new Promise((r) => setTimeout(r, 300))
    }
  }

  const browser = await chromium.launch()
  const pages = [
    ['home', ''],
    ['daily', '#daily/2026-01-15'],
    ['reading-three', '#r/three/34r-7-61'],
    ['reading-yesno', '#r/yesno/13'],
    ['reading-choice', '#r/choice/16r-19'],
    ['manual', '#manual/three'],
    ['browse', '#cards'],
    ['detail', '#card/major-13/r'],
    ['reading-relation', '#r/relation/6-36r-45'],
    ['learn', '#learn'],
    ['journal', '#journal'],
  ]
  for (const [w, label] of [[1080, 'desktop'], [390, 'mobile']]) {
    const page = await browser.newPage({ viewport: { width: w, height: 1400 } })
    for (const [name, hash] of pages) {
      await page.goto(`${BASE_URL}${hash}`)
      await page.reload()
      await page.waitForTimeout(900)
      if (name === 'daily') {
        const btn = await page.$('.daily-back .btn.primary')
        if (btn) {
          await btn.click()
          await page.waitForTimeout(900)
        }
      }
      await page.screenshot({ path: `${outDir}${label}-${name}.png`, fullPage: true })
    }
    // 抽牌流程互動截圖：切牌 → 弧形扇排
    await page.goto(`${BASE_URL}#draw/three`)
    await page.reload()
    await page.click('.draw-ask .btn.primary')
    await page.waitForSelector('.cut-deck', { timeout: 6000 })
    await page.screenshot({ path: `${outDir}${label}-cut.png` })
    for (let i = 0; i < 3; i++) {
      await page.click('.cut-deck')
      await page.waitForTimeout(200)
    }
    await page.waitForSelector('.fan-arc', { timeout: 3000 })
    await page.waitForTimeout(400)
    await page.screenshot({ path: `${outDir}${label}-fan.png` })
    // 牌義學習互動截圖：儀表 → 記憶卡正/反面 → 測驗
    await page.goto(`${BASE_URL}#study`)
    await page.reload()
    await page.waitForTimeout(600)
    await page.screenshot({ path: `${outDir}${label}-study.png`, fullPage: true })
    await page.click('.start-cards')
    await page.waitForSelector('.study-card', { timeout: 3000 })
    await page.waitForTimeout(600)
    await page.screenshot({ path: `${outDir}${label}-study-card-front.png`, fullPage: true })
    await page.click('.study-card')
    await page.waitForTimeout(400)
    await page.screenshot({ path: `${outDir}${label}-study-card-back.png`, fullPage: true })
    await page.goto(`${BASE_URL}#study`)
    await page.reload()
    await page.click('.start-quiz')
    await page.waitForSelector('.quiz-option', { timeout: 3000 })
    await page.waitForTimeout(600)
    await page.screenshot({ path: `${outDir}${label}-study-quiz.png`, fullPage: true })
    await page.close()
  }
  await browser.close()
  console.log(`截圖完成 → ${outDir}`)
} finally {
  server.kill()
}
