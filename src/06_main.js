// 06_main.js — 起動・カメラ・竿モデル・メインループ
// トップレベル宣言: App* のみ
// import/export 禁止。THREE はスコープにある前提。

(function() {
  /* ============================================================
     レンダラ・シーン・カメラ
     ============================================================ */
  var AppRenderer = new THREE.WebGLRenderer({ antialias: true });
  AppRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  AppRenderer.setSize(window.innerWidth, window.innerHeight);
  AppRenderer.toneMapping = THREE.ACESFilmicToneMapping;
  AppRenderer.toneMappingExposure = 1.0;
  AppRenderer.outputColorSpace = THREE.SRGBColorSpace;
  AppRenderer.shadowMap.enabled = true;
  AppRenderer.shadowMap.type    = THREE.PCFSoftShadowMap;
  document.body.appendChild(AppRenderer.domElement);

  var AppScene  = new THREE.Scene();
  var AppCamera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);

  /* ============================================================
     環境生成
     ============================================================ */
  var AppEnv = EnvCreate(AppScene, AppRenderer);
  var AppStandY = (AppEnv && AppEnv.standY !== undefined) ? AppEnv.standY : 0;
  AppCamera.position.set(0, AppStandY + 1.6, 2);
  AppCamera.lookAt(0, AppStandY + 1.2, -20);

  /* ============================================================
     UI & GameCore
     ============================================================ */
  var AppUI   = new UIController(document.getElementById('ui-root'));
  var AppGame = new GameCore(AppEnv, AppUI);
  AppUI.bind(AppGame);

  // デバッグ用グローバルフック (QA自動化用)
  window.__game = AppGame;
  window.__env  = AppEnv;

  // floatObj をシーンに追加
  if (AppGame.floatObj) AppScene.add(AppGame.floatObj);

  // タイトル画面を開く
  AppUI.openTitle();

  /* ============================================================
     視点操作 (ヨー±60° ピッチ±30°)
     ============================================================ */
  var AppYaw   = 0;
  var AppPitch = -5 * Math.PI / 180; // わずかに下向き
  var AppYawV  = 0;   // 慣性
  var AppPitchV = 0;

  var _dragActive = false;
  var _dragLastX  = 0;
  var _dragLastY  = 0;

  var _touchActive = false;
  var _touchLastX  = 0;
  var _touchLastY  = 0;

  function _isUITarget(e) {
    // canvas 上のみゲーム入力 → UIパネル/ボタンは除外
    return e.target !== AppRenderer.domElement;
  }

  AppRenderer.domElement.addEventListener('pointerdown', function(e) {
    _dragActive = true;
    _dragLastX  = e.clientX;
    _dragLastY  = e.clientY;
    AppGame.pressStart();
  });

  window.addEventListener('pointerup', function(e) {
    if (_dragActive) {
      _dragActive = false;
      AppGame.pressEnd();
    }
  });

  window.addEventListener('pointermove', function(e) {
    if (!_dragActive) return;
    var dx = e.clientX - _dragLastX;
    var dy = e.clientY - _dragLastY;
    _dragLastX = e.clientX;
    _dragLastY = e.clientY;
    AppYawV   += dx * 0.003;
    AppPitchV += dy * 0.002;
  });

  // タッチ
  AppRenderer.domElement.addEventListener('touchstart', function(e) {
    if (e.touches.length > 0) {
      _touchActive = true;
      _touchLastX  = e.touches[0].clientX;
      _touchLastY  = e.touches[0].clientY;
    }
  }, { passive: true });

  window.addEventListener('touchend', function(e) {
    _touchActive = false;
  }, { passive: true });

  window.addEventListener('touchmove', function(e) {
    if (!_touchActive || e.touches.length === 0) return;
    var dx = e.touches[0].clientX - _touchLastX;
    var dy = e.touches[0].clientY - _touchLastY;
    _touchLastX = e.touches[0].clientX;
    _touchLastY = e.touches[0].clientY;
    AppYawV   += dx * 0.003;
    AppPitchV += dy * 0.002;
  }, { passive: true });

  /* ============================================================
     小魚の群れ (水面下 5匹)
     ============================================================ */
  var AppSchoolFish   = [];
  var AppSchoolAngles = [];
  var _schoolSpecies  = (function() {
    // アジかイワシを探す
    for (var i = 0; i < SPECIES.length; i++) {
      if (SPECIES[i].id === 'aji' || SPECIES[i].id === 'iwashi') return SPECIES[i];
    }
    return SPECIES[0];
  })();

  for (var _si = 0; _si < 5; _si++) {
    var _sfMesh = FishCreateMesh(_schoolSpecies, 12);
    _sfMesh.scale.setScalar(0.5);
    AppSchoolAngles.push((_si / 5) * Math.PI * 2);
    AppSchoolFish.push(_sfMesh);
    AppScene.add(_sfMesh);
  }

  /* ============================================================
     竿 (一人称、カメラ追従) — 磯竿テーパー設計
     ============================================================ */
  var AppRodGroup = new THREE.Group(); // カメラに追従させる別オブジェクト

  // ブランク材質: 艶のある濃茶〜黒 clearcoat高め
  var _rodMat = new THREE.MeshPhysicalMaterial({
    color: 0x1a0e06,
    roughness: 0.25,
    metalness: 0.05,
    clearcoat: 0.85,
    clearcoatRoughness: 0.12
  });

  // コルク/EVAグリップ材質 (手元 30cm 程度)
  var _gripMat = new THREE.MeshStandardMaterial({
    color: 0x8b6450,
    roughness: 0.88,
    metalness: 0.0
  });

  // リールシート材質: ガンメタ
  var _reelSeatMat = new THREE.MeshStandardMaterial({
    color: 0x3a3a3a,
    roughness: 0.4,
    metalness: 0.6
  });

  // リールボディ/ローター材質: アルミシルバー
  var _reelBodyMat = new THREE.MeshPhysicalMaterial({
    color: 0xb8c0c8,
    roughness: 0.25,
    metalness: 0.85,
    clearcoat: 0.4,
    clearcoatRoughness: 0.15
  });

  // スプール (糸巻き面): 少し暗めのシルバー
  var _spoolMat = new THREE.MeshStandardMaterial({
    color: 0x9aa0a8,
    roughness: 0.35,
    metalness: 0.75
  });

  // ベール/ガイド: 金属リング
  var _metalMat = new THREE.MeshStandardMaterial({
    color: 0xd0d8e0,
    roughness: 0.15,
    metalness: 0.92
  });

  // 穂先白塗り
  var _tipMat = new THREE.MeshStandardMaterial({
    color: 0xf0f0ee,
    roughness: 0.6,
    metalness: 0.0
  });

  // ハンドルノブ
  var _knobMat = new THREE.MeshStandardMaterial({
    color: 0x222222,
    roughness: 0.55,
    metalness: 0.1
  });

  // 竿を構成する頂点 (CatmullRom制御点) — ローカル座標
  // 竿根元(画面右下) → 竿先へ向かう
  var _rodCtrlPts = [
    new THREE.Vector3( 0.22, -0.28, -0.18),
    new THREE.Vector3( 0.18, -0.12, -0.55),
    new THREE.Vector3( 0.12,  0.04, -0.95),
    new THREE.Vector3( 0.05,  0.18, -1.40),
    new THREE.Vector3(-0.02,  0.28, -1.85),
    new THREE.Vector3(-0.06,  0.34, -2.30)
  ];
  var _rodCurve    = new THREE.CatmullRomCurve3(_rodCtrlPts);
  var _rodSegments = 24;

  // テーパー付き TubeGeometry — 制御点ごとに半径を変える
  // THREE.TubeGeometry は単一半径のみなので、複数セグメントを結合
  function _buildTaperedRod(curve, segs, radBase, radTip) {
    // セグメントを分割して各部分の半径を線形補間
    var positions = [];
    var normals   = [];
    var uvs       = [];
    var indices   = [];
    var radialSegs = 8;

    var points    = curve.getPoints(segs);
    var frames    = curve.computeFrenetFrames(segs, false);

    for (var i = 0; i <= segs; i++) {
      var t      = i / segs;
      // テーパー: 穂先ほど細く (二乗カーブで自然な絞り)
      var radius = radBase + (radTip - radBase) * (t * t);
      var pt     = points[i];
      var N      = frames.normals[i];
      var B      = frames.binormals[i];

      for (var j = 0; j <= radialSegs; j++) {
        var phi = (j / radialSegs) * Math.PI * 2;
        var cos = Math.cos(phi);
        var sin = Math.sin(phi);
        var nx  = cos * N.x + sin * B.x;
        var ny  = cos * N.y + sin * B.y;
        var nz  = cos * N.z + sin * B.z;
        positions.push(pt.x + nx * radius, pt.y + ny * radius, pt.z + nz * radius);
        normals.push(nx, ny, nz);
        uvs.push(j / radialSegs, t);
      }
    }

    for (var i = 0; i < segs; i++) {
      for (var j = 0; j < radialSegs; j++) {
        var a = i * (radialSegs + 1) + j;
        var b = a + radialSegs + 1;
        indices.push(a, b, a + 1);
        indices.push(b, b + 1, a + 1);
      }
    }

    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
    geo.setAttribute('normal',   new THREE.BufferAttribute(new Float32Array(normals), 3));
    geo.setAttribute('uv',       new THREE.BufferAttribute(new Float32Array(uvs), 2));
    geo.setIndex(new THREE.BufferAttribute(new Uint16Array(indices), 1));
    return geo;
  }

  // 竿ブランク本体 (根元r=0.010, 穂先r=0.0025)
  var _rodGeo  = _buildTaperedRod(_rodCurve, _rodSegments, 0.010, 0.0025);
  var _rodMesh = new THREE.Mesh(_rodGeo, _rodMat);
  AppRodGroup.add(_rodMesh);

  // コルク/EVAグリップ: 根元〜20cm 程度を太く柔らかく
  // CatmullRom で根元だけの短い曲線
  var _gripCurve = new THREE.CatmullRomCurve3([
    _rodCtrlPts[0].clone(),
    _rodCtrlPts[0].clone().lerp(_rodCtrlPts[1], 0.35)
  ]);
  var _gripGeo   = _buildTaperedRod(_gripCurve, 6, 0.016, 0.013);
  var _gripMesh  = new THREE.Mesh(_gripGeo, _gripMat);
  AppRodGroup.add(_gripMesh);

  // リールシート (グリップ前方): 短いシリンダー状
  var _reelSeatPt  = _rodCtrlPts[0].clone().lerp(_rodCtrlPts[1], 0.35);
  var _reelSeatPt2 = _rodCtrlPts[0].clone().lerp(_rodCtrlPts[1], 0.55);
  var _seatCurve   = new THREE.CatmullRomCurve3([_reelSeatPt, _reelSeatPt2]);
  var _seatGeo     = _buildTaperedRod(_seatCurve, 4, 0.014, 0.012);
  var _seatMesh    = new THREE.Mesh(_seatGeo, _reelSeatMat);
  AppRodGroup.add(_seatMesh);

  // 穂先だけ白塗り (t=0.85〜1.0 の短いセグメント)
  var _tipStartPt = _rodCurve.getPoint(0.85);
  var _tipEndPt   = _rodCurve.getPoint(1.0);
  var _tipCurve   = new THREE.CatmullRomCurve3([
    _tipStartPt,
    _rodCurve.getPoint(0.92),
    _tipEndPt
  ]);
  var _tipGeo  = _buildTaperedRod(_tipCurve, 8, 0.0022, 0.0012);
  var _tipMesh = new THREE.Mesh(_tipGeo, _tipMat);
  AppRodGroup.add(_tipMesh);

  /* ---- スピニングリール (ボディ+ローター+スプール+ベール+ハンドル) ---- */
  var _reelGroup = new THREE.Group();
  // リール取り付け位置: グリップ直前
  var _reelAttachPt = _rodCtrlPts[0].clone().lerp(_rodCtrlPts[1], 0.48);
  _reelGroup.position.copy(_reelAttachPt);
  // リールシート方向に回転
  var _seatTan = _rodCurve.getTangent(0.06);
  _reelGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), _seatTan.normalize());

  // ボディ (扁平な楕円形状)
  var _bodyGeo = new THREE.CylinderGeometry(0.020, 0.018, 0.030, 16);
  var _bodyMesh = new THREE.Mesh(_bodyGeo, _reelBodyMat);
  _bodyMesh.rotation.z = Math.PI / 2;
  _bodyMesh.position.set(-0.025, 0, 0);
  _reelGroup.add(_bodyMesh);

  // ローター (フット側: 薄いディスク)
  var _rotorGeo  = new THREE.CylinderGeometry(0.022, 0.022, 0.008, 16);
  var _rotorMesh = new THREE.Mesh(_rotorGeo, _reelBodyMat);
  _rotorMesh.rotation.z = Math.PI / 2;
  _rotorMesh.position.set(-0.006, 0, 0);
  _reelGroup.add(_rotorMesh);

  // スプール (糸巻き面: フランジ付き)
  var _spoolGeo  = new THREE.CylinderGeometry(0.018, 0.018, 0.018, 14);
  var _spoolMesh = new THREE.Mesh(_spoolGeo, _spoolMat);
  _spoolMesh.rotation.z = Math.PI / 2;
  _spoolMesh.position.set(0.012, 0, 0);
  _reelGroup.add(_spoolMesh);
  // スプールフランジ前後
  var _flangeGeo = new THREE.CylinderGeometry(0.023, 0.023, 0.004, 14);
  var _flangeF   = new THREE.Mesh(_flangeGeo, _spoolMat);
  _flangeF.rotation.z = Math.PI / 2;
  _flangeF.position.set(0.021, 0, 0);
  _reelGroup.add(_flangeF);
  var _flangeB   = new THREE.Mesh(_flangeGeo, _spoolMat);
  _flangeB.rotation.z = Math.PI / 2;
  _flangeB.position.set(0.002, 0, 0);
  _reelGroup.add(_flangeB);

  // ベール (細い金属アーチ): TorusGeometry の一部
  var _bailGeo  = new THREE.TorusGeometry(0.024, 0.0018, 6, 20, Math.PI);
  var _bailMesh = new THREE.Mesh(_bailGeo, _metalMat);
  _bailMesh.rotation.y = Math.PI / 2;
  _bailMesh.position.set(-0.002, 0.0, 0);
  _reelGroup.add(_bailMesh);

  // ハンドルアーム
  var _armGeo  = new THREE.CylinderGeometry(0.003, 0.003, 0.038, 8);
  var _armMesh = new THREE.Mesh(_armGeo, _metalMat);
  _armMesh.rotation.x = Math.PI / 2;
  _armMesh.position.set(-0.025, 0.019, 0.0);
  _reelGroup.add(_armMesh);

  // ハンドルノブ
  var _knobGeo  = new THREE.CylinderGeometry(0.007, 0.006, 0.014, 8);
  var _knobMesh = new THREE.Mesh(_knobGeo, _knobMat);
  _knobMesh.rotation.x = Math.PI / 2;
  _knobMesh.position.set(-0.025, 0.038, 0.0);
  _reelGroup.add(_knobMesh);

  AppRodGroup.add(_reelGroup);

  // ガイドリング (6個) — 小さな金属リング+足
  var _guideMat  = new THREE.MeshStandardMaterial({ color: 0xd0d8e0, metalness: 0.92, roughness: 0.12 });
  var _guideRing = [];
  // t=0.10〜0.92 に6個配置 (先端ほど小さく)
  var _guideT    = [0.10, 0.25, 0.42, 0.58, 0.74, 0.88];
  var _guideRadii = [0.010, 0.009, 0.008, 0.007, 0.006, 0.005]; // リング半径
  for (var _gi = 0; _gi < _guideT.length; _gi++) {
    var _gpt  = _rodCurve.getPoint(_guideT[_gi]);
    var _gTan = _rodCurve.getTangent(_guideT[_gi]);
    var _gGrp = new THREE.Group();
    _gGrp.position.copy(_gpt);
    _gGrp.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), _gTan.normalize());

    // リング本体 (竿方向に向いたトーラス)
    var _gRingGeo  = new THREE.TorusGeometry(_guideRadii[_gi], 0.0015, 5, 12);
    var _gRingMesh = new THREE.Mesh(_gRingGeo, _guideMat);
    _gGrp.add(_gRingMesh);

    // 足 (竿に沿った小さなシリンダー)
    var _footGeo  = new THREE.CylinderGeometry(0.001, 0.001, _guideRadii[_gi] * 1.6, 5);
    var _footMesh = new THREE.Mesh(_footGeo, _guideMat);
    _footMesh.position.set(0, _guideRadii[_gi] * 0.8, 0.001);
    _gGrp.add(_footMesh);

    AppRodGroup.add(_gGrp);
    _guideRing.push(_gGrp);
  }

  AppScene.add(AppRodGroup);

  /* ============================================================
     ライン (竿先→ウキ QuadraticBezier) — 細く半透明グレー
     ============================================================ */
  var _linePts   = [];
  var _lineDivs  = 20;
  for (var _li = 0; _li <= _lineDivs; _li++) _linePts.push(new THREE.Vector3());

  var _lineGeo = new THREE.BufferGeometry();
  var _linePos = new Float32Array((_lineDivs + 1) * 3);
  _lineGeo.setAttribute('position', new THREE.BufferAttribute(_linePos, 3));

  // 細く見せるため: 薄いグレー + 半透明
  var _lineMat  = new THREE.LineBasicMaterial({
    color: 0xa0a8a0,
    transparent: true,
    opacity: 0.45,
    linewidth: 1
  });
  var _lineMesh = new THREE.Line(_lineGeo, _lineMat);
  AppScene.add(_lineMesh);

  // 竿先ワールド座標を取得するための一時ベクタ
  var _rodTipLocal = new THREE.Vector3();
  var _rodTipWorld = new THREE.Vector3();

  /* ============================================================
     ファイト中の魚メッシュ
     ============================================================ */
  var AppHookedMesh = null;

  /* ============================================================
     ランディング演出
     ============================================================ */
  var _landingMesh     = null;
  var _landingTimer    = 0;
  var _landingDuration = 3.0;
  var _landingDone     = false;
  var _landingLight    = null; // 魚用フィルライト

  /* ============================================================
     タイトルパン
     ============================================================ */
  var _titlePanT = 0;

  /* ============================================================
     リサイズ
     ============================================================ */
  window.addEventListener('resize', function() {
    AppCamera.aspect = window.innerWidth / window.innerHeight;
    AppCamera.updateProjectionMatrix();
    AppRenderer.setSize(window.innerWidth, window.innerHeight);
  });

  /* ============================================================
     竿ジオメトリ更新 (テーパー付き再構築)
     ============================================================ */
  function AppUpdateRod(tension) {
    // テンションに応じて穂先側を曲げる (穂先ほど大きく曲がる自然な曲率)
    var bend = tension * 0.30;
    // 制御点3〜5を穂先方向に移動 (先端ほど大きく)
    _rodCtrlPts[3].y = 0.18  + bend * 0.25;
    _rodCtrlPts[4].y = 0.28  + bend * 0.55;
    _rodCtrlPts[5].y = 0.34  + bend;
    _rodCtrlPts[5].z = -2.30 + bend * 0.35;
    _rodCurve.points = _rodCtrlPts;

    // テーパー付き Tube を再構築
    _rodGeo.dispose();
    _rodGeo = _buildTaperedRod(_rodCurve, _rodSegments, 0.010, 0.0025);
    _rodMesh.geometry = _rodGeo;

    // 穂先ジオメトリ更新
    _tipGeo.dispose();
    var _newTipStartPt = _rodCurve.getPoint(0.85);
    var _newTipCurve   = new THREE.CatmullRomCurve3([
      _newTipStartPt,
      _rodCurve.getPoint(0.92),
      _rodCurve.getPoint(1.0)
    ]);
    _tipGeo = _buildTaperedRod(_newTipCurve, 8, 0.0022, 0.0012);
    _tipMesh.geometry = _tipGeo;

    // ガイドリングの位置更新
    for (var i = 0; i < _guideRing.length; i++) {
      var pt  = _rodCurve.getPoint(_guideT[i]);
      var tan = _rodCurve.getTangent(_guideT[i]);
      _guideRing[i].position.copy(pt);
      _guideRing[i].quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tan.normalize());
    }
  }

  /* ============================================================
     ライン更新
     ============================================================ */
  function AppUpdateLine(tension) {
    // 竿先ワールド座標
    _rodTipLocal.copy(_rodCtrlPts[5]);
    AppRodGroup.localToWorld(_rodTipWorld.copy(_rodTipLocal));

    var floatPos = AppGame.floatObj && AppGame.floatObj.visible
      ? AppGame.floatObj.position
      : new THREE.Vector3(_rodTipWorld.x, _rodTipWorld.y - 2, _rodTipWorld.z - 10);

    // 中間制御点: たるみはテンションで減る (tension=0で大きくたるむ)
    var sageFactor = 1.0 - tension * 0.85;
    var midX = (_rodTipWorld.x + floatPos.x) * 0.5;
    var midY = Math.min(_rodTipWorld.y, floatPos.y) - sageFactor * 1.5;
    var midZ = (_rodTipWorld.z + floatPos.z) * 0.5;

    var ctrl0 = _rodTipWorld;
    var ctrl1 = new THREE.Vector3(midX, midY, midZ);
    var ctrl2 = floatPos;

    var posArr = _lineGeo.attributes.position.array;
    for (var i = 0; i <= _lineDivs; i++) {
      var tl = i / _lineDivs;
      var inv = 1 - tl;
      var px = inv * inv * ctrl0.x + 2 * inv * tl * ctrl1.x + tl * tl * ctrl2.x;
      var py = inv * inv * ctrl0.y + 2 * inv * tl * ctrl1.y + tl * tl * ctrl2.y;
      var pz = inv * inv * ctrl0.z + 2 * inv * tl * ctrl1.z + tl * tl * ctrl2.z;
      posArr[i * 3]     = px;
      posArr[i * 3 + 1] = py;
      posArr[i * 3 + 2] = pz;
    }
    _lineGeo.attributes.position.needsUpdate = true;
  }

  /* ============================================================
     ファイト中の魚影
     ============================================================ */
  function AppUpdateHookedFish(t) {
    var game = AppGame;
    if (game.state === 'fight' && game.hookedFish) {
      if (!AppHookedMesh) {
        AppHookedMesh = FishCreateMesh(game.hookedFish.species, game.hookedFish.sizeCm);
        AppScene.add(AppHookedMesh);
      }
      // ウキ位置付近を水面下で泳ぎ回る
      var fo  = game.floatObj;
      var fop = fo ? fo.position : new THREE.Vector3(0, 0, -15);
      var ang = t * 0.8;
      var rad = Math.min(game.fishDistance * 0.3, 4);
      AppHookedMesh.position.set(
        fop.x + Math.cos(ang) * rad,
        (AppEnv ? AppEnv.standY : 0) - 1.0 - game.fishDistance * 0.05,
        fop.z + Math.sin(ang) * rad
      );
      AppHookedMesh.rotation.y = ang + Math.PI;

      // ファイト中: ローター回転 (リールグループのローターを回す)
      if (_rotorMesh) {
        _rotorMesh.rotation.x += 0.03;
      }
    } else if (game.state !== 'fight' && game.state !== 'landed') {
      if (AppHookedMesh) {
        FishDispose(AppHookedMesh);
        AppScene.remove(AppHookedMesh);
        AppHookedMesh = null;
      }
    }
  }

  /* ============================================================
     ランディング演出 — 魚をカメラ前に掲げる
     ============================================================ */
  function AppHandleLanding(dt) {
    var game = AppGame;
    if (game.state === 'landed') {
      if (!_landingMesh && game.hookedFish) {
        // AppHookedMeshがなければここで生成 (fight経由せずlanded注入された場合等)
        if (!AppHookedMesh) {
          AppHookedMesh = FishCreateMesh(game.hookedFish.species, game.hookedFish.sizeCm);
          AppScene.add(AppHookedMesh);
        }
        // 魚をカメラ前に掲げる
        _landingMesh  = AppHookedMesh;
        AppHookedMesh = null;
        _landingTimer = 0;
        _landingDone  = false;

        // フィルライト追加 (魚を照らす薄い暖色ライト)
        if (!_landingLight) {
          _landingLight = new THREE.PointLight(0xffd080, 1.8, 2.5);
          AppScene.add(_landingLight);
        }
      }
      if (_landingMesh) {
        _landingTimer += dt;

        // カメラ正面 0.6m・やや下に配置
        var fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(AppCamera.quaternion);
        var targetPos = AppCamera.position.clone().addScaledVector(fwd, 0.6);
        targetPos.y -= 0.10; // やや下

        // サイズ調整: 大物でも画面に収まるようスケール制限
        // 魚はsizeCm/100 m の実寸。カメラ前0.6mでFOV60° → 画面高≒0.69m
        // 目標: 魚が画面高の約40%以内に収まるよう = 最大0.28m表示
        if (game.hookedFish) {
          var sizeCm = game.hookedFish.sizeCm;
          var fishLenM = sizeCm / 100;
          // 0.28m以内に制限
          var targetScale = Math.min(1.0, 0.28 / Math.max(fishLenM, 0.10));
          _landingMesh.scale.setScalar(targetScale);
        }

        _landingMesh.position.copy(targetPos);
        // 軽く回転して見せる (ゆっくり1回転)
        var rotAngle = _landingTimer * 1.2;
        _landingMesh.rotation.y = AppCamera.rotation.y + Math.sin(rotAngle) * 0.5;
        _landingMesh.rotation.x = Math.sin(_landingTimer * 0.8) * 0.12;

        // フィルライトを魚のやや斜め上に配置
        if (_landingLight) {
          _landingLight.position.copy(targetPos).addScaledVector(fwd, -0.1);
          _landingLight.position.y += 0.3;
          _landingLight.position.x += 0.2;
          // 演出終盤で徐々にフェードアウト
          if (_landingTimer > _landingDuration * 0.7) {
            var fadeRatio = 1.0 - (_landingTimer - _landingDuration * 0.7) / (_landingDuration * 0.3);
            _landingLight.intensity = Math.max(0, 1.8 * fadeRatio);
          }
        }

        if (_landingTimer > _landingDuration && !_landingDone) {
          _landingDone = true;
        }
      }
    } else {
      // idle などに戻ったらランディングメッシュを片付け
      if (_landingMesh) {
        FishDispose(_landingMesh);
        AppScene.remove(_landingMesh);
        _landingMesh  = null;
        _landingTimer = 0;
        _landingDone  = false;
      }
      // フィルライトも消す
      if (_landingLight) {
        AppScene.remove(_landingLight);
        _landingLight.dispose ? _landingLight.dispose() : null;
        _landingLight = null;
      }
    }
  }

  /* ============================================================
     カメラ更新
     ============================================================ */
  function AppUpdateCamera(dt) {
    var game = AppGame;
    var inertia = 0.88;

    if (game.state === 'title') {
      // 海と灯台が映える画角: やや右方向にパン、水平線と灯台を捉える
      _titlePanT += dt * 0.10;
      // 灯台が通常シーンの右前方にある想定でヨーを-0.15〜+0.25に振る
      AppYaw   = -0.10 + Math.sin(_titlePanT) * 0.22;
      AppPitch = -0.08; // 水平線がやや上方: 海面が広く見える
      AppYawV  = 0;
      AppPitchV = 0;
    } else {
      // 慣性
      AppYawV   *= inertia;
      AppPitchV *= inertia;
      AppYaw    += AppYawV;
      AppPitch  += AppPitchV;
    }

    // クランプ
    var maxYaw   =  60 * Math.PI / 180;
    var minPitch = -30 * Math.PI / 180;
    var maxPitch =  30 * Math.PI / 180;
    AppYaw   = Math.max(-maxYaw,   Math.min(maxYaw,   AppYaw));
    AppPitch = Math.max(minPitch,  Math.min(maxPitch, AppPitch));

    AppCamera.position.set(0, AppStandY + 1.6, 2);
    AppCamera.rotation.order = 'YXZ';
    AppCamera.rotation.y = AppYaw;
    AppCamera.rotation.x = AppPitch;

    // 竿グループをカメラに追従
    AppRodGroup.position.copy(AppCamera.position);
    AppRodGroup.rotation.copy(AppCamera.rotation);
  }

  /* ============================================================
     小魚群れ更新
     ============================================================ */
  function AppUpdateSchool(t) {
    for (var i = 0; i < AppSchoolFish.length; i++) {
      AppSchoolAngles[i] += 0.008;
      var ang = AppSchoolAngles[i];
      var rad = 5 + i * 1.2;
      AppSchoolFish[i].position.set(
        Math.cos(ang) * rad,
        (AppEnv ? AppEnv.standY : 0) - 0.6 - i * 0.3,
        Math.sin(ang) * rad - 15
      );
      AppSchoolFish[i].rotation.y = -ang + Math.PI / 2;
    }
  }

  /* ============================================================
     メインループ
     ============================================================ */
  var _prevTime = performance.now() * 0.001;

  function AppAnimate() {
    requestAnimationFrame(AppAnimate);
    var now = performance.now() * 0.001;
    var dt  = Math.min(now - _prevTime, 0.1);
    _prevTime = now;

    var t = now; // 経過秒

    // 環境更新
    if (AppEnv && AppEnv.update) AppEnv.update(t, dt);

    // ゲーム更新
    AppGame.update(t, dt);

    // 魚アニメ
    FishUpdateAll(t);

    // カメラ
    AppUpdateCamera(dt);

    // 小魚群れ
    AppUpdateSchool(t);

    // 竿 & ライン
    var tension = AppGame.lineTension;
    AppUpdateRod(tension);
    AppUpdateLine(tension);

    // ファイト魚影
    AppUpdateHookedFish(t);

    // ランディング
    AppHandleLanding(dt);

    // レンダリング
    AppRenderer.render(AppScene, AppCamera);
  }

  AppAnimate();

})();
