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
     竿 (一人称、カメラ追従)
     ============================================================ */
  var AppRodGroup = new THREE.Group(); // カメラに追従させる別オブジェクト

  // 竿のマテリアル
  var _rodMat = new THREE.MeshStandardMaterial({
    color: 0x2a1a0a,
    roughness: 0.55,
    metalness: 0.15
  });
  var _reelMat = new THREE.MeshStandardMaterial({
    color: 0x888888,
    roughness: 0.3,
    metalness: 0.7
  });

  // 竿を構成する頂点 (CatmullRom制御点)
  // ローカル座標: 竿根元(画面右下) → 竿先へ向かう
  var _rodCtrlPts = [
    new THREE.Vector3( 0.22, -0.28, -0.18),
    new THREE.Vector3( 0.18, -0.12, -0.55),
    new THREE.Vector3( 0.12,  0.04, -0.95),
    new THREE.Vector3( 0.05,  0.18, -1.40),
    new THREE.Vector3(-0.02,  0.28, -1.85),
    new THREE.Vector3(-0.06,  0.34, -2.30)
  ];
  var _rodCurve   = new THREE.CatmullRomCurve3(_rodCtrlPts);
  var _rodSegments = 18;

  // 最初の竿ジオメトリ
  var _rodGeo  = new THREE.TubeGeometry(_rodCurve, _rodSegments, 0.018, 7, false);
  var _rodMesh = new THREE.Mesh(_rodGeo, _rodMat);
  AppRodGroup.add(_rodMesh);

  // リール本体 (Lathe)
  var _reelPoints = [];
  for (var _ri = 0; _ri <= 12; _ri++) {
    var _rt = _ri / 12;
    var _rx = 0.025 + 0.012 * Math.sin(_rt * Math.PI);
    _reelPoints.push(new THREE.Vector2(_rx, (_rt - 0.5) * 0.08));
  }
  var _reelGeo  = new THREE.LatheGeometry(_reelPoints, 16);
  var _reelMesh = new THREE.Mesh(_reelGeo, _reelMat);
  // 竿の根元付近に配置
  _reelMesh.position.set(0.19, -0.20, -0.40);
  _reelMesh.rotation.z = Math.PI / 2;
  AppRodGroup.add(_reelMesh);

  // リールハンドル
  var _handleMat  = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.6 });
  var _handleGeo  = new THREE.CylinderGeometry(0.008, 0.008, 0.07, 8);
  var _handleMesh = new THREE.Mesh(_handleGeo, _handleMat);
  _handleMesh.position.set(0.19, -0.15, -0.40);
  _handleMesh.rotation.z = Math.PI / 2;
  AppRodGroup.add(_handleMesh);

  var _knobGeo  = new THREE.SphereGeometry(0.012, 8, 6);
  var _knobMesh = new THREE.Mesh(_knobGeo, _handleMat);
  _knobMesh.position.set(0.22, -0.15, -0.40);
  AppRodGroup.add(_knobMesh);

  // ガイドリング (5個)
  var _guideMat = new THREE.MeshStandardMaterial({ color: 0x999999, metalness: 0.8, roughness: 0.2 });
  var _guideRing = [];
  var _guideT    = [0.15, 0.3, 0.5, 0.7, 0.9];
  for (var _gi = 0; _gi < 5; _gi++) {
    var _gpt = _rodCurve.getPoint(_guideT[_gi]);
    var _gGeo  = new THREE.TorusGeometry(0.013, 0.003, 6, 12);
    var _gMesh = new THREE.Mesh(_gGeo, _guideMat);
    _gMesh.position.copy(_gpt);
    // リングを竿方向に向ける
    var _gTan = _rodCurve.getTangent(_guideT[_gi]);
    _gMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), _gTan.normalize());
    AppRodGroup.add(_gMesh);
    _guideRing.push(_gMesh);
  }

  AppScene.add(AppRodGroup);

  /* ============================================================
     ライン (竿先→ウキ QuadraticBezier)
     ============================================================ */
  var _linePts   = [];
  var _lineDivs  = 20;
  for (var _li = 0; _li <= _lineDivs; _li++) _linePts.push(new THREE.Vector3());

  var _lineGeo = new THREE.BufferGeometry();
  var _linePos = new Float32Array((_lineDivs + 1) * 3);
  _lineGeo.setAttribute('position', new THREE.BufferAttribute(_linePos, 3));

  var _lineMat  = new THREE.LineBasicMaterial({ color: 0xddddcc, linewidth: 1 });
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
  var _landingDuration = 2.2;
  var _landingDone     = false;

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
     竿 Tube ジオメトリ更新
     ============================================================ */
  function AppUpdateRod(tension) {
    // テンションに応じて竿先を曲げる
    var bend = tension * 0.28;
    _rodCtrlPts[4].y = 0.28 + bend * 0.5;
    _rodCtrlPts[5].y = 0.34 + bend;
    _rodCtrlPts[5].z = -2.30 + bend * 0.3;
    _rodCurve.points = _rodCtrlPts;

    // TubeGeometry を再構築 (低分割なので許容)
    _rodGeo.dispose();
    _rodGeo = new THREE.TubeGeometry(_rodCurve, _rodSegments, 0.018, 7, false);
    _rodMesh.geometry = _rodGeo;

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
    } else if (game.state !== 'fight' && game.state !== 'landed') {
      if (AppHookedMesh) {
        FishDispose(AppHookedMesh);
        AppScene.remove(AppHookedMesh);
        AppHookedMesh = null;
      }
    }
  }

  /* ============================================================
     ランディング演出
     ============================================================ */
  function AppHandleLanding(dt) {
    var game = AppGame;
    if (game.state === 'landed') {
      if (!_landingMesh && game.hookedFish && AppHookedMesh) {
        // 魚をカメラ前に掲げる
        _landingMesh  = AppHookedMesh;
        AppHookedMesh = null;
        _landingTimer = 0;
        _landingDone  = false;
      }
      if (_landingMesh) {
        _landingTimer += dt;
        // カメラ正面1.2m
        var fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(AppCamera.quaternion);
        _landingMesh.position.copy(AppCamera.position).addScaledVector(fwd, 1.2);
        _landingMesh.position.y += 0.05 * Math.sin(_landingTimer * 3);
        _landingMesh.rotation.y = AppCamera.rotation.y + Math.sin(_landingTimer * 1.5) * 0.3;
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
    }
  }

  /* ============================================================
     カメラ更新
     ============================================================ */
  function AppUpdateCamera(dt) {
    var game = AppGame;
    var inertia = 0.88;

    if (game.state === 'title') {
      // ゆっくりパン
      _titlePanT += dt * 0.12;
      AppYaw   = Math.sin(_titlePanT) * 0.35;
      AppPitch = -0.06;
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
