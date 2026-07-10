// 端到端測試：每日一牌 seed 穩定、hash 直開/防禦、抽牌流程、分享還原、手動輸入、
// GoatCounter 隱私、免責聲明、牌庫、localStorage。
// 需先 npm run build；本腳本自行啟動 vite preview（port 5231，避開 dev server 5230）。
import { spawn } from 'node:child_process'
import { chromium } from 'playwright'

const PORT = 5231
const BASE_URL = `http://localhost:${PORT}/`

const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], {
  cwd: new URL('..', import.meta.url).pathname,
  stdio: 'ignore',
})

const fail = (msg) => {
  console.error(`FAIL: ${msg}`)
  server.kill()
  process.exit(1)
}

try {
  for (let i = 0; i < 30; i++) {
    try {
      await fetch(BASE_URL)
      break
    } catch {
      await new Promise((r) => setTimeout(r, 300))
      if (i === 29) fail('preview server 沒起來')
    }
  }

  const browser = await chromium.launch()
  const context = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'] })
  const page = await context.newPage()
  const consoleErrors = []
  page.on('pageerror', (e) => consoleErrors.push(String(e)))

  // 1. 首頁：每日一牌卡 + 三張模式卡 + 牌庫入口
  await page.goto(BASE_URL)
  await page.waitForSelector('.daily-card', { timeout: 5000 })
  const modeCards = await page.$$('.mode-card')
  if (modeCards.length !== 3) fail(`首頁應有 3 張模式卡，實得 ${modeCards.length}`)
  if (!(await page.$('.browse-link'))) fail('首頁缺牌庫入口')

  // 2. 每日一牌 seed 穩定：固定日期兩次開啟結果相同；壞日期 fallback 不炸
  await page.goto(`${BASE_URL}#daily/2026-01-15`)
  await page.reload()
  await page.click('.daily-back .btn.primary')
  await page.waitForSelector('.daily-front .card-caption', { timeout: 3000 })
  const daily1 = await page.textContent('.daily-front .card-caption')
  await page.goto(`${BASE_URL}#daily/2026-01-15`)
  await page.reload()
  await page.click('.daily-back .btn.primary')
  await page.waitForSelector('.daily-front .card-caption', { timeout: 3000 })
  const daily2 = await page.textContent('.daily-front .card-caption')
  if (daily1 !== daily2) fail(`每日一牌不穩定：「${daily1}」vs「${daily2}」`)
  await page.goto(`${BASE_URL}#daily/bad-date`)
  await page.reload()
  await page.waitForSelector('.daily-view', { timeout: 3000 })

  // 2b. 暱稱 seed：同名同日結果固定、名字 reload 保留（localStorage）
  await page.goto(`${BASE_URL}#daily/2026-01-15`)
  await page.reload()
  await page.fill('.name-input', '小美')
  await page.click('.daily-back .btn.primary')
  await page.waitForSelector('.daily-front .card-caption', { timeout: 3000 })
  const named1 = await page.textContent('.daily-front .card-caption')
  const owner = await page.textContent('.daily-owner')
  if (!owner.includes('小美')) fail('翻牌後應顯示「小美 的今日一牌」')
  await page.reload()
  const savedName = await page.inputValue('.name-input')
  if (savedName !== '小美') fail(`暱稱 reload 應保留，實得「${savedName}」`)
  await page.click('.daily-back .btn.primary')
  await page.waitForSelector('.daily-front .card-caption', { timeout: 3000 })
  const named2 = await page.textContent('.daily-front .card-caption')
  if (named1 !== named2) fail(`同名同日結果不穩定：「${named1}」vs「${named2}」`)
  await page.evaluate(() => localStorage.removeItem('tarot.name.v1'))

  // 3. hash 直開還原：單牌詳情（正/逆位）、reading 三區段
  await page.goto(`${BASE_URL}#card/wands-03`)
  await page.reload()
  await page.waitForSelector('.card-detail', { timeout: 3000 })
  const detailTitle = await page.textContent('.detail-title h2')
  if (!detailTitle.includes('權杖三')) fail(`#card/wands-03 應顯示權杖三，實得 ${detailTitle}`)
  await page.goto(`${BASE_URL}#card/wands-03/r`)
  await page.reload()
  await page.waitForSelector('.card-detail', { timeout: 3000 })
  const revTab = await page.textContent('.ori-toggle .btn.active')
  if (!revTab.includes('逆位')) fail('#card/wands-03/r 應停在逆位分頁')
  if (!(await page.$('.detail-img .card-face.is-reversed'))) fail('#card/wands-03/r 牌圖應為逆位旋轉')

  await page.goto(`${BASE_URL}#r/three/34r-7-61`)
  await page.reload()
  await page.waitForSelector('.reading', { timeout: 3000 })
  const sections = await page.$$('.reading-card')
  if (sections.length !== 3) fail(`#r/three 應 3 區段，實得 ${sections.length}`)
  const firstCaption = await sections[0].$eval('.card-caption', (el) => el.textContent)
  if (!firstCaption.includes('逆位')) fail('#r/three/34r-… 第一張應帶逆位標記')
  const posTitles = await page.$$eval('.position-head h3', (els) => els.map((e) => e.textContent))
  for (const t of ['過去', '現在', '未來']) if (!posTitles.includes(t)) fail(`三張牌陣缺位置「${t}」`)

  // 4. 非法 hash 防禦：越界/重複/張數不符 → 回首頁、無 pageerror
  for (const bad of ['#r/three/99-1-2', '#r/three/1-1-2', '#r/yesno/1-2', '#r/nope/1', '#card/fake-id']) {
    await page.goto(`${BASE_URL}${bad}`)
    await page.reload()
    await page.waitForSelector('.hero', { timeout: 3000 }).catch(() => fail(`非法 hash ${bad} 沒回首頁`))
  }

  // 5. 抽牌流程：問題 → 洗牌 → 點 3 張 → 翻 3 張 → 解讀，三張牌名互不重複
  await page.goto(`${BASE_URL}#draw/three`)
  await page.reload()
  await page.fill('.question-input', 'e2e 測試問題')
  await page.click('.draw-ask .btn.primary')
  await page.waitForSelector('.fan', { timeout: 6000 })
  const fanCards = await page.$$('.fan-card')
  if (fanCards.length !== 78) fail(`扇面應 78 張牌背，實得 ${fanCards.length}`)
  await fanCards[5].click()
  await fanCards[20].click()
  await fanCards[60].click()
  await page.waitForSelector('.reveal-cards', { timeout: 3000 })
  for (const box of await page.$$('.flip-box')) await box.click()
  await page.waitForSelector('.see-reading', { timeout: 3000 })
  await page.click('.see-reading')
  await page.waitForSelector('.reading', { timeout: 3000 })
  const names = await page.$$eval('.reading .card-caption', (els) => els.map((e) => e.textContent.replace(/正位|逆位/g, '').trim()))
  if (new Set(names).size !== 3) fail(`三張牌不應重複：${names.join('、')}`)
  const asked = await page.textContent('.asked-question')
  if (!asked.includes('e2e 測試問題')) fail('解讀頁應顯示所問之事')

  // 6. 分享連結：格式正確、不含問題文字、新分頁還原一致
  await page.click('.reading-actions .btn:first-child')
  const shared = await page.evaluate(() => navigator.clipboard.readText())
  if (!/#r\/three\/\d{1,2}r?-\d{1,2}r?-\d{1,2}r?$/.test(shared)) fail(`分享連結格式不對：${shared}`)
  if (shared.includes('e2e') || shared.includes('%')) fail(`分享連結不應含問題文字：${shared}`)
  const page2 = await context.newPage()
  await page2.goto(shared)
  await page2.waitForSelector('.reading', { timeout: 5000 })
  const names2 = await page2.$$eval('.reading .card-caption', (els) => els.map((e) => e.textContent.trim()))
  const names1full = await page.$$eval('.reading .card-caption', (els) => els.map((e) => e.textContent.trim()))
  if (JSON.stringify(names1full) !== JSON.stringify(names2)) fail('分享連結開啟結果與原頁不一致')
  await page2.close()

  // 7. 複製給 AI：含問題、三張牌名、正逆位字樣
  await page.click('.copy-ai')
  const aiPrompt = await page.evaluate(() => navigator.clipboard.readText())
  if (!aiPrompt.includes('e2e 測試問題')) fail('AI prompt 缺問題')
  if (!/正位|逆位/.test(aiPrompt)) fail('AI prompt 缺正逆位')
  for (const n of names) if (!aiPrompt.includes(n)) fail(`AI prompt 缺牌名 ${n}`)

  // 8. 是非模式：verdict 徽章五值之一、理由非空
  await page.goto(`${BASE_URL}#r/yesno/13`)
  await page.reload()
  await page.waitForSelector('.reading', { timeout: 3000 })
  const verdictText = await page.textContent('.verdict-badge')
  if (!/是|偏是|持平|偏否|否/.test(verdictText)) fail(`verdict 徽章不對：${verdictText}`)
  const reason = await page.textContent('.verdict-reason')
  if (!reason || reason.length < 10) fail('verdict 理由過短')

  // 9. 手動輸入：搜尋愚者 → 選逆位 → 解讀正確
  await page.goto(`${BASE_URL}#manual/yesno`)
  await page.reload()
  await page.waitForSelector('.manual-entry', { timeout: 3000 })
  await page.fill('.search-input', '愚者')
  await page.waitForSelector('.card-grid .grid-cell', { timeout: 3000 })
  await page.click('.card-grid .grid-cell')
  await page.waitForSelector('.orientation-options', { timeout: 3000 })
  await page.click('.orientation-options .orientation-btn:nth-child(2)') // 逆位
  await page.waitForSelector('.reading', { timeout: 3000 })
  const manualCaption = await page.textContent('.reading .card-caption')
  if (!manualCaption.includes('愚者') || !manualCaption.includes('逆位')) fail(`手動輸入結果不對：${manualCaption}`)

  // 10. GoatCounter：path 只回報 pathname（帶 hash 的頁面上驗證）
  const gcPath = await page.evaluate(() => window.goatcounter.path())
  if (gcPath.includes('#') || gcPath.includes('?')) fail(`goatcounter path 洩漏 hash/query：${gcPath}`)
  if (gcPath !== new URL(BASE_URL).pathname) fail(`goatcounter path 應為 pathname，實得 ${gcPath}`)

  // 11. 免責聲明 + 版權
  const footer = await page.textContent('.app-footer')
  if (!footer.includes('僅供參考')) fail('footer 缺免責聲明')
  if (!footer.includes('© 2026 wadasiwak')) fail('footer 缺版權')

  // 12. 牌庫：78 格、首格圖有載到
  await page.goto(`${BASE_URL}#cards`)
  await page.reload()
  await page.waitForSelector('.browse-grid', { timeout: 3000 })
  const cells = await page.$$('.browse-grid .grid-cell')
  if (cells.length !== 78) fail(`牌庫應 78 格，實得 ${cells.length}`)
  await page.waitForFunction(() => document.querySelector('.browse-grid .card-face')?.naturalWidth > 0, { timeout: 10000 })

  // 13. localStorage：最近紀錄 reload 保留
  await page.goto(BASE_URL)
  await page.reload()
  await page.waitForSelector('.recent', { timeout: 3000 })
  const recent = await page.textContent('.recent')
  if (!recent.includes('愚者')) fail('最近紀錄應含剛剛手動輸入的愚者')

  if (consoleErrors.length) fail(`頁面有未捕捉錯誤：${consoleErrors.join(' | ')}`)

  await browser.close()
  console.log('e2e OK：首頁、每日一牌seed、hash直開、非法hash防禦、抽牌流程、分享還原、AI複製、是非、手動輸入、GoatCounter隱私、免責、牌庫78格、最近紀錄全部通過')
} finally {
  server.kill()
}
