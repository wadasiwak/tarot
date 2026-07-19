// 生日牌／年度牌語境解讀（22 張大牌 × 生日/年度，zh/en）。
// 生日牌＝人格底色與一生課題；年度牌＝該年主題與功課，收在可行動的方向。
// 語氣鐵則同 types.ts：繁中台灣用語、凶牌給轉圜不嚇人、禁模板句、不與 RWS 方向矛盾。
// 演算法（數字總和迭代縮減）見 src/lib/birthCard.ts；此檔只放文案。
import type { Lang } from '../lib/i18n'

export interface MyCardText {
  birth: string // 作為生日牌的意義 60–100 字
  year: string // 作為年度牌的意義 60–100 字
}

export const MYCARD: Record<string, MyCardText> = {
  'major-00': {
    birth: '你的底色是說走就走的勇氣：對世界保持好奇，不被「應該」綁住，別人眼中的冒險對你像呼吸。一生的課題是在自由與承諾之間找到平衡——跳之前看一眼，但別因此不跳。',
    year: '這一年像一張空白的地圖，適合開始：新領域、新身分、新地方。計畫不必完美，先跨出第一步，路會在腳下長出來。留意天真變成大意的時刻，其他時候，放心去闖。',
  },
  'major-01': {
    birth: '你天生帶著把想法變成現實的手感：口才好、會整合資源、學什麼都快。課題在於專注——樣樣通的人最怕樣樣鬆。選定一件事把它做到底，你的魔法才會真正顯形。',
    year: '今年資源與機會都擺在你伸手可及的桌面上，關鍵是開口與出手：提案、談判、啟動擱置已久的計畫都有加成。別把能量花在證明自己聰明，把它花在交出作品。',
  },
  'major-02': {
    birth: '你的天賦是聽得見別人聽不見的弦外之音：直覺準、觀察深，安靜卻有份量。課題是信任自己的內在聲音，不必事事拿證據說服別人——有些事，你就是知道。',
    year: '這一年答案多半不在外面，而在你靜下來之後浮現的念頭裡。適合進修、研究、寫日記、養一段獨處的習慣。先別急著公開所有想法，醞釀本身就是進度。',
  },
  'major-03': {
    birth: '你身上有讓人與事物自然生長的能量：溫暖、有審美、照顧人是本能。你適合創造——作品、家、關係都算。課題是別把養分全給出去，留一份滋養自己，豐盛才續得下去。',
    year: '今年的主題是滋養與收成：投入的感情、作品與身體都會回應你的照顧。適合經營生活感——把家弄舒服、把關係養深、把身體養好。先照顧好自己，再去照顧世界。',
  },
  'major-04': {
    birth: '你的底色是秩序與擔當：習慣把混亂整理成規則，別人自然把方向盤交給你。課題是分辨「掌握」與「控制」——真正的權威來自讓人安心，而不是讓人聽話。',
    year: '這一年適合把人生當公司經營：立規矩、定目標、建立不靠意志力也能運轉的制度。責任會變重，但版圖也會變大。柔軟一點下指令，權威反而更穩。',
  },
  'major-05': {
    birth: '你天生重視傳承與意義：適合教、適合帶人、適合在體制裡把事情做對。課題是分辨哪些傳統是智慧、哪些只是慣性——你終究要整理出一套自己的信念，再傳下去。',
    year: '今年是拜師與學習的一年：找前輩、進課程、補齊基本功，都比單打獨鬥有效；也可能輪到你當那個給建議的人。遵循正道不等於守舊，把學到的內化成自己的版本。',
  },
  'major-06': {
    birth: '你的一生繞著選擇與連結轉：重視關係，渴望價值觀契合的同伴，真誠到讓人卸下防備。課題是在重要岔路上聽自己的心，而不是選那個讓大家都滿意的答案。',
    year: '這一年的關鍵字是選擇：感情、合作、去留，都可能走到需要表態的路口。用價值觀當尺，選那個讓你更像自己的選項。關係運強，誠實溝通會把重要的人帶得更近。',
  },
  'major-07': {
    birth: '你天生帶著往前衝的引擎：目標感強、不服輸，跌倒後爬起來的速度是你的招牌。課題是駕馭而非蠻力——學會同時握住野心與情緒這兩匹馬，你會走得又快又遠。',
    year: '今年是推進的一年：立下明確目標，行動力與勝率都有加成，適合衝刺事業、搬遷、啟程。注意方向盤——衝得快卻沒選好路，是這一年唯一的敗法。記得定期抬頭看地圖。',
  },
  'major-08': {
    birth: '你的力量是溫柔的那種：能安撫場面、馴服難搞的人與自己的衝動，越是艱難越顯得穩。課題是承認自己也有累的時候——示弱不會折損你的強大，反而讓它完整。',
    year: '這一年考驗的不是爆發力，是耐性與心志：用勸的不用逼的，用陪伴代替對抗。困難會有，但你比想像中撐得住。把脾氣當寵物練習安撫，年底你會喜歡那個更穩的自己。',
  },
  'major-09': {
    birth: '你自帶一盞往內照的燈：喜歡把事情想透徹、靠獨處回血，人群中常覺得自己像觀察者。深度是你的天賦。課題是把研究成果帶回人間——你的光不只照自己，也能替別人引路。',
    year: '今年適合放慢與沉澱：讀書、獨旅、整理這幾年的經歷，把外界的喧鬧關小聲一點。有問題別急著問別人，先問自己。刻意獨處不是退出，是替下一段路備糧。',
  },
  'major-10': {
    birth: '你的人生節奏比別人起伏得更明顯：機運來得突然，變化是常態。天賦是適應力與時機感。課題是在轉輪上保持重心——順風時謙虛，逆風時記得輪子還會再轉。',
    year: '這一年輪子轉得快：計畫可能被打亂，也可能天上掉下轉機。與其抓緊控制，不如練習借力使力——變化來時先問「這裡面有什麼機會」。留點餘裕，好運需要空位才進得來。',
  },
  'major-11': {
    birth: '你天生對公平敏感：說話有憑據、做事求對等，人們信任你的判斷。課題是接受世界不總是立即公平——把是非感用來修正自己做得到的部分，而不是替全世界記帳。',
    year: '今年種什麼收什麼，因果結算得特別快：契約、法律、承諾與帳目都值得多看兩眼。做決定前把利弊攤在紙上，誠實面對數字與事實。行得正，這一年會還你公道。',
  },
  'major-12': {
    birth: '你看世界的角度天生與眾不同：能在卡住的地方看見別人看不見的出路，願意為值得的事等待。課題是分辨「有意義的犧牲」與「習慣性委屈」——前者成就你，後者消耗你。',
    year: '這一年有些事急不得：進度卡住時，功課不是更用力，而是換角度。暫停不是浪費——很多答案要倒過來看才顯影。把等待期拿來整理內在，時候到了，局面自己會鬆開。',
  },
  'major-13': {
    birth: '你的人生擅長重開機：對結束的耐受力比常人高，斷捨離是天賦，每次告別都讓你長出新的一層。課題是允許自己好好哀悼——結束值得被認真對待，然後再輕盈上路。',
    year: '今年是汰舊換新的一年：有些章節會自然翻頁——職務、關係、習慣或身分。別把力氣花在挽留已經完成使命的事物上；騰出來的空間，正是新生活要進駐的地方。',
  },
  'major-14': {
    birth: '你是天生的調和者：能把衝突的人、混雜的資源調成剛好入口的比例，耐心與分寸是你的超能力。課題是在遷就各方之餘記得自己的配方——中庸不是沒有立場，是恰到好處。',
    year: '這一年的功課是調配比例：工作與休息、付出與保留、快與慢。急事緩辦，大目標拆成小步。身體也在求平衡——作息與飲食值得認真對待。慢慢來，比較快。',
  },
  'major-15': {
    birth: '你的能量濃烈：慾望明確、感染力強，懂得人性的暗面也因此更能同理。課題是主導慾望而不是被慾望主導——認清哪條鎖鏈其實是自己掛上去的，你隨時有鑰匙。',
    year: '今年要對「上癮」保持清醒：過勞、消費、關係裡的執著，都可能悄悄收緊。感到被綁住時，記得多數鎖鏈是鬆的，抬手就能卸下。把濃烈的能量導向創作與熱情，它就是燃料。',
  },
  'major-16': {
    birth: '你的人生偶有天雷級的轉折：舊結構塌掉的瞬間，你比誰都清醒。天賦是災後重建的韌性——你蓋的第二座塔永遠比第一座穩。課題是別等塔倒才檢查地基，定期拆掉不對的部分。',
    year: '這一年可能有突發的變動：計畫翻盤、真相揭曉。第一時間會晃，但塌掉的多半是本來就撐不久的部分。把它當一次強制升級——清完瓦礫再蓋回去的，會是更接近真實的人生。',
  },
  'major-17': {
    birth: '你自帶療癒與希望的體質：再糟的局面，你都找得到一顆可以指路的星，人們靠近你會安靜下來。課題是把理想落地——願景要接上日常的水管，一次澆一點，夢想才會長大。',
    year: '走過前段的顛簸，這一年是修復與充電：傷口開始癒合，久違的盼望回來了。適合許長期的願、養規律的小習慣，也適合把溫柔分給別人。方向比速度重要，慢慢亮就好。',
  },
  'major-18': {
    birth: '你的內在世界深而多層：想像力、夢境與情緒雷達都比常人靈敏，是藝術與同理的原料。課題是和不確定共處——看不清時不硬走，等月光把路照出來，你的直覺其實很準。',
    year: '今年局面偶爾起霧：資訊不全、情緒反覆、真假難辨。決策放慢，重要的事睡一晚再定，並小心過度腦補。夢與直覺是這一年的忠實線報——記下來，回頭看常常應驗。',
  },
  'major-19': {
    birth: '你的底色是亮的：樂觀、直接，一走進房間就把亮度調高。天賦是把複雜的事變簡單、把低迷的人點亮。課題是允許自己也有陰天——不必永遠當太陽，偶爾讓別人照你。',
    year: '這是被陽光眷顧的一年：成果浮上檯面，努力被看見，適合曝光、發表、慶祝與享受。快樂不必等大事，把每個小成就當節日過。你的明亮會感染身邊的人，大方發光。',
  },
  'major-20': {
    birth: '你的人生常有甦醒時刻：某天突然聽見內心的號角，然後整個人升級。天賦是誠實的自我檢視與翻身的勇氣。課題是原諒過去的自己——審視是為了重生，不是為了判刑。',
    year: '今年是總結算與新生的一年：舊帳收尾、塵封的事有了回音，也可能聽見改變人生方向的呼喚。認真回顧這幾年的路，該和解的和解。答應那個呼喚，第二人生從這裡開始。',
  },
  'major-21': {
    birth: '你天生帶著「完成」的能量：有始有終，能把散落的碎片整合成完整的圓，視野開闊、適合跨界與遠行。課題是完成後放手慶祝，允許新循環開始——圓滿不是終點，是節點。',
    year: '這一年適合收圓：多年的努力進入交付期，學位、專案、旅程都可能在此完成，好好慶祝再開下一局。也適合拓展邊界——出國、跨界合作都有加成。把句點畫漂亮，就是最好的開場。',
  },
}

export const MYCARD_EN: Record<string, MyCardText> = {
  'major-00': {
    birth: 'Your base note is the courage to simply set out: endlessly curious, never boxed in by "supposed to" — what others call risky feels like breathing to you. Your lifelong lesson is balancing freedom with commitment: look before you leap, but never stop leaping.',
    year: 'This year is a blank map made for beginnings — new fields, new roles, new places. The plan need not be perfect; take the first step and the road grows under your feet. Watch the moments where innocence turns careless. Otherwise, go explore.',
  },
  'major-01': {
    birth: 'You were born with the knack of turning ideas into reality: persuasive, resourceful, quick to learn anything. Your lesson is focus — the jack of all trades risks mastering none. Pick one thing and see it through, and your magic becomes visible.',
    year: 'This year the tools and openings are all within arm\'s reach; the key is to speak up and act. Pitches, negotiations, long-shelved projects — all favored. Spend your energy not on proving you are clever, but on shipping the work.',
  },
  'major-02': {
    birth: 'Your gift is hearing what goes unsaid: sharp intuition, deep observation, a quiet presence that carries weight. Your lesson is to trust that inner voice without needing evidence to convince everyone — some things, you simply know.',
    year: 'This year the answers live less in the world and more in what surfaces once you sit still. Study, research, keep a journal, build a habit of solitude. Don\'t rush to publish every thought — the incubation itself is progress.',
  },
  'major-03': {
    birth: 'You carry an energy that makes people and things grow: warm, aesthetic, a natural caretaker. You are built to create — works, homes, relationships all count. Your lesson: don\'t give every drop away; keep some nourishment for yourself, or the abundance runs dry.',
    year: 'This year\'s theme is nurture and harvest: the feelings, work and body you tend will answer your care. Cultivate the texture of daily life — make home comfortable, deepen bonds, feed your health. Tend yourself first, then the world.',
  },
  'major-04': {
    birth: 'Your base note is order and responsibility: you sort chaos into rules, and people hand you the wheel without being asked. Your lesson is telling mastery from control — real authority makes people feel safe, not obedient.',
    year: 'Run your life like an enterprise this year: set rules, fix goals, build systems that work without willpower. Responsibility grows heavier, but so does your territory. Give orders with a softer hand and your authority stands firmer.',
  },
  'major-05': {
    birth: 'You value lineage and meaning by nature: made to teach, to mentor, to do things right inside institutions. Your lesson is telling wisdom from mere habit among traditions — in the end you must distill your own creed, then pass it on.',
    year: 'A year for apprenticeship: find mentors, take courses, patch the fundamentals — all beat going it alone. You may also become the one giving counsel. Following the proven path isn\'t rigidity; make what you learn your own version.',
  },
  'major-06': {
    birth: 'Your life orbits choice and connection: relationships matter deeply, and you long for companions who share your values, with an honesty that disarms. Your lesson: at the big forks, listen to your heart — not the answer that pleases everyone.',
    year: 'The keyword of this year is choice: love, partnerships, staying or leaving may all reach a point of decision. Use your values as the ruler and pick the option that makes you more yourself. Relationship luck runs high — honest talk draws your people closer.',
  },
  'major-07': {
    birth: 'You come with a forward-drive engine: goal-hungry, refusing to lose, famous for how fast you get back up. Your lesson is mastery over brute force — hold ambition and emotion like two horses in one harness, and you\'ll go far, fast.',
    year: 'A year of advancement: set a clear target and both momentum and odds tilt your way — sprint the career, relocate, set out. Mind the steering: speeding down the wrong road is the only way to lose this year. Look up at the map regularly.',
  },
  'major-08': {
    birth: 'Your strength is the gentle kind: you calm rooms, tame difficult people and your own impulses, steadiest when things are hardest. Your lesson is admitting you tire too — showing softness doesn\'t diminish your strength; it completes it.',
    year: 'This year tests patience and heart, not explosive power: persuade rather than push, accompany rather than confront. Hardships will come, but you can bear more than you think. Practice soothing your temper like a pet — by year\'s end you\'ll like the steadier you.',
  },
  'major-09': {
    birth: 'You carry a lamp that shines inward: you like thinking things through, recharge in solitude, and often feel like the observer in a crowd. Depth is your gift. Your lesson: bring the findings back to the world — your light can guide others, not just you.',
    year: 'A year to slow down and settle: read, travel alone, sort through the past few years, turn the world\'s volume down. Before asking others, ask yourself. Deliberate solitude isn\'t retreat — it\'s provisioning for the road ahead.',
  },
  'major-10': {
    birth: 'Your life turns more visibly than most: luck arrives suddenly, change is the constant. Adaptability and timing are your gifts. Your lesson is keeping your center on the wheel — humble in tailwinds, and in headwinds remembering the wheel turns again.',
    year: 'The wheel spins fast this year: plans may scatter, windfalls may drop from the sky. Rather than gripping for control, practice riding the momentum — when change comes, ask first "where\'s the opening in this?" Keep slack in the schedule; luck needs an empty seat.',
  },
  'major-11': {
    birth: 'You are born sensitive to fairness: you speak with evidence and deal in equal measure, and people trust your judgment. Your lesson is accepting that the world isn\'t always promptly fair — aim your sense of justice at what you can fix, not at keeping score for the planet.',
    year: 'What you sow returns quickly this year — cause and effect settle their accounts fast. Contracts, legal matters, promises and ledgers deserve a second look. Lay out pros and cons on paper, face the numbers honestly. Walk straight, and the year will do you justice.',
  },
  'major-12': {
    birth: 'You see the world from an angle all your own: where others see a dead end you spot the way through, and you\'ll wait and give for what\'s worthy. Your lesson: tell meaningful sacrifice from habitual self-denial — one builds you, the other drains you.',
    year: 'Some things can\'t be rushed this year: when progress jams, the assignment isn\'t more force but a new angle. Pausing isn\'t waste — many answers only develop upside down. Use the waiting to put your inner house in order; when it\'s time, the knot loosens itself.',
  },
  'major-13': {
    birth: 'Your life is skilled at rebooting: you tolerate endings better than most, letting go is a gift, and every farewell grows you a new layer. Your lesson is allowing yourself to truly grieve — endings deserve to be honored, and then you travel light.',
    year: 'A year of molting: some chapters will turn on their own — a role, a relationship, a habit, an identity. Don\'t spend strength holding onto what has finished its work; the space it frees is exactly where the new life moves in.',
  },
  'major-14': {
    birth: 'You are a born blender: you mix clashing people and scattered resources into proportions everyone can drink. Patience and measure are your superpowers. Your lesson: while accommodating everyone, remember your own recipe — moderation isn\'t having no stance; it\'s getting it just right.',
    year: 'This year\'s homework is ratios: work and rest, giving and keeping, fast and slow. Handle urgent things unhurriedly; break big goals into small steps. The body wants balance too — sleep and diet deserve real attention. Slower gets you there sooner.',
  },
  'major-15': {
    birth: 'Your energy runs rich and intense: desires are vivid, your pull is magnetic, and knowing the shadow side of human nature makes you more compassionate, not less. Your lesson is steering desire instead of being steered — see which chains you hung on yourself; you\'ve always held the key.',
    year: 'Stay clear-eyed about addiction this year: overwork, spending, obsession in relationships can all tighten quietly. When you feel bound, remember most of these chains hang loose — lift your hands and they slip off. Channel the intensity into craft and passion, and it becomes fuel.',
  },
  'major-16': {
    birth: 'Your life holds a few thunderbolt turns: the moment an old structure falls, you see more clearly than anyone. Your gift is the resilience of rebuilding — your second tower always stands firmer than the first. Your lesson: don\'t wait for collapse to check the foundations; dismantle the wrong parts yourself, regularly.',
    year: 'Sudden shake-ups are possible this year: plans overturned, truths revealed. It rattles at first, but what falls was mostly propped up anyway. Treat it as a forced upgrade — what you rebuild after clearing the rubble is a life closer to the truth.',
  },
  'major-17': {
    birth: 'You are built for healing and hope: in the worst of it you still find one star to steer by, and people grow calm around you. Your lesson is grounding the ideal — pipe the vision into daily life and water it a little at a time, and the dream grows.',
    year: 'After the rough stretch, this is a year of mending and recharging: wounds begin to close and long-lost hope returns. Make long-term wishes, grow small steady habits, and share your gentleness. Direction matters more than speed — glow slowly.',
  },
  'major-18': {
    birth: 'Your inner world is deep and layered: imagination, dreams and an emotional radar keener than most — raw material for art and empathy. Your lesson is living with uncertainty: when the path is unclear, don\'t force the march; wait for the moonlight, for your intuition is truer than you think.',
    year: 'Fog rolls in at times this year: partial information, shifting moods, truth hard to tell from illusion. Slow your decisions, sleep on the big ones, and watch for over-imagining. Dreams and gut feelings are this year\'s loyal informants — write them down; they tend to prove right.',
  },
  'major-19': {
    birth: 'Your base tone is bright: optimistic, direct, turning the lights up just by entering the room. Your gift is making complicated things simple and dim people shine. Your lesson is allowing your own cloudy days — you needn\'t always be the sun; sometimes let others warm you.',
    year: 'A sun-blessed year: results surface, effort gets seen — made for showing your work, publishing, celebrating, enjoying. Don\'t wait for milestones to be happy; treat every small win as a holiday. Your brightness is contagious, so shine generously.',
  },
  'major-20': {
    birth: 'Your life keeps moments of awakening: one day a trumpet sounds inside, and you level up whole. Your gifts are honest self-examination and the courage to rise again. Your lesson is forgiving your past self — the review is for rebirth, not for sentencing.',
    year: 'A year of reckoning and renewal: old accounts close, long-buried matters echo back, and you may hear a call that redirects your life. Look back honestly over the past years and make the peace you need to make. Answer the call — the second act starts here.',
  },
  'major-21': {
    birth: 'You carry the energy of completion: you finish what you start and gather scattered pieces into a whole circle, with a horizon wide enough for crossings and long journeys. Your lesson: when it\'s done, let go and celebrate, then allow the next cycle — fullness is a waypoint, not an endpoint.',
    year: 'A year for closing the circle: years of effort reach delivery — degrees, projects, journeys may all complete here. Celebrate properly before the next round. Boundaries are ripe for expanding too: going abroad and cross-field alliances are favored. Draw the period beautifully; it becomes the best opening line.',
  },
}

export function getMyCard(id: string, lang: Lang): MyCardText | undefined {
  return lang === 'en' ? (MYCARD_EN[id] ?? MYCARD[id]) : MYCARD[id]
}
