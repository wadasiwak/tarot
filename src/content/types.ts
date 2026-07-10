// 塔羅牌內容 schema。所有內容檔皆為 plain literals designed to be LLM-generatable。
// 本檔即內容生產 agent 的 prompt 文件——欄位語意、字數範圍、枚舉白名單都以此為準。
//
// ── 語氣鐵則（每一欄都適用）─────────────────────────────────────────
// 1. 繁體中文、台灣用語；禁止簡體字與中國大陸用語。
// 2. 凶牌（塔、死神、惡魔、寶劍三/九/十、聖杯五…）給轉圜不嚇人：
//    誠實說出挑戰，但一定收在「可以怎麼面對」的方向。
// 3. 量身寫、禁模板句：不可跨牌複製貼上同一句式（「這張牌提醒你…」開頭全卡通用即為模板句）。
// 4. 方向不可與傳統偉特（RWS）牌義矛盾。可對齊公共領域的 Waite《The Pictorial
//    Key to the Tarot》(1911) 的方向，但禁止翻譯任何現代版權文本。
// 5. 健康相關話題一律導向「及早正規就醫」，絕不勸停藥、不給診斷。
// 6. scene 欄位只能描述 RWS 1909 牌面上真的畫出來的元素，禁止腦補。

// 四花色（順序凍結：hash 編碼依 registry 順序）
export const SUITS = ['wands', 'cups', 'swords', 'pentacles'] as const
export type Suit = (typeof SUITS)[number]

export const SUIT_NAMES: Record<Suit, string> = {
  wands: '權杖',
  cups: '聖杯',
  swords: '寶劍',
  pentacles: '錢幣',
}

// 是非題傾向五級。⚠️ 禁止機械式「正位=yes、逆位=no」——
// verdict 是「這張牌對是非題的整體能量傾向」：
// 例：死神正位問復合 → no（結束本身就是答案）；死神逆位 → neutral（懸而未決）；
//     太陽正位 → yes；太陽逆位 → leanYes（好事延遲，不是壞事）。
export const VERDICTS = ['yes', 'leanYes', 'neutral', 'leanNo', 'no'] as const
export type Verdict = (typeof VERDICTS)[number]

export const VERDICT_LABELS: Record<Verdict, string> = {
  yes: '是',
  leanYes: '偏是',
  neutral: '持平',
  leanNo: '偏否',
  no: '否',
}

export const VERDICT_LABELS_EN: Record<Verdict, string> = {
  yes: 'Yes',
  leanYes: 'Leaning yes',
  neutral: 'Unclear',
  leanNo: 'Leaning no',
  no: 'No',
}

export const SUIT_NAMES_EN: Record<Suit, string> = {
  wands: 'Wands',
  cups: 'Cups',
  swords: 'Swords',
  pentacles: 'Pentacles',
}

// 單一方向（正位或逆位）的完整解讀
export interface CardReading {
  keywords: string[] // 3–5 個關鍵詞，各 2–6 字（例：新的開始、冒險、天真）
  core: string // 核心牌義 80–140 字。單牌詳情與三張牌陣的主體文
  daily: string // 每日指引 60–100 字。「今天」口吻，收在一個具體可做的小行動
  love: string // 愛情感情 40–70 字（單身與有伴都要能讀）
  career: string // 事業工作學業 40–70 字
  money: string // 財運金錢 40–70 字
  advice: string // 一句行動建議 20–40 字。三張牌陣「未來」位置也會引用
  past: string // 三張牌陣「過去」位白話句 30–55 字：回望口吻，說這張牌作為「成因」留下了什麼（例：「這件事始於…，那份…是現在局面的種子。」句式勿全卡雷同）
  present: string // 三張牌陣「現在」位白話句 30–55 字：當下課題口吻，說你此刻正面對什麼、該把注意力放哪
  other: string // 關係牌陣「對方的狀態」位白話句 30–55 字：第三人稱（「對方／那個人」）描述對方此刻的狀態與心思，扣合正逆位牌義，不評價不腦補動機
  verdict: Verdict // 是非題傾向（枚舉白名單，見上）
  verdictReason: string // 是非傾向理由 30–60 字（「這張牌顯示…，所以偏向…」的因果）
}

export interface TarotCard {
  id: string // canonical id，只能用 registry.ts 白名單（major-00…pentacles-14），禁自創
  name: string // 中文名（愚者、權杖三、聖杯王后）——以 registry.ts 為準
  nameEn: string // 英文名（The Fool / Three of Wands）——以 registry.ts 為準
  arcana: 'major' | 'minor'
  suit?: Suit // 小牌必填；大牌省略
  rank?: number // 小牌 1–14（1=Ace、11=侍者、12=騎士、13=王后、14=國王）；大牌省略
  number: number // 大牌 0–21；小牌同 rank（顯示用）
  scene: string // 牌面圖像描述 40–80 字，只寫 RWS 1909 真的畫的元素，供拿實體牌的人認牌
  upright: CardReading
  reversed: CardReading
}
