// 牌陣定義與位置框架語。
// 位置框架是「牌陣的屬性」不是「牌的屬性」：渲染時當區段標頭說明，
// 牌身內容（core / advice…）不重複這些話，避免 78×3 份模板位置文。

export type SpreadId = 'daily' | 'three' | 'yesno' | 'choice' | 'relation' | 'tree' | 'month' | 'celtic'

export const SPREAD_SIZE: Record<SpreadId, number> = {
  daily: 1,
  three: 3,
  yesno: 1,
  choice: 2,
  relation: 3,
  tree: 6,
  month: 5,
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
  tree: {
    name: '關係之樹',
    intro: '把一段關係看成一棵樹——兩個人的狀態、扎根的地方、正在澆的水、卡住的結，最後看它往哪裡長。感情、家人、朋友都適用。',
    positions: [
      { title: '我的狀態', frame: '你在這段關係裡此刻的樣子：帶著什麼心情站在樹下，最在意的是什麼。' },
      { title: '對方的狀態', frame: '對方此刻的能量與心思——以牌面呈現的樣子，而非你希望或擔心的樣子。' },
      { title: '關係的根基', frame: '這段關係扎根的地方：把你們連在一起的底層默契，或最初的緣分。' },
      { title: '目前的養分', frame: '現在滋養這段關係的東西：讓它保持生機的互動與心意，值得繼續澆灌。' },
      {
        title: '彼此的心結',
        frame: '兩人之間打結的地方：可能是誤會、期待落差，或都還沒說出口的事。',
        bridge: '把這張牌讀成結卡住的位置——看見結在哪裡，其實就已經鬆開了一半。',
      },
      { title: '這段關係的走向', frame: '照現在的相處方式，這棵樹自然會長的方向；牌末附上這張牌給你的行動建議。' },
    ],
  },
  month: {
    name: '月度展望',
    intro: '月初抽一次，替接下來的一個月畫一張溫柔的地圖：主題、工作學業、感情人際、身心狀態，最後收在一句提醒。',
    positions: [
      {
        title: '本月主題',
        frame: '這個月的主旋律：整體的能量基調，接下來的日子大致會繞著它展開。',
        bridge: '把這張牌當作本月的關鍵字——遇到猶豫的時刻，回頭想想它。',
      },
      { title: '工作學業', frame: '這個月在工作或學業上的氣象：機會、進度，與值得留意的施力點。' },
      { title: '感情人際', frame: '這個月的感情與人際流動：與重要的人之間，靠近或需要空間的節奏。' },
      {
        title: '身心狀態',
        frame: '這個月的身心電量：能量的起伏，以及該把休息排進行事曆的訊號。',
        bridge: '把這張牌讀成身心的天氣預報——提醒你何時該充電、何時可以衝刺；若真的不舒服，記得及早就醫。',
      },
      { title: '給你的提醒', frame: '這個月最想送給你的一句話：放在心上，月底再回頭看看。' },
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
  tree: {
    name: 'Relationship Tree',
    intro: 'Read a relationship as a tree — where you both stand, its roots, what feeds it, where it knots, and where it grows. Works for love, family and friends.',
    positions: [
      { title: 'Where I Stand', frame: 'How you show up in this relationship right now: the mood you bring, what you care about most.' },
      { title: 'Where They Stand', frame: 'Their energy and state of mind — as the card shows it, not as you hope or fear it to be.' },
      { title: 'The Roots', frame: 'Where this relationship is rooted: the quiet understanding, or the first bond, that holds you together.' },
      { title: 'What Feeds It', frame: 'What nourishes the relationship now: the exchanges and care that keep it alive — worth watering.' },
      {
        title: 'The Knot',
        frame: 'Where things tangle between you: a misunderstanding, mismatched expectations, or something left unsaid.',
        bridge: 'Read this card as where the knot sits — seeing it clearly is already half of untying it.',
      },
      { title: 'Where It Grows', frame: 'The direction the tree naturally grows if things stay as they are; the card ends with its advice for you.' },
    ],
  },
  month: {
    name: 'Monthly Outlook',
    intro: 'Draw once at the start of the month for a gentle map of the weeks ahead: theme, work and study, love and people, body and mind, closing on one reminder.',
    positions: [
      {
        title: 'Theme of the Month',
        frame: "The month's keynote: the overall energy the coming weeks will tend to circle around.",
        bridge: 'Keep this card as the keyword of your month — when in doubt, come back to it.',
      },
      { title: 'Work & Study', frame: 'The weather over work or study this month: openings, progress, and where effort pays off.' },
      { title: 'Love & People', frame: 'How feelings and connections flow this month: the rhythm of closeness and space with the people who matter.' },
      {
        title: 'Body & Mind',
        frame: "This month's energy levels: the ebb and flow, and the signals to schedule real rest.",
        bridge: 'Read this card as a weather forecast for body and mind — when to recharge, when to sprint; and if something truly feels wrong, see a doctor early.',
      },
      { title: 'A Reminder for You', frame: 'One line to carry through the month — keep it close, and look back at it when the month ends.' },
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

// 解讀頁每個位置的「💡 白話句」來源：牌義哪一欄，或 'bridge'＝該位置的銜接句（上面 positions[].bridge）。
// 新增牌陣時在這裡補一列；長度必須等於 SPREAD_SIZE（check-content 會驗）。
export type BridgeField = 'past' | 'present' | 'other' | 'love' | 'career' | 'advice' | 'bridge'
export const BRIDGE_FIELDS: Record<Exclude<SpreadId, 'daily'>, BridgeField[][]> = {
  three: [['past'], ['present'], ['advice']],
  yesno: [['advice']],
  choice: [['advice'], ['advice']],
  relation: [['present'], ['other'], ['advice']],
  tree: [['present'], ['other'], ['past'], ['love'], ['bridge'], ['advice']],
  month: [['bridge'], ['career'], ['love'], ['bridge'], ['advice']],
  // 凱爾特十字：位置層級銜接句；最後「結果」位再補這張牌的行動建議
  celtic: [['bridge'], ['bridge'], ['bridge'], ['bridge'], ['bridge'], ['bridge'], ['bridge'], ['bridge'], ['bridge'], ['bridge', 'advice']],
}

export function getSpreads(lang: 'zh' | 'en') {
  return lang === 'en' ? SPREADS_EN : SPREADS
}
