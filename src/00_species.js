// 00_species.js — 魚種データ
// トップレベル宣言: SPECIES_* のみ

const SPECIES = [
  // ──────────────────────────────────────────────────────────
  // 1. チヌ (クロダイ)
  // ──────────────────────────────────────────────────────────
  {
    id: 'chinu',
    name: 'チヌ(クロダイ)',
    nameEn: 'Black seabream',
    category: 'normal',
    rarity: 1,
    minSize: 15, maxSize: 60,
    weight: { wA: 0.019, wB: 3.0 },
    habitat: ['bottom', 'mid'],
    active: ['day', 'dusk', 'night'],
    baitPref: { mushi: 1.2, oyster: 1.5, ebi: 1.0, lure: 0.6, dango: 1.4 },
    fight: { power: 0.65, stamina: 0.70, erratic: 0.55 },
    price: 120,
    desc: '磯釣りの王様。大阪湾では「チヌ」と呼ばれ、堤防でも磯でも姿を見せる日本を代表するフィッシュ。貝類・ゴカイ何でも食うグルメ派だが、針のサイズと餌の付け方には一家言あり。40cmを超えると「年なし」と呼ばれ、ベテランでも心が震える。',
    model: {
      profile: 'deep',
      bodyH: 0.38, bodyW: 0.14,
      snout: 'blunt',
      tail: 'forked',
      dorsal: { start: 0.28, end: 0.62, h: 0.12, spiny: true },
      anal:   { start: 0.60, end: 0.78, h: 0.08 },
      pectoral: 0.16,
      colors: { back: '#1e2428', base: '#6a7078', belly: '#dcdcd8', fins: '#3a3d42', eye: '#1a1a1a' },
      pattern: { type: 'vbars', color: '#151820', count: 5, opacity: 0.18 },
      sheen: 0.65,
      special: null
    }
  },

  // ──────────────────────────────────────────────────────────
  // 2. キビレ
  // ──────────────────────────────────────────────────────────
  {
    id: 'kibirei',
    name: 'キビレ(キチヌ)',
    nameEn: 'Yellow seabream',
    category: 'normal',
    rarity: 2,
    minSize: 15, maxSize: 55,
    weight: { wA: 0.018, wB: 3.0 },
    habitat: ['bottom', 'mid'],
    active: ['day', 'dusk'],
    baitPref: { mushi: 1.3, oyster: 1.2, ebi: 1.1, lure: 0.5, dango: 1.0 },
    fight: { power: 0.60, stamina: 0.65, erratic: 0.50 },
    price: 100,
    desc: 'チヌよりひと回り小さく、黄色い胸鰭・腹鰭が目印。干潟や砂泥底を好み、「チヌのくせにルアーに食ってくる」という評判が若手アングラーに人気。薄塩で焼けば上品な白身の旨さに驚く。',
    model: {
      profile: 'deep',
      bodyH: 0.36, bodyW: 0.13,
      snout: 'blunt',
      tail: 'forked',
      dorsal: { start: 0.28, end: 0.62, h: 0.11, spiny: true },
      anal:   { start: 0.60, end: 0.78, h: 0.07 },
      pectoral: 0.16,
      colors: { back: '#2a2f34', base: '#7a8088', belly: '#e0e0d8', fins: '#c8a830', eye: '#1a1a1a' },
      pattern: { type: 'vbars', color: '#20242a', count: 4, opacity: 0.15 },
      sheen: 0.60,
      special: null
    }
  },

  // ──────────────────────────────────────────────────────────
  // 3. マダイ
  // ──────────────────────────────────────────────────────────
  {
    id: 'madai',
    name: 'マダイ',
    nameEn: 'Red seabream',
    category: 'normal',
    rarity: 3,
    minSize: 20, maxSize: 80,
    weight: { wA: 0.024, wB: 3.0 },
    habitat: ['bottom', 'mid'],
    active: ['day', 'dusk'],
    baitPref: { mushi: 1.0, oyster: 1.1, ebi: 1.3, lure: 0.7, dango: 0.8 },
    fight: { power: 0.75, stamina: 0.80, erratic: 0.45 },
    price: 250,
    desc: '縁起物の王様にして食卓の横綱。その鮮やかな朱色と青い斑点は「タイの本物感」そのもの。産卵期の「桜鯛」は身に脂がのって別格の旨さ。50cmを超える大型は深場からの大引きが一番の醍醐味だ。',
    model: {
      profile: 'deep',
      bodyH: 0.40, bodyW: 0.15,
      snout: 'blunt',
      tail: 'lunate',
      dorsal: { start: 0.26, end: 0.60, h: 0.14, spiny: true },
      anal:   { start: 0.60, end: 0.76, h: 0.09 },
      pectoral: 0.17,
      colors: { back: '#b84030', base: '#d05040', belly: '#f0c8b0', fins: '#c04838', eye: '#1a0808' },
      pattern: { type: 'spots', color: '#4080d0', count: 8, opacity: 0.45 },
      sheen: 0.70,
      special: null
    }
  },

  // ──────────────────────────────────────────────────────────
  // 4. メジナ
  // ──────────────────────────────────────────────────────────
  {
    id: 'mejina',
    name: 'メジナ(グレ)',
    nameEn: 'Largescale blackfish',
    category: 'normal',
    rarity: 2,
    minSize: 20, maxSize: 55,
    weight: { wA: 0.020, wB: 3.0 },
    habitat: ['mid', 'surface'],
    active: ['day', 'dusk'],
    baitPref: { mushi: 1.0, oyster: 0.9, ebi: 0.8, lure: 0.5, dango: 1.5 },
    fight: { power: 0.70, stamina: 0.72, erratic: 0.65 },
    price: 130,
    desc: '磯フカセ釣りの本命中の本命で、関西では「グレ」の愛称で知られる。岩礁の際を泳ぎ、付けエサよりも撒き餌に同調させるシビアな棚合わせが肝。口太と尾長では引きの質がまるで違い、尾長は竿を一気に持っていく暴走族だ。',
    model: {
      profile: 'deep',
      bodyH: 0.36, bodyW: 0.13,
      snout: 'blunt',
      tail: 'forked',
      dorsal: { start: 0.28, end: 0.64, h: 0.11, spiny: true },
      anal:   { start: 0.62, end: 0.78, h: 0.08 },
      pectoral: 0.15,
      colors: { back: '#28302a', base: '#505a50', belly: '#b8c0b0', fins: '#3a4038', eye: '#1a1a1a' },
      pattern: { type: 'none', color: '#333', count: 0, opacity: 0.0 },
      sheen: 0.45,
      special: null
    }
  },

  // ──────────────────────────────────────────────────────────
  // 5. シーバス (スズキ)
  // ──────────────────────────────────────────────────────────
  {
    id: 'seabass',
    name: 'シーバス(スズキ)',
    nameEn: 'Japanese seabass',
    category: 'normal',
    rarity: 2,
    minSize: 30, maxSize: 90,
    weight: { wA: 0.010, wB: 2.9 },
    habitat: ['mid', 'surface'],
    active: ['dusk', 'night'],
    baitPref: { mushi: 0.8, oyster: 0.6, ebi: 1.1, lure: 1.8, dango: 0.4 },
    fight: { power: 0.80, stamina: 0.65, erratic: 0.75 },
    price: 160,
    desc: '夜の河口や堤防で炸裂するエラ洗いが最大の興奮。ルアーへの反応が高くシーバスゲームは今や一大ジャンル。「フッコ」「スズキ」「ランカー」とサイズで呼び名が変わる出世魚でもあり、ランカー80cmはアングラーの夢。',
    model: {
      profile: 'standard',
      bodyH: 0.26, bodyW: 0.11,
      snout: 'pointed',
      tail: 'forked',
      dorsal: { start: 0.26, end: 0.60, h: 0.10, spiny: true },
      anal:   { start: 0.62, end: 0.76, h: 0.07 },
      pectoral: 0.15,
      colors: { back: '#3a4040', base: '#909898', belly: '#e8e8e4', fins: '#606860', eye: '#181818' },
      pattern: { type: 'speckle', color: '#303838', count: 12, opacity: 0.25 },
      sheen: 0.75,
      special: null
    }
  },

  // ──────────────────────────────────────────────────────────
  // 6. アジ
  // ──────────────────────────────────────────────────────────
  {
    id: 'aji',
    name: 'アジ(マアジ)',
    nameEn: 'Japanese jack mackerel',
    category: 'normal',
    rarity: 1,
    minSize: 12, maxSize: 40,
    weight: { wA: 0.008, wB: 2.8 },
    habitat: ['mid', 'surface'],
    active: ['day', 'dusk', 'night'],
    baitPref: { mushi: 1.3, oyster: 0.6, ebi: 1.2, lure: 1.0, dango: 0.7 },
    fight: { power: 0.35, stamina: 0.40, erratic: 0.60 },
    price: 60,
    desc: '釣り人が一番お世話になる魚。サビキで入門し、ライトタックルのアジングでその奥深さを知る。刺身・塩焼き・アジフライと活躍の場が広い食卓のMVP。側線に沿ったゼイゴ(稜鱗)が手に刺さるのも愛嬌のうち。',
    model: {
      profile: 'standard',
      bodyH: 0.25, bodyW: 0.10,
      snout: 'pointed',
      tail: 'forked',
      dorsal: { start: 0.28, end: 0.58, h: 0.09, spiny: true },
      anal:   { start: 0.60, end: 0.74, h: 0.06 },
      pectoral: 0.14,
      colors: { back: '#3a4a50', base: '#808c90', belly: '#dce4e0', fins: '#607080', eye: '#181818' },
      pattern: { type: 'none', color: '#333', count: 0, opacity: 0.0 },
      sheen: 0.70,
      special: null
    }
  },

  // ──────────────────────────────────────────────────────────
  // 7. サバ
  // ──────────────────────────────────────────────────────────
  {
    id: 'saba',
    name: 'サバ(マサバ)',
    nameEn: 'Chub mackerel',
    category: 'normal',
    rarity: 1,
    minSize: 20, maxSize: 50,
    weight: { wA: 0.009, wB: 2.8 },
    habitat: ['mid', 'surface'],
    active: ['day', 'dusk'],
    baitPref: { mushi: 1.0, oyster: 0.5, ebi: 0.9, lure: 1.4, dango: 0.6 },
    fight: { power: 0.50, stamina: 0.45, erratic: 0.70 },
    price: 50,
    desc: '青魚の代表格。背の波状模様は「サバ縞」の語源そのもので、回遊の早さは釣り人を悩ませる。鮮度落ちが早く「サバの生き腐れ」と言われるが、釣りたて直送の〆サバは別物の美味さ。',
    model: {
      profile: 'standard',
      bodyH: 0.22, bodyW: 0.11,
      snout: 'pointed',
      tail: 'lunate',
      dorsal: { start: 0.28, end: 0.55, h: 0.09, spiny: true },
      anal:   { start: 0.60, end: 0.72, h: 0.06 },
      pectoral: 0.14,
      colors: { back: '#2a5040', base: '#607870', belly: '#e0e8e0', fins: '#405850', eye: '#181818' },
      pattern: { type: 'hstripes', color: '#1a3028', count: 8, opacity: 0.55 },
      sheen: 0.65,
      special: null
    }
  },

  // ──────────────────────────────────────────────────────────
  // 8. イワシ
  // ──────────────────────────────────────────────────────────
  {
    id: 'iwashi',
    name: 'イワシ(マイワシ)',
    nameEn: 'Japanese sardine',
    category: 'normal',
    rarity: 1,
    minSize: 10, maxSize: 28,
    weight: { wA: 0.005, wB: 2.7 },
    habitat: ['surface'],
    active: ['day'],
    baitPref: { mushi: 1.0, oyster: 0.4, ebi: 0.7, lure: 0.8, dango: 0.6 },
    fight: { power: 0.20, stamina: 0.25, erratic: 0.50 },
    price: 30,
    desc: '弱い魚の代名詞だが、釣れた群れに当たると入れ食いの快感は格別。側線に沿った黒い斑点列が個体識別の目印。丸干しや煮付けにすると骨まで食べられ、青魚の栄養素を余すことなく摂取できる。',
    model: {
      profile: 'standard',
      bodyH: 0.20, bodyW: 0.09,
      snout: 'blunt',
      tail: 'forked',
      dorsal: { start: 0.32, end: 0.54, h: 0.08, spiny: false },
      anal:   { start: 0.60, end: 0.72, h: 0.05 },
      pectoral: 0.13,
      colors: { back: '#304050', base: '#7090a0', belly: '#e0eaea', fins: '#507080', eye: '#181818' },
      pattern: { type: 'spots', color: '#1a2030', count: 6, opacity: 0.40 },
      sheen: 0.80,
      special: null
    }
  },

  // ──────────────────────────────────────────────────────────
  // 9. カサゴ
  // ──────────────────────────────────────────────────────────
  {
    id: 'kasago',
    name: 'カサゴ(ガシラ)',
    nameEn: 'Rockfish',
    category: 'normal',
    rarity: 1,
    minSize: 10, maxSize: 35,
    weight: { wA: 0.025, wB: 3.1 },
    habitat: ['bottom'],
    active: ['day', 'dusk', 'night'],
    baitPref: { mushi: 1.3, oyster: 1.0, ebi: 1.4, lure: 0.9, dango: 0.5 },
    fight: { power: 0.45, stamina: 0.50, erratic: 0.40 },
    price: 80,
    desc: '根魚の帝王と呼ばれるずんぐり体型。背鰭の棘に毒はないが鋭く刺さるため素手扱いに注意。岩の隙間に突っ込む根ずれは初心者泣かせだが、穴釣りの標的としては最高の相棒。唐揚げは骨まで食べられ磯の旨みが凝縮。',
    model: {
      profile: 'standard',
      bodyH: 0.35, bodyW: 0.16,
      snout: 'blunt',
      tail: 'rounded',
      dorsal: { start: 0.22, end: 0.65, h: 0.15, spiny: true },
      anal:   { start: 0.62, end: 0.76, h: 0.08 },
      pectoral: 0.20,
      colors: { back: '#7a3820', base: '#a05030', belly: '#d0a080', fins: '#8a4028', eye: '#180808' },
      pattern: { type: 'marble', color: '#4a2010', count: 10, opacity: 0.50 },
      sheen: 0.25,
      special: null
    }
  },

  // ──────────────────────────────────────────────────────────
  // 10. メバル
  // ──────────────────────────────────────────────────────────
  {
    id: 'mebaru',
    name: 'メバル',
    nameEn: 'Japaneseredfin',
    category: 'normal',
    rarity: 2,
    minSize: 10, maxSize: 30,
    weight: { wA: 0.020, wB: 3.1 },
    habitat: ['mid', 'bottom'],
    active: ['dusk', 'night'],
    baitPref: { mushi: 1.2, oyster: 0.8, ebi: 1.1, lure: 1.0, dango: 0.5 },
    fight: { power: 0.38, stamina: 0.45, erratic: 0.50 },
    price: 90,
    desc: '大きな目が特徴の夜釣りの定番。春告魚とも呼ばれ、2〜3月に接岸する大型メバルは磯師の垂涎の的。電気ウキで狙う一本釣りには風情があり、メバリングの小型プラグへのアタリは繊細で面白い。',
    model: {
      profile: 'standard',
      bodyH: 0.32, bodyW: 0.13,
      snout: 'blunt',
      tail: 'rounded',
      dorsal: { start: 0.24, end: 0.64, h: 0.13, spiny: true },
      anal:   { start: 0.62, end: 0.76, h: 0.08 },
      pectoral: 0.18,
      colors: { back: '#3a3030', base: '#706060', belly: '#c8c0b0', fins: '#503838', eye: '#080408' },
      pattern: { type: 'vbars', color: '#282020', count: 6, opacity: 0.30 },
      sheen: 0.35,
      special: null
    }
  },

  // ──────────────────────────────────────────────────────────
  // 11. アイナメ
  // ──────────────────────────────────────────────────────────
  {
    id: 'ainame',
    name: 'アイナメ',
    nameEn: 'Fat greenling',
    category: 'normal',
    rarity: 2,
    minSize: 20, maxSize: 55,
    weight: { wA: 0.015, wB: 2.9 },
    habitat: ['bottom'],
    active: ['day', 'dusk'],
    baitPref: { mushi: 1.4, oyster: 0.9, ebi: 1.2, lure: 0.7, dango: 0.6 },
    fight: { power: 0.55, stamina: 0.60, erratic: 0.45 },
    price: 110,
    desc: '北日本の磯・根魚の代表。胴体に走る側線が5本あるのが和名の由来という説も。晩秋から冬が旬で、鍋や煮付けにすると脂がのって格別。ロックフィッシュゲームでは良型を求めて深場の岩礁を攻める。',
    model: {
      profile: 'standard',
      bodyH: 0.28, bodyW: 0.12,
      snout: 'blunt',
      tail: 'rounded',
      dorsal: { start: 0.24, end: 0.70, h: 0.11, spiny: true },
      anal:   { start: 0.60, end: 0.78, h: 0.07 },
      pectoral: 0.17,
      colors: { back: '#506030', base: '#788050', belly: '#c8c890', fins: '#607040', eye: '#181408' },
      pattern: { type: 'marble', color: '#384020', count: 8, opacity: 0.40 },
      sheen: 0.30,
      special: null
    }
  },

  // ──────────────────────────────────────────────────────────
  // 12. カワハギ
  // ──────────────────────────────────────────────────────────
  {
    id: 'kawahagi',
    name: 'カワハギ',
    nameEn: 'Filefish',
    category: 'normal',
    rarity: 2,
    minSize: 12, maxSize: 35,
    weight: { wA: 0.030, wB: 3.2 },
    habitat: ['bottom', 'mid'],
    active: ['day'],
    baitPref: { mushi: 1.5, oyster: 1.3, ebi: 1.0, lure: 0.3, dango: 0.8 },
    fight: { power: 0.30, stamina: 0.35, erratic: 0.80 },
    price: 150,
    desc: 'エサ取り名人の異名を持つ難敵。皮が厚く手で剥ける点が和名の由来で、処理した身は淡白で上品な旨み。肝を刺身に乗せた「肝醤油」は三ツ星レストランも顔負けの絶品。アタリを取る繊細さが釣り人を虜にする。',
    model: {
      profile: 'deep',
      bodyH: 0.50, bodyW: 0.12,
      snout: 'pointed',
      tail: 'truncate',
      dorsal: { start: 0.15, end: 0.20, h: 0.18, spiny: true },
      anal:   { start: 0.58, end: 0.76, h: 0.14 },
      pectoral: 0.14,
      colors: { back: '#5a5030', base: '#8a8050', belly: '#d8d0a0', fins: '#706040', eye: '#181408' },
      pattern: { type: 'marble', color: '#3a3020', count: 12, opacity: 0.45 },
      sheen: 0.15,
      special: null
    }
  },

  // ──────────────────────────────────────────────────────────
  // 13. ベラ (キュウセン)
  // ──────────────────────────────────────────────────────────
  {
    id: 'bera',
    name: 'ベラ(キュウセン)',
    nameEn: 'Rock wrasse',
    category: 'normal',
    rarity: 1,
    minSize: 10, maxSize: 30,
    weight: { wA: 0.008, wB: 2.8 },
    habitat: ['bottom', 'mid'],
    active: ['day'],
    baitPref: { mushi: 1.5, oyster: 0.9, ebi: 1.0, lure: 0.4, dango: 0.7 },
    fight: { power: 0.20, stamina: 0.25, erratic: 0.55 },
    price: 40,
    desc: '雄は青緑の縞模様、雌はオレンジ縞と性別で配色が正反対という不思議な魚。雌が生長で雄に性転換する雌性先熟型。大阪湾以西では「ベラ飯」「ベラ鍋」として普通に食べられ、侮れない食味の持ち主。',
    model: {
      profile: 'standard',
      bodyH: 0.26, bodyW: 0.11,
      snout: 'pointed',
      tail: 'rounded',
      dorsal: { start: 0.26, end: 0.68, h: 0.10, spiny: true },
      anal:   { start: 0.60, end: 0.76, h: 0.07 },
      pectoral: 0.16,
      colors: { back: '#2a6040', base: '#508060', belly: '#c0d8b8', fins: '#306848', eye: '#101808' },
      pattern: { type: 'hstripes', color: '#f08030', count: 5, opacity: 0.60 },
      sheen: 0.40,
      special: null
    }
  },

  // ──────────────────────────────────────────────────────────
  // 14. シロギス
  // ──────────────────────────────────────────────────────────
  {
    id: 'shirogisu',
    name: 'シロギス',
    nameEn: 'Japanese whiting',
    category: 'normal',
    rarity: 1,
    minSize: 10, maxSize: 28,
    weight: { wA: 0.004, wB: 2.6 },
    habitat: ['bottom'],
    active: ['day'],
    baitPref: { mushi: 1.8, oyster: 0.6, ebi: 0.8, lure: 0.3, dango: 0.4 },
    fight: { power: 0.20, stamina: 0.25, erratic: 0.60 },
    price: 55,
    desc: '白砂の砂浜を好む夏の釣りの定番。チョイ投げ釣りの入門種としても人気だが、ピンギス入れ食いからの連掛けは指先の感度が問われる本格派。てんぷらにすると身が締まり甘い磯の香りが広がる夏の味覚。',
    model: {
      profile: 'slender',
      bodyH: 0.18, bodyW: 0.09,
      snout: 'pointed',
      tail: 'forked',
      dorsal: { start: 0.28, end: 0.56, h: 0.09, spiny: true },
      anal:   { start: 0.58, end: 0.72, h: 0.06 },
      pectoral: 0.13,
      colors: { back: '#a09080', base: '#c8b8a8', belly: '#f0ece0', fins: '#b0a090', eye: '#181410' },
      pattern: { type: 'none', color: '#999', count: 0, opacity: 0.0 },
      sheen: 0.30,
      special: null
    }
  },

  // ──────────────────────────────────────────────────────────
  // 15. ハゼ
  // ──────────────────────────────────────────────────────────
  {
    id: 'haze',
    name: 'ハゼ(マハゼ)',
    nameEn: 'Yellowfin goby',
    category: 'normal',
    rarity: 1,
    minSize: 8, maxSize: 22,
    weight: { wA: 0.003, wB: 2.6 },
    habitat: ['bottom'],
    active: ['day'],
    baitPref: { mushi: 1.5, oyster: 0.6, ebi: 1.2, lure: 0.5, dango: 0.4 },
    fight: { power: 0.15, stamina: 0.20, erratic: 0.30 },
    price: 25,
    desc: '夏から秋にかけて河口や干潟に群れる江戸前釣りの象徴。「ハゼの天ぷら」は落語にも登場する昔ながらの味。ちょい投げの入門種だが、大ハゼを求めて晩秋の深場に挑む「落ちハゼ」釣りにはベテランもはまる渋さがある。',
    model: {
      profile: 'standard',
      bodyH: 0.20, bodyW: 0.12,
      snout: 'blunt',
      tail: 'rounded',
      dorsal: { start: 0.28, end: 0.60, h: 0.10, spiny: true },
      anal:   { start: 0.58, end: 0.72, h: 0.06 },
      pectoral: 0.17,
      colors: { back: '#706040', base: '#907860', belly: '#d0c0a0', fins: '#806850', eye: '#181008' },
      pattern: { type: 'speckle', color: '#4a3828', count: 14, opacity: 0.40 },
      sheen: 0.15,
      special: null
    }
  },

  // ──────────────────────────────────────────────────────────
  // 16. ボラ
  // ──────────────────────────────────────────────────────────
  {
    id: 'bora',
    name: 'ボラ',
    nameEn: 'Flathead grey mullet',
    category: 'normal',
    rarity: 1,
    minSize: 20, maxSize: 65,
    weight: { wA: 0.012, wB: 2.8 },
    habitat: ['surface', 'mid'],
    active: ['day', 'dusk'],
    baitPref: { mushi: 0.8, oyster: 0.6, ebi: 0.7, lure: 0.5, dango: 1.6 },
    fight: { power: 0.65, stamina: 0.70, erratic: 0.60 },
    price: 50,
    desc: '港や河口でよく見かける大型魚だが、食用としての評価は産地次第。澄んだ外海育ちのボラは刺身でも食べられ、からすみの原料でもある。針がかりすると強烈な引きで竿をひったくり、初心者には本命と間違われることも多い。',
    model: {
      profile: 'standard',
      bodyH: 0.24, bodyW: 0.12,
      snout: 'blunt',
      tail: 'forked',
      dorsal: { start: 0.32, end: 0.55, h: 0.09, spiny: true },
      anal:   { start: 0.60, end: 0.74, h: 0.06 },
      pectoral: 0.14,
      colors: { back: '#404840', base: '#707870', belly: '#d0d8d0', fins: '#505850', eye: '#181818' },
      pattern: { type: 'hstripes', color: '#383e38', count: 4, opacity: 0.20 },
      sheen: 0.50,
      special: null
    }
  },

  // ──────────────────────────────────────────────────────────
  // 17. サヨリ
  // ──────────────────────────────────────────────────────────
  {
    id: 'sayori',
    name: 'サヨリ',
    nameEn: 'Japanese halfbeak',
    category: 'normal',
    rarity: 2,
    minSize: 20, maxSize: 40,
    weight: { wA: 0.002, wB: 2.5 },
    habitat: ['surface'],
    active: ['day'],
    baitPref: { mushi: 1.0, oyster: 0.3, ebi: 0.6, lure: 0.8, dango: 0.5 },
    fight: { power: 0.25, stamina: 0.30, erratic: 0.70 },
    price: 70,
    desc: '細長い銀色の体に橙色の嘴が美しい春の表層魚。「表は美しく腹は黒い」という諺の語源とも言われるが、実際は内臓の腹膜が黒いだけ。刺身にすると透明感ある白身が食卓を彩り、秋冬には天ぷらや干物でも人気。',
    model: {
      profile: 'slender',
      bodyH: 0.12, bodyW: 0.08,
      snout: 'long',
      tail: 'forked',
      dorsal: { start: 0.60, end: 0.78, h: 0.07, spiny: false },
      anal:   { start: 0.62, end: 0.80, h: 0.06 },
      pectoral: 0.12,
      colors: { back: '#3a4848', base: '#909898', belly: '#e8eeee', fins: '#708080', eye: '#181c1c' },
      pattern: { type: 'none', color: '#888', count: 0, opacity: 0.0 },
      sheen: 0.90,
      special: null
    }
  },

  // ──────────────────────────────────────────────────────────
  // 18. タチウオ
  // ──────────────────────────────────────────────────────────
  {
    id: 'tachiuo',
    name: 'タチウオ',
    nameEn: 'Largehead hairtail',
    category: 'normal',
    rarity: 2,
    minSize: 40, maxSize: 120,
    weight: { wA: 0.0008, wB: 2.2 },
    habitat: ['mid', 'surface'],
    active: ['dusk', 'night'],
    baitPref: { mushi: 0.6, oyster: 0.3, ebi: 0.8, lure: 1.7, dango: 0.3 },
    fight: { power: 0.60, stamina: 0.55, erratic: 0.80 },
    price: 130,
    desc: '銀の太刀のような体が和名の由来。鋭い歯は釣り人の指を容易に切り裂くため、タオルつかみが常識。秋の大阪湾のタチウオ釣りは一大風物詩で、夕マズメに電気ウキが沈む瞬間は格別の興奮。指3〜4本幅の大型は指ドラゴンと称される。',
    model: {
      profile: 'eel',
      bodyH: 0.10, bodyW: 0.06,
      snout: 'pointed',
      tail: 'pointed',
      dorsal: { start: 0.08, end: 0.88, h: 0.06, spiny: false },
      anal:   { start: 0.50, end: 0.88, h: 0.02 },
      pectoral: 0.08,
      colors: { back: '#c0c8cc', base: '#d8e0e4', belly: '#e8f0f4', fins: '#b8c0c8', eye: '#101418' },
      pattern: { type: 'none', color: '#ccc', count: 0, opacity: 0.0 },
      sheen: 0.95,
      special: null
    }
  },

  // ──────────────────────────────────────────────────────────
  // 19. ヒラメ
  // ──────────────────────────────────────────────────────────
  {
    id: 'hirame',
    name: 'ヒラメ',
    nameEn: 'Japanese flounder',
    category: 'normal',
    rarity: 3,
    minSize: 25, maxSize: 80,
    weight: { wA: 0.025, wB: 2.8 },
    habitat: ['bottom'],
    active: ['day', 'dusk'],
    baitPref: { mushi: 0.7, oyster: 0.5, ebi: 1.2, lure: 1.6, dango: 0.3 },
    fight: { power: 0.70, stamina: 0.65, erratic: 0.55 },
    price: 300,
    desc: '高級魚の代名詞。砂底に擬態して待ち伏せするヒラメは、左目が上を向く「ヒラメは左、カレイは右」の語呂合わせで初心者が必ず覚える魚。ルアーへのアタックは「ヒラメの三段引き」と呼ばれる独特の食い方が特徴。',
    model: {
      profile: 'flat',
      bodyH: 0.45, bodyW: 0.06,
      snout: 'pointed',
      tail: 'rounded',
      dorsal: { start: 0.12, end: 0.82, h: 0.10, spiny: false },
      anal:   { start: 0.18, end: 0.82, h: 0.10 },
      pectoral: 0.18,
      colors: { back: '#706050', base: '#907870', belly: '#e0dcd0', fins: '#806858', eye: '#181008' },
      pattern: { type: 'speckle', color: '#504030', count: 16, opacity: 0.50 },
      sheen: 0.20,
      special: null
    }
  },

  // ──────────────────────────────────────────────────────────
  // 20. マゴチ
  // ──────────────────────────────────────────────────────────
  {
    id: 'magochi',
    name: 'マゴチ',
    nameEn: 'Flathead',
    category: 'normal',
    rarity: 3,
    minSize: 25, maxSize: 70,
    weight: { wA: 0.010, wB: 2.7 },
    habitat: ['bottom'],
    active: ['day'],
    baitPref: { mushi: 0.6, oyster: 0.4, ebi: 1.4, lure: 1.5, dango: 0.3 },
    fight: { power: 0.65, stamina: 0.60, erratic: 0.50 },
    price: 280,
    desc: '頭が縦に扁平な独特のシルエット。砂泥底の忍者で、小魚やエビに猛然と飛びかかる。夏の高級魚として知られ、薄造りの刺身は透明感ある白身の極み。光るルアーへの反応が高く「コチ師」と呼ばれる専門家も多い。',
    model: {
      profile: 'flat',
      bodyH: 0.20, bodyW: 0.10,
      snout: 'pointed',
      tail: 'rounded',
      dorsal: { start: 0.28, end: 0.65, h: 0.09, spiny: true },
      anal:   { start: 0.52, end: 0.75, h: 0.07 },
      pectoral: 0.22,
      colors: { back: '#806050', base: '#a08060', belly: '#d8c8a8', fins: '#907060', eye: '#181008' },
      pattern: { type: 'speckle', color: '#604030', count: 20, opacity: 0.45 },
      sheen: 0.15,
      special: null
    }
  },

  // ──────────────────────────────────────────────────────────
  // 21. アナゴ
  // ──────────────────────────────────────────────────────────
  {
    id: 'anago',
    name: 'アナゴ(マアナゴ)',
    nameEn: 'Conger eel',
    category: 'normal',
    rarity: 2,
    minSize: 25, maxSize: 70,
    weight: { wA: 0.003, wB: 2.4 },
    habitat: ['bottom'],
    active: ['dusk', 'night'],
    baitPref: { mushi: 1.4, oyster: 0.9, ebi: 1.3, lure: 0.4, dango: 0.5 },
    fight: { power: 0.35, stamina: 0.55, erratic: 0.65 },
    price: 100,
    desc: '夜の投げ釣りで穴から出てくる港の守り神。タコ糸のようにクルクル回転して仕掛けを絡め、抜き上げると周囲に飛び散る粘液が釣り人泣かせ。だが、ふわっとした白身を煮穴子にした瞬間、すべての苦労が報われる。',
    model: {
      profile: 'eel',
      bodyH: 0.08, bodyW: 0.07,
      snout: 'pointed',
      tail: 'pointed',
      dorsal: { start: 0.20, end: 0.92, h: 0.05, spiny: false },
      anal:   { start: 0.45, end: 0.92, h: 0.04 },
      pectoral: 0.10,
      colors: { back: '#4a4030', base: '#7a6850', belly: '#c8b898', fins: '#5a5040', eye: '#181008' },
      pattern: { type: 'spots', color: '#e8e0c8', count: 10, opacity: 0.70 },
      sheen: 0.20,
      special: null
    }
  },

  // ──────────────────────────────────────────────────────────
  // 22. ウツボ
  // ──────────────────────────────────────────────────────────
  {
    id: 'utsubo',
    name: 'ウツボ',
    nameEn: 'Undulated moray',
    category: 'normal',
    rarity: 3,
    minSize: 30, maxSize: 120,
    weight: { wA: 0.004, wB: 2.3 },
    habitat: ['bottom'],
    active: ['dusk', 'night'],
    baitPref: { mushi: 0.8, oyster: 1.2, ebi: 1.4, lure: 0.6, dango: 0.4 },
    fight: { power: 0.75, stamina: 0.80, erratic: 0.70 },
    price: 90,
    desc: '磯の怪物。岩穴からぬっと現れる鋭い歯は釣りバリを簡単に曲げ、仕掛けごと切られることも多い。土佐では「ぎゅうじ」と呼び、煮付け・タタキと立派な食材だが、首都圏の釣り人には外道扱いされる不遇の魚。',
    model: {
      profile: 'eel',
      bodyH: 0.14, bodyW: 0.12,
      snout: 'pointed',
      tail: 'pointed',
      dorsal: { start: 0.15, end: 0.90, h: 0.08, spiny: false },
      anal:   { start: 0.45, end: 0.90, h: 0.06 },
      pectoral: 0.06,
      colors: { back: '#6a5020', base: '#8a7030', belly: '#c0a060', fins: '#705828', eye: '#201008' },
      pattern: { type: 'marble', color: '#3a2808', count: 14, opacity: 0.60 },
      sheen: 0.15,
      special: null
    }
  },

  // ──────────────────────────────────────────────────────────
  // 23. クサフグ
  // ──────────────────────────────────────────────────────────
  {
    id: 'kusafugu',
    name: 'クサフグ',
    nameEn: 'Grass puffer',
    category: 'normal',
    rarity: 1,
    minSize: 8, maxSize: 18,
    weight: { wA: 0.015, wB: 3.0 },
    habitat: ['bottom', 'mid'],
    active: ['day'],
    baitPref: { mushi: 1.6, oyster: 1.2, ebi: 1.3, lure: 0.5, dango: 0.9 },
    fight: { power: 0.15, stamina: 0.20, erratic: 0.30 },
    price: 10,
    desc: 'エサ取りの横綱。ゴカイを根本からかじって仕掛けを無効化する達人。仕掛けを引き上げると丸々と膨らんだその姿に思わず笑えるが、猛毒テトロドトキシンを持つため絶対に食べてはいけない。磯の掃除屋とも呼ばれる。',
    model: {
      profile: 'round',
      bodyH: 0.55, bodyW: 0.45,
      snout: 'blunt',
      tail: 'rounded',
      dorsal: { start: 0.60, end: 0.75, h: 0.08, spiny: false },
      anal:   { start: 0.62, end: 0.76, h: 0.07 },
      pectoral: 0.14,
      colors: { back: '#5a6030', base: '#7a8040', belly: '#e0e0c0', fins: '#606840', eye: '#181408' },
      pattern: { type: 'speckle', color: '#2a2808', count: 20, opacity: 0.55 },
      sheen: 0.10,
      special: null
    }
  },

  // ──────────────────────────────────────────────────────────
  // 24. アオリイカ
  // ──────────────────────────────────────────────────────────
  {
    id: 'aoriika',
    name: 'アオリイカ',
    nameEn: 'Bigfin reef squid',
    category: 'normal',
    rarity: 3,
    minSize: 15, maxSize: 45,
    weight: { wA: 0.018, wB: 2.5 },
    habitat: ['mid', 'surface'],
    active: ['dusk', 'night'],
    baitPref: { mushi: 0.3, oyster: 0.3, ebi: 1.6, lure: 1.5, dango: 0.2 },
    fight: { power: 0.55, stamina: 0.50, erratic: 0.85 },
    price: 280,
    desc: 'エギングの主役、イカの王様。透明感ある体に興奮すると浮かぶ斑点模様が美しく、磯師は「モイカ」と呼んで敬う。シャクリに反応するエギングの技術論は奥が深く、秋の新子シーズンは磯堤防を問わず大人気。墨汁は着衣に永久に残るので要注意。',
    model: {
      profile: 'squid',
      bodyH: 0.30, bodyW: 0.18,
      snout: 'pointed',
      tail: 'pointed',
      dorsal: { start: 0.10, end: 0.85, h: 0.12, spiny: false },
      anal:   { start: 0.10, end: 0.85, h: 0.12 },
      pectoral: 0.20,
      colors: { back: '#c0c8c0', base: '#d0d8d0', belly: '#e8eee8', fins: '#b8c0b8', eye: '#0a0a0a' },
      pattern: { type: 'speckle', color: '#8040a0', count: 18, opacity: 0.35 },
      sheen: 0.50,
      special: null
    }
  },

  // ──────────────────────────────────────────────────────────
  // 25. マダコ
  // ──────────────────────────────────────────────────────────
  {
    id: 'madako',
    name: 'マダコ',
    nameEn: 'Common octopus',
    category: 'normal',
    rarity: 2,
    minSize: 15, maxSize: 50,
    weight: { wA: 0.030, wB: 2.8 },
    habitat: ['bottom'],
    active: ['day', 'night'],
    baitPref: { mushi: 0.4, oyster: 1.0, ebi: 1.5, lure: 1.2, dango: 0.3 },
    fight: { power: 0.50, stamina: 0.60, erratic: 0.75 },
    price: 200,
    desc: '8本の腕で岩に吸着し、なかなか浮き上がらない底の強敵。「たこ糸」の語源にもなった引っ張り感は独特。ルアーに抱き着いてくる瞬間の「コンッ」という感触がたまらないと言うタコ師も多い。明石の蛸飯は日本の食文化遺産。',
    model: {
      profile: 'squid',
      bodyH: 0.45, bodyW: 0.40,
      snout: 'rounded',
      tail: 'rounded',
      dorsal: { start: 0.10, end: 0.50, h: 0.05, spiny: false },
      anal:   { start: 0.10, end: 0.50, h: 0.05 },
      pectoral: 0.10,
      colors: { back: '#8a3018', base: '#a04020', belly: '#c07850', fins: '#783010', eye: '#200808' },
      pattern: { type: 'marble', color: '#5a1808', count: 12, opacity: 0.50 },
      sheen: 0.10,
      special: 'tentacles'
    }
  },

  // ──────────────────────────────────────────────────────────
  // 26. イシダイ
  // ──────────────────────────────────────────────────────────
  {
    id: 'ishidai',
    name: 'イシダイ',
    nameEn: 'Striped beakfish',
    category: 'normal',
    rarity: 3,
    minSize: 20, maxSize: 60,
    weight: { wA: 0.025, wB: 3.1 },
    habitat: ['bottom'],
    active: ['day'],
    baitPref: { mushi: 0.7, oyster: 1.6, ebi: 1.0, lure: 0.4, dango: 0.5 },
    fight: { power: 0.80, stamina: 0.75, erratic: 0.55 },
    price: 350,
    desc: '磯釣りの最高峰と呼ばれる「磯の王者」。硬い嘴でサザエや貝類を砕く食性から、サザエを餌にした石物専用仕掛けが発達した。縦縞模様は成長で消え、老成魚は「クチグロ」と呼ばれる黒い嘴の横綱になる。',
    model: {
      profile: 'deep',
      bodyH: 0.42, bodyW: 0.16,
      snout: 'blunt',
      tail: 'truncate',
      dorsal: { start: 0.26, end: 0.62, h: 0.13, spiny: true },
      anal:   { start: 0.60, end: 0.76, h: 0.09 },
      pectoral: 0.16,
      colors: { back: '#303030', base: '#606060', belly: '#c0c0c0', fins: '#404040', eye: '#100808' },
      pattern: { type: 'vbars', color: '#101010', count: 7, opacity: 0.75 },
      sheen: 0.55,
      special: null
    }
  },

  // ──────────────────────────────────────────────────────────
  // 27. イシガキダイ
  // ──────────────────────────────────────────────────────────
  {
    id: 'ishigakidai',
    name: 'イシガキダイ',
    nameEn: 'Rock porgy',
    category: 'normal',
    rarity: 3,
    minSize: 20, maxSize: 55,
    weight: { wA: 0.024, wB: 3.0 },
    habitat: ['bottom'],
    active: ['day'],
    baitPref: { mushi: 0.6, oyster: 1.5, ebi: 1.0, lure: 0.3, dango: 0.5 },
    fight: { power: 0.75, stamina: 0.72, erratic: 0.50 },
    price: 320,
    desc: '体の白い斑点が石垣模様に見えることから命名。イシダイよりさらに南方系で、黒潮の影響を受ける外洋磯でのみ出会える。老成すると口元が白くなり「クチシロ」と称される。白身の刺身は絶品で、釣り上げた喜びと味の両方で釣り人を満足させる。',
    model: {
      profile: 'deep',
      bodyH: 0.40, bodyW: 0.15,
      snout: 'blunt',
      tail: 'truncate',
      dorsal: { start: 0.26, end: 0.62, h: 0.13, spiny: true },
      anal:   { start: 0.60, end: 0.76, h: 0.09 },
      pectoral: 0.16,
      colors: { back: '#282828', base: '#484848', belly: '#a0a0a0', fins: '#383838', eye: '#100808' },
      pattern: { type: 'spots', color: '#e8e8e8', count: 14, opacity: 0.80 },
      sheen: 0.50,
      special: null
    }
  },

  // ──────────────────────────────────────────────────────────
  // 28. イサキ
  // ──────────────────────────────────────────────────────────
  {
    id: 'isaki',
    name: 'イサキ',
    nameEn: 'Threeline grunt',
    category: 'normal',
    rarity: 2,
    minSize: 15, maxSize: 40,
    weight: { wA: 0.016, wB: 2.9 },
    habitat: ['mid', 'bottom'],
    active: ['dusk', 'night'],
    baitPref: { mushi: 1.2, oyster: 0.8, ebi: 1.0, lure: 0.7, dango: 1.1 },
    fight: { power: 0.50, stamina: 0.55, erratic: 0.60 },
    price: 140,
    desc: '夜の磯を群れで泳ぐ中型魚。フカセ釣りやカゴ釣りで狙われ、梅雨の時期が最盛期とされる「梅雨イサキ」は脂がのって絶品。若魚には3本の黄縞があるが成長と共に消え、大型の老成魚は磯師が「メッキ」と呼んで珍重する。',
    model: {
      profile: 'standard',
      bodyH: 0.30, bodyW: 0.12,
      snout: 'blunt',
      tail: 'forked',
      dorsal: { start: 0.26, end: 0.62, h: 0.12, spiny: true },
      anal:   { start: 0.62, end: 0.76, h: 0.08 },
      pectoral: 0.15,
      colors: { back: '#505840', base: '#708060', belly: '#c8d0b8', fins: '#606850', eye: '#181808' },
      pattern: { type: 'hstripes', color: '#d0c840', count: 3, opacity: 0.50 },
      sheen: 0.45,
      special: null
    }
  },

  // ──────────────────────────────────────────────────────────
  // 29. カンパチ
  // ──────────────────────────────────────────────────────────
  {
    id: 'kanpachi',
    name: 'カンパチ',
    nameEn: 'Greater amberjack',
    category: 'normal',
    rarity: 3,
    minSize: 30, maxSize: 100,
    weight: { wA: 0.011, wB: 2.9 },
    habitat: ['mid', 'surface'],
    active: ['day'],
    baitPref: { mushi: 0.5, oyster: 0.4, ebi: 0.9, lure: 1.8, dango: 0.3 },
    fight: { power: 0.85, stamina: 0.80, erratic: 0.65 },
    price: 350,
    desc: '眉間を斜めに走る八の字に見える斑模様が和名の由来。ブリよりも引きが強烈で「カンパチに走られたら止まらない」と言われる。刺身は脂と旨みのバランスが絶妙で三大回遊魚の一角。青物ジギングで最も人気の高いターゲット。',
    model: {
      profile: 'standard',
      bodyH: 0.28, bodyW: 0.12,
      snout: 'blunt',
      tail: 'lunate',
      dorsal: { start: 0.24, end: 0.58, h: 0.11, spiny: true },
      anal:   { start: 0.60, end: 0.74, h: 0.08 },
      pectoral: 0.16,
      colors: { back: '#2a4050', base: '#5a7880', belly: '#d0dcd8', fins: '#4a6870', eye: '#180c08' },
      pattern: { type: 'hstripes', color: '#d8a030', count: 1, opacity: 0.70 },
      sheen: 0.70,
      special: null
    }
  },

  // ──────────────────────────────────────────────────────────
  // 30. ブリ
  // ──────────────────────────────────────────────────────────
  {
    id: 'buri',
    name: 'ブリ',
    nameEn: 'Japanese amberjack',
    category: 'normal',
    rarity: 3,
    minSize: 40, maxSize: 120,
    weight: { wA: 0.012, wB: 2.9 },
    habitat: ['mid', 'surface'],
    active: ['day'],
    baitPref: { mushi: 0.4, oyster: 0.3, ebi: 0.8, lure: 1.9, dango: 0.3 },
    fight: { power: 0.90, stamina: 0.85, erratic: 0.60 },
    price: 400,
    desc: '日本の出世魚の代表格。関西でワカナ→ツバス→ハマチ→メジロ→ブリと成長で名が変わる。冬の寒ブリは脂がのった最高級品で、能登や富山の寒ブリ一本釣りは絶景の荒海との勝負。ショアからの大型ブリは「夢の一本」と語り継がれる。',
    model: {
      profile: 'standard',
      bodyH: 0.26, bodyW: 0.12,
      snout: 'blunt',
      tail: 'lunate',
      dorsal: { start: 0.24, end: 0.58, h: 0.10, spiny: true },
      anal:   { start: 0.60, end: 0.74, h: 0.07 },
      pectoral: 0.16,
      colors: { back: '#304858', base: '#607888', belly: '#d8e0dc', fins: '#506878', eye: '#180c08' },
      pattern: { type: 'hstripes', color: '#c89820', count: 1, opacity: 0.65 },
      sheen: 0.68,
      special: null
    }
  },

  // ──────────────────────────────────────────────────────────
  // 31. コノシロ
  // ──────────────────────────────────────────────────────────
  {
    id: 'konoshiro',
    name: 'コノシロ',
    nameEn: 'Gizzard shad',
    category: 'normal',
    rarity: 1,
    minSize: 12, maxSize: 28,
    weight: { wA: 0.006, wB: 2.7 },
    habitat: ['surface', 'mid'],
    active: ['day'],
    baitPref: { mushi: 1.0, oyster: 0.4, ebi: 0.7, lure: 0.8, dango: 0.6 },
    fight: { power: 0.25, stamina: 0.30, erratic: 0.55 },
    price: 35,
    desc: 'ニシン科の出世魚でコハダの成魚。江戸前寿司のコハダはこの魚の幼魚で、職人の〆の技が光る逸品。群れで回遊する習性から、見つかれば大漁も期待できる。骨が多く食べづらいが、酢締めにすると骨ごと食べられる。',
    model: {
      profile: 'standard',
      bodyH: 0.24, bodyW: 0.09,
      snout: 'blunt',
      tail: 'forked',
      dorsal: { start: 0.32, end: 0.52, h: 0.10, spiny: false },
      anal:   { start: 0.58, end: 0.78, h: 0.06 },
      pectoral: 0.13,
      colors: { back: '#3a5060', base: '#7898a8', belly: '#d8e8f0', fins: '#608090', eye: '#181c20' },
      pattern: { type: 'spots', color: '#1a2830', count: 5, opacity: 0.60 },
      sheen: 0.75,
      special: null
    }
  },

  // ──────────────────────────────────────────────────────────
  // 32. ウミタナゴ
  // ──────────────────────────────────────────────────────────
  {
    id: 'umitanago',
    name: 'ウミタナゴ',
    nameEn: 'Surfperch',
    category: 'normal',
    rarity: 1,
    minSize: 12, maxSize: 28,
    weight: { wA: 0.012, wB: 3.0 },
    habitat: ['mid'],
    active: ['day'],
    baitPref: { mushi: 1.3, oyster: 0.8, ebi: 0.9, lure: 0.6, dango: 1.0 },
    fight: { power: 0.28, stamina: 0.35, erratic: 0.45 },
    price: 45,
    desc: '堤防の定番外道だが、体の美しい銀色と赤みのグラデーションが本物の観賞価値を持つ。胎生魚で稚魚を産む珍しい魚種。小型の割に引きは意外とあり、春告魚の一つとして親しまれている。',
    model: {
      profile: 'deep',
      bodyH: 0.38, bodyW: 0.12,
      snout: 'blunt',
      tail: 'forked',
      dorsal: { start: 0.26, end: 0.64, h: 0.12, spiny: true },
      anal:   { start: 0.60, end: 0.76, h: 0.08 },
      pectoral: 0.15,
      colors: { back: '#404858', base: '#8090a0', belly: '#d8e0e8', fins: '#607080', eye: '#181820' },
      pattern: { type: 'none', color: '#555', count: 0, opacity: 0.0 },
      sheen: 0.60,
      special: null
    }
  },

  // ──────────────────────────────────────────────────────────
  // 33. アカエイ
  // ──────────────────────────────────────────────────────────
  {
    id: 'akaei',
    name: 'アカエイ',
    nameEn: 'Whiptail stingray',
    category: 'normal',
    rarity: 2,
    minSize: 30, maxSize: 100,
    weight: { wA: 0.050, wB: 2.5 },
    habitat: ['bottom'],
    active: ['day'],
    baitPref: { mushi: 1.3, oyster: 1.0, ebi: 1.2, lure: 0.3, dango: 0.7 },
    fight: { power: 0.70, stamina: 0.75, erratic: 0.40 },
    price: 60,
    desc: '砂底に潜む「平べったい外道」の代表。長い尾の棘には猛毒があり、踏んだり素手でつかんだりすると重傷を負う。引き上げると重くなる独特のアタリに、最初は大物かと期待させてくれる罪な魚。実は焼き肉にするとコリコリした食感が楽しい。',
    model: {
      profile: 'flat',
      bodyH: 0.65, bodyW: 0.04,
      snout: 'pointed',
      tail: 'pointed',
      dorsal: { start: 0.60, end: 0.70, h: 0.04, spiny: false },
      anal:   { start: 0.62, end: 0.72, h: 0.03 },
      pectoral: 0.55,
      colors: { back: '#8a5030', base: '#a06040', belly: '#d0b090', fins: '#8a5030', eye: '#180808' },
      pattern: { type: 'none', color: '#666', count: 0, opacity: 0.0 },
      sheen: 0.10,
      special: null
    }
  },

  // ──────────────────────────────────────────────────────────
  // 34. ゴンズイ
  // ──────────────────────────────────────────────────────────
  {
    id: 'gonzui',
    name: 'ゴンズイ',
    nameEn: 'Striped eel catfish',
    category: 'normal',
    rarity: 1,
    minSize: 8, maxSize: 25,
    weight: { wA: 0.006, wB: 2.6 },
    habitat: ['bottom'],
    active: ['dusk', 'night'],
    baitPref: { mushi: 1.5, oyster: 0.9, ebi: 1.2, lure: 0.4, dango: 0.6 },
    fight: { power: 0.18, stamina: 0.22, erratic: 0.35 },
    price: 20,
    desc: '夜釣りの常連トラブルメーカー。背鰭と胸鰭に毒棘があり、刺さると激しく腫れる。幼魚は「ゴンズイ玉」と呼ばれる密集状態で行動するが、その光景は不気味さと神秘さが共存する磯の風物詩。ナマズに似た姿で髭が特徴。',
    model: {
      profile: 'standard',
      bodyH: 0.18, bodyW: 0.12,
      snout: 'blunt',
      tail: 'rounded',
      dorsal: { start: 0.22, end: 0.40, h: 0.10, spiny: true },
      anal:   { start: 0.58, end: 0.76, h: 0.06 },
      pectoral: 0.16,
      colors: { back: '#2a2018', base: '#504030', belly: '#906850', fins: '#3a2e20', eye: '#100808' },
      pattern: { type: 'hstripes', color: '#e0d090', count: 2, opacity: 0.85 },
      sheen: 0.12,
      special: 'whiskers'
    }
  },

  // ══════════════════════════════════════════════════════════
  // 架空種 (category: 'fantasy') — 6種
  // ══════════════════════════════════════════════════════════

  // F1. 黄金チヌ
  {
    id: 'golden_chinu',
    name: '黄金チヌ',
    nameEn: 'Golden Black Seabream',
    category: 'fantasy',
    rarity: 5,
    minSize: 30, maxSize: 70,
    weight: { wA: 0.025, wB: 3.0 },
    habitat: ['bottom', 'mid'],
    active: ['dusk', 'night'],
    baitPref: { mushi: 0.8, oyster: 2.0, ebi: 0.8, lure: 0.4, dango: 2.5 },
    fight: { power: 0.95, stamina: 0.95, erratic: 0.80 },
    price: 5000,
    desc: '千年を生きたチヌが磯の神気を受けて全身黄金に変じた伝説の魚。月のない闇夜に海底から金色の光を放ちながら浮上すると言われ、一目見ただけで福運が訪れるとも。針に掛けた者は生涯の大漁を約束されるが、逃した者は三年間不漁に泣く。',
    model: {
      profile: 'deep',
      bodyH: 0.38, bodyW: 0.14,
      snout: 'blunt',
      tail: 'forked',
      dorsal: { start: 0.28, end: 0.62, h: 0.12, spiny: true },
      anal:   { start: 0.60, end: 0.78, h: 0.08 },
      pectoral: 0.16,
      colors: { back: '#c8a000', base: '#e8c030', belly: '#fff0a0', fins: '#d0a810', eye: '#301800' },
      pattern: { type: 'vbars', color: '#c09000', count: 5, opacity: 0.20 },
      sheen: 1.0,
      special: 'crown'
    }
  },

  // F2. 龍宮の幼竜
  {
    id: 'ryuguu_dragon',
    name: '龍宮の幼竜',
    nameEn: 'Ryuguu Sea Dragon Fry',
    category: 'fantasy',
    rarity: 5,
    minSize: 50, maxSize: 200,
    weight: { wA: 0.005, wB: 2.1 },
    habitat: ['mid', 'surface'],
    active: ['night'],
    baitPref: { mushi: 0.3, oyster: 0.5, ebi: 1.2, lure: 1.8, dango: 0.2 },
    fight: { power: 1.0, stamina: 1.0, erratic: 1.0 },
    price: 9999,
    desc: '竜宮城より使わされた竜の御子。リュウグウノツカイを遥かに超える全長を誇り、深夜の外洋磯にのみ姿を現す。頭部の角と鱗から発する青白い燐光は海面を照らし、周囲の魚を従える。釣り上げた者は一夜限り竜宮城に招かれるという言い伝えあり。',
    model: {
      profile: 'eel',
      bodyH: 0.16, bodyW: 0.10,
      snout: 'pointed',
      tail: 'lunate',
      dorsal: { start: 0.05, end: 0.90, h: 0.18, spiny: true },
      anal:   { start: 0.50, end: 0.90, h: 0.08 },
      pectoral: 0.14,
      colors: { back: '#0a1840', base: '#2040a0', belly: '#8090e0', fins: '#1830c0', eye: '#00e8ff' },
      pattern: { type: 'speckle', color: '#80c0ff', count: 20, opacity: 0.60 },
      sheen: 0.85,
      special: 'horn'
    }
  },

  // F3. 提灯深海魚
  {
    id: 'chochin_fish',
    name: '提灯深海魚',
    nameEn: 'Lantern Abyss Fish',
    category: 'fantasy',
    rarity: 4,
    minSize: 20, maxSize: 50,
    weight: { wA: 0.010, wB: 2.7 },
    habitat: ['bottom'],
    active: ['night'],
    baitPref: { mushi: 0.5, oyster: 0.4, ebi: 0.8, lure: 2.0, dango: 0.2 },
    fight: { power: 0.70, stamina: 0.65, erratic: 0.90 },
    price: 2000,
    desc: '頭頂から伸びる発光器官が日本の提灯に似ることから命名。深海の漆黒で赤い光を灯して獲物を誘き寄せる姿は恐怖と美しさが同居する。釣り上げると水面でもその提灯は消えず、夜の堤防を赤く染める。古文書には「火魚」として恐れられた記録が残る。',
    model: {
      profile: 'round',
      bodyH: 0.50, bodyW: 0.40,
      snout: 'pointed',
      tail: 'rounded',
      dorsal: { start: 0.10, end: 0.20, h: 0.25, spiny: true },
      anal:   { start: 0.60, end: 0.75, h: 0.09 },
      pectoral: 0.16,
      colors: { back: '#1a0808', base: '#380010', belly: '#500018', fins: '#280008', eye: '#ff2000' },
      pattern: { type: 'speckle', color: '#ff4000', count: 8, opacity: 0.50 },
      sheen: 0.20,
      special: 'glow'
    }
  },

  // F4. 磯の人面魚
  {
    id: 'jinmen_fish',
    name: '磯の人面魚',
    nameEn: 'Human-faced Reef Wraith',
    category: 'fantasy',
    rarity: 4,
    minSize: 25, maxSize: 55,
    weight: { wA: 0.018, wB: 2.9 },
    habitat: ['mid', 'bottom'],
    active: ['night'],
    baitPref: { mushi: 1.0, oyster: 1.0, ebi: 1.0, lure: 1.0, dango: 1.0 },
    fight: { power: 0.60, stamina: 0.75, erratic: 1.0 },
    price: 1500,
    desc: '夜の磯岩際に浮かぶ半透明の魚。顔のような紋様が釣り人を惑わせ、思わず竿を下げさせる怪異。江戸時代の釣り書「磯撰集」にも記述があり、「この魚を見て逃げれば翌日大漁、話しかけると三日は竿を持てなくなる」とある。食味は不明。誰も食べない。',
    model: {
      profile: 'deep',
      bodyH: 0.36, bodyW: 0.13,
      snout: 'blunt',
      tail: 'rounded',
      dorsal: { start: 0.28, end: 0.64, h: 0.11, spiny: false },
      anal:   { start: 0.60, end: 0.76, h: 0.08 },
      pectoral: 0.15,
      colors: { back: '#303848', base: '#606878', belly: '#d0d8e8', fins: '#505868', eye: '#c8c0a0' },
      pattern: { type: 'marble', color: '#a09888', count: 6, opacity: 0.70 },
      sheen: 0.40,
      special: 'ghost'
    }
  },

  // F5. 虹色イカ
  {
    id: 'rainbow_squid',
    name: '虹色イカ',
    nameEn: 'Prismatic Rainbow Squid',
    category: 'fantasy',
    rarity: 4,
    minSize: 20, maxSize: 60,
    weight: { wA: 0.012, wB: 2.4 },
    habitat: ['mid', 'surface'],
    active: ['dusk', 'night'],
    baitPref: { mushi: 0.2, oyster: 0.3, ebi: 1.4, lure: 2.0, dango: 0.1 },
    fight: { power: 0.75, stamina: 0.70, erratic: 1.0 },
    price: 1800,
    desc: '体色が絶えず変化し、7色の虹模様を呈するアオリイカの変異個体。光の速さで色を変えながら泳ぐ姿は海中の宝石。釣り人の間では「虹イカに会った日はジャンボ宝くじを買え」という都市伝説が流布している。墨は虹色で、コレクターに高値で取引されるとも。',
    model: {
      profile: 'squid',
      bodyH: 0.30, bodyW: 0.18,
      snout: 'pointed',
      tail: 'pointed',
      dorsal: { start: 0.10, end: 0.85, h: 0.14, spiny: false },
      anal:   { start: 0.10, end: 0.85, h: 0.14 },
      pectoral: 0.22,
      colors: { back: '#8020c0', base: '#c040e0', belly: '#e080ff', fins: '#a030d0', eye: '#200030' },
      pattern: { type: 'speckle', color: '#ffff00', count: 24, opacity: 0.70 },
      sheen: 0.90,
      special: 'glow'
    }
  },

  // F6. 古代甲冑魚
  {
    id: 'ancient_armor_fish',
    name: '古代甲冑魚',
    nameEn: 'Ancient Armored Fish',
    category: 'fantasy',
    rarity: 4,
    minSize: 40, maxSize: 90,
    weight: { wA: 0.040, wB: 3.3 },
    habitat: ['bottom'],
    active: ['day', 'dusk'],
    baitPref: { mushi: 0.8, oyster: 1.8, ebi: 1.0, lure: 0.5, dango: 0.9 },
    fight: { power: 0.88, stamina: 0.90, erratic: 0.45 },
    price: 2500,
    desc: '3億年前のデボン紀に生きた板皮類(プラコダーム)の生き残りとされる深海の化石魚。重厚な骨質甲冑で全身を覆い、その重量感ある引きは一度体験すると忘れられない。学術的価値は計り知れず、釣り上げた際はリリース推奨だが、コインも破格の高額が入る。',
    model: {
      profile: 'standard',
      bodyH: 0.38, bodyW: 0.20,
      snout: 'blunt',
      tail: 'truncate',
      dorsal: { start: 0.24, end: 0.58, h: 0.14, spiny: true },
      anal:   { start: 0.58, end: 0.74, h: 0.09 },
      pectoral: 0.20,
      colors: { back: '#4a5030', base: '#6a7048', belly: '#909870', fins: '#585e38', eye: '#181c10' },
      pattern: { type: 'marble', color: '#2a3018', count: 18, opacity: 0.65 },
      sheen: 0.08,
      special: 'horn'
    }
  }
];

const SPECIES_BY_ID = Object.fromEntries(SPECIES.map(s => [s.id, s]));
