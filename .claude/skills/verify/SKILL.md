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
- check 腳本靠 Node 26 原生 type stripping 直接 import .ts；簡體字黑名單已排除「后」「划」（正體正字）。
- 問題文字**絕不進 URL**（個資），只進「複製給 AI」剪貼簿；GoatCounter 只回報 pathname（e2e 第 10 條釘住）。
- 牌圖 `public/cards/<id>.jpg` 78 張已 commit（1909 公版，寬 480 壓過）；重抓跑 `npm run images`（斷點續跑）。
- e2e 的每日一牌測試用 `#daily/2026-01-15` 固定日期（seed 決定性）。
