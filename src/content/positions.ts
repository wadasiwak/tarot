// 牌陣定義與位置框架語。
// 位置框架是「牌陣的屬性」不是「牌的屬性」：渲染時當區段標頭說明，
// 牌身內容（core / advice…）不重複這些話，避免 78×3 份模板位置文。

export type SpreadId = 'daily' | 'three' | 'yesno' | 'choice' | 'relation' | 'celtic'

export const SPREAD_SIZE: Record<SpreadId, number> = {
  daily: 1,
  three: 3,
  yesno: 1,
  choice: 2,
  relation: 3,
  celtic: 10,
}

export interface SpreadPosition {
  title: string // 位置名（過去 / 現在 / 未來 / 選項A…）
  frame: string // 框架語 30–50 字，說明這個位置在回答什麼
  bridge?: string // 位置牌義銜接句（凱爾特十字用）：把「這個位置」與「抽到的牌義」接起來的一句話。
  // 十張牌陣無法為 78×10 寫專屬白話句，改以位置層級的銜接句提示讀法。
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
  celtic: {
    name: '凱爾特十字',
    intro: '十張牌看一件事的全貌——現況與阻力、根基與過往、內心與環境，最後收在走向。適合醞釀已久的大哉問。',
    positions: [
      {
        title: '現況',
        frame: '這件事此刻的核心能量：你真正身處的局面，而不是你以為的樣子。',
        bridge: '先讓這張牌替現在定調——後面九張，都是繞著它展開的。',
      },
      {
        title: '挑戰',
        frame: '橫在眼前的阻力或課題：得正面通過的那道坎，有時也是被錯認的助力。',
        bridge: '把這張牌讀成要過的關：它未必是敵人，卻繞不過去。',
      },
      {
        title: '根基',
        frame: '事情的深層基礎：埋在表面之下、讓局面長成現在這樣的土壤。',
        bridge: '它說的是你心裡其實早就有數的底層原因——往下挖，就是這裡。',
      },
      {
        title: '過去',
        frame: '剛走過的一段：正在退場、但影響尚未散去的人事物。',
        bridge: '這股力量正在減弱——留下它教你的，然後允許它離開。',
      },
      {
        title: '顯意識',
        frame: '你腦中盤旋的目標與念頭：檯面上的期待，你以為自己要的東西。',
        bridge: '拿這張牌對照你嘴上說的目標，看看兩者是不是同一件事。',
      },
      {
        title: '未來',
        frame: '近期即將浮現的能量：下一步最可能出現的場景，而非最終定局。',
        bridge: '它是即將轉進的下一幕——先看見，就來得及提前佈局。',
      },
      {
        title: '自身態度',
        frame: '你在這件事裡的姿態：你如何看待自己，又打算用什麼樣子面對。',
        bridge: '這張牌是你的自畫像——它和你想像中的自己，像不像？',
      },
      {
        title: '環境',
        frame: '身邊的人與外在條件：旁人的眼光、可用的資源與整體氛圍。',
        bridge: '把它讀成周遭的風向；順風或逆風，都是能拿來用的資訊。',
      },
      {
        title: '希望與恐懼',
        frame: '心底最深的期待與最怕發生的事——它們常是同一件事的兩面。',
        bridge: '它照出你不敢明說的那一塊；誠實面對，它就不再暗中使力。',
      },
      {
        title: '結果',
        frame: '照目前的路走下去，事情最可能收在哪裡；這是趨勢，不是判決。',
        bridge: '喜歡這個方向，就穩穩走下去；不喜歡，前九張牌就是改寫它的線索。',
      },
    ],
  },
}

export const SPREADS_EN: Record<SpreadId, { name: string; intro: string; positions: SpreadPosition[] }> = {
  daily: {
    name: 'Card of the Day',
    intro: "Today's energy and reminder — the result stays the same all day.",
    positions: [{ title: "Today's Guidance", frame: 'This card describes the energy around you today, and one thing worth keeping in mind.' }],
  },
  three: {
    name: 'Three-Card Spread',
    intro: 'Past, present and future — the arc of one situation.',
    positions: [
      { title: 'Past', frame: 'Where it came from: what has already happened that shaped the present.' },
      { title: 'Present', frame: 'The task at hand: what you are truly facing right now.' },
      { title: 'Future', frame: 'Where things naturally head if nothing changes; the card ends with its advice for you.' },
    ],
  },
  yesno: {
    name: 'Yes or No',
    intro: 'Hold a yes-or-no question in mind and draw one card for the overall lean.',
    positions: [{ title: 'The Lean', frame: "The card's overall energy toward your question, with the reasoning." }],
  },
  choice: {
    name: 'Two Choices',
    intro: 'Torn between two options? Draw one card for each and compare their energy.',
    positions: [
      { title: 'Option A', frame: 'The energy and likely unfolding of path A.' },
      { title: 'Option B', frame: 'The energy and likely unfolding of path B.' },
    ],
  },
  relation: {
    name: 'Relationship Spread',
    intro: 'Both sides of a relationship and where it is heading — love, family or work.',
    positions: [
      { title: 'Where I Stand', frame: 'Your place in this relationship right now: the energy you carry, what you care about.' },
      { title: 'Where They Stand', frame: 'Their energy and state of mind — as the card shows it, not as you wish it to be.' },
      { title: 'Where It Heads', frame: 'Where the relationship naturally goes if things stay as they are; the card ends with its advice.' },
    ],
  },
  celtic: {
    name: 'Celtic Cross',
    intro: 'Ten cards for the full picture of one matter — the present, what blocks it, its roots and past, mind and surroundings, closing on where it heads. Made for the big questions.',
    positions: [
      {
        title: 'The Present',
        frame: 'The heart of the matter right now — the situation you are actually in, not the one you assume.',
        bridge: 'Let this card set the tone: the other nine unfold around it.',
      },
      {
        title: 'The Challenge',
        frame: 'What crosses your path: the hurdle to face head-on — sometimes an ally in disguise.',
        bridge: 'Read this as the gate you must pass through; it need not be an enemy, but it cannot be walked around.',
      },
      {
        title: 'The Foundation',
        frame: 'The deep base of it all: the soil beneath the surface that grew this situation.',
        bridge: 'It names the underlying cause you have quietly known all along — dig here.',
      },
      {
        title: 'The Past',
        frame: 'What is on its way out: recently passed, though its influence still lingers.',
        bridge: 'Its grip is loosening — keep what it taught you, and let the rest go.',
      },
      {
        title: 'The Conscious',
        frame: 'What circles in your mind: the stated goal, what you believe you want.',
        bridge: 'Hold this card against what you say you want — are they the same thing?',
      },
      {
        title: 'The Near Future',
        frame: 'The energy about to surface: the next scene, not the final act.',
        bridge: 'This is the turn coming up — see it early and you can prepare rather than react.',
      },
      {
        title: 'Your Stance',
        frame: 'How you place yourself in this story: how you see yourself, and the face you plan to bring.',
        bridge: 'This card is your self-portrait — does it match the self you imagine?',
      },
      {
        title: 'Surroundings',
        frame: 'The people and conditions around you: opinions, resources, and the mood of the room.',
        bridge: 'Treat it as the prevailing wind — with you or against you, it is information you can use.',
      },
      {
        title: 'Hopes & Fears',
        frame: 'Your deepest hope and sharpest fear — so often two faces of the same thing.',
        bridge: 'It shows the part you dare not say aloud; name it, and it stops steering from the shadows.',
      },
      {
        title: 'The Outcome',
        frame: 'Where things most likely land if you stay on this road — a tendency, not a verdict.',
        bridge: 'If you like this direction, keep walking; if not, the nine cards before it are your levers for change.',
      },
    ],
  },
}

export function getSpreads(lang: 'zh' | 'en') {
  return lang === 'en' ? SPREADS_EN : SPREADS
}
