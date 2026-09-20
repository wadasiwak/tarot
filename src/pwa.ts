// PWA：service worker 註冊。
// - 只在 production build 註冊（dev 沒有 sw.js）；dev 模式主動註銷＋清 cache，
//   preview 與 dev server 共用 5230，留下的 SW 會劫持 dev server 送舊快取。
// - 更新策略：開站時若已有待命新版就直接切換並 reload（此時用戶什麼都還沒做）；
//   使用中才裝好的新版留到下次開站，不打斷抽牌。
export function setupPWA(): void {
  if (!('serviceWorker' in navigator)) return

  if (import.meta.env.DEV) {
    navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => r.unregister()))
    if ('caches' in window) caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)))
    return
  }

  let switching = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (switching) location.reload()
  })

  // 相對路徑：GH Pages 子路徑下解析成 /tarot/sw.js
  navigator.serviceWorker
    .register('sw.js')
    .then((reg) => {
      if (reg.waiting && navigator.serviceWorker.controller) {
        switching = true
        reg.waiting.postMessage({ type: 'SKIP_WAITING' })
      }
    })
    .catch(() => {
      /* SW 註冊失敗不影響線上使用 */
    })
}
