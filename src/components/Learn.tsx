import { useApp } from '../state'
import { STRINGS, type Lang } from '../lib/i18n'

// 塔羅小學堂：花色/數字/宮廷牌/正逆位的入門地圖（原創撰寫，雙語）
const SECTIONS: Record<Lang, { title: string; body: string[] }[]> = {
  zh: [
    {
      title: '塔羅牌是什麼？',
      body: [
        '一副偉特塔羅共 78 張：22 張「大牌」談人生的大主題與轉折，56 張「小牌」談日常生活的具體情境。抽牌不是預言未來，比較像一面鏡子——用牌面的圖像，幫你把心裡已經在發生的事情看得更清楚。',
      ],
    },
    {
      title: '怎麼問出好問題？',
      body: [
        '開放式的問題比是非題更有收穫：與其問「他喜不喜歡我」，不如問「這段關係現在最需要我看見什麼」。問題越具體，解讀越有著力點；範圍抓「最近一到三個月」通常最準確。',
        '同一件事短時間內不要重複抽——第一次的牌就是答案，重抽多半只是想聽到自己想聽的。',
      ],
    },
    {
      title: '四種花色，四種人生領域',
      body: [
        '🔥 權杖（Wands）＝火：行動力、熱情、事業衝勁。牌裡出現很多權杖，代表事情跟「做」有關。',
        '💧 聖杯（Cups）＝水：情感、關係、直覺。聖杯多的時候，重點在「感受」而不是道理。',
        '🌬️ 寶劍（Swords）＝風：思考、真相、衝突與溝通。寶劍多，表示課題在腦子裡——想法、話語、決斷。',
        '🪙 錢幣（Pentacles）＝土：金錢、工作實務、身體健康。錢幣多，答案往往很務實：慢慢做、顧好基本盤。',
      ],
    },
    {
      title: '數字一到十的旅程',
      body: [
        '每個花色的一到十，是一段能量的完整旅程：一是種子（新開始）、二是選擇與平衡、三是初步成果、四是穩定、五是動盪與挑戰、六是修復與給予、七是評估與堅持、八是加速與精進、九是接近完成、十是圓滿或滿載。看到數字，就大概知道事情走到旅程的哪一段。',
      ],
    },
    {
      title: '宮廷牌：出現在你身邊的人（或你自己）',
      body: [
        '侍者是初學者與新訊息、騎士是行動中的追尋者、王后是內斂成熟的掌握、國王是對外的主導與擔當。宮廷牌可以是身邊具體的某個人，也可以是你自己正在展現（或需要展現）的那一面——兩種讀法都對，看哪個更有共鳴。',
      ],
    },
    {
      title: '正位與逆位',
      body: [
        '正位是這張牌的能量順暢地流動；逆位不是「壞」，而是能量卡住了——可能是堵塞、過度、不足，或轉向內在。例如逆位的太陽不是黑暗，是好事延遲；逆位的死神不是逃過結束，是懸而未決。逆位牌常常是整個牌陣裡最誠實的提醒。',
      ],
    },
    {
      title: '解讀的心法',
      body: [
        '先看圖再看字：牌面上哪個細節最抓住你的眼睛，那通常就是這次抽牌要對你說的話。解讀文字是地圖，你的直覺才是導航。',
        '最後提醒：塔羅是自我對話的工具，不是命定。牌給的是視角與提醒，決定權永遠在你手上。',
      ],
    },
  ],
  en: [
    {
      title: 'What is tarot?',
      body: [
        "A Rider–Waite deck has 78 cards: 22 Major Arcana for life's big themes and turning points, and 56 Minor Arcana for everyday situations. A reading isn't fortune-telling — it's closer to a mirror, using the imagery to help you see more clearly what is already happening inside you.",
      ],
    },
    {
      title: 'How to ask a good question',
      body: [
        'Open questions give you more than yes-or-no ones: instead of "does he like me," try "what does this relationship most need me to see right now." The more specific the question, the more the reading has to hold onto; a one-to-three-month window usually reads best.',
        "Don't redraw the same question again and again — the first spread is the answer. Redrawing is usually just fishing for what you want to hear.",
      ],
    },
    {
      title: 'Four suits, four areas of life',
      body: [
        '🔥 Wands = fire: drive, passion, career momentum. Lots of Wands means the matter is about doing.',
        '💧 Cups = water: feelings, relationships, intuition. Many Cups shift the focus to how it feels, not what makes sense.',
        '🌬️ Swords = air: thought, truth, conflict and communication. Many Swords put the task in your head — ideas, words, decisions.',
        '🪙 Pentacles = earth: money, practical work, the body. Many Pentacles usually mean a down-to-earth answer: go slow, mind the basics.',
      ],
    },
    {
      title: 'The journey from Ace to Ten',
      body: [
        'Each suit runs Ace to Ten as one complete arc of energy: one is the seed (a new start), two is choice and balance, three is first results, four is stability, five is upheaval, six is repair and giving, seven is assessment and persistence, eight is acceleration and craft, nine is nearly there, ten is completion — or a full load. The number alone tells you roughly where things stand on the journey.',
      ],
    },
    {
      title: 'Court cards: people around you (or you)',
      body: [
        'Pages are beginners and fresh news, Knights are seekers in motion, Queens hold quiet mastery, Kings lead and take charge. A court card can be a specific person in your life — or a side of yourself you are showing (or need to show). Both readings are valid; go with the one that resonates.',
      ],
    },
    {
      title: 'Upright and reversed',
      body: [
        "Upright, a card's energy flows freely; reversed isn't \"bad\" — the energy is stuck: blocked, overdone, undersupplied, or turned inward. A reversed Sun isn't darkness but good news delayed; reversed Death isn't escaping an ending but leaving it unresolved. Reversed cards are often the most honest reminders in the whole spread.",
      ],
    },
    {
      title: 'How to read',
      body: [
        'Look at the picture before the text: whichever detail catches your eye is usually what the draw wants to say to you. The written meanings are a map — your intuition is the navigator.',
        'One last reminder: tarot is a tool for self-reflection, not fate. The cards offer perspective and reminders; the decisions are always yours.',
      ],
    },
  ],
}

export function Learn() {
  const go = useApp((s) => s.go)
  const lang = useApp((s) => s.lang)
  const T = STRINGS[lang]
  return (
    <div className="learn">
      <h2 className="reading-title">{T.learnTitle}</h2>
      <p className="reading-intro">{T.learnIntro}</p>
      {SECTIONS[lang].map((s) => (
        <section className="learn-section" key={s.title}>
          <h3>{s.title}</h3>
          {s.body.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </section>
      ))}
      <div className="reading-actions">
        <button type="button" className="btn primary" onClick={() => go({ name: 'browse' })}>
          {T.learnBrowseBtn}
        </button>
        <button type="button" className="btn" onClick={() => go({ name: 'draw', spread: 'three' })}>
          {T.learnDrawBtn}
        </button>
      </div>
    </div>
  )
}
