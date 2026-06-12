// 04_game.js — GameCore
// トップレベル宣言: Game* のみ
// import/export 禁止。THREE はスコープにある前提。

/* ============================================================
   WebAudio SE 合成ユーティリティ
   ============================================================ */
var GameAudioCtx = null;

function GameGetAudioCtx() {
  if (!GameAudioCtx) {
    try {
      GameAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch(e) { GameAudioCtx = null; }
  }
  return GameAudioCtx;
}

// gain は 0..1
function GamePlaySplash(muted) {
  if (muted) return;
  var ctx = GameGetAudioCtx(); if (!ctx) return;
  var buf = ctx.createBuffer(1, ctx.sampleRate * 0.4, ctx.sampleRate);
  var data = buf.getChannelData(0);
  for (var i = 0; i < data.length; i++) {
    var t = i / ctx.sampleRate;
    data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 18) * 0.6;
  }
  var src = ctx.createBufferSource();
  src.buffer = buf;
  var g = ctx.createGain(); g.gain.value = 0.5;
  src.connect(g); g.connect(ctx.destination);
  src.start();
}

function GamePlayDrag(muted) {
  if (muted) return;
  var ctx = GameGetAudioCtx(); if (!ctx) return;
  var dur = 0.35;
  var osc = ctx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(320, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + dur);
  var g = ctx.createGain();
  g.gain.setValueAtTime(0.18, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
  osc.connect(g); g.connect(ctx.destination);
  osc.start(); osc.stop(ctx.currentTime + dur);
}

function GamePlayBite(muted) {
  if (muted) return;
  var ctx = GameGetAudioCtx(); if (!ctx) return;
  var osc = ctx.createOscillator();
  osc.type = 'square';
  osc.frequency.setValueAtTime(880, ctx.currentTime);
  osc.frequency.setValueAtTime(440, ctx.currentTime + 0.05);
  var g = ctx.createGain();
  g.gain.setValueAtTime(0.22, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
  osc.connect(g); g.connect(ctx.destination);
  osc.start(); osc.stop(ctx.currentTime + 0.2);
}

function GamePlayFanfare(muted) {
  if (muted) return;
  var ctx = GameGetAudioCtx(); if (!ctx) return;
  var notes = [523, 659, 784, 1047];
  for (var i = 0; i < notes.length; i++) {
    (function(freq, offset) {
      var osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      var g = ctx.createGain();
      g.gain.setValueAtTime(0, ctx.currentTime + offset);
      g.gain.linearRampToValueAtTime(0.25, ctx.currentTime + offset + 0.04);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + 0.28);
      osc.connect(g); g.connect(ctx.destination);
      osc.start(ctx.currentTime + offset);
      osc.stop(ctx.currentTime + offset + 0.3);
    })(notes[i], i * 0.12);
  }
}

/* ============================================================
   抽選ヘルパー
   ============================================================ */
function GameTimeSlot(p) {
  // p: 0..1  0=朝, 0.25=昼, 0.5=夕, 0.7=夜
  if (p >= 0.65 && p < 0.95) return 'night';
  if (p >= 0.45 && p < 0.65) return 'dusk';
  return 'day';
}

function GameCalcWeight(species, sizeCm) {
  var wA = species.weight.wA;
  var wB = species.weight.wB;
  return wA * Math.pow(sizeCm / 10, wB);
}

function GameRandRange(lo, hi) {
  return lo + Math.random() * (hi - lo);
}

/* ============================================================
   GameCore
   ============================================================ */
class GameCore {
  constructor(env, ui) {
    this._env = env;
    this._ui  = ui;

    // --- 状態 ---
    this.state = 'title'; // title|idle|casting|waiting|bite|fight|landed

    // --- 時間帯 (0..1、実時間4分で一周) ---
    this.timeOfDay = 0.1;  // 朝から始まる
    this._TOD_PERIOD = 240; // 秒

    // --- キャスト ---
    this._castPower   = 0;
    this._pressing    = false;
    this._castChargeT = 0;

    // --- ウキ ---
    this.floatObj = null;
    this._floatSinkTarget = 0;   // 0=浮, 1=消し込み
    this._floatSinkCur    = 0;
    this._bitePreTick     = 0;
    this._bitePreActive   = false;

    // --- 待ちタイマー ---
    this._waitTimer    = 0;
    this._waitDuration = 20;
    this._biteWindow   = 0;   // 本アタリ受付秒数
    this._biteState    = 0;   // 0=なし 1=前アタリ 2=本アタリ

    // --- ファイト ---
    this.lineTension  = 0;
    this.fishDistance = 30;
    this.fishStamina  = 1;
    this.hookedFish   = null;
    this._erraticT    = 0;

    // --- ランディング ---
    this._landedTimer = 0;
    this._catchShown  = false;

    // --- コイン/タックル/記録 ---
    this.coins    = 500;
    this.records  = {};
    this.equipped = { rod: 'rod_tanago', reel: 'reel_sazanami', rig: 'rig_tanuki_uki', bait: 'mushi' };
    this.owned    = { rods: ['rod_tanago'], reels: ['reel_sazanami'], rigs: ['rig_tanuki_uki'] };

    // --- サウンド ---
    this._muted = false;

    // --- ウキ THREE.Object3D ---
    this._initFloat();

    // --- ロード ---
    this.load();
  }

  /* ---------- ウキ初期化 ---------- */
  _initFloat() {
    if (this.floatObj) {
      if (this.floatObj.parent) this.floatObj.parent.remove(this.floatObj);
    }
    var g = new THREE.Group();
    // 細長い楕円ウキ
    var geo = new THREE.SphereGeometry(0.08, 10, 7);
    geo.scale(0.8, 3.0, 0.8);
    var mat = new THREE.MeshStandardMaterial({ color: 0xff4422, roughness: 0.5, metalness: 0.0 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    g.add(mesh);
    // 下部アンテナ
    var aGeo = new THREE.CylinderGeometry(0.012, 0.006, 0.35, 6);
    var aMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8 });
    var ant = new THREE.Mesh(aGeo, aMat);
    ant.position.y = -0.32;
    g.add(ant);
    g.position.set(0, 0.25, -18);
    this.floatObj = g;
  }

  /* ---------- save/load ---------- */
  save() {
    try {
      var data = {
        coins:    this.coins,
        records:  this.records,
        equipped: this.equipped,
        owned:    this.owned,
        muted:    this._muted
      };
      localStorage.setItem('turi-save-v1', JSON.stringify(data));
    } catch(e) {}
  }

  load() {
    try {
      var raw = localStorage.getItem('turi-save-v1');
      if (!raw) return;
      var data = JSON.parse(raw);
      if (data.coins    !== undefined) this.coins    = data.coins;
      if (data.records  !== undefined) this.records  = data.records;
      if (data.equipped !== undefined) this.equipped = data.equipped;
      if (data.owned    !== undefined) this.owned    = data.owned;
      if (data.muted    !== undefined) this._muted   = data.muted;
    } catch(e) {}
  }

  /* ---------- 入力 ---------- */
  pressStart() {
    if (this.state === 'idle') {
      this._pressing    = true;
      this._castChargeT = 0;
      this._castPower   = 0;
    } else if (this.state === 'bite') {
      // 本アタリ中にフッキング
      if (this._biteState === 2) {
        this._startFight();
      }
    } else if (this.state === 'fight') {
      this._pressing = true;
    }
  }

  pressEnd() {
    if (this.state === 'casting' || (this.state === 'idle' && this._pressing)) {
      // まだ idle で離した = キャスト実行
      if (this._pressing && this.state === 'idle') {
        this._doCast();
      }
      this._pressing = false;
    } else if (this.state === 'fight') {
      this._pressing = false;
    }
  }

  /* ---------- ゲーム開始(タイトル→idle) ---------- */
  startGame() {
    this.state = 'idle';
    if (this._ui) this._ui.setHUD({ state: 'idle', tension: 0, distance: 0, stamina: 1,
      coins: this.coins, time: this.timeOfDay, speciesHint: null });
    // floatObj をシーンから一旦外しておく(mainが管理)
  }

  /* ---------- メニュー再開 ---------- */
  resume() {
    // メニューから戻るだけ
  }

  /* ---------- サウンドトグル ---------- */
  toggleSound() {
    this._muted = !this._muted;
    this.save();
  }

  /* ---------- equip ---------- */
  equip(cat, id) {
    if (cat === 'rod')  { if (this.owned.rods.indexOf(id)   >= 0) this.equipped.rod  = id; }
    if (cat === 'reel') { if (this.owned.reels.indexOf(id)  >= 0) this.equipped.reel = id; }
    if (cat === 'rig')  { if (this.owned.rigs.indexOf(id)   >= 0) this.equipped.rig  = id; }
    if (cat === 'bait') { this.equipped.bait = id; }
    this.save();
  }

  /* ---------- buy ---------- */
  buy(cat, id) {
    var lists = { rod: TACKLE_RODS, reel: TACKLE_REELS, rig: TACKLE_RIGS, bait: TACKLE_BAITS };
    var list = lists[cat]; if (!list) return false;
    var item = null;
    for (var i = 0; i < list.length; i++) { if (list[i].id === id) { item = list[i]; break; } }
    if (!item) return false;
    if (this.coins < item.price) return false;
    this.coins -= item.price;
    if (cat === 'rod'  && this.owned.rods.indexOf(id)  < 0) this.owned.rods.push(id);
    if (cat === 'reel' && this.owned.reels.indexOf(id) < 0) this.owned.reels.push(id);
    if (cat === 'rig'  && this.owned.rigs.indexOf(id)  < 0) this.owned.rigs.push(id);
    this.save();
    return true;
  }

  /* ---------- 釣果モーダル閉じる ---------- */
  dismissCatch() {
    this._catchShown = false;
    this._goIdle();
  }

  /* ============================================================
     メインアップデート
     ============================================================ */
  update(t, dt) {
    // 時間帯進行
    this.timeOfDay = (this.timeOfDay + dt / this._TOD_PERIOD) % 1;
    if (this._env && this._env.setTimeOfDay) this._env.setTimeOfDay(this.timeOfDay);

    switch (this.state) {
      case 'title':   this._updateTitle(t, dt);   break;
      case 'idle':    this._updateIdle(t, dt);    break;
      case 'casting': this._updateCasting(t, dt); break;
      case 'waiting': this._updateWaiting(t, dt); break;
      case 'bite':    this._updateBite(t, dt);    break;
      case 'fight':   this._updateFight(t, dt);   break;
      case 'landed':  this._updateLanded(t, dt);  break;
    }

    // ウキの波同期
    this._updateFloat(t, dt);

    // HUD更新
    if (this._ui && this.state !== 'title') {
      this._ui.setHUD({
        state:       this.state,
        tension:     this.lineTension,
        distance:    this.fishDistance,
        stamina:     this.fishStamina,
        coins:       this.coins,
        time:        this.timeOfDay,
        speciesHint: (this.hookedFish && this.hookedFish.species) ? this.hookedFish.species.name : null
      });
    }
  }

  /* ---------- 各状態 ---------- */
  _updateTitle(t, dt) {}

  _updateIdle(t, dt) {
    if (this._pressing) {
      this._castChargeT += dt;
      this._castPower = Math.min(1, this._castChargeT / 2.0);
      if (this._ui) this._ui.setCastPower(this._castPower);
      if (this._castChargeT >= 2.2) {
        // 満杯で自動キャスト
        this._doCast();
      }
    } else {
      if (this._castPower > 0) {
        this._castPower = 0;
        if (this._ui) this._ui.setCastPower(0);
      }
    }
  }

  _doCast() {
    this._pressing = false;
    this.state = 'casting';
    var power = Math.max(0.15, this._castPower);
    this._castPower = 0;
    if (this._ui) this._ui.setCastPower(0);
    // キャスト距離: 10m〜40m
    var dist = 10 + power * 30;
    this.floatObj.position.set(
      (Math.random() - 0.5) * dist * 0.4,
      5,
      -dist
    );
    this._castingT = 0;
    this._castingDist = dist;
  }

  _updateCasting(t, dt) {
    this._castingT += dt;
    if (this._castingT >= 0.8) {
      // 着水
      this.state = 'waiting';
      GamePlaySplash(this._muted);
      this._startWaiting();
    }
  }

  _startWaiting() {
    // 抽選タイマー: 10〜30s
    this._waitTimer    = 0;
    this._waitDuration = 10 + Math.random() * 20;
    this._biteState    = 0;
    this._bitePreActive = false;
    this._floatSinkTarget = 0;
    if (this._ui) this._ui.showBite(0);
  }

  _updateWaiting(t, dt) {
    this._waitTimer += dt;

    // 前アタリ (70% of duration)
    if (!this._bitePreActive && this._waitTimer >= this._waitDuration * 0.7) {
      this._bitePreActive = true;
      this._bitePreTick   = 0;
      this._biteState     = 1;
      if (this._ui) this._ui.showBite(1);
      this._floatSinkTarget = 0.35; // ピクッ
    }

    // 前アタリのピクッは短時間で戻す
    if (this._bitePreActive && this._biteState === 1) {
      this._bitePreTick += dt;
      if (this._bitePreTick > 0.6) {
        this._floatSinkTarget = 0;
        if (this._bitePreTick > 1.2) this._biteState = 0;
      }
    }

    if (this._waitTimer >= this._waitDuration) {
      // 本アタリ
      this.state = 'bite';
      this._biteState = 2;
      this._floatSinkTarget = 1.0;
      this._biteWindow = 0;
      GamePlayBite(this._muted);
      if (this._ui) this._ui.showBite(2);
    }
  }

  _updateBite(t, dt) {
    this._biteWindow += dt;
    if (this._biteWindow > 1.2) {
      // 逃した
      this._biteState = 0;
      this._floatSinkTarget = 0;
      if (this._ui) this._ui.showBite(0);
      // エサ取られる確率30%
      var baitTaken = Math.random() < 0.3;
      if (baitTaken) {
        // ウキを回収して再キャスト促す
        this._goIdle();
      } else {
        this.state = 'waiting';
        this._startWaiting();
      }
    }
  }

  _startFight() {
    // 魚抽選
    var fish = this._drawFish();
    if (!fish) { this._goIdle(); return; }
    this.hookedFish = fish;
    this.state = 'fight';
    this._pressing = false;
    this.lineTension  = 0.2;
    this.fishDistance = 15 + Math.random() * 20;
    this.fishStamina  = fish.species.fight.stamina;
    this._erraticT    = 0;
    this._floatSinkTarget = 1.0;
    if (this._ui) this._ui.showBite(0);
  }

  _updateFight(t, dt) {
    var fish    = this.hookedFish;
    var sp      = fish.species;
    var rod     = this._getRod();
    var reel    = this._getReel();
    var powerFactor  = 0.4 + rod.power  * 0.12;
    var dragFactor   = 0.3 + reel.drag  * 0.10;

    // スタミナ減少
    this.fishStamina = Math.max(0, this.fishStamina - dt * 0.04);

    // erratic走り
    this._erraticT += dt;
    var erraticThresh = 2.5 - sp.fight.erratic * 1.5;
    var rushing = false;
    if (this._erraticT > erraticThresh && Math.random() < sp.fight.erratic * dt * 1.5) {
      this._erraticT = 0;
      rushing = true;
      GamePlayDrag(this._muted);
    }

    if (this._pressing) {
      // リール中: 距離減、テンション増
      var reelSpeed  = (reel.speed / 5) * 4;
      var reduction  = reelSpeed * dt * (0.3 + this.fishStamina * 0.7);
      this.fishDistance = Math.max(0, this.fishDistance - reduction);
      this.lineTension  = Math.min(1.2, this.lineTension + dt * (sp.fight.power * powerFactor + 0.15));
    } else {
      // テンション下がる
      this.lineTension = Math.max(0, this.lineTension - dt * dragFactor);
    }

    if (rushing) {
      this.fishDistance += sp.fight.power * (3 + Math.random() * 4);
      this.lineTension   = Math.min(1.1, this.lineTension + 0.25);
    }

    // テンション超過 = ライン破断
    if (this.lineTension > 1.0) {
      this._lineBreak();
      return;
    }

    // 距離0 = ランディング
    if (this.fishDistance <= 0) {
      this.fishDistance = 0;
      this._doLanding();
      return;
    }

    // 時間経過で魚が弱る
    if (this.fishStamina <= 0) {
      this.fishDistance = Math.max(0, this.fishDistance - dt * 6);
      if (this.fishDistance <= 0) { this._doLanding(); return; }
    }
  }

  _lineBreak() {
    this.hookedFish = null;
    this.lineTension = 0;
    this._floatSinkTarget = 0;
    this._goIdle();
  }

  _doLanding() {
    this.state = 'landed';
    this._landedTimer = 0;
    this._catchShown  = false;
    this.lineTension  = 0;
    this._floatSinkTarget = 0;
  }

  _updateLanded(t, dt) {
    this._landedTimer += dt;
    if (!this._catchShown && this._landedTimer > 0.5) {
      this._catchShown = true;
      var fish = this.hookedFish;
      if (fish) {
        var sp      = fish.species;
        var sizeCm  = fish.sizeCm;
        var wt      = GameCalcWeight(sp, sizeCm);
        // コイン計算: price×サイズ比×レア倍率
        var sizeRatio  = sizeCm / ((sp.minSize + sp.maxSize) / 2);
        var rareMult   = 1 + (sp.rarity - 1) * 0.4;
        var coins      = Math.round(sp.price * sizeCm * sizeRatio * rareMult * 0.1);
        this.coins += coins;
        // records
        var isNew    = false;
        var isRecord = false;
        if (!this.records[sp.id]) {
          this.records[sp.id] = { count: 0, maxSize: 0 };
          isNew = true;
        }
        this.records[sp.id].count++;
        if (sizeCm > this.records[sp.id].maxSize) {
          this.records[sp.id].maxSize = sizeCm;
          if (!isNew) isRecord = true;
        }
        this.save();
        GamePlayFanfare(this._muted);
        if (this._ui) this._ui.showCatch(sp, sizeCm, wt, coins, isNew, isRecord);
      }
    }
  }

  /* ---------- floatObj 更新 ---------- */
  _updateFloat(t, dt) {
    if (!this.floatObj) return;
    var fo = this.floatObj;

    // 沈み補間
    this._floatSinkCur += (this._floatSinkTarget - this._floatSinkCur) * Math.min(1, dt * 5);

    if (this.state === 'casting' || this.state === 'idle' || this.state === 'title') {
      // 水面下に隠す
      fo.visible = false;
      return;
    }
    fo.visible = true;

    // 波高さ同期
    var wh = 0;
    if (this._env && this._env.getWaveHeight) {
      wh = this._env.getWaveHeight(fo.position.x, fo.position.z, t);
    }
    fo.position.y = wh + 0.18 - this._floatSinkCur * 0.6;

    // ウキの揺れ
    if (this._bitePreActive && this._biteState === 1) {
      fo.position.y += Math.sin(t * 18) * 0.05 * this._floatSinkTarget;
    }
  }

  /* ---------- 魚抽選 ---------- */
  _drawFish() {
    var slot    = GameTimeSlot(this.timeOfDay);
    var rigData = this._getRig();
    var baitId  = this.equipped.bait;
    var rigDepth = rigData ? rigData.depth : 'mid';

    var weighted = [];
    var total    = 0;

    for (var i = 0; i < SPECIES.length; i++) {
      var sp = SPECIES[i];
      var w  = 1.0;

      // 棚一致
      var habitatMatch = false;
      for (var h = 0; h < sp.habitat.length; h++) {
        if (sp.habitat[h] === rigDepth) { habitatMatch = true; break; }
      }
      if (!habitatMatch) w *= 0.1;

      // baitPref
      var pref = sp.baitPref[baitId] !== undefined ? sp.baitPref[baitId] : 1.0;
      w *= pref;

      // 時間帯
      var timeMatch = false;
      for (var a = 0; a < sp.active.length; a++) {
        if (sp.active[a] === slot) { timeMatch = true; break; }
      }
      if (!timeMatch) w *= 0.25;

      // rarity (高いほど出にくい)
      var rarityFactor = Math.pow(0.45, sp.rarity - 1);
      w *= rarityFactor;

      // fantasy 合計約2% → さらに抑制
      if (sp.category === 'fantasy') {
        w *= 0.04;
        // 夜は微増
        if (slot === 'night') w *= 1.8;
      }

      if (w > 0) {
        weighted.push({ sp: sp, w: w });
        total += w;
      }
    }

    if (total === 0 || weighted.length === 0) return null;

    var r = Math.random() * total;
    var cum = 0;
    var chosen = weighted[0].sp;
    for (var j = 0; j < weighted.length; j++) {
      cum += weighted[j].w;
      if (r <= cum) { chosen = weighted[j].sp; break; }
    }

    var sizeCm = GameRandRange(chosen.minSize, chosen.maxSize);
    return { species: chosen, sizeCm: sizeCm };
  }

  /* ---------- タックル取得ヘルパー ---------- */
  _getRod() {
    for (var i = 0; i < TACKLE_RODS.length; i++) {
      if (TACKLE_RODS[i].id === this.equipped.rod) return TACKLE_RODS[i];
    }
    return TACKLE_RODS[0];
  }
  _getReel() {
    for (var i = 0; i < TACKLE_REELS.length; i++) {
      if (TACKLE_REELS[i].id === this.equipped.reel) return TACKLE_REELS[i];
    }
    return TACKLE_REELS[0];
  }
  _getRig() {
    for (var i = 0; i < TACKLE_RIGS.length; i++) {
      if (TACKLE_RIGS[i].id === this.equipped.rig) return TACKLE_RIGS[i];
    }
    return TACKLE_RIGS[0];
  }

  /* ---------- idle 遷移 ---------- */
  _goIdle() {
    this.state = 'idle';
    this.lineTension  = 0;
    this.fishDistance = 0;
    this.fishStamina  = 1;
    this.hookedFish   = null;
    this._pressing    = false;
    this._biteState   = 0;
    this._floatSinkTarget = 0;
    this._floatSinkCur    = 0;
    if (this.floatObj) this.floatObj.visible = false;
  }
}
