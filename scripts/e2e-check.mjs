// 端到端測試：每日一牌 seed 穩定、hash 直開/防禦、抽牌流程、分享還原、手動輸入、
// GoatCounter 隱私、免責聲明、牌庫、localStorage。
// 需先 npm run build；本腳本自行啟動 vite preview（port 5231，避開 dev server 5230）。
import { spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { chromium } from 'playwright'
import { REGISTRY } from '../src/content/registry.ts' // Node 原生 type stripping（年度牌名比對用）

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

  // 1. 首頁：每日一牌卡 + 三張模式卡 + 牌庫入口；首訪（無任何紀錄）應顯示入門卡且可連到小學堂
  await page.goto(BASE_URL)
  await page.waitForSelector('.daily-card', { timeout: 5000 })
  const modeCards = await page.$$('.mode-card')
  if (modeCards.length !== 7) fail(`首頁應有 7 張模式卡（含關係之樹、月度展望、凱爾特十字），實得 ${modeCards.length}`)
  if (!(await page.textContent('.mode-card:nth-child(7) .adv-badge')).includes('進階')) fail('凱爾特十字模式卡應標「進階・10 張」')
  const modeText = await page.textContent('.mode-cards')
  for (const m of ['關係之樹', '月度展望']) if (!modeText.includes(m)) fail(`首頁模式卡缺「${m}」`)
  const homeLinks = await page.$$('.browse-link')
  if (homeLinks.length !== 5) fail(`首頁應有牌庫/小學堂/牌義學習/我的牌/回顧五個入口，實得 ${homeLinks.length}`)
  if (!(await page.$('.first-visit-card'))) fail('首訪（無任何紀錄）首頁應顯示入門卡')
  await page.click('.first-visit-card')
  await page.waitForSelector('.learn', { timeout: 3000 }).catch(() => fail('首訪入門卡應連到小學堂'))

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

  // 2c. 回顧過去日期：可看牌但不寫每日史（不能回填打卡）、有提示；未來／不存在的日期 fallback 今天
  const pastRec = await page.evaluate(() => JSON.parse(localStorage.getItem('tarot.daily.v1') || '{}'))
  if (pastRec['小美']?.['2026-01-15']) fail('回顧過去日期的翻牌不應寫入每日史')
  if (!(await page.$('.daily-past-note'))) fail('回顧過去日期應顯示「不計入打卡」提示')
  const todayLocal = await page.evaluate(() => {
    const d = new Date()
    const pad = (n) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  })
  for (const bad of ['2099-01-01', '2026-02-31']) {
    await page.goto(`${BASE_URL}#daily/${bad}`)
    await page.reload()
    await page.waitForSelector('.daily-view', { timeout: 3000 })
    const intro = await page.textContent('.reading-intro')
    if (!intro.includes(todayLocal)) fail(`#daily/${bad} 應 fallback 今天 ${todayLocal}，實得「${intro}」`)
  }
  // 後面改名測試（18）需要小美 2026-01-15 有史：直接植入
  await page.evaluate(() => localStorage.setItem('tarot.daily.v1', JSON.stringify({ 小美: { '2026-01-15': { index: 0, reversed: false } } })))

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

  // 5. 抽牌流程：問題 → 洗牌 → 切三刀 → 弧形扇排點 3 張 → 翻 3 張 → 解讀，三張牌名互不重複
  await page.goto(`${BASE_URL}#draw/three`)
  await page.reload()
  await page.fill('.question-input', 'e2e 測試問題')
  await page.click('.draw-ask .btn.primary')
  await page.waitForSelector('.cut-deck', { timeout: 6000 })
  for (let i = 0; i < 3; i++) {
    await page.click('.cut-deck')
    await page.waitForTimeout(150)
  }
  await page.waitForSelector('.fan-arc', { timeout: 3000 })
  const fanCards = await page.$$('.fan-slot .fan-card')
  if (fanCards.length !== 78) fail(`扇面應 78 張牌背，實得 ${fanCards.length}`)
  // 最上層那張（z 最高、完整可見）用真實點擊驗證可點性；被鄰牌蓋住的用 force
  await fanCards[77].click()
  await fanCards[20].click({ force: true })
  await fanCards[5].click({ force: true })
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

  // 7b. 存成圖卡：真的產出 PNG 下載（桌機 chromium 無 share sheet → 走下載）
  if (!(await page.$('.share-image'))) fail('結果頁缺「存成圖卡」按鈕')
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 10000 }),
    page.click('.share-image'),
  ])
  if (!download.suggestedFilename().endsWith('.png')) fail(`圖卡下載檔名不對：${download.suggestedFilename()}`)

  // 7c. 關係牌陣：hash 直開三區段、位置名正確、對方位無 💡（僅牌義）
  await page.goto(`${BASE_URL}#r/relation/1-2-3`)
  await page.reload()
  await page.waitForSelector('.reading', { timeout: 3000 })
  const relTitles = await page.$$eval('.position-head h3', (els) => els.map((e) => e.textContent))
  for (const t of ['我的狀態', '對方的狀態', '關係走向']) if (!relTitles.includes(t)) fail(`關係牌陣缺位置「${t}」`)
  const relBridges = await page.$$eval('.reading-card', (els) => els.map((e) => e.querySelector('.advice') !== null))
  if (!relBridges.every(Boolean)) fail(`關係牌陣三個位置都應有 💡 白話句，實得 ${JSON.stringify(relBridges)}`)

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

  // 14. 每日回顧：翻今天的牌 → #journal 月曆有紀錄
  await page.goto(`${BASE_URL}#daily`)
  await page.reload()
  await page.click('.daily-back .btn.primary')
  await page.waitForSelector('.daily-front .card-caption', { timeout: 3000 })
  await page.goto(`${BASE_URL}#journal`)
  await page.reload()
  await page.waitForSelector('.cal-grid', { timeout: 3000 })
  const marked = await page.$$('.cal-cell.has-card')
  if (marked.length < 1) fail('每日回顧月曆應至少有一天有紀錄')

  // 14b. 語言切換：EN 首頁/牌義/詳情都是英文、reload 記住偏好、切回中文
  await page.goto(BASE_URL)
  await page.reload()
  await page.click('.lang-toggle')
  const heroEn = await page.textContent('.hero-title')
  if (!heroEn.includes('let the cards speak')) fail(`EN 首頁標題不對：${heroEn}`)
  await page.reload()
  const heroEn2 = await page.textContent('.hero-title')
  if (!heroEn2.includes('let the cards speak')) fail('EN 偏好 reload 後未保留')
  await page.goto(`${BASE_URL}#card/major-00`)
  await page.reload()
  const detailEn = await page.textContent('.detail-title h2')
  if (!detailEn.includes('The Fool')) fail(`EN 詳情頁牌名不對：${detailEn}`)
  const coreEn = await page.textContent('.card-detail .core')
  if (!/[a-zA-Z]{20}/.test(coreEn.replaceAll(' ', ''))) fail('EN 詳情頁 core 應為英文內容')
  const oriEn = await page.textContent('.ori-toggle .btn.active')
  if (!oriEn.includes('Upright')) fail('EN 正逆位切換鈕應為英文')
  await page.goto(`${BASE_URL}#r/three/34r-7-61`)
  await page.reload()
  const posEn = await page.$$eval('.position-head h3', (els) => els.map((e) => e.textContent))
  for (const t of ['Past', 'Present', 'Future']) if (!posEn.includes(t)) fail(`EN 三張牌陣缺位置「${t}」`)
  await page.click('.lang-toggle') // 切回中文
  const backZh = await page.$$eval('.position-head h3', (els) => els.map((e) => e.textContent))
  if (!backZh.includes('過去')) fail('切回中文失敗')

  // 15. 小學堂：hash 直開、段落齊全
  await page.goto(`${BASE_URL}#learn`)
  await page.reload()
  await page.waitForSelector('.learn', { timeout: 3000 })
  const learnSections = await page.$$('.learn-section')
  if (learnSections.length < 6) fail(`小學堂應至少 6 段，實得 ${learnSections.length}`)

  // 15b. 小學堂章節錨點：#learn/reversed 直開應捲動到正逆位章節
  await page.goto(`${BASE_URL}#learn/reversed`)
  await page.reload()
  await page.waitForSelector('#learn-reversed', { timeout: 3000 })
  await page.waitForTimeout(800)
  if (!(await page.evaluate(() => window.scrollY > 0))) fail('#learn/reversed 應捲動到正逆位章節')

  // 15c. 交叉連結：解讀頁正逆位徽章 → 小學堂正逆位；單牌詳情花色名 → 小學堂花色
  await page.goto(`${BASE_URL}#r/yesno/13`)
  await page.reload()
  await page.waitForSelector('.reading', { timeout: 3000 })
  await page.click('.ori-badge.clickable')
  await page.waitForSelector('.learn', { timeout: 3000 })
  if ((await page.evaluate(() => location.hash)) !== '#learn/reversed') fail('正逆位徽章應連到 #learn/reversed')
  await page.goto(`${BASE_URL}#card/wands-03`)
  await page.reload()
  await page.waitForSelector('.card-detail', { timeout: 3000 })
  await page.click('.detail-sub.as-link')
  await page.waitForSelector('.learn', { timeout: 3000 })
  if ((await page.evaluate(() => location.hash)) !== '#learn/suits') fail('花色名應連到 #learn/suits')

  // 16. 收藏＋筆記：解讀頁收藏、寫筆記、reload 保留；筆記絕不進 URL
  await page.goto(`${BASE_URL}#r/three/34r-7-61`)
  await page.reload()
  await page.waitForSelector('.reading', { timeout: 3000 })
  await page.click('.save-reading')
  await page.waitForSelector('.save-reading.saved', { timeout: 3000 })
  await page.waitForSelector('.note-box .note-input', { timeout: 3000 })
  await page.fill('.note-box .note-input', 'e2e 筆記：當時的想法')
  await page.click('.save-note')
  await page.reload()
  await page.waitForSelector('.save-reading.saved', { timeout: 3000 }).catch(() => fail('收藏狀態 reload 後應保留'))
  const noteAfterReload = await page.inputValue('.note-box .note-input')
  if (noteAfterReload !== 'e2e 筆記：當時的想法') fail(`筆記 reload 後應保留，實得「${noteAfterReload}」`)
  if ((await page.evaluate(() => location.href)).includes('筆記')) fail('筆記絕不能出現在 URL')

  // 16b. 首頁最近清單：有紀錄後不顯示首訪卡；星號收藏/取消收藏
  await page.goto(BASE_URL)
  await page.reload()
  await page.waitForSelector('.recent-item', { timeout: 3000 })
  if (await page.$('.first-visit-card')) fail('已有紀錄仍顯示首訪入門卡')
  await page.click('.recent-item .icon-btn.star')
  await page.waitForSelector('.recent-item .icon-btn.star.on', { timeout: 3000 })

  // 16c. Journal 收藏清單：兩筆、展開看筆記、點開回 Reading、兩段式刪除
  await page.goto(`${BASE_URL}#journal`)
  await page.reload()
  await page.waitForSelector('.saved-list', { timeout: 3000 })
  let savedItems = await page.$$('.saved-item')
  if (savedItems.length !== 2) fail(`Journal 應有 2 筆收藏，實得 ${savedItems.length}`)
  await (await savedItems[1].$('.saved-head')).click() // 第二筆＝較早收藏的三張牌陣
  await page.waitForSelector('.saved-body', { timeout: 3000 })
  const journalNote = await page.inputValue('.saved-body .note-input')
  if (journalNote !== 'e2e 筆記：當時的想法') fail(`Journal 展開應看到筆記，實得「${journalNote}」`)
  await page.click('.open-saved')
  await page.waitForSelector('.reading', { timeout: 3000 })
  if (!(await page.evaluate(() => location.hash)).startsWith('#r/three/34r-7-61')) fail('收藏清單點開應回到原解讀')
  await page.goto(`${BASE_URL}#journal`)
  await page.reload()
  savedItems = await page.$$('.saved-item')
  await (await savedItems[1].$('.saved-head')).click()
  await page.click('.delete-saved')
  await page.waitForSelector('.confirm-delete', { timeout: 3000 })
  await page.click('.confirm-delete')
  await page.waitForTimeout(200)
  if ((await page.$$('.saved-item')).length !== 1) fail('確認刪除後收藏應剩 1 筆')

  // 17. 最近清單單筆刪除
  await page.goto(BASE_URL)
  await page.reload()
  await page.waitForSelector('.recent-item', { timeout: 3000 })
  const recentBefore = (await page.$$('.recent-item')).length
  await page.click('.recent-item .icon-btn:not(.star)')
  await page.waitForTimeout(200)
  const recentAfter = (await page.$$('.recent-item')).length
  if (recentAfter !== recentBefore - 1) fail(`單筆刪除後應剩 ${recentBefore - 1} 筆，實得 ${recentAfter}`)

  // 18. 暱稱改名：每日史整包搬到新名、舊名移除、chips 更新；未命名也可改名
  await page.goto(`${BASE_URL}#journal`)
  await page.reload()
  await page.waitForSelector('.name-chips', { timeout: 3000 })
  await page.click('.name-chips .btn.tab:has-text("小美")')
  await page.click('.rename-btn')
  await page.fill('.rename-input', '阿花')
  await page.click('.rename-row .btn.primary')
  await page.waitForTimeout(200)
  const dailyStore = await page.evaluate(() => JSON.parse(localStorage.getItem('tarot.daily.v1')))
  if (!dailyStore['阿花'] || !dailyStore['阿花']['2026-01-15']) fail('改名後每日史應搬到新名「阿花」')
  if (dailyStore['小美']) fail('改名後舊名「小美」的史應移除')
  if (!(await page.$('.name-chips .btn.tab:has-text("阿花")'))) fail('改名後 chips 應顯示新名')
  await page.click('.name-chips .btn.tab:has-text("未命名")')
  await page.click('.rename-btn')
  await page.fill('.rename-input', '無名氏')
  await page.click('.rename-row .btn.primary')
  await page.waitForTimeout(200)
  const dailyStore2 = await page.evaluate(() => JSON.parse(localStorage.getItem('tarot.daily.v1')))
  if (dailyStore2[''] !== undefined) fail('未命名改名後空字串鍵應移除')
  if (!dailyStore2['無名氏']) fail('未命名的史應搬到「無名氏」')

  // 19. 牌義學習：#study 直開、進度儀表歸零、記憶卡翻卡評分
  await page.goto(`${BASE_URL}#study`)
  await page.reload()
  await page.waitForSelector('.study', { timeout: 3000 })
  const statNums = await page.$$eval('.stat-box .stat-num', (els) => els.map((e) => Number(e.textContent)))
  if (statNums.length !== 4) fail(`學習儀表應 4 格，實得 ${statNums.length}`)
  if (statNums[0] !== 0 || statNums[3] !== 78) fail(`初始儀表應 已學0/未學78，實得 ${statNums.join(',')}`)
  await page.click('.start-cards')
  await page.waitForSelector('.study-card', { timeout: 3000 })
  const frontName = await page.textContent('.study-front .study-card-name')
  if (!frontName.includes('愚者')) fail(`第一張新卡應為愚者（registry 順序），實得 ${frontName}`)
  await page.click('.study-card') // 翻面
  await page.waitForSelector('.study-back', { timeout: 3000 })
  const kwRows = await page.$$('.study-back .study-kw')
  if (kwRows.length !== 2) fail(`翻面應有正位＋逆位兩行關鍵字，實得 ${kwRows.length}`)
  if (!(await page.$('.study-back .study-core'))) fail('翻面應有核心牌義摘要')
  await page.click('.rate-good') // 記得 → 換下一張
  await page.waitForSelector('.study-front', { timeout: 3000 })
  const secondName = await page.textContent('.study-front .study-card-name')
  if (!secondName.includes('魔術師')) fail(`第二張新卡應為魔術師，實得 ${secondName}`)
  await page.click('.study-card')
  await page.waitForSelector('.study-back', { timeout: 3000 })
  await page.click('.rate-again') // 忘了 → 回佇列尾、SRS 記 lapse

  // 19b. 進度持久化：reload 後儀表反映剛剛的評分、localStorage 有排程
  await page.goto(`${BASE_URL}#study`)
  await page.reload()
  await page.waitForSelector('.study-stats', { timeout: 3000 })
  const statAfter = await page.$$eval('.stat-box .stat-num', (els) => els.map((e) => Number(e.textContent)))
  if (statAfter[0] !== 2) fail(`評 2 張後已學應為 2，實得 ${statAfter[0]}`)
  if (statAfter[1] !== 1) fail(`「忘了」的那張應今日到期，實得 ${statAfter[1]}`)
  const studyStore = await page.evaluate(() => JSON.parse(localStorage.getItem('tarot.study.v1')))
  if (!studyStore.srs['major-00'] || studyStore.srs['major-00'].interval < 1) fail('愚者評「記得」後間隔應 ≥1 天')
  if (studyStore.srs['major-01'].lapses !== 1) fail('魔術師評「忘了」後應記 1 次 lapse')

  // 19c. 測驗：4 選項、10 題答完出成績、統計入庫、答錯加重 SRS
  await page.click('.start-quiz')
  await page.waitForSelector('.quiz-option', { timeout: 3000 })
  for (let i = 0; i < 10; i++) {
    const opts = await page.$$('.quiz-option')
    if (opts.length !== 4) fail(`第 ${i + 1} 題應 4 個選項，實得 ${opts.length}`)
    await opts[0].click()
    await page.waitForSelector('.quiz-next', { timeout: 3000 })
    await page.click('.quiz-next')
    await page.waitForTimeout(100)
  }
  await page.waitForSelector('.quiz-done', { timeout: 3000 })
  const studyStore2 = await page.evaluate(() => JSON.parse(localStorage.getItem('tarot.study.v1')))
  if (studyStore2.quiz.answered !== 10) fail(`測驗統計應 10 題，實得 ${studyStore2.quiz.answered}`)
  const wrongCount = 10 - studyStore2.quiz.correct
  const srsCount = Object.keys(studyStore2.srs).length
  if (srsCount < 2) fail(`答錯的牌應加入 SRS，排程數 ${srsCount}（答錯 ${wrongCount}）`)
  await page.click('.quiz-done-actions .btn:not(.primary)') // 回牌義學習
  await page.waitForSelector('.study-stats', { timeout: 3000 })

  // 19d. 單牌詳情「加入學習」：入庫、變已在學習、點了跳 #study；學習資料不進 URL
  const freeId = await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('tarot.study.v1'))
    const ids = []
    for (let i = 0; i <= 21; i++) ids.push(`major-${String(i).padStart(2, '0')}`)
    for (const suit of ['wands', 'cups', 'swords', 'pentacles'])
      for (let i = 1; i <= 14; i++) ids.push(`${suit}-${String(i).padStart(2, '0')}`)
    return ids.find((id) => !s.srs[id])
  })
  await page.goto(`${BASE_URL}#card/${freeId}`)
  await page.reload()
  await page.waitForSelector('.add-study:not(.added)', { timeout: 3000 })
  await page.click('.add-study')
  await page.waitForSelector('.add-study.added', { timeout: 3000 })
  const studyStore3 = await page.evaluate(() => JSON.parse(localStorage.getItem('tarot.study.v1')))
  if (!studyStore3.srs[freeId]) fail(`詳情頁加入學習後 ${freeId} 應入排程`)
  await page.click('.add-study.added')
  await page.waitForSelector('.study', { timeout: 3000 })
  if ((await page.evaluate(() => location.hash)) !== '#study') fail('學習頁 hash 應為 #study，不得夾帶學習資料')

  // 20. 凱爾特十字線上抽：問題 → 洗牌 → 切三刀 → 扇排點 10 張 → 翻 10 張 → 解讀
  await page.goto(`${BASE_URL}#draw/celtic`)
  await page.reload()
  await page.fill('.question-input', 'celtic e2e 測試')
  await page.click('.draw-ask .btn.primary')
  await page.waitForSelector('.cut-deck', { timeout: 6000 })
  for (let i = 0; i < 3; i++) {
    await page.click('.cut-deck')
    await page.waitForTimeout(150)
  }
  await page.waitForSelector('.fan-arc', { timeout: 3000 })
  const fan10 = await page.$$('.fan-slot .fan-card')
  if (fan10.length !== 78) fail(`凱爾特十字扇面應 78 張牌背，實得 ${fan10.length}`)
  await fan10[77].click()
  for (const i of [70, 60, 50, 40, 30, 20, 10, 5, 0]) await fan10[i].click({ force: true })
  await page.waitForSelector('.reveal-cards', { timeout: 3000 })
  const flip10 = await page.$$('.flip-box')
  if (flip10.length !== 10) fail(`凱爾特十字應翻 10 張，實得 ${flip10.length}`)
  for (const box of flip10) await box.click()
  await page.waitForSelector('.see-reading', { timeout: 3000 })
  await page.click('.see-reading')
  await page.waitForSelector('.reading', { timeout: 3000 })
  const celticSections = await page.$$('.reading-card')
  if (celticSections.length !== 10) fail(`凱爾特十字解讀應 10 區段，實得 ${celticSections.length}`)
  const celticNames = await page.$$eval('.reading .card-caption', (els) => els.map((e) => e.textContent.replace(/正位|逆位/g, '').trim()))
  if (new Set(celticNames).size !== 10) fail(`凱爾特十字 10 張牌不應重複：${celticNames.join('、')}`)
  const celticTitles = await page.$$eval('.position-head h3', (els) => els.map((e) => e.textContent))
  for (const t of ['現況', '挑戰', '根基', '過去', '顯意識', '未來', '自身態度', '環境', '希望與恐懼', '結果'])
    if (!celticTitles.some((x) => x.includes(t))) fail(`凱爾特十字缺位置「${t}」`)
  if ((await page.$$('.celtic-map .celtic-cell')).length !== 10) fail('凱爾特十字應有 10 張縮圖總覽')
  const celticBridges = await page.$$eval('.reading-card', (els) => els.map((e) => e.querySelector('.advice') !== null))
  if (!celticBridges.every(Boolean)) fail(`凱爾特十字每個位置都應有 💡 銜接句，實得 ${JSON.stringify(celticBridges)}`)
  if (await page.$('.verdict-badge')) fail('凱爾特十字不是是非題陣，不應出現傾向徽章')
  if (!(await page.$('.share-image'))) fail('凱爾特十字結果頁缺「存成圖卡」按鈕')

  // 20b. 凱爾特十字分享連結：10 個 token、新分頁還原一致
  await page.click('.reading-actions .btn:first-child')
  const celticShared = await page.evaluate(() => navigator.clipboard.readText())
  if (!/#r\/celtic\/(\d{1,2}r?-){9}\d{1,2}r?$/.test(celticShared)) fail(`凱爾特十字分享連結格式不對：${celticShared}`)
  const pageC = await context.newPage()
  await pageC.goto(celticShared)
  await pageC.waitForSelector('.reading', { timeout: 5000 })
  const celticNames2 = await pageC.$$eval('.reading .card-caption', (els) => els.map((e) => e.textContent.trim()))
  const celticNames1 = await page.$$eval('.reading .card-caption', (els) => els.map((e) => e.textContent.trim()))
  if (JSON.stringify(celticNames1) !== JSON.stringify(celticNames2)) fail('凱爾特十字分享連結開啟結果與原頁不一致')
  await pageC.close()

  // 20c. 凱爾特十字手動輸入：進度指示逐張推進 → 10 區段解讀
  await page.goto(`${BASE_URL}#manual/celtic`)
  await page.reload()
  await page.waitForSelector('.manual-entry', { timeout: 3000 })
  for (let i = 0; i < 10; i++) {
    const prog = await page.textContent('.pick-progress')
    if (!prog.includes(`${i + 1}/10`)) fail(`手動輸入進度指示應顯示第 ${i + 1}/10 張，實得「${prog}」`)
    await page.click('.card-grid .grid-cell:not(.used)')
    await page.waitForSelector('.orientation-options', { timeout: 3000 })
    await page.click('.orientation-options .orientation-btn:first-child')
    await page.waitForTimeout(100)
  }
  await page.waitForSelector('.reading', { timeout: 3000 })
  if ((await page.$$('.reading-card')).length !== 10) fail('凱爾特十字手動輸入應進 10 區段解讀')

  // 21. 我的牌：固定生日 1990-07-23 → 生日牌皇帝（31→4）；年度牌依今年同法重算比對；生日不進 URL
  await page.goto(`${BASE_URL}#mycard`)
  await page.reload()
  await page.waitForSelector('.mycard-form', { timeout: 3000 })
  await page.fill('.birthday-input', '1990-07-23')
  await page.click('.mycard-show')
  await page.waitForSelector('.mycard-results', { timeout: 3000 })
  const birthCaption = await page.textContent('.mycard-birth .card-caption')
  if (!birthCaption.includes('皇帝')) fail(`生日牌 1990-07-23 應為皇帝，實得 ${birthCaption}`)
  const digitSum = (n) => String(n).split('').reduce((a, c) => a + Number(c), 0)
  let ySum = digitSum(7) + digitSum(23) + digitSum(new Date().getFullYear())
  while (ySum > 22) ySum = digitSum(ySum)
  const expectYearIdx = ySum === 22 ? 0 : ySum
  const yearCaption = await page.textContent('.mycard-year .card-caption')
  if (!yearCaption.includes(REGISTRY[expectYearIdx].name)) fail(`年度牌應為 ${REGISTRY[expectYearIdx].name}（${expectYearIdx}），實得 ${yearCaption}`)
  if ((await page.evaluate(() => localStorage.getItem('tarot.birthday.v1'))) !== '1990-07-23') fail('生日應存 localStorage')
  const myUrl = await page.evaluate(() => location.href)
  if (myUrl.includes('1990') || !myUrl.endsWith('#mycard')) fail(`生日絕不進 URL，hash 應為 #mycard：${myUrl}`)
  await page.reload()
  await page.waitForSelector('.mycard-results', { timeout: 3000 }).catch(() => fail('reload 後應直接用存好的生日顯示結果'))
  if (!(await page.$('.mycard-results .share-image'))) fail('我的牌缺「存成圖卡」按鈕')

  // 22. 統計：<10 筆顯示「多抽幾次」；注入資料後 Top5/正逆位/牌陣次數渲染（含去重）
  await page.evaluate(() => {
    localStorage.removeItem('tarot.recent.v1')
    localStorage.removeItem('tarot.saved.v1')
    localStorage.removeItem('tarot.daily.v1')
  })
  await page.goto(`${BASE_URL}#journal`)
  await page.reload()
  await page.waitForSelector('.stats-section', { timeout: 3000 })
  if (!(await page.$('.stats-few'))) fail('無紀錄時統計區應顯示「多抽幾次再來看」提示')
  await page.evaluate(() => {
    localStorage.setItem(
      'tarot.recent.v1',
      JSON.stringify([
        { spread: 'three', cards: [{ index: 0, reversed: false }, { index: 1, reversed: true }, { index: 2, reversed: false }], at: '2026-07-01' },
        { spread: 'celtic', cards: Array.from({ length: 10 }, (_, i) => ({ index: i, reversed: i % 3 === 0 })), at: '2026-07-02' },
        { spread: 'yesno', cards: [{ index: 0, reversed: false }], at: '2026-07-03' },
        { spread: 'yesno', cards: [{ index: 5, reversed: true }], at: '2026-07-04' },
        { spread: 'choice', cards: [{ index: 7, reversed: false }, { index: 9, reversed: false }], at: '2026-07-05' },
      ]),
    )
    // 與最近重複的收藏（驗證 entryKey 去重不重複計）
    localStorage.setItem('tarot.saved.v1', JSON.stringify([{ id: 'x1', spread: 'yesno', cards: [{ index: 0, reversed: false }], at: '2026-07-03' }]))
    const days = {}
    for (let d = 1; d <= 6; d++) days[`2026-06-0${d}`] = { index: 0, reversed: d % 2 === 0 }
    localStorage.setItem('tarot.daily.v1', JSON.stringify({ '': days }))
  })
  await page.reload()
  await page.waitForSelector('.stats-body', { timeout: 3000 })
  const readingsNum = await page.textContent('.stats-tiles .stat-box:first-child .stat-num')
  if (readingsNum !== '11') fail(`累計抽牌應 11 次（6 daily + 5 spread，收藏去重），實得 ${readingsNum}`)
  const topRows = await page.$$('.top-card-row')
  if (topRows.length !== 5) fail(`Top 5 應 5 列，實得 ${topRows.length}`)
  const topFirst = await page.textContent('.top-card-row:first-child')
  if (!topFirst.includes('愚者') || !topFirst.includes('× 9')) fail(`Top 1 應為愚者 × 9，實得 ${topFirst}`)
  const chipsText = await page.textContent('.spread-chips')
  for (const c of ['每日一牌 × 6', '三張牌陣 × 1', '是非一問 × 2', '二選一 × 1', '凱爾特十字 × 1'])
    if (!chipsText.includes(c)) fail(`牌陣使用次數缺「${c}」，實得 ${chipsText}`)
  if (!(await page.$('.ori-bar'))) fail('統計區缺正逆位比例條')
  const oriLegend = await page.textContent('.ori-bar-legend')
  if (!oriLegend.includes('（14）') || !oriLegend.includes('（9）')) fail(`正逆位應 14/9，實得 ${oriLegend}`)

  // 23. 關係之樹：完整線上抽（問題 → 洗牌 → 切三刀 → 扇排點 6 張 → 翻 6 張 → 解讀）
  await page.goto(`${BASE_URL}#draw/tree`)
  await page.reload()
  await page.fill('.question-input', 'tree e2e 測試')
  await page.click('.draw-ask .btn.primary')
  await page.waitForSelector('.cut-deck', { timeout: 6000 })
  for (let i = 0; i < 3; i++) {
    await page.click('.cut-deck')
    await page.waitForTimeout(150)
  }
  await page.waitForSelector('.fan-arc', { timeout: 3000 })
  const fanTree = await page.$$('.fan-slot .fan-card')
  if (fanTree.length !== 78) fail(`關係之樹扇面應 78 張牌背，實得 ${fanTree.length}`)
  await fanTree[77].click()
  for (const i of [60, 45, 30, 15, 3]) await fanTree[i].click({ force: true })
  await page.waitForSelector('.reveal-cards', { timeout: 3000 })
  const flipTree = await page.$$('.flip-box')
  if (flipTree.length !== 6) fail(`關係之樹應翻 6 張，實得 ${flipTree.length}`)
  for (const box of flipTree) await box.click()
  await page.waitForSelector('.see-reading', { timeout: 3000 })
  await page.click('.see-reading')
  await page.waitForSelector('.reading', { timeout: 3000 })
  const treeSections = await page.$$('.reading-card')
  if (treeSections.length !== 6) fail(`關係之樹解讀應 6 區段，實得 ${treeSections.length}`)
  const treeNames = await page.$$eval('.reading .card-caption', (els) => els.map((e) => e.textContent.replace(/正位|逆位/g, '').trim()))
  if (new Set(treeNames).size !== 6) fail(`關係之樹 6 張牌不應重複：${treeNames.join('、')}`)
  const treeTitles = await page.$$eval('.position-head h3', (els) => els.map((e) => e.textContent))
  for (const t of ['我的狀態', '對方的狀態', '關係的根基', '目前的養分', '彼此的心結', '這段關係的走向'])
    if (!treeTitles.includes(t)) fail(`關係之樹缺位置「${t}」`)
  const treeBridges = await page.$$eval('.reading-card', (els) => els.map((e) => e.querySelector('.advice') !== null))
  if (!treeBridges.every(Boolean)) fail(`關係之樹每個位置都應有 💡 白話句，實得 ${JSON.stringify(treeBridges)}`)
  if (await page.$('.verdict-badge')) fail('關係之樹不是是非題陣，不應出現傾向徽章')
  if (!(await page.$('.share-image'))) fail('關係之樹結果頁缺「存成圖卡」按鈕')

  // 23b. 關係之樹：分享連結 6 token 還原一致、收藏 reload 保留、最近紀錄入列
  await page.click('.reading-actions .btn:first-child')
  const treeShared = await page.evaluate(() => navigator.clipboard.readText())
  if (!/#r\/tree\/(\d{1,2}r?-){5}\d{1,2}r?$/.test(treeShared)) fail(`關係之樹分享連結格式不對：${treeShared}`)
  if (treeShared.includes('tree e2e')) fail('關係之樹分享連結不應含問題文字')
  const pageT = await context.newPage()
  await pageT.goto(treeShared)
  await pageT.waitForSelector('.reading', { timeout: 5000 })
  const treeNames2 = await pageT.$$eval('.reading .card-caption', (els) => els.map((e) => e.textContent.trim()))
  const treeNames1 = await page.$$eval('.reading .card-caption', (els) => els.map((e) => e.textContent.trim()))
  if (JSON.stringify(treeNames1) !== JSON.stringify(treeNames2)) fail('關係之樹分享連結開啟結果與原頁不一致')
  await pageT.close()
  await page.click('.save-reading')
  await page.waitForSelector('.save-reading.saved', { timeout: 3000 })
  await page.reload()
  await page.waitForSelector('.save-reading.saved', { timeout: 3000 }).catch(() => fail('關係之樹收藏 reload 後應保留'))
  const treeRecent = await page.evaluate(() => JSON.parse(localStorage.getItem('tarot.recent.v1')))
  if (!treeRecent.some((e) => e.spread === 'tree' && e.cards.length === 6)) fail('關係之樹抽牌應進最近紀錄（6 張）')

  // 24. 月度展望：完整線上抽（5 張）→ 解讀 → 位置與白話句 → 收藏
  await page.goto(`${BASE_URL}#draw/month`)
  await page.reload()
  await page.click('.draw-ask .btn.primary') // 月度展望不一定要問題，直接抽
  await page.waitForSelector('.cut-deck', { timeout: 6000 })
  for (let i = 0; i < 3; i++) {
    await page.click('.cut-deck')
    await page.waitForTimeout(150)
  }
  await page.waitForSelector('.fan-arc', { timeout: 3000 })
  const fanMonth = await page.$$('.fan-slot .fan-card')
  await fanMonth[77].click()
  for (const i of [55, 40, 25, 8]) await fanMonth[i].click({ force: true })
  await page.waitForSelector('.reveal-cards', { timeout: 3000 })
  const flipMonth = await page.$$('.flip-box')
  if (flipMonth.length !== 5) fail(`月度展望應翻 5 張，實得 ${flipMonth.length}`)
  for (const box of flipMonth) await box.click()
  await page.waitForSelector('.see-reading', { timeout: 3000 })
  await page.click('.see-reading')
  await page.waitForSelector('.reading', { timeout: 3000 })
  const monthSections = await page.$$('.reading-card')
  if (monthSections.length !== 5) fail(`月度展望解讀應 5 區段，實得 ${monthSections.length}`)
  const monthNames = await page.$$eval('.reading .card-caption', (els) => els.map((e) => e.textContent.replace(/正位|逆位/g, '').trim()))
  if (new Set(monthNames).size !== 5) fail(`月度展望 5 張牌不應重複：${monthNames.join('、')}`)
  const monthTitles = await page.$$eval('.position-head h3', (els) => els.map((e) => e.textContent))
  for (const t of ['本月主題', '工作學業', '感情人際', '身心狀態', '給你的提醒'])
    if (!monthTitles.includes(t)) fail(`月度展望缺位置「${t}」`)
  const monthBridges = await page.$$eval('.reading-card', (els) => els.map((e) => e.querySelector('.advice') !== null))
  if (!monthBridges.every(Boolean)) fail(`月度展望每個位置都應有 💡 白話句，實得 ${JSON.stringify(monthBridges)}`)
  // 本月主題位＝positions.ts 的位置銜接句（固定文案），驗證橋接取對來源
  const monthFirstBridge = await page.$eval('.reading-card:first-child .advice', (el) => el.textContent)
  if (!monthFirstBridge.includes('本月的關鍵字')) fail(`月度展望「本月主題」位白話句應為位置銜接句，實得 ${monthFirstBridge}`)
  await page.click('.save-reading')
  await page.waitForSelector('.save-reading.saved', { timeout: 3000 })
  await page.reload()
  await page.waitForSelector('.save-reading.saved', { timeout: 3000 }).catch(() => fail('月度展望收藏 reload 後應保留'))

  // 24b. 月度展望：hash 直開＋手動輸入進度 5 張
  await page.goto(`${BASE_URL}#r/month/3-17r-40-55-68`)
  await page.reload()
  await page.waitForSelector('.reading', { timeout: 3000 })
  if ((await page.$$('.reading-card')).length !== 5) fail('#r/month hash 直開應 5 區段')
  await page.goto(`${BASE_URL}#manual/tree`)
  await page.reload()
  await page.waitForSelector('.manual-entry', { timeout: 3000 })
  const treeProg = await page.textContent('.pick-progress')
  if (!treeProg.includes('1/6')) fail(`關係之樹手動輸入進度應 1/6，實得「${treeProg}」`)
  const treeSlots = await page.$$('.manual-slot')
  if (treeSlots.length !== 6) fail(`關係之樹手動輸入應 6 個位置格，實得 ${treeSlots.length}`)

  // 25. 返回鍵：站內導航 push 進 history，瀏覽器返回回上一頫而非離站；返回列在非首頁出現
  await page.goto(BASE_URL)
  await page.reload()
  await page.waitForSelector('.hero', { timeout: 3000 })
  if (await page.$('.back-bar')) fail('首頁不應有返回列')
  await page.click('.mode-card:nth-child(1) .btn.primary')
  await page.waitForSelector('.draw-flow', { timeout: 3000 })
  if (!(await page.$('.back-bar'))) fail('非首頁畫面應有返回列')
  await page.goBack()
  await page.waitForSelector('.hero', { timeout: 3000 }).catch(() => fail('瀏覽器返回應回到首頁（不是離站）'))
  await page.goForward()
  await page.waitForSelector('.draw-flow', { timeout: 3000 }).catch(() => fail('瀏覽器前進應回到抽牌頁'))
  // 解讀 → 單牌詳情 → 返回列的「返回」應回到同一份解讀（不是牌庫）
  await page.goto(`${BASE_URL}#r/three/34r-7-61`)
  await page.reload()
  await page.waitForSelector('.reading', { timeout: 3000 })
  await page.click('.reading-card:nth-child(1) .btn.subtle')
  await page.waitForSelector('.card-detail', { timeout: 3000 })
  await page.click('.back-bar .back-btn')
  await page.waitForSelector('.reading', { timeout: 3000 }).catch(() => fail('單牌詳情的返回應回到剛才的解讀'))
  if (!page.url().includes('#r/three/34r-7-61')) fail(`返回後網址應是原解讀，實得 ${page.url()}`)
  // 直開詳情（沒有站內上一頁）→ 返回回首頁
  await page.goto(`${BASE_URL}#card/wands-03`)
  await page.reload()
  await page.waitForSelector('.card-detail', { timeout: 3000 })
  await page.click('.back-bar .back-btn')
  await page.waitForSelector('.hero', { timeout: 3000 }).catch(() => fail('直開詳情按返回應回首頁'))
  await page.click('.mode-card:nth-child(1) .btn.primary')
  await page.waitForSelector('.draw-flow', { timeout: 3000 })
  await page.click('.back-bar .home-btn')
  await page.waitForSelector('.hero', { timeout: 3000 }).catch(() => fail('返回列的首頁鈕應回首頁'))

  // 26. 中途重新整理：線上抽牌切完牌、點了 1 張後 reload 應接續（不重來）；手動輸入選了 1 張 reload 保留
  await page.goto(`${BASE_URL}#draw/three`)
  await page.reload()
  await page.fill('.question-input', '續抽測試')
  await page.click('.draw-ask .btn.primary')
  await page.waitForSelector('.cut-deck', { timeout: 6000 })
  for (let i = 0; i < 3; i++) {
    await page.click('.cut-deck')
    await page.waitForTimeout(150)
  }
  await page.waitForSelector('.fan-arc', { timeout: 3000 })
  await page.click('.fan-slot:nth-child(40) .fan-card', { force: true })
  await page.waitForSelector('.fan-slot.picked', { timeout: 2000 })
  await page.reload()
  await page.waitForSelector('.fan-arc', { timeout: 3000 }).catch(() => fail('抽牌中途 reload 應停在扇排步驟'))
  if ((await page.$$('.fan-slot.picked')).length !== 1) fail('抽牌中途 reload 應保留已點的 1 張')
  if (!(await page.$('.resumed-note'))) fail('續抽應顯示「已接續」提示')
  for (const i of [10, 60]) await page.click(`.fan-slot:nth-child(${i}) .fan-card`, { force: true })
  await page.waitForSelector('.reveal-cards', { timeout: 3000 })
  await page.reload()
  await page.waitForSelector('.reveal-cards', { timeout: 3000 }).catch(() => fail('翻牌步驟 reload 應停在翻牌'))
  for (const box of await page.$$('.flip-box')) await box.click()
  await page.waitForSelector('.see-reading', { timeout: 3000 })
  await page.click('.see-reading')
  await page.waitForSelector('.reading', { timeout: 3000 })
  if (!(await page.textContent('.asked-question')).includes('續抽測試')) fail('續抽後問題文字應保留到解讀頁')
  const inflightAfter = await page.evaluate(() => sessionStorage.getItem('tarot.inflight.v1'))
  if (inflightAfter) fail('看解讀後應清掉續抽快照')
  await page.goto(`${BASE_URL}#manual/three`)
  await page.reload()
  await page.fill('.search-input', '愚者')
  await page.click('.card-grid .grid-cell')
  await page.click('.orientation-btn:nth-child(1)')
  await page.waitForSelector('.manual-slot.current:nth-child(2)', { timeout: 2000 })
  await page.reload()
  await page.waitForSelector('.manual-entry', { timeout: 3000 })
  if (!(await page.textContent('.manual-slot:nth-child(1) .slot-card')).includes('愚者')) fail('手動輸入中途 reload 應保留已選的牌')
  await page.evaluate(() => sessionStorage.removeItem('tarot.inflight.v1'))

  // 27. 備份與還原：下載 JSON（含 app 標記與各 key）→ 清空本機 → 從檔案合併還原 → 收藏回來
  await page.goto(`${BASE_URL}#journal`)
  await page.reload()
  await page.waitForSelector('.backup-section', { timeout: 3000 })
  const savedBefore = await page.evaluate(() => localStorage.getItem('tarot.saved.v1'))
  if (!savedBefore) fail('備份測試前應已有收藏資料')
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 5000 }), page.click('.export-backup')])
  if (!/^tarot-backup-\d{8}\.json$/.test(dl.suggestedFilename())) fail(`備份檔名應為 tarot-backup-YYYYMMDD.json，實得 ${dl.suggestedFilename()}`)
  const dlPath = await dl.path()
  const backup = JSON.parse(readFileSync(dlPath, 'utf8'))
  if (backup.app !== 'tarot' || backup.version !== 1) fail('備份檔應帶 app=tarot 與 version')
  for (const k of ['tarot.saved.v1', 'tarot.daily.v1', 'tarot.study.v1']) if (!(k in backup.data)) fail(`備份檔缺 ${k}`)
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await page.waitForSelector('.backup-section', { timeout: 3000 })
  if (!(await page.$('.saved-empty'))) fail('清空後收藏清單應為空')
  await page.setInputFiles('.import-file', dlPath)
  await page.waitForSelector('.backup-msg.ok', { timeout: 3000 }).catch(() => fail('匯入備份應顯示成功'))
  await page.waitForTimeout(1200)
  await page.waitForSelector('.saved-item', { timeout: 3000 }).catch(() => fail('還原後收藏清單應回來'))
  const savedAfter = await page.evaluate(() => localStorage.getItem('tarot.saved.v1'))
  if (JSON.parse(savedAfter).length !== JSON.parse(savedBefore).length) fail('還原後收藏筆數應與備份一致')
  // 壞檔：不是本站備份 → 提示、不動資料
  const { writeFileSync } = await import('node:fs')
  const badPath = `${dlPath}.bad.json`
  writeFileSync(badPath, JSON.stringify({ hello: 'world' }))
  await page.setInputFiles('.import-file', badPath)
  await page.waitForSelector('.backup-msg.bad', { timeout: 3000 }).catch(() => fail('匯入非本站檔案應提示錯誤'))

  // 28. 壞分享連結：回首頁並帶提示；其他非法 hash 不提示
  await page.goto(`${BASE_URL}#r/three/99-1-2`)
  await page.reload()
  await page.waitForSelector('.home-notice', { timeout: 3000 }).catch(() => fail('壞分享連結應在首頁顯示提示'))
  await page.goto(`${BASE_URL}#card/fake-id`)
  await page.reload()
  await page.waitForSelector('.hero', { timeout: 3000 })
  if (await page.$('.home-notice')) fail('非分享連結的非法 hash 不應顯示壞連結提示')

  // 29. 二選一：hash 直開 2 區段＋比較橫幅；手動輸入 2 張出結果
  await page.goto(`${BASE_URL}#r/choice/0-13r`)
  await page.reload()
  await page.waitForSelector('.reading', { timeout: 3000 })
  if ((await page.$$('.reading-card')).length !== 2) fail('#r/choice 應 2 區段')
  if (!(await page.$('.choice-banner'))) fail('二選一應顯示比較橫幅')
  if ((await page.$$('.verdict-badge')).length !== 2) fail('二選一兩張牌都應有 verdict 徽章')
  await page.goto(`${BASE_URL}#manual/choice`)
  await page.reload()
  for (const q of ['愚者', '魔術師']) {
    await page.fill('.search-input', q)
    await page.click('.card-grid .grid-cell')
    await page.click('.orientation-btn:nth-child(1)')
    await page.waitForTimeout(150)
  }
  await page.waitForSelector('.reading .choice-banner', { timeout: 3000 }).catch(() => fail('二選一手動輸入 2 張後應進解讀並有橫幅'))
  await page.evaluate(() => sessionStorage.removeItem('tarot.inflight.v1'))

  // 30. 連續天數：今天還沒翻時從昨天起算（昨天＋前天有史 → 顯示 2 天）
  await page.evaluate(() => {
    const pad = (n) => String(n).padStart(2, '0')
    const key = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
    const d1 = new Date()
    d1.setDate(d1.getDate() - 1)
    const d2 = new Date()
    d2.setDate(d2.getDate() - 2)
    localStorage.removeItem('tarot.name.v1')
    localStorage.setItem('tarot.daily.v1', JSON.stringify({ '': { [key(d1)]: { index: 1, reversed: false }, [key(d2)]: { index: 2, reversed: true } } }))
  })
  await page.goto(`${BASE_URL}#journal`)
  await page.reload()
  await page.waitForSelector('.cal-grid', { timeout: 3000 })
  const streakText = await page.textContent('.streak-badge').catch(() => '')
  if (!streakText || !streakText.includes('2')) fail(`今天未翻時 streak 應從昨天起算為 2，實得「${streakText}」`)

  // 31. 壞資料防禦：localStorage 塞越界 index／未知 spread，首頁與回顧照常渲染、無 pageerror
  await page.evaluate(() => {
    localStorage.setItem(
      'tarot.recent.v1',
      JSON.stringify([
        { spread: 'nope', cards: [{ index: 1, reversed: false }], at: '2026-01-01' },
        { spread: 'three', cards: [{ index: 999, reversed: false }], at: '2026-01-01' },
        { spread: 'three', cards: [{ index: 1, reversed: false }, { index: 2, reversed: true }, { index: 3, reversed: false }], at: '2026-01-01' },
        'garbage',
      ]),
    )
    localStorage.setItem('tarot.saved.v1', JSON.stringify([{ id: 'x', spread: 'yesno', cards: [{ index: -1, reversed: false }], at: '2026-01-01' }, 42]))
  })
  await page.goto(BASE_URL)
  await page.reload()
  await page.waitForSelector('.hero', { timeout: 3000 })
  if ((await page.$$('.recent-item')).length !== 1) fail('壞的最近紀錄應被丟棄，只留 1 筆合法的')
  await page.goto(`${BASE_URL}#journal`)
  await page.reload()
  await page.waitForSelector('.saved-list', { timeout: 3000 })
  if (await page.$('.saved-item')) fail('壞的收藏紀錄應被丟棄')

  if (consoleErrors.length) fail(`頁面有未捕捉錯誤：${consoleErrors.join(' | ')}`)

  await browser.close()
  console.log('e2e OK：首頁+首訪入門卡、每日一牌seed、hash直開、非法hash防禦、抽牌流程、分享還原、AI複製、是非、手動輸入、GoatCounter隱私、免責、牌庫78格、最近紀錄+單筆刪除、收藏+筆記、Journal收藏清單、暱稱改名、小學堂錨點與交叉連結、牌義學習(記憶卡/測驗/持久化/加入學習)、凱爾特十字(線上抽/手動/分享還原/十字總覽)、我的牌(生日牌/年度牌/本機保存)、抽牌統計(門檻/Top5/去重)、關係之樹(線上抽6張/分享還原/收藏/手動6格)、月度展望(線上抽5張/位置白話句/收藏/hash直開)、返回鍵/返回列、中途續抽、備份還原、壞連結提示、二選一、streak從昨天起算、壞資料防禦全部通過')
} finally {
  server.kill()
}
