/* ============================================================
   05_ui.js — UIController
   チヌ釣り三昧 UI 全実装
   import/export 禁止。トップレベル接頭辞: UI*
   ============================================================ */

/* ---------- SVGシルエット生成ヘルパー ---------- */

/**
 * 魚種の model.profile / model.tail などから簡易 SVG パス文字列を生成。
 * @param {object} species  SPECIES エントリ
 * @param {boolean} filled  未捕獲=true(グレー塗りつぶし)
 * @param {number} w 横幅px
 * @param {number} h 縦幅px
 * @returns {string} <svg>…</svg> 文字列
 */
function UIBuildFishSVG(species, filled, w, h) {
  w = w || 80;
  h = h || 52;
  var m = (species && species.model) ? species.model : {};
  var profile = m.profile || 'standard';
  var tail    = m.tail    || 'forked';
  var bodyH   = m.bodyH  || 0.30;
  var bodyW   = m.bodyW  || 0.13;
  var isCat   = species && species.category === 'fantasy';

  // 輪郭色
  var strokeColor = filled ? '#666' : (isCat ? '#a03cdc' : '#44aa77');
  var fillColor   = filled ? '#444' : (m.colors ? (m.colors.base || '#6a8fa0') : '#6a8fa0');

  // --- ボディ楕円ベース (cx=w*0.42, cy=h*0.50) ---
  var cx = w * 0.42;
  var cy = h * 0.50;
  var rx = w * 0.34;
  var ry = h * (bodyH * 1.6);
  if (ry < 8) ry = 8;

  // profile別調整
  if (profile === 'deep') { ry *= 1.3; rx *= 0.9; }
  if (profile === 'slender') { ry *= 0.55; rx *= 1.0; }
  if (profile === 'flat') { ry *= 0.75; }
  if (profile === 'eel') { rx *= 1.2; ry *= 0.45; }
  if (profile === 'round') { ry *= 1.15; rx *= 0.88; }
  if (profile === 'squid') { ry *= 1.1; rx *= 0.8; }

  // 吻
  var snoutX = cx + rx + (profile === 'slender' ? w * 0.18 : w * 0.06);
  var snoutY = cy;

  // 尾部基点
  var tailBaseX = cx - rx;

  // 尾ひれ
  var tailPath = '';
  if (profile === 'squid') {
    // イカっぽい
    var t1x = tailBaseX - w * 0.15;
    var t1ya = cy - ry * 0.6;
    var t1yb = cy + ry * 0.6;
    tailPath = 'M ' + tailBaseX + ' ' + (cy - ry * 0.3)
      + ' Q ' + (tailBaseX - w*0.10) + ' ' + t1ya + ' ' + t1x + ' ' + t1ya
      + ' L ' + t1x + ' ' + t1yb
      + ' Q ' + (tailBaseX - w*0.10) + ' ' + t1yb + ' ' + tailBaseX + ' ' + (cy + ry * 0.3)
      + ' Z';
  } else if (tail === 'forked' || tail === 'lunate') {
    var spread = (tail === 'lunate') ? ry * 1.0 : ry * 0.75;
    var notchX = tailBaseX - w * 0.08;
    var tipX   = tailBaseX - w * (tail === 'lunate' ? 0.18 : 0.14);
    tailPath = 'M ' + tailBaseX + ' ' + cy
      + ' Q ' + notchX + ' ' + (cy - spread * 0.5) + ' ' + tipX + ' ' + (cy - spread)
      + ' Q ' + (tailBaseX - w*0.04) + ' ' + cy + ' ' + tailBaseX + ' ' + cy
      + ' Q ' + (tailBaseX - w*0.04) + ' ' + cy + ' ' + tipX + ' ' + (cy + spread)
      + ' Q ' + notchX + ' ' + (cy + spread * 0.5) + ' ' + tailBaseX + ' ' + cy
      + ' Z';
  } else if (tail === 'rounded') {
    var tipXr = tailBaseX - w * 0.10;
    tailPath = 'M ' + tailBaseX + ' ' + (cy - ry * 0.6)
      + ' Q ' + tipXr + ' ' + cy + ' ' + tailBaseX + ' ' + (cy + ry * 0.6)
      + ' Z';
  } else if (tail === 'pointed') {
    var tipXp = tailBaseX - w * 0.14;
    tailPath = 'M ' + tailBaseX + ' ' + (cy - ry * 0.4)
      + ' L ' + tipXp + ' ' + cy
      + ' L ' + tailBaseX + ' ' + (cy + ry * 0.4)
      + ' Z';
  } else {
    // truncate
    tailPath = 'M ' + tailBaseX + ' ' + (cy - ry * 0.65)
      + ' L ' + (tailBaseX - w*0.06) + ' ' + (cy - ry * 0.7)
      + ' L ' + (tailBaseX - w*0.06) + ' ' + (cy + ry * 0.7)
      + ' L ' + tailBaseX + ' ' + (cy + ry * 0.65)
      + ' Z';
  }

  // 背びれ(簡易)
  var dorsalPath = '';
  if (profile !== 'eel' && profile !== 'squid') {
    var dsx = cx + rx * 0.4;
    var dex = cx - rx * 0.1;
    var dTop = cy - ry - h * 0.14;
    dorsalPath = 'M ' + dsx + ' ' + (cy - ry * 0.85)
      + ' Q ' + ((dsx+dex)/2) + ' ' + dTop + ' ' + dex + ' ' + (cy - ry * 0.75)
      + ' Z';
  }

  // 目
  var eyeRad = Math.max(2.5, ry * 0.18);
  var eyeX   = cx + rx * 0.55;
  var eyeY   = cy - ry * 0.12;

  // bodyパス (滑らかな楕円を cubic bezier で描く)
  var kappa = 0.5523;
  var bLeft  = cx - rx;
  var bRight = cx + rx;
  var bTop   = cy - ry;
  var bBot   = cy + ry;
  // 四隅制御点
  var cpH = rx * kappa;
  var cpV = ry * kappa;
  var bodyPath =
    'M ' + (cx + rx) + ' ' + cy
    + ' C ' + (cx+rx) + ' ' + (cy-cpV) + ' ' + (cx+cpH) + ' ' + bTop + ' ' + cx + ' ' + bTop
    + ' C ' + (cx-cpH) + ' ' + bTop + ' ' + bLeft + ' ' + (cy-cpV) + ' ' + bLeft + ' ' + cy
    + ' C ' + bLeft + ' ' + (cy+cpV) + ' ' + (cx-cpH) + ' ' + bBot + ' ' + cx + ' ' + bBot
    + ' C ' + (cx+cpH) + ' ' + bBot + ' ' + (cx+rx) + ' ' + (cy+cpV) + ' ' + (cx+rx) + ' ' + cy
    + ' Z';

  // eel はもっと細長い特有形状
  if (profile === 'eel') {
    bodyPath =
      'M ' + (cx + rx) + ' ' + cy
      + ' Q ' + (cx + rx*0.6) + ' ' + (cy - ry) + ' ' + cx + ' ' + (cy - ry)
      + ' Q ' + (cx - rx*0.5) + ' ' + (cy - ry) + ' ' + (cx - rx) + ' ' + cy
      + ' Q ' + (cx - rx*0.5) + ' ' + (cy + ry) + ' ' + cx + ' ' + (cy + ry)
      + ' Q ' + (cx + rx*0.6) + ' ' + (cy + ry) + ' ' + (cx + rx) + ' ' + cy
      + ' Z';
  }

  var bodyFill = filled ? '#3a3a3a' : fillColor;
  var belly    = filled ? '#3a3a3a' : (m.colors ? (m.colors.belly || '#dde') : '#dde');
  var backCol  = filled ? '#3a3a3a' : (m.colors ? (m.colors.back  || '#223344') : '#223344');
  var finFill  = filled ? '#444'    : (m.colors ? (m.colors.fins  || '#557788') : '#557788');

  // グラデーション ID (衝突防止)
  var gid = 'fish-g-' + (species ? species.id : 'unk') + '-' + (filled ? 'u' : 'k');

  var svgStr =
    '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '">'
    + '<defs>'
    + '<linearGradient id="' + gid + '" x1="0" y1="0" x2="0" y2="1">'
    + '<stop offset="0%" stop-color="' + backCol + '"/>'
    + '<stop offset="60%" stop-color="' + bodyFill + '"/>'
    + '<stop offset="100%" stop-color="' + belly + '"/>'
    + '</linearGradient>'
    + '</defs>';

  // 尾ひれ
  if (tailPath) {
    svgStr += '<path d="' + tailPath + '" fill="' + finFill + '" stroke="' + strokeColor + '" stroke-width="0.8" opacity="0.9"/>';
  }
  // 背びれ
  if (dorsalPath) {
    svgStr += '<path d="' + dorsalPath + '" fill="' + finFill + '" stroke="' + strokeColor + '" stroke-width="0.8" opacity="0.8"/>';
  }
  // ボディ
  svgStr += '<path d="' + bodyPath + '" fill="url(#' + gid + ')" stroke="' + strokeColor + '" stroke-width="1"/>';

  // 目
  if (!filled) {
    var eyeColor = m.colors ? (m.colors.eye || '#111') : '#111';
    svgStr += '<circle cx="' + eyeX + '" cy="' + eyeY + '" r="' + eyeRad + '" fill="' + eyeColor + '"/>'
      + '<circle cx="' + (eyeX - eyeRad*0.3) + '" cy="' + (eyeY - eyeRad*0.3) + '" r="' + (eyeRad*0.28) + '" fill="rgba(255,255,255,0.7)"/>';
  }
  svgStr += '</svg>';
  return svgStr;
}

/* ---------- 星評価ヘルパー ---------- */
function UIStars(n, max) {
  max = max || 5;
  var s = '';
  for (var i = 1; i <= max; i++) {
    s += i <= n ? '★' : '☆';
  }
  return s;
}

/* ---------- 時刻文字列ヘルパー ---------- */
function UITimeString(timeOfDay) {
  // timeOfDay 0..1 → HH:MM 風文字列 (ゲーム内1日)
  var totalMin = Math.floor(timeOfDay * 24 * 60);
  var h = Math.floor(totalMin / 60) % 24;
  var m = totalMin % 60;
  return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
}

function UITimeIcon(timeOfDay) {
  if (timeOfDay < 0.25)  return '🌅'; // 朝
  if (timeOfDay < 0.55)  return '☀️'; // 昼
  if (timeOfDay < 0.75)  return '🌆'; // 夕
  return '🌙';                         // 夜
}

/* ---------- UIController 本体 ---------- */

class UIController {
  /**
   * @param {HTMLElement} root  #ui-root 要素
   */
  constructor(root) {
    this._root   = root;
    this._game   = null;

    // HUD差分管理用キャッシュ
    this._hudCache = {
      state: null, tension: null, distance: null,
      stamina: null, coins: null, time: null
    };

    // bite状態
    this._biteLevel = 0;
    this._biteTimeout = null;

    // タックルタブ
    this._tackleTab = 'rod';

    // DOM参照
    this._dom = {};

    this._buildDOM();
  }

  /* ===== DOM構築 ===== */
  _buildDOM() {
    var root = this._root;
    root.innerHTML = '';

    /* --- タイトル --- */
    var title = this._el('div', 'ui-title', '');
    title.innerHTML =
      '<div class="ui-title__logo-wrap">'
      + '<div class="ui-title__deco-line"></div>'
      + '<div class="ui-title__main">チヌ釣り三昧</div>'
      + '<div class="ui-title__sub">〜磯の主を求めて〜</div>'
      + '<div class="ui-title__deco-line"></div>'
      + '</div>'
      + '<button class="ui-title__start-btn" id="ui-start-btn">釣りを始める</button>'
      + '<div class="ui-title__help">'
      + '<h3>操作方法</h3>'
      + '<p>🖱 長押し（クリック保持）でキャストパワー調整</p>'
      + '<p>🖱 離すとキャスト ─ ウキが着水するまで待機</p>'
      + '<p>🐟 アタリ「!!」が出たら即クリック → 合わせ！</p>'
      + '<p>🎣 ファイト中：長押しでリール、離すと糸を送る</p>'
      + '<p>📱 スマホ：タップ長押し / ドラッグで視点移動</p>'
      + '</div>';

    root.appendChild(title);
    this._dom.title = title;

    /* --- HUD --- */
    var hud = this._el('div', 'ui-hud', '');

    // 左上: 時刻・コイン
    var topLeft = this._el('div', 'ui-hud__topleft', '');
    topLeft.innerHTML =
      '<div class="ui-hud__time-block">'
      + '<span class="ui-hud__time-icon" id="ui-time-icon">🌅</span>'
      + '<span class="ui-hud__time-text" id="ui-time-text">06:00</span>'
      + '</div>'
      + '<div class="ui-hud__coin-block">'
      + '<span class="ui-hud__coin-icon">🪙</span>'
      + '<span class="ui-hud__coin-text" id="ui-coin-text">0</span>'
      + '</div>';
    hud.appendChild(topLeft);

    // 右上: アイコンボタン
    var topRight = this._el('div', 'ui-hud__topright', '');
    topRight.innerHTML =
      '<button class="ui-hud__icon-btn" id="ui-btn-dex" title="図鑑">📖</button>'
      + '<button class="ui-hud__icon-btn" id="ui-btn-tackle" title="タックル">🎣</button>'
      + '<button class="ui-hud__icon-btn" id="ui-btn-menu" title="メニュー">☰</button>';
    hud.appendChild(topRight);

    // 左下: タックル簡易表示
    var tackleInfo = this._el('div', 'ui-hud__tackle-info', '');
    tackleInfo.innerHTML =
      '竿 <span id="ui-rod-name">—</span><br>'
      + 'エサ <span id="ui-bait-name">—</span>';
    hud.appendChild(tackleInfo);

    // 下中央: 状態テキスト
    var statusTxt = this._el('div', 'ui-hud__status', '');
    statusTxt.id = 'ui-status-text';
    hud.appendChild(statusTxt);

    // キャストメーター
    var castMeter = this._el('div', 'ui-hud__cast-meter', '');
    castMeter.id = 'ui-cast-meter';
    castMeter.innerHTML =
      '<div class="ui-hud__cast-meter-label">CAST POWER</div>'
      + '<div class="ui-hud__cast-meter-track">'
      + '<div class="ui-hud__cast-meter-fill" id="ui-cast-fill"></div>'
      + '</div>';
    hud.appendChild(castMeter);

    // テンションパネル(ファイト)
    var tensionPanel = this._el('div', 'ui-hud__tension-panel', '');
    tensionPanel.id = 'ui-tension-panel';
    tensionPanel.innerHTML =
      '<span class="ui-hud__tension-label">テンション</span>'
      + '<div class="ui-hud__tension-track">'
      + '<div class="ui-hud__tension-fill" id="ui-tension-fill"></div>'
      + '</div>'
      + '<div class="ui-hud__fish-distance">'
      + '<span id="ui-fish-dist">—</span><small>m</small>'
      + '<small>距離</small>'
      + '</div>'
      + '<div class="ui-hud__stamina-label">魚の体力</div>'
      + '<div class="ui-hud__stamina-track">'
      + '<div class="ui-hud__stamina-fill" id="ui-stamina-fill"></div>'
      + '</div>';
    hud.appendChild(tensionPanel);

    root.appendChild(hud);
    this._dom.hud = hud;

    /* --- アタリ演出(前アタリ) --- */
    var biteMinor = this._el('div', 'ui-bite-minor', '');
    biteMinor.id = 'ui-bite-minor';
    biteMinor.innerHTML =
      '<div class="ui-bite-minor__ripple"></div>'
      + '<div class="ui-bite-minor__ripple"></div>'
      + '<div class="ui-bite-minor__ripple"></div>'
      + '<div class="ui-bite-minor__text">…!</div>';
    root.appendChild(biteMinor);
    this._dom.biteMinor = biteMinor;

    /* --- アタリ演出(本アタリ) --- */
    var biteMajor = this._el('div', 'ui-bite-major', '');
    biteMajor.id = 'ui-bite-major';
    biteMajor.innerHTML = '<div class="ui-bite-major__text">!!</div>';
    root.appendChild(biteMajor);
    this._dom.biteMajor = biteMajor;

    /* --- 釣果モーダル --- */
    var catchModal = this._el('div', 'ui-catch-modal', '');
    catchModal.id = 'ui-catch-modal';
    catchModal.innerHTML =
      '<div class="ui-catch-card" id="ui-catch-card">'
      + '<div class="ui-catch-card__badges" id="ui-catch-badges"></div>'
      + '<div class="ui-catch-card__fish-name" id="ui-catch-name"></div>'
      + '<div class="ui-catch-card__fish-name-en" id="ui-catch-name-en"></div>'
      + '<div class="ui-catch-card__svg-wrap" id="ui-catch-svg"></div>'
      + '<div class="ui-catch-card__stats">'
      + '<div class="ui-catch-stat"><div class="ui-catch-stat__label">サイズ</div><div class="ui-catch-stat__value" id="ui-catch-size">—</div></div>'
      + '<div class="ui-catch-stat"><div class="ui-catch-stat__label">重量</div><div class="ui-catch-stat__value" id="ui-catch-weight">—</div></div>'
      + '<div class="ui-catch-stat"><div class="ui-catch-stat__label">レア度</div><div class="ui-catch-stat__value" id="ui-catch-rarity">—</div></div>'
      + '</div>'
      + '<div class="ui-catch-card__coins" id="ui-catch-coins"></div>'
      + '<button class="ui-catch-card__close-btn" id="ui-catch-close">閉じる</button>'
      + '</div>';
    root.appendChild(catchModal);
    this._dom.catchModal = catchModal;

    /* --- 図鑑 --- */
    var dex = this._el('div', 'ui-dex', '');
    dex.id = 'ui-dex';
    dex.innerHTML =
      '<div class="ui-panel-header">'
      + '<div><span class="ui-panel-header__title">📖 図鑑</span>'
      + '<span class="ui-panel-header__sub" id="ui-dex-progress">0/0種</span></div>'
      + '<button class="ui-panel-close" id="ui-dex-close">✕</button>'
      + '</div>'
      + '<div class="ui-dex__grid-wrap">'
      + '<div class="ui-dex__grid" id="ui-dex-grid"></div>'
      + '</div>';
    root.appendChild(dex);
    this._dom.dex = dex;

    /* --- 図鑑詳細 --- */
    var dexDetail = this._el('div', 'ui-dex-detail', '');
    dexDetail.id = 'ui-dex-detail';
    dexDetail.innerHTML =
      '<div class="ui-dex-detail__card">'
      + '<button class="ui-dex-detail__close" id="ui-dex-detail-close">✕</button>'
      + '<div class="ui-dex-detail__name" id="ui-dex-detail-name"></div>'
      + '<div class="ui-dex-detail__name-en" id="ui-dex-detail-name-en"></div>'
      + '<div class="ui-dex-detail__svg-wrap" id="ui-dex-detail-svg"></div>'
      + '<div class="ui-dex-detail__rarity" id="ui-dex-detail-rarity"></div>'
      + '<div class="ui-dex-detail__meta" id="ui-dex-detail-meta"></div>'
      + '<div class="ui-dex-detail__desc" id="ui-dex-detail-desc"></div>'
      + '<div class="ui-dex-detail__record" id="ui-dex-detail-record"></div>'
      + '</div>';
    root.appendChild(dexDetail);
    this._dom.dexDetail = dexDetail;

    /* --- タックル画面 --- */
    var tackle = this._el('div', 'ui-tackle', '');
    tackle.id = 'ui-tackle';
    tackle.innerHTML =
      '<div class="ui-panel-header">'
      + '<span class="ui-panel-header__title">🎣 タックル</span>'
      + '<button class="ui-panel-close" id="ui-tackle-close">✕</button>'
      + '</div>'
      + '<div class="ui-tackle__tabs">'
      + '<button class="ui-tackle__tab is-active" data-tab="rod">竿</button>'
      + '<button class="ui-tackle__tab" data-tab="reel">リール</button>'
      + '<button class="ui-tackle__tab" data-tab="rig">仕掛け</button>'
      + '<button class="ui-tackle__tab" data-tab="bait">エサ</button>'
      + '</div>'
      + '<div class="ui-tackle__list-wrap" id="ui-tackle-list"></div>';
    root.appendChild(tackle);
    this._dom.tackle = tackle;

    /* --- メニュー --- */
    var menu = this._el('div', 'ui-menu', '');
    menu.id = 'ui-menu';
    menu.innerHTML =
      '<div class="ui-menu__card">'
      + '<div class="ui-menu__title">メニュー</div>'
      + '<button class="ui-menu__btn" id="ui-menu-resume">再開</button>'
      + '<button class="ui-menu__btn" id="ui-menu-sound">🔊 音 ON/OFF</button>'
      + '<button class="ui-menu__btn is-secondary" id="ui-menu-title">タイトルへ戻る</button>'
      + '</div>';
    root.appendChild(menu);
    this._dom.menu = menu;

    /* ===== イベント登録 ===== */
    this._bindEvents();
  }

  /* ===== イベントバインド ===== */
  _bindEvents() {
    var self = this;

    // タイトル「釣りを始める」
    this._on('ui-start-btn', 'click', function() {
      if (self._game && typeof self._game.startGame === 'function') {
        self._game.startGame();
      }
    });

    // HUDボタン
    this._on('ui-btn-dex',    'click', function() { self.openDex(); });
    this._on('ui-btn-tackle', 'click', function() { self.openTackle(); });
    this._on('ui-btn-menu',   'click', function() { self.openMenu(); });

    // 釣果モーダル閉じる
    this._on('ui-catch-close', 'click', function() {
      if (self._game && typeof self._game.dismissCatch === 'function') {
        self._game.dismissCatch();
      }
      self._dom.catchModal.classList.remove('is-active');
    });

    // 図鑑閉じる
    this._on('ui-dex-close', 'click', function() { self.closeDex(); });
    this._on('ui-dex-detail-close', 'click', function() {
      self._dom.dexDetail.classList.remove('is-active');
    });

    // タックル画面閉じる
    this._on('ui-tackle-close', 'click', function() { self.closeTackle(); });

    // タックルタブ
    var tabs = this._root.querySelectorAll('.ui-tackle__tab');
    for (var i = 0; i < tabs.length; i++) {
      tabs[i].addEventListener('click', function(e) {
        var tab = e.currentTarget.getAttribute('data-tab');
        self._switchTackleTab(tab);
      });
    }

    // メニューボタン
    this._on('ui-menu-resume', 'click', function() {
      self.closeMenu();
      if (self._game && typeof self._game.resume === 'function') {
        self._game.resume();
      }
    });
    this._on('ui-menu-sound', 'click', function() {
      if (self._game && typeof self._game.toggleSound === 'function') {
        self._game.toggleSound();
      }
    });
    this._on('ui-menu-title', 'click', function() {
      self.closeMenu();
      self.openTitle();
    });
  }

  /* ===== ユーティリティ ===== */
  _el(tag, cls, html) {
    var el = document.createElement(tag);
    if (cls) el.className = cls;
    if (html !== undefined) el.innerHTML = html;
    return el;
  }

  _on(id, event, fn) {
    var el = document.getElementById(id);
    if (el) el.addEventListener(event, fn);
  }

  _get(id) {
    return document.getElementById(id);
  }

  /* ===== 公開: bind ===== */
  /**
   * GameCore インスタンスを受け取り連携。
   * @param {object} game GameCore
   */
  bind(game) {
    this._game = game;
  }

  /* ===== 画面: タイトル ===== */
  openTitle() {
    this._dom.title.style.display    = '';
    this._dom.hud.classList.remove('is-active');
    this._dom.dex.classList.remove('is-active');
    this._dom.tackle.classList.remove('is-active');
    this._dom.menu.classList.remove('is-active');
    this._dom.catchModal.classList.remove('is-active');
    this._dom.biteMinor.classList.remove('is-active');
    this._dom.biteMajor.classList.remove('is-active');
    this._biteLevel = 0;
  }

  _hideTitle() {
    this._dom.title.style.display = 'none';
    this._dom.hud.classList.add('is-active');
  }

  /* ===== 公開: setHUD ===== */
  /**
   * 毎フレーム呼ばれる。差分のみ DOM 更新。
   * @param {object} p { state, tension, distance, stamina, coins, time, speciesHint }
   */
  setHUD(p) {
    if (!p) return;

    var cache = this._hudCache;
    var g = this._get.bind(this);

    // ── タイトル非表示 ──
    if (this._dom.title.style.display !== 'none') {
      this._hideTitle();
    }

    /* --- 時刻 --- */
    var timeVal = (p.time !== undefined) ? p.time : 0;
    if (timeVal !== cache.time) {
      cache.time = timeVal;
      var iconEl = g('ui-time-icon');
      var txtEl  = g('ui-time-text');
      if (iconEl) iconEl.textContent = UITimeIcon(timeVal);
      if (txtEl)  txtEl.textContent  = UITimeString(timeVal);
    }

    /* --- コイン --- */
    if (p.coins !== undefined && p.coins !== cache.coins) {
      cache.coins = p.coins;
      var coinEl = g('ui-coin-text');
      if (coinEl) coinEl.textContent = p.coins.toLocaleString();

      // タックル画面が開いている場合は購入ボタンを再評価
      if (this._dom.tackle.classList.contains('is-active')) {
        this._renderTackleList();
      }
    }

    /* --- 状態テキスト --- */
    if (p.state !== undefined && p.state !== cache.state) {
      cache.state = p.state;
      var stEl = g('ui-status-text');
      if (stEl) {
        stEl.textContent  = this._stateLabel(p.state);
        stEl.className    = 'ui-hud__status' + (p.state === 'bite' ? ' is-bite' : '');
      }

      // キャストメーター表示切替
      var castMeter = g('ui-cast-meter');
      if (castMeter) {
        castMeter.classList.toggle('is-active', p.state === 'casting');
      }

      // テンションパネル
      var tensionPanel = g('ui-tension-panel');
      if (tensionPanel) {
        tensionPanel.classList.toggle('is-active', p.state === 'fight');
      }

      // タックル情報更新(equipped)
      this._updateTackleHUD();
    }

    /* --- テンション --- */
    if (p.tension !== undefined && p.tension !== cache.tension) {
      cache.tension = p.tension;
      var tFill = g('ui-tension-fill');
      if (tFill) {
        var pct = Math.min(100, Math.max(0, p.tension * 100));
        tFill.style.height = pct + '%';
        tFill.className = 'ui-hud__tension-fill'
          + (p.tension > 0.8 ? ' is-danger' : p.tension > 0.55 ? ' is-warn' : '');
      }
    }

    /* --- 距離 --- */
    if (p.distance !== undefined && p.distance !== cache.distance) {
      cache.distance = p.distance;
      var distEl = g('ui-fish-dist');
      if (distEl) distEl.textContent = p.distance.toFixed(1);
    }

    /* --- スタミナ --- */
    if (p.stamina !== undefined && p.stamina !== cache.stamina) {
      cache.stamina = p.stamina;
      var sFill = g('ui-stamina-fill');
      if (sFill) {
        sFill.style.width = Math.min(100, Math.max(0, p.stamina * 100)) + '%';
        sFill.style.background = p.stamina > 0.5 ? '#22aa66' : p.stamina > 0.25 ? '#ddaa11' : '#cc3333';
      }
    }
  }

  /* キャストパワーを直接セット (setHUD 経由以外でも呼べる) */
  setCastPower(power) {
    var fill = this._get('ui-cast-fill');
    if (!fill) return;
    var pct = Math.min(100, Math.max(0, power * 100));
    fill.style.width = pct + '%';

    // キャストメーター表示
    var meter = this._get('ui-cast-meter');
    if (meter) meter.classList.add('is-active');
  }

  _stateLabel(state) {
    var map = {
      idle:    '長押しでキャスト',
      casting: 'キャスト中…',
      waiting: 'アタリを待て…',
      bite:    '!! 合わせろ !!',
      fight:   'リールを巻け！',
      landed:  '釣れた！',
      title:   ''
    };
    return map[state] || '';
  }

  _updateTackleHUD() {
    var game = this._game;
    if (!game || !game.equipped) return;
    var eq = game.equipped;
    var rodEl  = this._get('ui-rod-name');
    var baitEl = this._get('ui-bait-name');
    if (rodEl  && eq.rod)  rodEl.textContent  = eq.rod.name  || eq.rod.id  || '—';
    if (baitEl && eq.bait) baitEl.textContent = eq.bait.name || eq.bait.id || '—';
  }

  /* ===== 公開: showBite ===== */
  /**
   * @param {number} level 0=なし 1=前アタリ 2=本アタリ
   */
  showBite(level) {
    var self = this;
    this._biteLevel = level;

    var minor = this._dom.biteMinor;
    var major = this._dom.biteMajor;

    if (this._biteTimeout) {
      clearTimeout(this._biteTimeout);
      this._biteTimeout = null;
    }

    if (level === 0) {
      minor.classList.remove('is-active');
      major.classList.remove('is-active');
    } else if (level === 1) {
      minor.classList.add('is-active');
      major.classList.remove('is-active');
    } else if (level >= 2) {
      minor.classList.remove('is-active');
      // 再生のために一旦削除→付与
      major.classList.remove('is-active');
      void major.offsetWidth; // reflow
      major.classList.add('is-active');
      // 本アタリは約 1.2s で自動消去しない(game 側から showBite(0) を呼ぶ想定)
    }
  }

  /* ===== 公開: showCatch ===== */
  /**
   * @param {object} species    SPECIES エントリ
   * @param {number} sizeCm
   * @param {number} weightKg
   * @param {number} coins
   * @param {boolean} isNew     初釣果
   * @param {boolean} isRecord  記録更新
   */
  showCatch(species, sizeCm, weightKg, coins, isNew, isRecord) {
    var modal = this._dom.catchModal;
    var card  = this._get('ui-catch-card');

    // fantasy 枠
    var isFantasy = species && species.category === 'fantasy';
    card.className = 'ui-catch-card' + (isFantasy ? ' is-fantasy' : '');

    // バッジ
    var badges = this._get('ui-catch-badges');
    badges.innerHTML = '';
    if (isNew) {
      var nb = document.createElement('span');
      nb.className = 'ui-catch-badge is-new';
      nb.textContent = 'NEW!';
      badges.appendChild(nb);
    }
    if (isRecord) {
      var rb = document.createElement('span');
      rb.className = 'ui-catch-badge is-record';
      rb.textContent = '記録更新！';
      badges.appendChild(rb);
    }

    // 名前
    this._get('ui-catch-name').textContent    = (species && species.name)   || '不明の魚';
    this._get('ui-catch-name-en').textContent = (species && species.nameEn) || '';

    // SVG
    var svgWrap = this._get('ui-catch-svg');
    svgWrap.innerHTML = species ? UIBuildFishSVG(species, false, 240, 110) : '';

    // スタッツ
    this._get('ui-catch-size').textContent   = sizeCm   ? sizeCm.toFixed(1)   + ' cm' : '—';
    this._get('ui-catch-weight').textContent = weightKg ? weightKg.toFixed(2) + ' kg' : '—';
    this._get('ui-catch-rarity').textContent = species  ? UIStars(species.rarity) : '—';

    // コイン
    this._get('ui-catch-coins').textContent = '獲得 🪙 ' + (coins || 0).toLocaleString();

    modal.classList.add('is-active');

    // アタリ演出を消す
    this.showBite(0);
  }

  /* ===== 公開: openDex / closeDex ===== */
  openDex() {
    this._renderDexGrid();
    this._dom.dex.classList.add('is-active');
  }

  closeDex() {
    this._dom.dex.classList.remove('is-active');
    this._dom.dexDetail.classList.remove('is-active');
  }

  _renderDexGrid() {
    // SPECIES / records は実行時参照
    var speciesList;
    try { speciesList = SPECIES; } catch(e) { speciesList = []; }
    var records;
    try { records = (this._game && this._game.records) ? this._game.records : {}; } catch(e) { records = {}; }

    var grid = this._get('ui-dex-grid');
    if (!grid) return;
    grid.innerHTML = '';

    var caught = 0;
    var total  = speciesList.length;
    var self   = this;

    for (var i = 0; i < speciesList.length; i++) {
      (function(sp) {
        var rec     = records[sp.id];
        var isCaught  = !!(rec && rec.count > 0);
        var isFantasy = sp.category === 'fantasy';
        if (isCaught) caught++;

        var cell = document.createElement('div');
        cell.className = 'ui-dex-cell'
          + (isCaught  ? ' is-caught'  : ' is-unknown')
          + (isFantasy ? ' is-fantasy' : '');

        var svg = UIBuildFishSVG(sp, !isCaught, 64, 44);

        var nameHtml = isCaught
          ? '<div class="ui-dex-cell__name">' + sp.name + '</div>'
          : '<div class="ui-dex-cell__name" style="color:#555">???</div>';

        var countHtml = '';
        if (isCaught && rec) {
          countHtml = '<div class="ui-dex-cell__count">' + rec.count + '匹</div>'
            + '<div class="ui-dex-cell__size">' + rec.maxSize.toFixed(0) + 'cm</div>';
        }

        cell.innerHTML =
          '<div class="ui-dex-cell__silhouette">' + svg + '</div>'
          + nameHtml
          + countHtml;

        cell.addEventListener('click', function() {
          self._showDexDetail(sp, isCaught, records[sp.id]);
        });

        grid.appendChild(cell);
      })(speciesList[i]);
    }

    var prog = this._get('ui-dex-progress');
    if (prog) prog.textContent = caught + '/' + total + '種';
  }

  _showDexDetail(sp, isCaught, rec) {
    var isFantasy = sp.category === 'fantasy';

    this._get('ui-dex-detail-name').textContent    = sp.name   || '???';
    this._get('ui-dex-detail-name-en').textContent = isCaught  ? (sp.nameEn || '') : '???';

    var svgWrap = this._get('ui-dex-detail-svg');
    svgWrap.innerHTML = UIBuildFishSVG(sp, !isCaught, 200, 100);

    this._get('ui-dex-detail-rarity').textContent = 'レア度 ' + (isCaught ? UIStars(sp.rarity) : '★?????');

    // 生息情報
    var meta = '';
    if (isCaught) {
      var habitatMap = { bottom:'底層', mid:'中層', surface:'表層' };
      var activeMap  = { day:'昼',     dusk:'夕',   night:'夜' };
      var habitats  = sp.habitat ? sp.habitat.map(function(h){ return habitatMap[h]||h; }).join('・') : '—';
      var actives   = sp.active  ? sp.active.map(function(a){  return activeMap[a]||a;  }).join('・') : '—';
      meta = '棚: ' + habitats + '　時間帯: ' + actives
           + '\n体長: ' + sp.minSize + '〜' + sp.maxSize + ' cm';
    } else {
      meta = '— 未捕獲 —';
    }
    this._get('ui-dex-detail-meta').textContent = meta;
    this._get('ui-dex-detail-desc').textContent = isCaught ? (sp.desc || '') : '詳細は捕獲後に解禁';

    var recordEl = this._get('ui-dex-detail-record');
    if (rec && rec.count > 0) {
      recordEl.textContent = '捕獲数: ' + rec.count + '匹  最大: ' + rec.maxSize.toFixed(1) + ' cm';
    } else {
      recordEl.textContent = '';
    }

    // fantasy 枠
    var card = this._dom.dexDetail.querySelector('.ui-dex-detail__card');
    if (card) {
      card.style.borderColor = isFantasy ? 'rgba(160,60,220,0.6)' : '';
      card.style.boxShadow   = isFantasy ? '0 0 20px rgba(160,60,220,0.3)' : '';
    }

    this._dom.dexDetail.classList.add('is-active');
  }

  /* ===== 公開: openTackle / closeTackle ===== */
  openTackle() {
    this._switchTackleTab(this._tackleTab);
    this._dom.tackle.classList.add('is-active');
  }

  closeTackle() {
    this._dom.tackle.classList.remove('is-active');
  }

  _switchTackleTab(tab) {
    this._tackleTab = tab;

    // タブ active 切替
    var tabs = this._root.querySelectorAll('.ui-tackle__tab');
    for (var i = 0; i < tabs.length; i++) {
      tabs[i].classList.toggle('is-active', tabs[i].getAttribute('data-tab') === tab);
    }

    this._renderTackleList();
  }

  _renderTackleList() {
    var list = this._get('ui-tackle-list');
    if (!list) return;
    list.innerHTML = '';

    var tab  = this._tackleTab;
    var game = this._game;
    var coins = (game && game.coins !== undefined) ? game.coins : 0;
    var equipped = (game && game.equipped) ? game.equipped : {};
    var owned    = (game && game.owned)    ? game.owned    : {};

    var items    = [];
    var catKey   = ''; // equipped のキー
    var ownedArr = [];
    var statKeys = [];

    try {
      if (tab === 'rod') {
        items    = TACKLE_RODS;
        catKey   = 'rod';
        ownedArr = owned.rods   || [];
        statKeys = [{ key:'power',   label:'パワー'   }, { key:'control', label:'コントロール' }];
      } else if (tab === 'reel') {
        items    = TACKLE_REELS;
        catKey   = 'reel';
        ownedArr = owned.reels  || [];
        statKeys = [{ key:'drag',    label:'ドラグ'   }, { key:'speed',   label:'スピード' }];
      } else if (tab === 'rig') {
        items    = TACKLE_RIGS;
        catKey   = 'rig';
        ownedArr = owned.rigs   || [];
        statKeys = [{ key:'hookSize', label:'鈎サイズ' }];
      } else if (tab === 'bait') {
        items    = TACKLE_BAITS;
        catKey   = 'bait';
        ownedArr = []; // エサは消耗品・常時購入可
        statKeys = [];
      }
    } catch(e) {
      items = [];
    }

    var self = this;

    for (var i = 0; i < items.length; i++) {
      (function(item) {
        var isEquipped = equipped[catKey] && equipped[catKey].id === item.id;
        var isOwned    = tab === 'bait' ? true : ownedArr.some(function(o){ return o.id === item.id; });

        var el = document.createElement('div');
        el.className = 'ui-tackle__item' + (isEquipped ? ' is-equipped' : '');

        // 性能★
        var statsHtml = '';
        for (var k = 0; k < statKeys.length; k++) {
          var sk = statKeys[k];
          statsHtml += '<span class="ui-tackle__stat">'
            + sk.label + ': <span class="ui-tackle__stat-stars">'
            + UIStars(item[sk.key] || 0) + '</span></span>';
        }
        if (tab === 'rig' && item.type) {
          statsHtml += '<span class="ui-tackle__stat">種別: ' + item.type + '</span>';
        }

        // アクションボタン
        var actionHtml = '';
        if (isEquipped) {
          actionHtml = '<span class="ui-tackle__equipped-badge">装備中</span>';
        } else if (isOwned) {
          actionHtml = '<button class="ui-tackle__action-btn is-equip" data-cat="' + catKey + '" data-id="' + item.id + '">装備する</button>';
        } else {
          var canBuy  = coins >= (item.price || 0);
          actionHtml = '<span class="ui-tackle__price">🪙' + (item.price || 0) + '</span>'
            + '<button class="ui-tackle__action-btn is-buy" data-cat="' + catKey + '" data-id="' + item.id + '"'
            + (canBuy ? '' : ' disabled') + '>購入</button>';
        }

        el.innerHTML =
          '<div class="ui-tackle__item-info">'
          + '<div class="ui-tackle__item-name">' + (item.name || item.id) + '</div>'
          + '<div class="ui-tackle__item-desc">'  + (item.desc || '') + '</div>'
          + (statsHtml ? '<div class="ui-tackle__item-stats">' + statsHtml + '</div>' : '')
          + '</div>'
          + actionHtml;

        // ボタンクリック
        var btn = el.querySelector('.ui-tackle__action-btn');
        if (btn) {
          btn.addEventListener('click', function(e) {
            var cat = e.currentTarget.getAttribute('data-cat');
            var id  = e.currentTarget.getAttribute('data-id');
            var isBuyBtn = e.currentTarget.classList.contains('is-buy');

            if (!game) return;

            if (isBuyBtn && typeof game.buy === 'function') {
              var ok = game.buy(cat, id);
              if (ok !== false) { self._renderTackleList(); }
            } else if (!isBuyBtn && typeof game.equip === 'function') {
              game.equip(cat, id);
              self._renderTackleList();
            }
          });
        }

        list.appendChild(el);
      })(items[i]);
    }
  }

  /* ===== 公開: openMenu / closeMenu ===== */
  openMenu() {
    this._dom.menu.classList.add('is-active');
  }

  closeMenu() {
    this._dom.menu.classList.remove('is-active');
  }
}
