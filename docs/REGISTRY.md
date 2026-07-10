# 78 張塔羅牌 canonical id 對照表

**MUST use these exact ids and names. Do not invent.**
順序凍結（分享連結編碼依賴 index），與 `src/content/registry.ts` 完全一致。

| index | id | 中文名 | 英文名 |
|---|---|---|---|
| 0 | major-00 | 愚者 | The Fool |
| 1 | major-01 | 魔術師 | The Magician |
| 2 | major-02 | 女祭司 | The High Priestess |
| 3 | major-03 | 皇后 | The Empress |
| 4 | major-04 | 皇帝 | The Emperor |
| 5 | major-05 | 教皇 | The Hierophant |
| 6 | major-06 | 戀人 | The Lovers |
| 7 | major-07 | 戰車 | The Chariot |
| 8 | major-08 | 力量 | Strength |
| 9 | major-09 | 隱者 | The Hermit |
| 10 | major-10 | 命運之輪 | Wheel of Fortune |
| 11 | major-11 | 正義 | Justice |
| 12 | major-12 | 吊人 | The Hanged Man |
| 13 | major-13 | 死神 | Death |
| 14 | major-14 | 節制 | Temperance |
| 15 | major-15 | 惡魔 | The Devil |
| 16 | major-16 | 塔 | The Tower |
| 17 | major-17 | 星星 | The Star |
| 18 | major-18 | 月亮 | The Moon |
| 19 | major-19 | 太陽 | The Sun |
| 20 | major-20 | 審判 | Judgement |
| 21 | major-21 | 世界 | The World |
| 22–35 | wands-01 … wands-14 | 權杖一…十、侍者、騎士、王后、國王 | Ace…Ten, Page, Knight, Queen, King of Wands |
| 36–49 | cups-01 … cups-14 | 聖杯一…十、侍者、騎士、王后、國王 | Ace…Ten, Page, Knight, Queen, King of Cups |
| 50–63 | swords-01 … swords-14 | 寶劍一…十、侍者、騎士、王后、國王 | Ace…Ten, Page, Knight, Queen, King of Swords |
| 64–77 | pentacles-01 … pentacles-14 | 錢幣一…十、侍者、騎士、王后、國王 | Ace…Ten, Page, Knight, Queen, King of Pentacles |

小牌 rank 對應：01=一（Ace）、02–10=二…十、11=侍者（Page）、12=騎士（Knight）、13=王后（Queen）、14=國王（King）。

批次檔切分（每檔自包含 export）：

| 檔案 | 內容 |
|---|---|
| `src/content/major-00-10.ts` | major-00 … major-10（11 張） |
| `src/content/major-11-21.ts` | major-11 … major-21（11 張） |
| `src/content/wands-01-07.ts` | wands-01 … wands-07 |
| `src/content/wands-08-14.ts` | wands-08 … wands-14 |
| `src/content/cups-01-07.ts` / `cups-08-14.ts` | 同上模式 |
| `src/content/swords-01-07.ts` / `swords-08-14.ts` | 同上模式 |
| `src/content/pentacles-01-07.ts` / `pentacles-08-14.ts` | 同上模式 |
