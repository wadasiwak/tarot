# 日常塔羅

線上塔羅抽牌與解讀。偉特塔羅（Rider–Waite–Smith）78 張全收錄，支援正逆位。

**網站**：https://wadasiwak.github.io/tarot/

## 功能

- 🌙 **每日一牌**：同一天抽到的結果固定（日期 seed），當天的指引與小行動
- 🃏 **三張牌陣**：過去／現在／未來，看一件事的來龍去脈
- ⚖️ **是非一問**：想好是非題抽一張，五級傾向（是・偏是・持平・偏否・否）＋理由
- 🔀 **二選一**：兩個選項各抽一張比較能量
- 🌳 **關係之樹**：6 張把關係看成一棵樹——兩人狀態、根基、養分、心結與走向
- 🗓️ **月度展望**：月初抽 5 張，看本月主題、工作學業、感情人際、身心與提醒
- ✨ **凱爾特十字**：進階 10 張大陣，含十字排列總覽與逐位銜接句
- ✋ **輸入實體牌**：現實中抽了牌？搜尋選牌（含正逆位）立即看解析
- 📖 **牌庫**：78 張完整牌義（核心牌義／今日指引／愛情／事業／財運／行動建議）
- 🔮 **複製給 AI 深度解讀**：一鍵把牌陣結果組成 prompt，貼給任何 LLM
- 🔗 **分享連結**：抽牌結果編碼進網址（問題文字不進 URL）
- 🎂 **我的牌**：生日牌／年度牌（生命靈數算法，生日只存本機）
- 🎓 **牌義學習**：SM-2 間隔重複記憶卡＋四選一測驗，進度只存本機
- 📔 **回顧**：每日一牌月曆、解讀收藏＋筆記、抽牌統計（Top 5／正逆位／牌陣次數）
- 🌐 **中英雙語**：介面與 78 張牌義全雙語，偏好記在本機
- 📝 **每日筆記**：翻開今天的牌後可寫一句心情，回顧月曆點該日即可查看／修改
- 💾 **備份與還原**：所有紀錄一鍵下載成 JSON，換手機或清除瀏覽資料後從檔案還原（合併／覆蓋）
- 📲 **PWA 離線**：加到主畫面可離線開站；牌圖看過就留在裝置上
- ↩️ **返回鍵友善**：手機系統返回鍵在畫面間往返而非離站；抽牌中途誤觸重新整理會接續

以上個人紀錄全存瀏覽器 localStorage，無後端、不上傳。流量統計（GoatCounter）只回報「哪個功能被打開」，不含抽到的牌、日期或問題。

## 開發

```bash
npm install
npm run dev        # dev server (port 5230)
npm run check      # 內容驗證（78 張完備性、字數、枚舉、簡體字、模板句、牌陣位置文案、生日牌文案）
npm run lint       # oxlint
npm run build      # tsc + vite build
npm run e2e        # 端到端測試（自起 preview :5231）
npm run images     # 從 Wikimedia Commons 抓 78 張公版牌圖
```

CI（GitHub Actions）在 push 到 main 時依序跑 lint → check → build → e2e，全綠才部署到 Pages。

新增牌陣時的三個接點：`src/content/positions.ts` 的 `SPREAD_SIZE`／`SPREADS`／`SPREADS_EN`／`BRIDGE_FIELDS`（每個位置的 💡 白話句取牌義哪一欄）、`src/lib/share.ts` 的 `isDrawableSpread`、`src/components/Home.tsx` 的 `MODES`；`npm run check` 會驗長度對齊。

```bash
```

## 版權

- **程式碼**：© 2026 wadasiwak. All rights reserved.
- **解讀文字**：本站原創撰寫（方向對齊傳統偉特牌義），© 2026 wadasiwak，未經授權禁止轉載。
- **牌面圖像**：Rider–Waite–Smith 塔羅 1909 年原版掃描（Pamela Colman Smith 繪），
  已進入公共領域；圖檔來源 [Wikimedia Commons](https://commons.wikimedia.org/wiki/Category:Rider-Waite_tarot_deck)。
  注意：US Games 1971 年版的新增素材（含牌背設計）仍有版權，本站未使用。

## 免責

塔羅解讀僅供參考與自我對話，重大決定請以自己的判斷為主；健康相關請及早尋求正規醫療。
