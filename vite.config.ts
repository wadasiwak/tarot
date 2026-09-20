import { createHash } from 'node:crypto'
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

// 在每個 JS chunk 開頭加版權宣告（`/*!` 開頭的註解 minify 不會移除）
function copyrightBanner(): Plugin {
  return {
    name: 'copyright-banner',
    enforce: 'post',
    generateBundle(_options, bundle) {
      for (const chunk of Object.values(bundle)) {
        if (chunk.type === 'chunk') {
          chunk.code = `/*! © 2026 wadasiwak. All rights reserved. */\n${chunk.code}`
        }
      }
    },
  }
}

// PWA service worker：build 完成後掃 dist 產 sw.js（precache app shell；牌圖走「看過就留」）。
// 手寫、不用 vite-plugin-pwa：零新依賴、relative base 下 GH Pages 子路徑直接可用（移植自 japan-planner）。
// 在 closeBundle 跑：此時 publicDir 已複製進 dist，掃目錄才拿得到 icon/manifest。
function pwaServiceWorker(): Plugin {
  const root = fileURLToPath(new URL('.', import.meta.url))
  const skip = (rel: string) => rel === 'sw.js' || rel === 'og-image.png' || rel.startsWith('cards/')
  return {
    name: 'pwa-sw',
    apply: 'build',
    enforce: 'post',
    closeBundle() {
      const dist = join(root, 'dist')
      const files: string[] = []
      const walk = (dir: string) => {
        for (const ent of readdirSync(dir, { withFileTypes: true })) {
          const p = join(dir, ent.name)
          if (ent.isDirectory()) walk(p)
          else if (!skip(relative(dist, p))) files.push(relative(dist, p))
        }
      }
      walk(dist)
      files.sort()
      const hash = createHash('sha256')
      for (const f of files) hash.update(f).update(readFileSync(join(dist, f)))
      const sw = readFileSync(join(root, 'scripts/sw-template.js'), 'utf8')
        .replaceAll('__VERSION__', hash.digest('hex').slice(0, 12))
        .replaceAll('__PRECACHE__', JSON.stringify(files.map((f) => `./${f}`)))
      writeFileSync(join(dist, 'sw.js'), sw)
      console.log(`[pwa-sw] sw.js generated — ${files.length} files precached`)
    },
  }
}

export default defineConfig({
  plugins: [react(), copyrightBanner(), pwaServiceWorker()],
  // Relative base so the static build works at any path (GitHub Pages
  // serves it under /tarot/).
  base: './',
  server: { port: 5230 },
  preview: { port: 5230 },
})
