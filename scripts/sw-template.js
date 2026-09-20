// Service worker 模板：vite.config.ts 的 pwaServiceWorker plugin 在 build 時把
// __VERSION__／__PRECACHE__ 換成該次 build 的內容雜湊與檔案清單，寫到 dist/sw.js。
// 策略：app shell（HTML/JS/CSS/icon/manifest）precache；78 張牌圖 9.4MB 不在安裝時全抓，
// 改成「看過就留」的 cache-first（離線能翻每日一牌與看過的牌）。
// 跨網域（GoatCounter、姊妹作 widget）一律不攔不快取。
const CACHE = 'tarot-__VERSION__'
const CARDS_CACHE = 'tarot-cards' // 牌圖另放不帶版本的 cache，改版不清（否則每次部署離線牌圖全沒）
const PRECACHE = __PRECACHE__

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)))
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    (async () => {
      for (const key of await caches.keys()) {
        if (key !== CACHE && key !== CARDS_CACHE) await caches.delete(key)
      }
      await self.clients.claim()
    })(),
  )
})

self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting()
})

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return
  // ignoreVary：vite preview／CDN 會對 assets 回 Vary: Origin，module script 與 addAll
  // 存入時的請求標頭不同，不忽略會 cache miss、離線就 ERR_FAILED
  const OPTS = { ignoreSearch: true, ignoreVary: true }
  e.respondWith(
    (async () => {
      const cache = await caches.open(CACHE)
      // SPA：所有導航都回 app shell（離線 reload 也開得起來；hash 路由在前端）
      if (req.mode === 'navigate') {
        const shell = await cache.match('./index.html', OPTS)
        if (shell) return shell
      }
      const isCard = url.pathname.includes('/cards/')
      const hit = await (isCard ? caches.open(CARDS_CACHE) : Promise.resolve(cache)).then((c) => c.match(req, OPTS))
      if (hit) return hit
      const res = await fetch(req)
      // 牌圖：看過就留（waitUntil 確保 SW 不會在寫入前被回收）
      if (res.ok && isCard) e.waitUntil(caches.open(CARDS_CACHE).then((c) => c.put(req, res.clone())))
      return res
    })(),
  )
})
