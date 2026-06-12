/* ============================================================
   05_ui.js — UIController
   チヌ釣り三昧 UI 全実装
   import/export 禁止。トップレベル接頭辞: UI*
   ============================================================ */

/* ---------- SVGシルエット生成ヘルパー ---------- */

/**
 * 魚種の model から「ちゃんと魚に見える」SVGシルエットを生成。
 * 3次ベジェで口先→背中→尾柄→尾ひれ→腹→口先を閉じる。
 * 背鰭・臀鰭・胸鰭の突起、目も描画。
 * profile別にボディ形状を変える:
 *   standard/deep/slender/round → 通常の魚
 *   flat  → ヒラメ型(横長・両目が上面)
 *   eel   → 細長いS字体型
 *   squid → イカ型(外套+脚束+三角ひれ)
 */
function UIBuildFishSVG(species, filled, w, h) {
  w = w || 80;
  h = h || 52;
  var m = (species && species.model) ? species.model : {};
  var profile = m.profile || 'standard';
  var tail    = m.tail    || 'forked';
  var bodyH   = (m.bodyH  !== undefined) ? m.bodyH  : 0.30;
  var isCat   = species && species.category === 'fantasy';

  // 色セット
  var strokeColor = filled ? '#555' : (isCat ? '#a03cdc' : '#338866');
  var bodyFill  = filled ? '#2e2e2e' : (m.colors ? (m.colors.base  || '#6a8fa0') : '#6a8fa0');
  var bellyCol  = filled ? '#2e2e2e' : (m.colors ? (m.colors.belly || '#e8e8e0') : '#e8e8e0');
  var backCol   = filled ? '#2e2e2e' : (m.colors ? (m.colors.back  || '#223344') : '#223344');
  var finFill   = filled ? '#3a3a3a' : (m.colors ? (m.colors.fins  || '#557788') : '#557788');
  var eyeColor  = filled ? '#222'    : (m.colors ? (m.colors.eye   || '#111111') : '#111111');

  var gid = 'fg-' + (species ? species.id : 'unk') + '-' + (filled ? 'u' : 'k');
  var gidFin = gid + 'f';

  // ---- ヘルパー ----
  function f(n) { return Math.round(n * 10) / 10; }
  function pt(x, y) { return f(x) + ',' + f(y); }

  // =====================================================================
  // SQUID — イカ型
  // =====================================================================
  if (profile === 'squid') {
    // 外套: 中央右に縦長の流線型
    var mx = w * 0.52;
    var my = h * 0.50;
    var mw = w * 0.32;  // 半幅
    var mh = h * 0.40;  // 半高
    // 外套パス: 頭側(右)→先端三角(左)
    // 右(前端)は丸め、左(後端)は尖る
    var mRx = mx + mw;
    var mLx = mx - mw;
    var mTop = my - mh;
    var mBot = my + mh;
    // 三角ひれ
    var finW = mw * 0.55;
    var finH = mh * 0.50;
    var mantlePath =
      'M ' + f(mRx) + ' ' + f(my)
      + ' C ' + f(mRx) + ',' + f(my - mh*0.65) + ' ' + f(mx + mw*0.5) + ',' + f(mTop) + ' ' + f(mx) + ',' + f(mTop)
      + ' C ' + f(mx - mw*0.6) + ',' + f(mTop) + ' ' + f(mLx) + ',' + f(my - mh*0.3) + ' ' + f(mLx) + ',' + f(my)
      + ' C ' + f(mLx) + ',' + f(my + mh*0.3) + ' ' + f(mx - mw*0.6) + ',' + f(mBot) + ' ' + f(mx) + ',' + f(mBot)
      + ' C ' + f(mx + mw*0.5) + ',' + f(mBot) + ' ' + f(mRx) + ',' + f(my + mh*0.65) + ' ' + f(mRx) + ',' + f(my)
      + ' Z';
    // 三角ひれ(後端両側)
    var fintPath =
      'M ' + f(mLx + mw*0.2) + ',' + f(mTop + mh*0.3)
      + ' L ' + f(mLx - finW*0.5) + ',' + f(mTop)
      + ' L ' + f(mLx) + ',' + f(my - mh*0.1)
      + ' Z'
      + ' M ' + f(mLx + mw*0.2) + ',' + f(mBot - mh*0.3)
      + ' L ' + f(mLx - finW*0.5) + ',' + f(mBot)
      + ' L ' + f(mLx) + ',' + f(my + mh*0.1)
      + ' Z';
    // 脚束: 外套右端から8本
    var legBaseX = mRx - mw * 0.05;
    var legSpacing = mh * 0.18;
    var legs = '';
    for (var li = 0; li < 8; li++) {
      var legY0 = my + (li - 3.5) * legSpacing;
      var legLen = (li === 3 || li === 4) ? mw * 0.85 : mw * 0.60;
      var legCurve = (li < 4) ? -legLen * 0.2 : legLen * 0.2;
      legs += '<path d="M ' + f(legBaseX) + ',' + f(legY0)
        + ' Q ' + f(legBaseX + legLen*0.5) + ',' + f(legY0 + legCurve)
        + ' ' + f(legBaseX + legLen) + ',' + f(legY0 + legCurve * 1.5)
        + '" fill="none" stroke="' + finFill + '" stroke-width="1" opacity="0.85"/>';
    }
    // 目(外套前部左右)
    var eyeRsq = Math.max(2.5, mh * 0.20);
    var eyeXsq = mRx - mw * 0.55;
    var svgSq = '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '">'
      + '<defs>'
      + '<linearGradient id="' + gid + '" x1="0" y1="0" x2="0" y2="1">'
      + '<stop offset="0%" stop-color="' + backCol + '"/>'
      + '<stop offset="55%" stop-color="' + bodyFill + '"/>'
      + '<stop offset="100%" stop-color="' + bellyCol + '"/>'
      + '</linearGradient></defs>'
      + '<path d="' + fintPath + '" fill="' + finFill + '" stroke="' + strokeColor + '" stroke-width="0.7" opacity="0.85"/>'
      + '<path d="' + mantlePath + '" fill="url(#' + gid + ')" stroke="' + strokeColor + '" stroke-width="0.9"/>'
      + legs;
    if (!filled) {
      svgSq += '<circle cx="' + f(eyeXsq) + '" cy="' + f(my - mh*0.22) + '" r="' + f(eyeRsq) + '" fill="' + eyeColor + '"/>'
        + '<circle cx="' + f(eyeXsq - eyeRsq*0.28) + '" cy="' + f(my - mh*0.22 - eyeRsq*0.28) + '" r="' + f(eyeRsq*0.28) + '" fill="rgba(255,255,255,0.65)"/>';
    }
    svgSq += '</svg>';
    return svgSq;
  }

  // =====================================================================
  // EEL — 細長いS字体型 (タチウオ・アナゴ・ウツボ等)
  // =====================================================================
  if (profile === 'eel') {
    // 胴体は細長い帯状の多角形。S字のうねりを表現
    var ew = w * 0.92;
    var eh = h * 0.22;  // 半高
    var ecx = w * 0.50;
    var ecy = h * 0.50;
    // 口先(右端)から尾(左端)へS字
    var eRx = ecx + ew * 0.46;
    var eLx = ecx - ew * 0.46;
    // S字の振れ: 前半は上、後半は下(軽め)
    var sMid1x = ecx + ew * 0.12;
    var sMid2x = ecx - ew * 0.12;
    var sAmp = eh * 0.6; // 振れ幅
    // 背側パス
    var eelBody =
      'M ' + f(eRx) + ',' + f(ecy)
      + ' C ' + f(eRx - ew*0.07) + ',' + f(ecy - eh*0.5)
      + ' ' + f(sMid1x + ew*0.1) + ',' + f(ecy - eh - sAmp*0.6)
      + ' ' + f(sMid1x) + ',' + f(ecy - eh)
      + ' C ' + f(sMid1x - ew*0.12) + ',' + f(ecy - eh + sAmp*0.5)
      + ' ' + f(sMid2x + ew*0.05) + ',' + f(ecy - eh*0.2 + sAmp*0.4)
      + ' ' + f(eLx + ew*0.05) + ',' + f(ecy - eh*0.3)
      + ' L ' + f(eLx) + ',' + f(ecy)
      // 腹側(逆方向)
      + ' C ' + f(eLx + ew*0.05) + ',' + f(ecy + eh*0.3)
      + ' ' + f(sMid2x + ew*0.05) + ',' + f(ecy + eh*0.2 - sAmp*0.4)
      + ' ' + f(sMid2x) + ',' + f(ecy + eh)
      + ' C ' + f(sMid2x + ew*0.08) + ',' + f(ecy + eh - sAmp*0.5)
      + ' ' + f(sMid1x) + ',' + f(ecy + eh)
      + ' ' + f(sMid1x) + ',' + f(ecy + eh)
      + ' C ' + f(sMid1x + ew*0.12) + ',' + f(ecy + eh*0.5)
      + ' ' + f(eRx - ew*0.07) + ',' + f(ecy + eh*0.5)
      + ' ' + f(eRx) + ',' + f(ecy)
      + ' Z';
    // 背びれ(長い)
    var eelDorsal = 'M ' + f(eRx - ew*0.08) + ',' + f(ecy - eh*0.9)
      + ' Q ' + f(ecx) + ',' + f(ecy - eh - h*0.12)
      + ' ' + f(eLx + ew*0.08) + ',' + f(ecy - eh*0.9);
    // 目(右端に近い位置)
    var eelEyeX = eRx - ew * 0.07;
    var eelEyeY = ecy - eh * 0.25;
    var eelEyeR = Math.max(2, eh * 0.30);

    var svgEel = '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '">'
      + '<defs>'
      + '<linearGradient id="' + gid + '" x1="0" y1="0" x2="0" y2="1">'
      + '<stop offset="0%" stop-color="' + backCol + '"/>'
      + '<stop offset="50%" stop-color="' + bodyFill + '"/>'
      + '<stop offset="100%" stop-color="' + bellyCol + '"/>'
      + '</linearGradient></defs>'
      + '<path d="' + eelDorsal + '" fill="none" stroke="' + finFill + '" stroke-width="1.5" opacity="0.75"/>'
      + '<path d="' + eelBody + '" fill="url(#' + gid + ')" stroke="' + strokeColor + '" stroke-width="0.9"/>';
    if (!filled) {
      svgEel += '<circle cx="' + f(eelEyeX) + '" cy="' + f(eelEyeY) + '" r="' + f(eelEyeR) + '" fill="' + eyeColor + '"/>'
        + '<circle cx="' + f(eelEyeX - eelEyeR*0.3) + '" cy="' + f(eelEyeY - eelEyeR*0.3) + '" r="' + f(eelEyeR*0.28) + '" fill="rgba(255,255,255,0.65)"/>';
    }
    svgEel += '</svg>';
    return svgEel;
  }

  // =====================================================================
  // FLAT — ヒラメ・エイ型 (横から見た扁平魚)
  // =====================================================================
  if (profile === 'flat') {
    // 横長の菱形に近い形、前後に丸みを持たせる
    var fcx = w * 0.48;
    var fcy = h * 0.52;
    var frx = w * 0.42;  // 横方向
    var fry = h * 0.34;  // 縦方向(薄い)
    // 口先(右)は少し尖る、尾(左)も尖る
    var fHead = fcx + frx;
    var fTail = fcx - frx;
    var fTop = fcy - fry;
    var fBot = fcy + fry;
    // 上輪郭: 右→背中高み(少し前より)→左
    // 下輪郭: 左→腹→右
    var flatBody =
      'M ' + f(fHead) + ',' + f(fcy)
      + ' C ' + f(fHead - frx*0.12) + ',' + f(fcy - fry*0.7)
      + ' ' + f(fcx + frx*0.25) + ',' + f(fTop)
      + ' ' + f(fcx - frx*0.1) + ',' + f(fTop)
      + ' C ' + f(fcx - frx*0.55) + ',' + f(fTop)
      + ' ' + f(fTail + frx*0.08) + ',' + f(fcy - fry*0.4)
      + ' ' + f(fTail) + ',' + f(fcy)
      + ' C ' + f(fTail + frx*0.08) + ',' + f(fcy + fry*0.4)
      + ' ' + f(fcx - frx*0.55) + ',' + f(fBot)
      + ' ' + f(fcx - frx*0.1) + ',' + f(fBot)
      + ' C ' + f(fcx + frx*0.25) + ',' + f(fBot)
      + ' ' + f(fHead - frx*0.12) + ',' + f(fcy + fry*0.7)
      + ' ' + f(fHead) + ',' + f(fcy)
      + ' Z';
    // 目2つ(上面左右)
    var fEyeR = Math.max(2, fry * 0.22);
    var fEye1x = fcx + frx * 0.38;
    var fEye2x = fcx + frx * 0.18;
    var fEyeY = fcy - fry * 0.45;
    // 背びれ(上縁に沿った細い突起)
    var fDorsal = 'M ' + f(fHead - frx*0.22) + ',' + f(fTop + fry*0.1)
      + ' Q ' + f(fcx) + ',' + f(fTop - h*0.08)
      + ' ' + f(fTail + frx*0.20) + ',' + f(fTop + fry*0.1);
    // 尾ひれ
    var fTailSpread = fry * 0.85;
    var fTailPath = 'M ' + f(fTail) + ',' + f(fcy - fry*0.3)
      + ' C ' + f(fTail - frx*0.14) + ',' + f(fcy - fTailSpread)
      + ' ' + f(fTail - frx*0.14) + ',' + f(fcy - fTailSpread)
      + ' ' + f(fTail - frx*0.22) + ',' + f(fcy - fTailSpread * 0.85)
      + ' M ' + f(fTail - frx*0.22) + ',' + f(fcy - fTailSpread * 0.85)
      + ' C ' + f(fTail - frx*0.1) + ',' + f(fcy - fTailSpread*0.2)
      + ' ' + f(fTail - frx*0.1) + ',' + f(fcy + fTailSpread*0.2)
      + ' ' + f(fTail - frx*0.22) + ',' + f(fcy + fTailSpread * 0.85)
      + ' M ' + f(fTail - frx*0.22) + ',' + f(fcy + fTailSpread * 0.85)
      + ' C ' + f(fTail - frx*0.14) + ',' + f(fcy + fTailSpread)
      + ' ' + f(fTail - frx*0.14) + ',' + f(fcy + fTailSpread)
      + ' ' + f(fTail) + ',' + f(fcy + fry*0.3);

    var svgFlat = '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '">'
      + '<defs>'
      + '<linearGradient id="' + gid + '" x1="0" y1="0" x2="0" y2="1">'
      + '<stop offset="0%" stop-color="' + backCol + '"/>'
      + '<stop offset="60%" stop-color="' + bodyFill + '"/>'
      + '<stop offset="100%" stop-color="' + bellyCol + '"/>'
      + '</linearGradient></defs>'
      + '<path d="' + fDorsal + '" fill="none" stroke="' + finFill + '" stroke-width="1.2" opacity="0.8"/>'
      + '<path d="' + flatBody + '" fill="url(#' + gid + ')" stroke="' + strokeColor + '" stroke-width="0.9"/>'
      + '<path d="' + fTailPath + '" fill="none" stroke="' + finFill + '" stroke-width="1.5" opacity="0.85"/>';
    if (!filled) {
      svgFlat += '<circle cx="' + f(fEye1x) + '" cy="' + f(fEyeY) + '" r="' + f(fEyeR) + '" fill="' + eyeColor + '"/>'
        + '<circle cx="' + f(fEye1x - fEyeR*0.28) + '" cy="' + f(fEyeY - fEyeR*0.28) + '" r="' + f(fEyeR*0.28) + '" fill="rgba(255,255,255,0.65)"/>'
        + '<circle cx="' + f(fEye2x) + '" cy="' + f(fEyeY) + '" r="' + f(fEyeR * 0.85) + '" fill="' + eyeColor + '"/>';
    }
    svgFlat += '</svg>';
    return svgFlat;
  }

  // =====================================================================
  // 通常の魚 (standard / deep / slender / round)
  // 口先→背中の盛り上がり→尾柄のくびれ→尾びれ→腹→口先を3次ベジェで。
  // =====================================================================

  // キャンバス上での各寸法を計算
  // 魚全体を w×h に収める。マージン少し確保。
  var marginX = w * 0.04;
  var marginY = h * 0.08;

  // bodyH に応じて体高を決める
  var bodyHpx; // 体の最大高さ(半値)
  if (profile === 'deep')    { bodyHpx = h * 0.40; }
  else if (profile === 'slender') { bodyHpx = h * 0.16; }
  else if (profile === 'round')   { bodyHpx = h * 0.34; }
  else { bodyHpx = h * (bodyH * 1.55 + 0.10); } // standard
  bodyHpx = Math.min(bodyHpx, h * 0.46);
  bodyHpx = Math.max(bodyHpx, h * 0.12);

  // 横方向の主要X座標
  var snoutShift = (m.snout === 'long') ? w * 0.09 : (m.snout === 'pointed' ? w * 0.04 : 0.0);
  var xHead = w - marginX - snoutShift;  // 口先X
  var xBodyMax = w * 0.62;               // 最大体高の位置
  var xPeduncle = w * 0.20;             // 尾柄くびれ位置
  var xTailBase = w * 0.12;             // 尾ひれ基部X

  // Y基準: 画面中央より少し上(背びれが上へ出るため)
  var cy = h * 0.52;

  // 口先Y(吻の形によってわずかに異なる)
  var snoutYOff = (m.snout === 'blunt') ? bodyHpx * 0.08 : 0;

  // 尾柄のくびれ(体高の比)
  var pedH = bodyHpx * 0.30;  // 尾柄半高

  // ── ボディパス(背側→尾→腹側→口先) ──
  // 背側: 口先→背中最高点→尾柄
  var dorsalPeak = cy - bodyHpx;                  // 背中最高点Y
  var dorsalPeakX = xBodyMax + (xHead - xBodyMax) * 0.15; // 少し前寄り

  // 腹側の最低点
  var ventPeak = cy + bodyHpx * 0.72;
  var ventPeakX = xBodyMax - (xBodyMax - xTailBase) * 0.15;

  // mouth Y (吻の中央)
  var mouthY = cy + snoutYOff;

  var bodyPath =
    // 口先へ
    'M ' + f(xHead) + ',' + f(mouthY)
    // 背側: 口先→背中の盛り上がり→尾柄
    + ' C ' + f(xHead - (xHead-xBodyMax)*0.30) + ',' + f(cy - bodyHpx * 0.55)
    + ' '   + f(dorsalPeakX) + ',' + f(dorsalPeak)
    + ' '   + f(xBodyMax) + ',' + f(dorsalPeak + bodyHpx*0.05)
    + ' C ' + f(xBodyMax - (xBodyMax-xPeduncle)*0.35) + ',' + f(cy - bodyHpx * 0.60)
    + ' '   + f(xPeduncle + (xBodyMax-xPeduncle)*0.25) + ',' + f(cy - pedH * 1.2)
    + ' '   + f(xPeduncle) + ',' + f(cy - pedH)
    // 尾柄から尾ひれ基部へ
    + ' C ' + f(xPeduncle - (xPeduncle-xTailBase)*0.55) + ',' + f(cy - pedH * 0.9)
    + ' '   + f(xTailBase + (xPeduncle-xTailBase)*0.2) + ',' + f(cy - pedH * 0.6)
    + ' '   + f(xTailBase) + ',' + f(cy);

  // ── 尾ひれ ──
  var tailSpread, tailTipX, notchX;
  var tailPaths = '';

  if (tail === 'forked') {
    tailSpread = bodyHpx * 0.82;
    tailTipX   = xTailBase - w * 0.14;
    notchX     = xTailBase - w * 0.06;
    // 上葉
    tailPaths +=
      ' L ' + f(xTailBase) + ',' + f(cy - pedH * 0.4)
      + ' C ' + f(notchX) + ',' + f(cy - tailSpread*0.35)
      + ' '   + f(tailTipX + w*0.03) + ',' + f(cy - tailSpread*0.75)
      + ' '   + f(tailTipX) + ',' + f(cy - tailSpread)
      // 切れ込み
      + ' C ' + f(tailTipX + w*0.04) + ',' + f(cy - tailSpread*0.55)
      + ' '   + f(xTailBase - w*0.03) + ',' + f(cy - pedH*0.15)
      + ' '   + f(xTailBase) + ',' + f(cy)
      // 下葉
      + ' C ' + f(xTailBase - w*0.03) + ',' + f(cy + pedH*0.15)
      + ' '   + f(tailTipX + w*0.04) + ',' + f(cy + tailSpread*0.55)
      + ' '   + f(tailTipX) + ',' + f(cy + tailSpread)
      + ' C ' + f(tailTipX + w*0.03) + ',' + f(cy + tailSpread*0.75)
      + ' '   + f(notchX) + ',' + f(cy + tailSpread*0.35)
      + ' '   + f(xTailBase) + ',' + f(cy + pedH*0.4);
  } else if (tail === 'lunate') {
    // 三日月形: 深く切れ込む
    tailSpread = bodyHpx * 1.0;
    tailTipX   = xTailBase - w * 0.20;
    var lNotchX = xTailBase - w * 0.04;
    tailPaths +=
      ' L ' + f(xTailBase) + ',' + f(cy - pedH * 0.5)
      + ' C ' + f(lNotchX) + ',' + f(cy - tailSpread*0.4)
      + ' '   + f(tailTipX + w*0.04) + ',' + f(cy - tailSpread*0.72)
      + ' '   + f(tailTipX) + ',' + f(cy - tailSpread)
      + ' C ' + f(tailTipX + w*0.06) + ',' + f(cy - tailSpread*0.5)
      + ' '   + f(lNotchX - w*0.01) + ',' + f(cy - pedH * 0.08)
      + ' '   + f(xTailBase) + ',' + f(cy)
      + ' C ' + f(lNotchX - w*0.01) + ',' + f(cy + pedH * 0.08)
      + ' '   + f(tailTipX + w*0.06) + ',' + f(cy + tailSpread*0.5)
      + ' '   + f(tailTipX) + ',' + f(cy + tailSpread)
      + ' C ' + f(tailTipX + w*0.04) + ',' + f(cy + tailSpread*0.72)
      + ' '   + f(lNotchX) + ',' + f(cy + tailSpread*0.4)
      + ' '   + f(xTailBase) + ',' + f(cy + pedH * 0.5);
  } else if (tail === 'rounded') {
    tailSpread = bodyHpx * 0.72;
    tailTipX   = xTailBase - w * 0.12;
    tailPaths +=
      ' L ' + f(xTailBase) + ',' + f(cy - pedH * 0.55)
      + ' C ' + f(tailTipX + w*0.04) + ',' + f(cy - tailSpread*0.55)
      + ' '   + f(tailTipX) + ',' + f(cy - tailSpread * 0.3)
      + ' '   + f(tailTipX) + ',' + f(cy)
      + ' C ' + f(tailTipX) + ',' + f(cy + tailSpread * 0.3)
      + ' '   + f(tailTipX + w*0.04) + ',' + f(cy + tailSpread*0.55)
      + ' '   + f(xTailBase) + ',' + f(cy + pedH * 0.55);
  } else if (tail === 'pointed') {
    tailSpread = bodyHpx * 0.52;
    tailTipX   = xTailBase - w * 0.16;
    tailPaths +=
      ' L ' + f(xTailBase) + ',' + f(cy - pedH * 0.45)
      + ' C ' + f(xTailBase - w*0.05) + ',' + f(cy - tailSpread*0.5)
      + ' '   + f(tailTipX + w*0.06) + ',' + f(cy - tailSpread*0.5)
      + ' '   + f(tailTipX) + ',' + f(cy)
      + ' C ' + f(tailTipX + w*0.06) + ',' + f(cy + tailSpread*0.5)
      + ' '   + f(xTailBase - w*0.05) + ',' + f(cy + tailSpread*0.5)
      + ' '   + f(xTailBase) + ',' + f(cy + pedH * 0.45);
  } else {
    // truncate: まっすぐ切れた尾
    tailSpread = bodyHpx * 0.70;
    tailTipX   = xTailBase - w * 0.07;
    tailPaths +=
      ' L ' + f(xTailBase) + ',' + f(cy - pedH * 0.52)
      + ' L ' + f(tailTipX) + ',' + f(cy - tailSpread)
      + ' L ' + f(tailTipX) + ',' + f(cy + tailSpread)
      + ' L ' + f(xTailBase) + ',' + f(cy + pedH * 0.52);
  }

  // 腹側: 尾ひれ基部→腹の丸み→口先
  bodyPath += tailPaths
    + ' C ' + f(xTailBase + (xPeduncle-xTailBase)*0.2) + ',' + f(cy + pedH * 0.6)
    + ' '   + f(xPeduncle - (xPeduncle-xTailBase)*0.25) + ',' + f(cy + pedH * 1.2)
    + ' '   + f(xPeduncle) + ',' + f(cy + pedH)
    + ' C ' + f(xPeduncle + (xBodyMax-xPeduncle)*0.30) + ',' + f(cy + bodyHpx * 0.62)
    + ' '   + f(ventPeakX) + ',' + f(ventPeak)
    + ' '   + f(xBodyMax) + ',' + f(ventPeak - bodyHpx*0.05)
    + ' C ' + f(xBodyMax + (xHead-xBodyMax)*0.30) + ',' + f(cy + bodyHpx * 0.55)
    + ' '   + f(xHead - (xHead-xBodyMax)*0.28) + ',' + f(mouthY + bodyHpx * 0.30)
    + ' '   + f(xHead) + ',' + f(mouthY)
    + ' Z';

  // ── 背鰭 (dorsal) ──
  var dorsalSVG = '';
  var dStart = m.dorsal ? m.dorsal.start : 0.28;
  var dEnd   = m.dorsal ? m.dorsal.end   : 0.62;
  var dH     = m.dorsal ? m.dorsal.h     : 0.10;
  var spiny  = m.dorsal ? m.dorsal.spiny : false;
  // 背鰭のX座標: 体長割合を画面座標に変換(右が口先=1.0、左が尾=0.0)
  var bodyLen = xHead - xTailBase;
  var dxStart = xTailBase + bodyLen * (1.0 - dEnd);
  var dxEnd   = xTailBase + bodyLen * (1.0 - dStart);
  var dxMid   = (dxStart + dxEnd) * 0.5;
  var dTopY   = dorsalPeak - h * dH * 0.8;
  // 背鰭基部Y(背中ライン上)
  var dBaseY  = dorsalPeak + bodyHpx * 0.06;
  dorsalSVG =
    'M ' + f(dxEnd) + ',' + f(dBaseY)
    + ' C ' + f(dxEnd - (dxEnd-dxMid)*0.3) + ',' + f(dBaseY - h*dH*0.5)
    + ' '   + f(dxMid + (dxEnd-dxMid)*0.2) + ',' + f(dTopY + h*dH*0.1)
    + ' '   + f(dxMid) + ',' + f(dTopY)
    + ' C ' + f(dxMid - (dxMid-dxStart)*0.2) + ',' + f(dTopY + h*dH*0.1)
    + ' '   + f(dxStart + (dxMid-dxStart)*0.3) + ',' + f(dBaseY - h*dH*0.4)
    + ' '   + f(dxStart) + ',' + f(dBaseY)
    + ' Z';

  // 棘条(spiny)があれば細い縦線を数本追加
  var spinySVG = '';
  if (spiny && !filled) {
    var spineCount = 5;
    for (var si = 0; si < spineCount; si++) {
      var sxRatio = (si + 0.5) / spineCount;
      var sx = dxEnd + (dxStart - dxEnd) * sxRatio;
      var sTopY2 = dTopY + (dxMid - sx) * (dxMid - sx) / (bodyLen * bodyLen * 0.04) * h * dH * 0.5;
      var sBaseY2 = dBaseY;
      spiny && (spinySVG += '<line x1="' + f(sx) + '" y1="' + f(sBaseY2) + '" x2="' + f(sx) + '" y2="' + f(sTopY2 + h*dH*0.12) + '" stroke="' + finFill + '" stroke-width="0.5" opacity="0.6"/>');
    }
  }

  // ── 臀鰭 (anal) ──
  var analSVG = '';
  var aStart = m.anal ? m.anal.start : 0.60;
  var aEnd   = m.anal ? m.anal.end   : 0.78;
  var aH     = m.anal ? m.anal.h     : 0.07;
  var axStart = xTailBase + bodyLen * (1.0 - aEnd);
  var axEnd   = xTailBase + bodyLen * (1.0 - aStart);
  var axMid   = (axStart + axEnd) * 0.5;
  var aBaseY  = ventPeak - bodyHpx * 0.05;
  var aBotY   = aBaseY + h * aH * 0.75;
  analSVG =
    'M ' + f(axEnd) + ',' + f(aBaseY)
    + ' C ' + f(axMid + (axEnd-axMid)*0.2) + ',' + f(aBotY - h*aH*0.1)
    + ' '   + f(axMid) + ',' + f(aBotY)
    + ' '   + f(axStart) + ',' + f(aBaseY)
    + ' Z';

  // ── 胸鰭 (pectoral) ──
  var pectoralSVG = '';
  var pSize = m.pectoral !== undefined ? m.pectoral : 0.16;
  var pBaseX = xTailBase + bodyLen * 0.72;
  var pBaseY = cy - bodyHpx * 0.05;
  var pLen   = bodyHpx * pSize * 3.5;
  var pSpread = bodyHpx * 0.35;
  pectoralSVG =
    'M ' + f(pBaseX) + ',' + f(pBaseY)
    + ' C ' + f(pBaseX - pLen*0.3) + ',' + f(pBaseY - pSpread*0.4)
    + ' '   + f(pBaseX - pLen*0.7) + ',' + f(pBaseY + pSpread*0.3)
    + ' '   + f(pBaseX - pLen) + ',' + f(pBaseY + pSpread * 0.6)
    + ' C ' + f(pBaseX - pLen*0.65) + ',' + f(pBaseY + pSpread)
    + ' '   + f(pBaseX - pLen*0.3) + ',' + f(pBaseY + pSpread * 0.5)
    + ' '   + f(pBaseX) + ',' + f(pBaseY)
    + ' Z';

  // ── 目 ──
  var eyeR  = Math.max(2.5, bodyHpx * 0.175);
  var eyeX  = xTailBase + bodyLen * 0.82;
  var eyeY  = cy - bodyHpx * 0.22;
  // 吻が長い魚は目を前寄りに
  if (m.snout === 'long') { eyeX += bodyLen * 0.03; }

  // ── SVG組み立て ──
  var svgStr =
    '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '">'
    + '<defs>'
    + '<linearGradient id="' + gid + '" x1="0" y1="0" x2="0" y2="1">'
    + '<stop offset="0%" stop-color="' + backCol + '"/>'
    + '<stop offset="55%" stop-color="' + bodyFill + '"/>'
    + '<stop offset="100%" stop-color="' + bellyCol + '"/>'
    + '</linearGradient>'
    + '<linearGradient id="' + gidFin + '" x1="0" y1="0" x2="0" y2="1">'
    + '<stop offset="0%" stop-color="' + finFill + '" stop-opacity="0.9"/>'
    + '<stop offset="100%" stop-color="' + finFill + '" stop-opacity="0.5"/>'
    + '</linearGradient>'
    + '</defs>';

  // 胸鰭(体の下レイヤ)
  svgStr += '<path d="' + pectoralSVG + '" fill="url(#' + gidFin + ')" stroke="' + strokeColor + '" stroke-width="0.6" opacity="0.8"/>';
  // 臀鰭
  svgStr += '<path d="' + analSVG + '" fill="url(#' + gidFin + ')" stroke="' + strokeColor + '" stroke-width="0.6" opacity="0.8"/>';
  // ボディ
  svgStr += '<path d="' + bodyPath + '" fill="url(#' + gid + ')" stroke="' + strokeColor + '" stroke-width="0.9"/>';
  // 背鰭
  svgStr += '<path d="' + dorsalSVG + '" fill="url(#' + gidFin + ')" stroke="' + strokeColor + '" stroke-width="0.7" opacity="0.9"/>';
  svgStr += spinySVG;

  // 目
  if (!filled) {
    svgStr += '<circle cx="' + f(eyeX) + '" cy="' + f(eyeY) + '" r="' + f(eyeR) + '" fill="' + eyeColor + '"/>'
      + '<circle cx="' + f(eyeX - eyeR*0.28) + '" cy="' + f(eyeY - eyeR*0.28) + '" r="' + f(eyeR*0.28) + '" fill="rgba(255,255,255,0.70)"/>';
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
      + '<div class="ui-title__sub"><span>〜</span><span>磯</span><span>の</span><span>主</span><span>を</span><span>求</span><span>め</span><span>て</span><span>〜</span></div>'
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
    // equipped.rod / bait は文字列ID。TACKLE_* から名前を引く
    if (rodEl && eq.rod) {
      var rodName = '—';
      try {
        for (var ri = 0; ri < TACKLE_RODS.length; ri++) {
          if (TACKLE_RODS[ri].id === eq.rod) { rodName = TACKLE_RODS[ri].name; break; }
        }
      } catch(e) {}
      rodEl.textContent = rodName;
    }
    if (baitEl && eq.bait) {
      var baitName = eq.bait;
      try {
        for (var bi = 0; bi < TACKLE_BAITS.length; bi++) {
          if (TACKLE_BAITS[bi].id === eq.bait) { baitName = TACKLE_BAITS[bi].name; break; }
        }
      } catch(e) {}
      baitEl.textContent = baitName;
    }
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
        // equipped[catKey] は文字列ID、owned配列も文字列ID配列
        var isEquipped = equipped[catKey] === item.id;
        var isOwned    = tab === 'bait' ? true : ownedArr.some(function(o){ return o === item.id; });

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
