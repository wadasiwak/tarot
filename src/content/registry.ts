// 78 張塔羅牌 canonical 註冊表。
// ⚠️ 陣列順序凍結：major 0–21 → wands → cups → swords → pentacles（index 0–77），
//    分享連結 #r/... 的 token 直接編碼此 index，禁止重排、插入或刪除。
// id / name / nameEn 是全站唯一真相，內容檔與 UI 一律引用此表，禁止自創。
// wikimediaFile 是 Wikimedia Commons 上 1909 公版掃描的檔名（scripts/fetch-images.mjs 用）。

export interface RegistryEntry {
  id: string
  name: string
  nameEn: string
  wikimediaFile: string
}

export const REGISTRY: RegistryEntry[] = [
  // ── 大牌 22 張（index 0–21）──────────────────────────────
  { id: 'major-00', name: '愚者', nameEn: 'The Fool', wikimediaFile: 'RWS_Tarot_00_Fool.jpg' },
  { id: 'major-01', name: '魔術師', nameEn: 'The Magician', wikimediaFile: 'RWS_Tarot_01_Magician.jpg' },
  { id: 'major-02', name: '女祭司', nameEn: 'The High Priestess', wikimediaFile: 'RWS_Tarot_02_High_Priestess.jpg' },
  { id: 'major-03', name: '皇后', nameEn: 'The Empress', wikimediaFile: 'RWS_Tarot_03_Empress.jpg' },
  { id: 'major-04', name: '皇帝', nameEn: 'The Emperor', wikimediaFile: 'RWS_Tarot_04_Emperor.jpg' },
  { id: 'major-05', name: '教皇', nameEn: 'The Hierophant', wikimediaFile: 'RWS_Tarot_05_Hierophant.jpg' },
  { id: 'major-06', name: '戀人', nameEn: 'The Lovers', wikimediaFile: 'RWS_Tarot_06_Lovers.jpg' },
  { id: 'major-07', name: '戰車', nameEn: 'The Chariot', wikimediaFile: 'RWS_Tarot_07_Chariot.jpg' },
  { id: 'major-08', name: '力量', nameEn: 'Strength', wikimediaFile: 'RWS_Tarot_08_Strength.jpg' },
  { id: 'major-09', name: '隱者', nameEn: 'The Hermit', wikimediaFile: 'RWS_Tarot_09_Hermit.jpg' },
  { id: 'major-10', name: '命運之輪', nameEn: 'Wheel of Fortune', wikimediaFile: 'RWS_Tarot_10_Wheel_of_Fortune.jpg' },
  { id: 'major-11', name: '正義', nameEn: 'Justice', wikimediaFile: 'RWS_Tarot_11_Justice.jpg' },
  { id: 'major-12', name: '吊人', nameEn: 'The Hanged Man', wikimediaFile: 'RWS_Tarot_12_Hanged_Man.jpg' },
  { id: 'major-13', name: '死神', nameEn: 'Death', wikimediaFile: 'RWS_Tarot_13_Death.jpg' },
  { id: 'major-14', name: '節制', nameEn: 'Temperance', wikimediaFile: 'RWS_Tarot_14_Temperance.jpg' },
  { id: 'major-15', name: '惡魔', nameEn: 'The Devil', wikimediaFile: 'RWS_Tarot_15_Devil.jpg' },
  { id: 'major-16', name: '塔', nameEn: 'The Tower', wikimediaFile: 'RWS_Tarot_16_Tower.jpg' },
  { id: 'major-17', name: '星星', nameEn: 'The Star', wikimediaFile: 'RWS_Tarot_17_Star.jpg' },
  { id: 'major-18', name: '月亮', nameEn: 'The Moon', wikimediaFile: 'RWS_Tarot_18_Moon.jpg' },
  { id: 'major-19', name: '太陽', nameEn: 'The Sun', wikimediaFile: 'RWS_Tarot_19_Sun.jpg' },
  { id: 'major-20', name: '審判', nameEn: 'Judgement', wikimediaFile: 'RWS_Tarot_20_Judgement.jpg' },
  { id: 'major-21', name: '世界', nameEn: 'The World', wikimediaFile: 'RWS_Tarot_21_World.jpg' },
  // ── 權杖 14 張（index 22–35）────────────────────────────
  { id: 'wands-01', name: '權杖一', nameEn: 'Ace of Wands', wikimediaFile: 'Wands01.jpg' },
  { id: 'wands-02', name: '權杖二', nameEn: 'Two of Wands', wikimediaFile: 'Wands02.jpg' },
  { id: 'wands-03', name: '權杖三', nameEn: 'Three of Wands', wikimediaFile: 'Wands03.jpg' },
  { id: 'wands-04', name: '權杖四', nameEn: 'Four of Wands', wikimediaFile: 'Wands04.jpg' },
  { id: 'wands-05', name: '權杖五', nameEn: 'Five of Wands', wikimediaFile: 'Wands05.jpg' },
  { id: 'wands-06', name: '權杖六', nameEn: 'Six of Wands', wikimediaFile: 'Wands06.jpg' },
  { id: 'wands-07', name: '權杖七', nameEn: 'Seven of Wands', wikimediaFile: 'Wands07.jpg' },
  { id: 'wands-08', name: '權杖八', nameEn: 'Eight of Wands', wikimediaFile: 'Wands08.jpg' },
  { id: 'wands-09', name: '權杖九', nameEn: 'Nine of Wands', wikimediaFile: 'Wands09.jpg' },
  { id: 'wands-10', name: '權杖十', nameEn: 'Ten of Wands', wikimediaFile: 'Wands10.jpg' },
  { id: 'wands-11', name: '權杖侍者', nameEn: 'Page of Wands', wikimediaFile: 'Wands11.jpg' },
  { id: 'wands-12', name: '權杖騎士', nameEn: 'Knight of Wands', wikimediaFile: 'Wands12.jpg' },
  { id: 'wands-13', name: '權杖王后', nameEn: 'Queen of Wands', wikimediaFile: 'Wands13.jpg' },
  { id: 'wands-14', name: '權杖國王', nameEn: 'King of Wands', wikimediaFile: 'Wands14.jpg' },
  // ── 聖杯 14 張（index 36–49）────────────────────────────
  { id: 'cups-01', name: '聖杯一', nameEn: 'Ace of Cups', wikimediaFile: 'Cups01.jpg' },
  { id: 'cups-02', name: '聖杯二', nameEn: 'Two of Cups', wikimediaFile: 'Cups02.jpg' },
  { id: 'cups-03', name: '聖杯三', nameEn: 'Three of Cups', wikimediaFile: 'Cups03.jpg' },
  { id: 'cups-04', name: '聖杯四', nameEn: 'Four of Cups', wikimediaFile: 'Cups04.jpg' },
  { id: 'cups-05', name: '聖杯五', nameEn: 'Five of Cups', wikimediaFile: 'Cups05.jpg' },
  { id: 'cups-06', name: '聖杯六', nameEn: 'Six of Cups', wikimediaFile: 'Cups06.jpg' },
  { id: 'cups-07', name: '聖杯七', nameEn: 'Seven of Cups', wikimediaFile: 'Cups07.jpg' },
  { id: 'cups-08', name: '聖杯八', nameEn: 'Eight of Cups', wikimediaFile: 'Cups08.jpg' },
  { id: 'cups-09', name: '聖杯九', nameEn: 'Nine of Cups', wikimediaFile: 'Cups09.jpg' },
  { id: 'cups-10', name: '聖杯十', nameEn: 'Ten of Cups', wikimediaFile: 'Cups10.jpg' },
  { id: 'cups-11', name: '聖杯侍者', nameEn: 'Page of Cups', wikimediaFile: 'Cups11.jpg' },
  { id: 'cups-12', name: '聖杯騎士', nameEn: 'Knight of Cups', wikimediaFile: 'Cups12.jpg' },
  { id: 'cups-13', name: '聖杯王后', nameEn: 'Queen of Cups', wikimediaFile: 'Cups13.jpg' },
  { id: 'cups-14', name: '聖杯國王', nameEn: 'King of Cups', wikimediaFile: 'Cups14.jpg' },
  // ── 寶劍 14 張（index 50–63）────────────────────────────
  { id: 'swords-01', name: '寶劍一', nameEn: 'Ace of Swords', wikimediaFile: 'Swords01.jpg' },
  { id: 'swords-02', name: '寶劍二', nameEn: 'Two of Swords', wikimediaFile: 'Swords02.jpg' },
  { id: 'swords-03', name: '寶劍三', nameEn: 'Three of Swords', wikimediaFile: 'Swords03.jpg' },
  { id: 'swords-04', name: '寶劍四', nameEn: 'Four of Swords', wikimediaFile: 'Swords04.jpg' },
  { id: 'swords-05', name: '寶劍五', nameEn: 'Five of Swords', wikimediaFile: 'Swords05.jpg' },
  { id: 'swords-06', name: '寶劍六', nameEn: 'Six of Swords', wikimediaFile: 'Swords06.jpg' },
  { id: 'swords-07', name: '寶劍七', nameEn: 'Seven of Swords', wikimediaFile: 'Swords07.jpg' },
  { id: 'swords-08', name: '寶劍八', nameEn: 'Eight of Swords', wikimediaFile: 'Swords08.jpg' },
  { id: 'swords-09', name: '寶劍九', nameEn: 'Nine of Swords', wikimediaFile: 'Swords09.jpg' },
  { id: 'swords-10', name: '寶劍十', nameEn: 'Ten of Swords', wikimediaFile: 'Swords10.jpg' },
  { id: 'swords-11', name: '寶劍侍者', nameEn: 'Page of Swords', wikimediaFile: 'Swords11.jpg' },
  { id: 'swords-12', name: '寶劍騎士', nameEn: 'Knight of Swords', wikimediaFile: 'Swords12.jpg' },
  { id: 'swords-13', name: '寶劍王后', nameEn: 'Queen of Swords', wikimediaFile: 'Swords13.jpg' },
  { id: 'swords-14', name: '寶劍國王', nameEn: 'King of Swords', wikimediaFile: 'Swords14.jpg' },
  // ── 錢幣 14 張（index 64–77）────────────────────────────
  { id: 'pentacles-01', name: '錢幣一', nameEn: 'Ace of Pentacles', wikimediaFile: 'Pents01.jpg' },
  { id: 'pentacles-02', name: '錢幣二', nameEn: 'Two of Pentacles', wikimediaFile: 'Pents02.jpg' },
  { id: 'pentacles-03', name: '錢幣三', nameEn: 'Three of Pentacles', wikimediaFile: 'Pents03.jpg' },
  { id: 'pentacles-04', name: '錢幣四', nameEn: 'Four of Pentacles', wikimediaFile: 'Pents04.jpg' },
  { id: 'pentacles-05', name: '錢幣五', nameEn: 'Five of Pentacles', wikimediaFile: 'Pents05.jpg' },
  { id: 'pentacles-06', name: '錢幣六', nameEn: 'Six of Pentacles', wikimediaFile: 'Pents06.jpg' },
  { id: 'pentacles-07', name: '錢幣七', nameEn: 'Seven of Pentacles', wikimediaFile: 'Pents07.jpg' },
  { id: 'pentacles-08', name: '錢幣八', nameEn: 'Eight of Pentacles', wikimediaFile: 'Pents08.jpg' },
  { id: 'pentacles-09', name: '錢幣九', nameEn: 'Nine of Pentacles', wikimediaFile: 'Pents09.jpg' },
  { id: 'pentacles-10', name: '錢幣十', nameEn: 'Ten of Pentacles', wikimediaFile: 'Pents10.jpg' },
  { id: 'pentacles-11', name: '錢幣侍者', nameEn: 'Page of Pentacles', wikimediaFile: 'Pents11.jpg' },
  { id: 'pentacles-12', name: '錢幣騎士', nameEn: 'Knight of Pentacles', wikimediaFile: 'Pents12.jpg' },
  { id: 'pentacles-13', name: '錢幣王后', nameEn: 'Queen of Pentacles', wikimediaFile: 'Pents13.jpg' },
  { id: 'pentacles-14', name: '錢幣國王', nameEn: 'King of Pentacles', wikimediaFile: 'Pents14.jpg' },
]

export const CARD_COUNT = REGISTRY.length // 78

export function indexOfCard(id: string): number {
  return REGISTRY.findIndex((e) => e.id === id)
}
