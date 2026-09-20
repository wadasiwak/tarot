---
name: verify
description: 驗證 tarot（日常塔羅）改動——啟動指令、測試 hook、已知地雷
---

# 驗證日常塔羅

## 指令

```bash
npm run dev        # dev server port 5230
npm run check      # 內容驗證（單檔：npm run check -- src/content/wands-01-07.ts）
npm run build > /tmp/tarot-build.log 2>&1 && echo OK || tail /tmp/tarot-build.log   # 禁 pipe grep（吞 exit code）
npm run e2e        # 需先 build；自起 vite preview :5231，finally kill
node scripts/screenshot.mjs   # 截圖到 scripts/shots/（port 5232），截完必用 Read 親眼看
```

## Port

dev/preview **5230**、e2e **5231**、screenshot **5232**（姊妹作 port 表：5220=japan-planner，勿撞）。

## Gotchas

- `src/content/registry.ts` 順序凍結：分享連結 `#r/...` 直接編碼 index 0–77，**禁止重排/插入**。
- 內容檔（major-00-10.ts 等 10 檔）由 subagent 生成；改 schema 要同步 `types.ts`＋`scripts/check-content.mjs` 的 LEN 表。
- check／e2e 腳本靠 Node 22.18+ 原生 type stripping 直接 import .ts（CI 釘 22.18）；簡體字黑名單已排除「后」「划」（正體正字）。
- 問題文字**絕不進 URL**（個資），只進「複製給 AI」剪貼簿與本機紀錄；GoatCounter 只回報 pathname＋畫面種類（`daily`／`draw/three`／`r/celtic`…），**不含牌 token、日期、單牌 id**（e2e 第 10 條釘住）。
- 路由用 `pushState`＋`popstate/hashchange` 同步（`state.ts`），`history.state.depth` 記站內深度給 `back()` 判斷；e2e 用 `page.goBack()` 驗。改 `go()` 別退回 replaceState（手機返回鍵會直接離站）。
- `#daily/<日期>`：未來或不存在的日期 fallback 今天；**回顧過去日期不寫每日史**（e2e 2c 釘住，改名測試 18 靠植入資料）。
- 抽牌／手動輸入進行中狀態存 `sessionStorage` `tarot.inflight.v1`（DrawFlow/ManualEntry），看解讀後清掉；e2e 會 reload 驗續抽。
- localStorage 讀取逐筆驗 shape（`storage.ts` isEntry/isDrawnCard），壞筆丟棄；新增 key 要同步 `STORAGE_KEYS`（備份／還原靠它）。
- 解讀頁每個位置的 💡 白話句由 `positions.ts` 的 `BRIDGE_FIELDS` 查表；新牌陣要補一列，`npm run check` 驗長度＝SPREAD_SIZE 與 zh/en bridge 一致。
- PWA：`vite.config.ts` 手寫 SW plugin 在 build 時產 `dist/sw.js`（precache app shell，`cards/` 不預抓、看過就留）；dev 模式 `src/pwa.ts` 會註銷 SW＋清 cache（preview 與 dev 共用 5230）。改了 SW 策略要重 build 才看得到。
- 牌名本地化一律走 `lib/cardName.ts`（`cardName`/`cardNameAt`/`cardSummary`），別再寫 `lang === 'en' ? nameEn : name`。
- 牌圖 `public/cards/<id>.jpg` 78 張已 commit（1909 公版，寬 480 壓過）；重抓跑 `npm run images`（斷點續跑）。
- e2e 的每日一牌測試用 `#daily/2026-01-15` 固定日期（seed 決定性）。
