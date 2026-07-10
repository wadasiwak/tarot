// 牌陣定義與位置框架語。
// 位置框架是「牌陣的屬性」不是「牌的屬性」：渲染時當區段標頭說明，
// 牌身內容（core / advice…）不重複這些話，避免 78×3 份模板位置文。

export type SpreadId = 'daily' | 'three' | 'yesno' | 'choice' | 'relation'

export const SPREAD_SIZE: Record<SpreadId, number> = {
  daily: 1,
  three: 3,
  yesno: 1,
  choice: 2,
  relation: 3,
}

export interface SpreadPosition {
  title: string // 位置名（過去 / 現在 / 未來 / 選項A…）
  frame: string // 框架語 30–50 字，說明這個位置在回答什麼
}

export const SPREADS: Record<SpreadId, { name: string; intro: string; positions: SpreadPosition[] }> = {
  daily: {
    name: '每日一牌',
    intro: '今天的能量與提醒，同一天抽到的結果不會變。',
    positions: [{ title: '今日指引', frame: '這張牌描述今天圍繞著你的能量，以及一個值得放在心上的提醒。' }],
  },
  three: {
    name: '三張牌陣',
    intro: '以過去、現在、未來三個位置，看一件事的來龍去脈與走向。',
    positions: [
      { title: '過去', frame: '事情的成因與影響的來源：哪些已經發生的事，形塑了現在的局面。' },
      { title: '現在', frame: '當下的課題與狀態：你此刻真正面對的，是什麼。' },
      { title: '未來', frame: '若維持現狀，事情自然的走向；牌末附上這張牌給你的行動建議。' },
    ],
  },
  yesno: {
    name: '是非一問',
    intro: '心裡先想好一個是非題，抽一張牌看整體傾向。',
    positions: [{ title: '答案傾向', frame: '這張牌對你的問題所呈現的整體能量傾向，附上理由。' }],
  },
  choice: {
    name: '二選一',
    intro: '在兩個選項之間猶豫時，各抽一張牌比較兩邊的能量。',
    positions: [
      { title: '選項 A', frame: '選擇 A 這條路的能量與可能的發展。' },
      { title: '選項 B', frame: '選擇 B 這條路的能量與可能的發展。' },
    ],
  },
  relation: {
    name: '關係牌陣',
    intro: '看一段關係的兩端與走向——感情、家人、同事都適用。',
    positions: [
      { title: '我的狀態', frame: '你在這段關係裡此刻的位置：帶著什麼能量、在意著什麼。' },
      { title: '對方的狀態', frame: '對方此刻的能量與心思——以牌面呈現的樣子，而非你希望的樣子。' },
      { title: '關係走向', frame: '若兩人維持現在的相處方式，這段關係自然的走向；牌末附上行動建議。' },
    ],
  },
}
