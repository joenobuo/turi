# チヌ釣り三昧 〜磯の主を求めて〜 設計書

一人称視点のリアル調3D磯釣りゲーム。Three.js (r160, CDN importmap) を使い、
最終成果物は **単一の index.html**(ビルドで生成)。日本語UI。

## ビルド / ファイル構成

```
src/00_species.js   魚種データ(38種以上)
src/01_fishmodel.js プロシージャル魚メッシュ生成
src/02_ocean.js     海面・空・環境(磯場)
src/03_tackle.js    タックル(竿/リール/仕掛け/エサ)データ
src/04_game.js      ゲームロジック(状態機械・ファイト・抽選・セーブ)
src/05_ui.js        UI全部(HUD/図鑑/タックル/結果/タイトル)
src/06_main.js      起動・カメラ・竿モデル・メインループ
style.css           全CSS
build.js            node build.js → index.html を生成
```

ビルドは src/*.js を番号順に連結し、1つの `<script type="module">` に
`import * as THREE from 'three';` の直後に埋め込む。
**よって全ファイルは同一モジュールスコープを共有する。`import`/`export` 文は書くな。**
THREE はそのまま使える。トップレベル宣言はモジュールごとの接頭辞で衝突回避:
`SPECIES_*` / `Fish*` / `Ocean*`,`Env*` / `TACKLE_*`,`Rig*` / `Game*` / `UI*` / main は `App*`。

HTML本体は `<div id="ui-root"></div>` のみ。canvas は renderer が append、
UI DOM は ui-root 配下に JS で生成する。CSSは style.css に書く(ビルドでインライン化)。

## 品質基準(全エージェント必読)

- ビジュアルはリアル調。「箱と円錐を組み合わせた」感のあるローポリ表現は **絶対NG**。
- 魚は断面スイープによる滑らかな連続メッシュ + Canvas生成テクスチャ。フラットシェーディング禁止。
- 海はGerstner波シェーダ。renderer は ACESFilmicToneMapping / sRGB。
- 60fps目標。ジオメトリ生成は使い回し、毎フレームの new を避ける。

---

## 00_species.js — 契約

```js
const SPECIES = [ {…}, … ];                 // 38種以上
const SPECIES_BY_ID = Object.fromEntries(SPECIES.map(s=>[s.id,s]));
```

種オブジェクトのスキーマ(全フィールド必須):

```js
{
  id: 'chinu', name: 'チヌ(クロダイ)', nameEn: 'Black seabream',
  category: 'normal' | 'fantasy',      // fantasy = 架空生物(6種以上)
  rarity: 1..5,                        // 1=雑魚 5=超レア。チヌはrarity1-2で最頻出
  minSize: 15, maxSize: 60,            // cm
  weight: (sizeCm)=>kg を表す係数 wA, wB,  // kg = wA*(size/10)^wB 用の数値2つ
  habitat: ['bottom'|'mid'|'surface'], // 棚
  active: ['day'|'dusk'|'night'],      // 時間帯(ゲーム内時間)
  baitPref: { mushi:1.2, oyster:1.5, ebi:1.0, lure:0.6, dango:1.4 }, // 5種全部
  fight: { power: 0..1, stamina: 0..1, erratic: 0..1 },
  price: 100,                          // サイズ1cmあたりの基準コイン
  desc: '図鑑解説文。2〜3文、日本語、釣り人目線の蘊蓄。',
  model: { /* 下記 */ }
}
```

`model` スキーマ(01_fishmodel.js が解釈。全フィールド必須):

```js
{
  profile: 'standard'|'deep'|'slender'|'flat'|'eel'|'round'|'squid',
    // deep=タイ型(体高大) slender=サヨリ等 flat=ヒラメ eel=ウナギ型 round=フグ squid=イカタコ
  bodyH: 0.30,  bodyW: 0.13,           // 体長比の体高・体幅
  snout: 'blunt'|'pointed'|'long',
  tail: 'forked'|'rounded'|'truncate'|'lunate'|'pointed',
  dorsal: { start:0.28, end:0.62, h:0.10, spiny:true },  // 体長比
  anal:   { start:0.60, end:0.78, h:0.07 },
  pectoral: 0.16,                      // 胸鰭の大きさ(体長比)
  colors: { back:'#2e3338', base:'#8a8f96', belly:'#e9e9e4', fins:'#5a5d60', eye:'#1a1a1a' },
  pattern: { type:'none'|'vbars'|'hstripes'|'spots'|'speckle'|'marble',
             color:'#222', count:6, opacity:0.5 },
  sheen: 0.6,                          // 金属光沢(銀皮)0..1
  special: null | 'whiskers'|'glow'|'horn'|'tentacles'|'crown'|'ghost',  // 主に架空種
}
```

必須収録: チヌ, キビレ, マダイ, メジナ, シーバス(スズキ), アジ, サバ, イワシ, カサゴ,
メバル, アイナメ, カワハギ, ベラ(キュウセン), シロギス, ハゼ, ボラ, サヨリ, タチウオ,
ヒラメ, マゴチ, アナゴ, ウツボ, クサフグ, アオリイカ, マダコ, イシダイ, イシガキダイ,
イサキ, カンパチ, ブリ, コノシロ, ウミタナゴ, アカエイ, ゴンズイ + 架空6種以上
(例: 黄金チヌ, 龍宮の幼竜, 提灯深海魚, 磯の人面魚, 虹色イカ, 古代甲冑魚 など自由に)。

## 01_fishmodel.js — 契約

```js
function FishCreateMesh(species, sizeCm) => THREE.Group
  // .userData = { update(t): 泳ぎ/尾びれスウェイ更新 } を持たせる
function FishUpdateAll(t)   // 生成済み全個体の update を呼ぶ(内部レジストリ管理、dispose対応)
function FishDispose(group)
```

実装指針: 中心スプラインに沿った楕円断面スイープ(縦24×周16以上)で胴体を1枚の
BufferGeometry に。UVは (沿軸u, 周v)。Canvas 512x256 でテクスチャ生成:
背→腹のグラデ + pattern描画 + 鱗の微細ノイズ。MeshPhysicalMaterial
(metalness=sheen*0.5, roughness=0.35, clearcoat) 。鰭は Shape+ExtrudeGeometry(薄く)
または平面で半透明 DoubleSide。目は球+ハイライト。尾の左右スウェイは
頂点シェーダ注入(onBeforeCompile, uTime, 軸方向で振幅増)で行う。
profile ごとに断面・スプラインを変える。squid は外套+8本以上の脚(TubeGeometry)。
special 演出: glow=emissive+点光, ghost=半透明, など。

## 02_ocean.js — 契約

```js
function EnvCreate(scene, renderer) => env
env.update(t, dt)
env.getWaveHeight(x, z, t)   // シェーダと同一のGerstner和をCPUで計算(ウキ同期用)
env.water, env.sunLight, env.setTimeOfDay(p)  // p:0..1 (0=朝,0.5=夕,0.75=夜) 空/光を変化
```

内容: Gerstner波4成分以上のカスタムシェーダ海面(法線も解析的に)、フレネル反射色、
泡/スペキュラ。空は ShaderMaterial グラデ半球+太陽。磯場: 足元の岩礁
(変位ノイズをかけた滑らかな岩、テトラ等。プリミティブ丸出しNG)。遠景に岬のシルエット。
霧 scene.fog。海中をほのめかす濁り。カモメ(任意)。

## 03_tackle.js — 契約

```js
const TACKLE_RODS  = [ {id,name,desc,price, power:1..5, control:1..5} ];   // 5本以上
const TACKLE_REELS = [ {id,name,desc,price, drag:1..5, speed:1..5} ];      // 4台以上
const TACKLE_RIGS  = [ {id,name,desc,price, type:'uki'|'bottom'|'lure', depth:'surface'|'mid'|'bottom', hookSize:1..5} ]; // 5種以上
const TACKLE_BAITS = [ {id:'mushi'|'oyster'|'ebi'|'lure'|'dango', name, desc, price} ]; // 5種ちょうど(baitPrefのキーと一致)
```

最初の所持: 各カテゴリの最安品。以降は釣果コインでショップ購入。

## 04_game.js — 契約

```js
class GameCore {
  constructor(env, ui)            // ui は UIController
  state                           // 'title'|'idle'|'casting'|'waiting'|'bite'|'fight'|'landed'
  update(t, dt)
  // 入力(mainが転送): pressStart(), pressEnd(), 図鑑等のUI操作はUI側がGameCoreのメソッドを呼ぶ
  save / load                     // localStorage 'turi-save-v1'
  records                         // { speciesId: {count, maxSize} }
  coins, equipped:{rod,reel,rig,bait}, owned:{rods:[],reels:[],rigs:[]}
  floatObj                        // ウキ/ルアーの THREE.Object3D(mainが見る)
  hookedFish                      // ファイト中 {species,sizeCm,mesh?}
  lineTension 0..1, fishDistance, fishStamina   // HUD用
  timeOfDay 0..1                  // ゆっくり進行、env.setTimeOfDay に反映
}
```

フロー:
- idle: 長押しでキャストパワーメーター(UI)、離すとcasting→ウキ着水→waiting
- waiting: 抽選タイマー(10〜30s、エサ/棚/時間帯/レア度で重み付け)。前アタリ(ウキがピクッ)
  → 本アタリ(ウキ消し込み+SE)。本アタリ中(約1.2s)に pressStart でフッキング→fight。
  逃すと waiting 継続/エサ取られ。
- fight: 押している間リール(距離減・テンション増)、離すとテンション減・魚が走ると距離増。
  魚は stamina が減ると弱る。erratic で突発の走り。tension>1 でライン破断、
  距離0でランディング→landed(UIに結果、コイン加算、記録更新、save)。
  竿powerとリールdragでテンション余裕が変わる。
- 抽選: habitat と rig.depth の一致、baitPref、active と timeOfDay、rarity で重み。
  fantasy種は低確率(合計2%程度、夜やレア餌で微増)。
- WebAudio で簡易SE(着水スプラッシュ、ドラグ音、アタリ音、ファンファーレ)を合成生成。

## 05_ui.js — 契約

```js
class UIController {
  constructor(root)        // ui-root要素
  bind(game)               // GameCore 連携
  // 画面: タイトル / HUD(テンションバー,距離,状態,時刻,コイン,操作ガイド) /
  //       キャストパワーメーター / アタリ表示(「!」) /
  //       釣果モーダル(魚名,サイズ,重量,新記録,コイン) /
  //       図鑑(グリッド。未捕獲はシルエット???、捕獲済は色付き+最大記録+解説) /
  //       タックル画面(装備変更+ショップ購入タブ) / 一時メニュー
  showCatch(species,sizeCm,weightKg,coins,isNew,isRecord)
  setHUD({state,tension,distance,stamina,coins,time,speciesHint})
  showBite(level)          // 0=なし 1=前アタリ 2=本アタリ
  openDex()/openTackle()/openTitle() …
}
```

デザイン: 落ち着いた和モダン(深紺/生成り/朱のアクセント)。游明朝/serif系見出し。
半透明パネル+backdrop-filter。スマホでも崩れない最低限のレスポンシブ。

## 06_main.js — 契約

- renderer(ACESFilmic, sRGB, shadow), camera: 磯の上 eye高さ~1.6m。
- マウスドラッグ/タッチで視点(ヨー±60°,ピッチ±30°)。クリック長押し=ゲーム入力
  (UIパネル上は除外)。
- 一人称の竿: 画面右下から伸びる滑らかなテーパーTube(CatmullRomを毎フレーム曲げ更新、
  テンションで曲がる)+リール(Lathe+ハンドル等ディテール)+ガイドリング。
  ラインは竿先→ウキ/魚への QuadraticBezier を Line で。
- ウキ: env.getWaveHeight で波に同期して浮き、アタリで沈む(game側の値を反映)。
- 雰囲気: 水面下に小魚の群れ(FishCreateMeshの小型個体を数匹回遊)、ファイト中は
  魚影が水面下に見え、ランディングで魚メッシュをカメラ前に掲げて見せる。
- ループ: env.update → game.update → FishUpdateAll → render。resize対応。
```
