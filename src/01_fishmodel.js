/*
 * 01_fishmodel.js — プロシージャル魚メッシュ生成
 *
 * テスト用ダミー species 例:
 * const testSpecies = {
 *   id: 'chinu', name: 'チヌ',
 *   model: {
 *     profile: 'standard', bodyH: 0.32, bodyW: 0.14,
 *     snout: 'blunt', tail: 'forked',
 *     dorsal: { start:0.28, end:0.62, h:0.10, spiny:true },
 *     anal:   { start:0.60, end:0.78, h:0.07 },
 *     pectoral: 0.16,
 *     colors: { back:'#1a2030', base:'#6a7080', belly:'#e0e0d8', fins:'#404450', eye:'#111' },
 *     pattern: { type:'none', color:'#222', count:0, opacity:0 },
 *     sheen: 0.7, special: null
 *   }
 * };
 * FishCreateMesh(testSpecies, 40);
 */

// ---- 内部レジストリ / テクスチャキャッシュ ----
var _FishRegistry = [];
var _FishTextureCache = {};

// ---- profile ごとのスプライン制御点 ----
function _FishGetSplinePoints(profile, length) {
  var L = length;
  if (profile === 'eel') {
    return [
      new THREE.Vector3(0,      0, 0),
      new THREE.Vector3(L*0.15, 0, 0),
      new THREE.Vector3(L*0.35, 0, 0),
      new THREE.Vector3(L*0.55, 0, 0),
      new THREE.Vector3(L*0.75, 0, 0),
      new THREE.Vector3(L*0.90, 0, 0),
      new THREE.Vector3(L,      0, 0)
    ];
  }
  if (profile === 'squid') {
    return [
      new THREE.Vector3(0,      0, 0),
      new THREE.Vector3(L*0.20, 0, 0),
      new THREE.Vector3(L*0.55, 0, 0),
      new THREE.Vector3(L*0.80, 0, 0),
      new THREE.Vector3(L,      0, 0)
    ];
  }
  // standard / deep / slender / flat / round
  return [
    new THREE.Vector3(0,      0, 0),
    new THREE.Vector3(L*0.12, 0, 0),
    new THREE.Vector3(L*0.30, 0, 0),
    new THREE.Vector3(L*0.50, 0, 0),
    new THREE.Vector3(L*0.70, 0, 0),
    new THREE.Vector3(L*0.85, 0, 0),
    new THREE.Vector3(L,      0, 0)
  ];
}

// ---- 断面スケール(hw=横半径, hh=縦半径) ----
function _FishGetSectionScale(profile, bodyH, bodyW, t) {
  var hw, hh, envelope, q;
  if (profile === 'standard') {
    envelope = Math.sin(Math.PI * t) * (0.5 + 0.5 * Math.sin(Math.PI * t));
    hw = bodyW * 0.5 * envelope;
    hh = bodyH * 0.5 * envelope;
    if (t < 0.15) { q = t / 0.15; hw *= q; hh *= q; }
    if (t > 0.85) { q = (1.0 - t) / 0.15; hw *= q; hh *= q; }
  } else if (profile === 'deep') {
    envelope = Math.sin(Math.PI * t) * (0.5 + 0.5 * Math.sin(Math.PI * t));
    hw = bodyW * 0.5 * envelope;
    hh = bodyH * 0.65 * envelope;
    if (t < 0.15) { q = t / 0.15; hw *= q; hh *= q; }
    if (t > 0.80) { q = (1.0 - t) / 0.20; hw *= q; hh *= q; }
  } else if (profile === 'slender') {
    envelope = Math.sin(Math.PI * t) * (0.4 + 0.4 * Math.sin(Math.PI * t));
    hw = bodyW * 0.35 * envelope;
    hh = bodyH * 0.35 * envelope;
    if (t < 0.10) { q = t / 0.10; hw *= q; hh *= q; }
    if (t > 0.80) { q = (1.0 - t) / 0.20; hw *= q; hh *= q; }
  } else if (profile === 'flat') {
    envelope = Math.sin(Math.PI * t) * (0.5 + 0.5 * Math.sin(Math.PI * t));
    hw = bodyW * 1.4 * envelope;
    hh = bodyH * 0.15 * envelope;
    if (t < 0.15) { q = t / 0.15; hw *= q; hh *= q; }
    if (t > 0.80) { q = (1.0 - t) / 0.20; hw *= q; hh *= q; }
  } else if (profile === 'eel') {
    var r = bodyW * 0.3 * Math.min(1.0, t < 0.05 ? t / 0.05 : (t > 0.90 ? (1.0 - t) / 0.10 : 1.0));
    hw = r;
    hh = r;
  } else if (profile === 'round') {
    envelope = Math.sin(Math.PI * t);
    hw = bodyW * 0.65 * envelope;
    hh = bodyH * 0.65 * envelope;
    if (t < 0.10) { q = t / 0.10; hw *= q; hh *= q; }
    if (t > 0.80) { q = (1.0 - t) / 0.20; hw *= q; hh *= q; }
  } else if (profile === 'squid') {
    var taper = 1.0 - t * 0.85;
    hw = bodyW * 0.45 * taper;
    hh = bodyH * 0.45 * taper;
  } else {
    envelope = Math.sin(Math.PI * t);
    hw = bodyW * 0.5 * envelope;
    hh = bodyH * 0.5 * envelope;
  }
  return { hw: Math.max(hw, 0.0001), hh: Math.max(hh, 0.0001) };
}

// ---- 胴体 BufferGeometry ----
function _FishBuildBodyGeometry(model, length) {
  var segsAlong  = 28;
  var segsAround = 18;

  var splinePts = _FishGetSplinePoints(model.profile, length);
  var curve = new THREE.CatmullRomCurve3(splinePts);

  var totalVerts = (segsAlong + 1) * (segsAround + 1);
  var positions = new Float32Array(totalVerts * 3);
  var normals   = new Float32Array(totalVerts * 3);
  var uvs       = new Float32Array(totalVerts * 2);

  var tangent  = new THREE.Vector3();
  var normal   = new THREE.Vector3();
  var binormal = new THREE.Vector3();
  var worldUp  = new THREE.Vector3(0, 1, 0);
  var pos      = new THREE.Vector3();

  for (var i = 0; i <= segsAlong; i++) {
    var t = i / segsAlong;
    curve.getPoint(t, pos);
    curve.getTangent(t, tangent);
    tangent.normalize();

    if (Math.abs(tangent.dot(worldUp)) > 0.99) {
      normal.set(0, 0, 1);
    } else {
      normal.crossVectors(worldUp, tangent).normalize();
    }
    binormal.crossVectors(tangent, normal).normalize();
    normal.crossVectors(binormal, tangent).normalize();

    var sec = _FishGetSectionScale(model.profile, model.bodyH, model.bodyW, t);
    var hw = sec.hw;
    var hh = sec.hh;

    for (var j = 0; j <= segsAround; j++) {
      var phi  = (j / segsAround) * Math.PI * 2;
      var cosP = Math.cos(phi);
      var sinP = Math.sin(phi);
      var nx   = cosP * hw;
      var ny   = sinP * hh;
      var vx   = normal.x * nx + binormal.x * ny;
      var vy   = normal.y * nx + binormal.y * ny;
      var vz   = normal.z * nx + binormal.z * ny;

      var vi = (i * (segsAround + 1) + j) * 3;
      positions[vi]     = pos.x + vx;
      positions[vi + 1] = pos.y + vy;
      positions[vi + 2] = pos.z + vz;

      var nl = Math.sqrt(vx*vx + vy*vy + vz*vz) || 1.0;
      normals[vi]     = vx / nl;
      normals[vi + 1] = vy / nl;
      normals[vi + 2] = vz / nl;

      var ui = (i * (segsAround + 1) + j) * 2;
      uvs[ui]     = t;
      uvs[ui + 1] = j / segsAround;
    }
  }

  var faces   = segsAlong * segsAround * 2;
  var indices = new Uint32Array(faces * 3);
  var fi = 0;
  for (var ia = 0; ia < segsAlong; ia++) {
    for (var ja = 0; ja < segsAround; ja++) {
      var a = ia * (segsAround + 1) + ja;
      var b = a + 1;
      var c = (ia + 1) * (segsAround + 1) + ja;
      var d = c + 1;
      indices[fi++] = a; indices[fi++] = c; indices[fi++] = b;
      indices[fi++] = b; indices[fi++] = c; indices[fi++] = d;
    }
  }

  var geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('normal',   new THREE.BufferAttribute(normals, 3));
  geo.setAttribute('uv',       new THREE.BufferAttribute(uvs, 2));
  geo.setIndex(new THREE.BufferAttribute(indices, 1));
  geo.computeVertexNormals();
  return geo;
}

// ---- Canvas テクスチャ生成 ----
function _FishBuildTexture(species) {
  var m = species.model;
  var cacheKey = (species.id || 'unknown') + '_' + m.pattern.type + '_' + m.sheen;
  if (_FishTextureCache[cacheKey]) return _FishTextureCache[cacheKey];

  var W = 512, H = 256;
  var canvas = document.createElement('canvas');
  canvas.width  = W;
  canvas.height = H;
  var ctx = canvas.getContext('2d');

  // 背→基調→腹 縦グラデ
  var grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0.00, m.colors.back);
  grad.addColorStop(0.35, m.colors.back);
  grad.addColorStop(0.55, m.colors.base);
  grad.addColorStop(0.75, m.colors.belly);
  grad.addColorStop(1.00, m.colors.belly);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // pattern
  var ptype = m.pattern.type;
  var cnt   = m.pattern.count || 6;
  ctx.fillStyle = m.pattern.color || '#222';
  ctx.strokeStyle = m.pattern.color || '#222';

  if (ptype === 'vbars') {
    ctx.globalAlpha = m.pattern.opacity || 0.5;
    for (var i = 0; i < cnt; i++) {
      var bx = (i / cnt) * W + W / cnt * 0.35;
      var bw = W / cnt * 0.25;
      ctx.fillRect(bx, 0, bw, H);
    }
  } else if (ptype === 'hstripes') {
    ctx.globalAlpha = m.pattern.opacity || 0.5;
    for (var i = 0; i < cnt; i++) {
      var by = (i / cnt) * H;
      var bh = H / cnt * 0.4;
      ctx.fillRect(0, by, W, bh);
    }
  } else if (ptype === 'spots') {
    ctx.globalAlpha = (m.pattern.opacity || 0.5) * 0.8;
    for (var i = 0; i < cnt * cnt; i++) {
      var sx = (i % cnt) / cnt * W + (Math.sin(i * 7.3) * 0.5 + 0.5) * W / cnt;
      var sy = Math.floor(i / cnt) / cnt * H + (Math.cos(i * 3.7) * 0.5 + 0.5) * H / cnt;
      var sr = W / cnt * 0.12;
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (ptype === 'speckle') {
    ctx.globalAlpha = (m.pattern.opacity || 0.5) * 0.6;
    for (var i = 0; i < cnt * 30; i++) {
      var px = (Math.sin(i * 1.618) * 0.5 + 0.5) * W;
      var py = (Math.cos(i * 2.718) * 0.5 + 0.5) * H;
      var pr = 1.5 + (Math.sin(i * 5.1) * 0.5 + 0.5) * 2.5;
      ctx.beginPath();
      ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (ptype === 'marble') {
    ctx.globalAlpha = (m.pattern.opacity || 0.5) * 0.4;
    ctx.lineWidth = 2;
    for (var i = 0; i < cnt * 4; i++) {
      var mx0 = (Math.sin(i * 1.1) * 0.5 + 0.5) * W;
      var mx1 = (Math.sin(i * 1.3 + 1) * 0.5 + 0.5) * W;
      var mx2 = (Math.sin(i * 0.9 + 2) * 0.5 + 0.5) * W;
      var mx3 = (Math.sin(i * 1.5 + 3) * 0.5 + 0.5) * W;
      ctx.beginPath();
      ctx.moveTo(mx0, 0);
      ctx.bezierCurveTo(mx1, H * 0.33, mx2, H * 0.66, mx3, H);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1.0;

  // 鱗ノイズ
  ctx.globalAlpha = 0.05;
  ctx.fillStyle = '#ffffff';
  for (var yi = 0; yi < H; yi += 7) {
    var offset = (Math.floor(yi / 7) % 2) * 4;
    for (var xi = offset; xi < W; xi += 8) {
      ctx.beginPath();
      ctx.arc(xi, yi, 2.5, Math.PI * 0.2, Math.PI * 0.8);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1.0;

  // 鰓蓋ライン
  ctx.globalAlpha = 0.18;
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(W * 0.18, H * 0.5, H * 0.38, -Math.PI * 0.4, Math.PI * 0.4);
  ctx.stroke();

  // 腹の明部
  var bellyGrad = ctx.createLinearGradient(0, H * 0.60, 0, H);
  bellyGrad.addColorStop(0, 'rgba(255,255,255,0)');
  bellyGrad.addColorStop(1, 'rgba(255,255,255,0.18)');
  ctx.globalAlpha = 1.0;
  ctx.fillStyle = bellyGrad;
  ctx.fillRect(0, H * 0.60, W, H * 0.40);

  var tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  _FishTextureCache[cacheKey] = tex;
  return tex;
}

// ---- 尾びれ Shape ----
function _FishTailShape(tailType, scale) {
  var s = scale;
  var shape = new THREE.Shape();
  if (tailType === 'forked') {
    shape.moveTo(0, 0);
    shape.lineTo(-s*0.08, s*0.25);
    shape.lineTo(-s*0.25, s*0.48);
    shape.lineTo(-s*0.15, s*0.48);
    shape.lineTo(0, s*0.22);
    shape.lineTo(s*0.15, s*0.48);
    shape.lineTo(s*0.25, s*0.48);
    shape.lineTo(s*0.08, s*0.25);
    shape.lineTo(0, 0);
  } else if (tailType === 'lunate') {
    shape.moveTo(0, 0);
    shape.bezierCurveTo(-s*0.05, s*0.20, -s*0.35, s*0.38, -s*0.30, s*0.52);
    shape.lineTo(-s*0.18, s*0.50);
    shape.bezierCurveTo(-s*0.18, s*0.30, 0, s*0.14, 0, s*0.10);
    shape.bezierCurveTo(0, s*0.14, s*0.18, s*0.30, s*0.18, s*0.50);
    shape.lineTo(s*0.30, s*0.52);
    shape.bezierCurveTo(s*0.35, s*0.38, s*0.05, s*0.20, 0, 0);
  } else if (tailType === 'rounded') {
    shape.moveTo(0, 0);
    shape.bezierCurveTo(-s*0.1, s*0.15, -s*0.28, s*0.25, -s*0.28, s*0.42);
    shape.bezierCurveTo(-s*0.28, s*0.56, -s*0.15, s*0.58, 0, s*0.58);
    shape.bezierCurveTo(s*0.15, s*0.58, s*0.28, s*0.56, s*0.28, s*0.42);
    shape.bezierCurveTo(s*0.28, s*0.25, s*0.1, s*0.15, 0, 0);
  } else if (tailType === 'truncate') {
    shape.moveTo(-s*0.22, 0);
    shape.lineTo(-s*0.22, s*0.45);
    shape.lineTo( s*0.22, s*0.45);
    shape.lineTo( s*0.22, 0);
    shape.lineTo(-s*0.22, 0);
  } else {
    // pointed
    shape.moveTo(0, 0);
    shape.lineTo(-s*0.16, s*0.30);
    shape.bezierCurveTo(-s*0.16, s*0.45, -s*0.06, s*0.58, 0, s*0.60);
    shape.bezierCurveTo( s*0.06, s*0.58,  s*0.16, s*0.45, s*0.16, s*0.30);
    shape.lineTo(0, 0);
  }
  return shape;
}

// ---- 背鰭/臀鰭 Shape ----
function _FishDorsalShape(dorsal, scale, spiny) {
  var ds = dorsal.end - dorsal.start;
  var w  = ds * scale;
  var h  = dorsal.h * scale * 1.2;
  var shape = new THREE.Shape();
  shape.moveTo(0, 0);
  if (spiny) {
    var teeth = 8;
    for (var i = 0; i <= teeth; i++) {
      var tx = (i / teeth) * w;
      var ty = (i % 2 === 0) ? h : h * 0.65;
      shape.lineTo(tx, ty);
    }
  } else {
    shape.bezierCurveTo(w * 0.2, h * 1.1, w * 0.8, h * 1.1, w, h * 0.4);
  }
  shape.lineTo(w, 0);
  shape.lineTo(0, 0);
  return shape;
}

// ---- 鰭メッシュ生成 ----
function _FishMakeFin(shape, depth, color, opacity) {
  var geo = new THREE.ExtrudeGeometry(shape, { depth: depth, bevelEnabled: false });
  geo.computeVertexNormals();
  var mat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(color),
    transparent: true,
    opacity: opacity,
    side: THREE.DoubleSide,
    roughness: 0.6,
    metalness: 0.0,
    clearcoat: 0.2,
    depthWrite: false
  });
  return { geo: geo, mat: mat, mesh: new THREE.Mesh(geo, mat) };
}

// ---- 目 ----
function _FishMakeEye(eyeColor, radius) {
  var grp = new THREE.Group();

  var eyeGeo = new THREE.SphereGeometry(radius, 10, 10);
  var eyeMat = new THREE.MeshPhysicalMaterial({ color: 0xdddddd, roughness: 0.1, clearcoat: 1.0 });
  grp.add(new THREE.Mesh(eyeGeo, eyeMat));

  var pupilGeo = new THREE.SphereGeometry(radius * 0.72, 8, 8);
  var pupilMat = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(eyeColor), roughness: 0.3 });
  var pupilMesh = new THREE.Mesh(pupilGeo, pupilMat);
  pupilMesh.position.z = radius * 0.3;
  grp.add(pupilMesh);

  var hlGeo = new THREE.SphereGeometry(radius * 0.25, 6, 6);
  var hlMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  var hlMesh = new THREE.Mesh(hlGeo, hlMat);
  hlMesh.position.set(radius * 0.25, radius * 0.25, radius * 0.85);
  grp.add(hlMesh);

  return {
    group: grp,
    geos: [eyeGeo, pupilGeo, hlGeo],
    mats: [eyeMat, pupilMat, hlMat]
  };
}

// ---- squid 脚 ----
function _FishMakeTentacle(length, thickness, color) {
  var pts = [];
  for (var i = 0; i <= 10; i++) {
    var tt = i / 10;
    pts.push(new THREE.Vector3(
      Math.sin(tt * Math.PI * 1.5) * length * 0.12,
      -tt * length,
      Math.cos(tt * Math.PI * 0.8) * length * 0.05
    ));
  }
  var curve = new THREE.CatmullRomCurve3(pts);
  var geo = new THREE.TubeGeometry(curve, 12, thickness, 6, false);
  var mat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(color),
    roughness: 0.7,
    transparent: true,
    opacity: 0.88,
    side: THREE.DoubleSide
  });
  return { geo: geo, mat: mat, mesh: new THREE.Mesh(geo, mat) };
}

// ---- special 演出 ----
function _FishApplySpecial(special, group, length, model, disposables) {
  if (!special) return;
  var finColor = model.colors.fins;

  if (special === 'whiskers') {
    for (var wi = 0; wi < 4; wi++) {
      var side = (wi % 2 === 0) ? 1 : -1;
      var wpts = [
        new THREE.Vector3(length * 0.05, 0, 0),
        new THREE.Vector3(length * 0.02, side * length * 0.04, -length * 0.04),
        new THREE.Vector3(0, side * length * 0.07, -length * 0.10)
      ];
      var wcurve = new THREE.CatmullRomCurve3(wpts);
      var wgeo = new THREE.TubeGeometry(wcurve, 6, length * 0.004, 4, false);
      var wmat = new THREE.MeshPhysicalMaterial({ color: 0x888870, roughness: 0.8 });
      var wmesh = new THREE.Mesh(wgeo, wmat);
      wmesh.position.y = (wi < 2 ? 1 : -1) * length * 0.03;
      group.add(wmesh);
      disposables.push(wgeo, wmat);
    }
  } else if (special === 'glow') {
    var glight = new THREE.PointLight(0x88ffaa, 2.0, length * 3);
    glight.position.set(length * 0.1, length * 0.2, 0);
    group.add(glight);

    var rodPts = [
      new THREE.Vector3(length * 0.08, 0, 0),
      new THREE.Vector3(length * 0.10, length * 0.15, 0),
      new THREE.Vector3(length * 0.06, length * 0.30, 0)
    ];
    var rodCurve = new THREE.CatmullRomCurve3(rodPts);
    var rodGeo = new THREE.TubeGeometry(rodCurve, 8, length * 0.008, 5, false);
    var rodMat = new THREE.MeshPhysicalMaterial({ color: 0x223322, roughness: 0.6 });
    group.add(new THREE.Mesh(rodGeo, rodMat));

    var ballGeo = new THREE.SphereGeometry(length * 0.022, 8, 8);
    var ballMat = new THREE.MeshPhysicalMaterial({
      color: 0x99ffbb,
      emissive: new THREE.Color(0x44ff88),
      emissiveIntensity: 2.5,
      roughness: 0.1
    });
    var ballMesh = new THREE.Mesh(ballGeo, ballMat);
    ballMesh.position.set(length * 0.06, length * 0.32, 0);
    group.add(ballMesh);
    disposables.push(rodGeo, rodMat, ballGeo, ballMat);
  } else if (special === 'horn') {
    var hornGeo = new THREE.ConeGeometry(length * 0.025, length * 0.10, 8);
    var hornMat = new THREE.MeshPhysicalMaterial({ color: 0xd4c080, metalness: 0.5, roughness: 0.3 });
    var hornMesh = new THREE.Mesh(hornGeo, hornMat);
    hornMesh.position.set(length * 0.15, length * 0.18, 0);
    hornMesh.rotation.z = Math.PI * 0.15;
    group.add(hornMesh);
    disposables.push(hornGeo, hornMat);
  } else if (special === 'tentacles') {
    for (var ti = 0; ti < 8; ti++) {
      var tangle = (ti / 8) * Math.PI * 2;
      var tent = _FishMakeTentacle(length * 0.50, length * 0.012, finColor);
      tent.mesh.position.set(
        length * 0.95,
        Math.sin(tangle) * length * 0.06,
        Math.cos(tangle) * length * 0.06
      );
      tent.mesh.rotation.x = tangle;
      group.add(tent.mesh);
      disposables.push(tent.geo, tent.mat);
    }
  } else if (special === 'crown') {
    var torusGeo = new THREE.TorusGeometry(length * 0.06, length * 0.010, 8, 24);
    var torusMat = new THREE.MeshPhysicalMaterial({ color: 0xffd700, metalness: 1.0, roughness: 0.1 });
    var torusMesh = new THREE.Mesh(torusGeo, torusMat);
    torusMesh.position.set(length * 0.12, length * 0.22, 0);
    torusMesh.rotation.x = Math.PI * 0.5;
    group.add(torusMesh);
    disposables.push(torusGeo, torusMat);
  }
}

// ============================================================
// 公開 API
// ============================================================

function FishCreateMesh(species, sizeCm) {
  var m      = species.model;
  var length = sizeCm / 100;
  var group  = new THREE.Group();
  var disposables = [];

  // ------ 胴体 ------
  var bodyGeo = _FishBuildBodyGeometry(m, length);
  var bodyTex = _FishBuildTexture(species);
  disposables.push(bodyGeo, bodyTex);

  var isShiny = m.sheen > 0.5;
  var bodyMat = new THREE.MeshPhysicalMaterial({
    map: bodyTex,
    metalness: m.sheen * 0.5,
    roughness: 0.35,
    clearcoat: 0.6,
    clearcoatRoughness: 0.3,
    envMapIntensity: isShiny ? 1.5 : 1.0
  });
  if (m.special === 'ghost') {
    bodyMat.transparent = true;
    bodyMat.opacity = 0.45;
    bodyMat.emissive = new THREE.Color(0x8899cc);
    bodyMat.emissiveIntensity = 0.4;
  }
  disposables.push(bodyMat);

  // onBeforeCompile: 泳ぎアニメ (uTime uniform 注入)
  var uniforms = { uTime: { value: 0.0 } };
  bodyMat.userData.uniforms = uniforms;
  var ampStr = (length * 0.10).toFixed(6);
  bodyMat.onBeforeCompile = function(shader) {
    shader.uniforms.uTime = uniforms.uTime;
    shader.vertexShader = 'uniform float uTime;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      '#include <begin_vertex>\n' +
      'float u_ax = uv.x;\n' +
      'float sway = sin(uTime * 2.5 + u_ax * 6.2832) * ' + ampStr + ' * pow(u_ax, 1.5);\n' +
      'transformed.y += sway;\n'
    );
  };

  var bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
  // スプラインは X軸に沿っているため、魚が Z 方向を向くよう回転
  bodyMesh.rotation.y = -Math.PI * 0.5;
  group.add(bodyMesh);

  // ------ 尾びれ ------
  if (m.profile !== 'eel') {
    var tailShape = _FishTailShape(m.tail, length);
    var tailFin   = _FishMakeFin(tailShape, length * 0.005, m.colors.fins, 0.80);
    tailFin.mesh.rotation.y = -Math.PI * 0.5;
    tailFin.mesh.position.set(0, -length * 0.03, length);
    group.add(tailFin.mesh);
    disposables.push(tailFin.geo, tailFin.mat);
  }

  // ------ 背鰭 ------
  var dorsalShape = _FishDorsalShape(m.dorsal, length, m.dorsal.spiny);
  var dorsalFin   = _FishMakeFin(dorsalShape, length * 0.005, m.colors.fins, 0.82);
  dorsalFin.mesh.rotation.y = -Math.PI * 0.5;
  var dorsalY = m.bodyH * length * 0.25;
  dorsalFin.mesh.position.set(0, dorsalY, m.dorsal.start * length);
  group.add(dorsalFin.mesh);
  disposables.push(dorsalFin.geo, dorsalFin.mat);

  // eel は全長背鰭を追加
  if (m.profile === 'eel') {
    var eelDorsal  = { start: 0.05, end: 0.95, h: m.bodyH * 0.8, spiny: false };
    var eelShape   = _FishDorsalShape(eelDorsal, length, false);
    var eelFin     = _FishMakeFin(eelShape, length * 0.004, m.colors.fins, 0.78);
    eelFin.mesh.rotation.y = -Math.PI * 0.5;
    eelFin.mesh.position.set(0, m.bodyH * length * 0.15, eelDorsal.start * length);
    group.add(eelFin.mesh);
    disposables.push(eelFin.geo, eelFin.mat);
  }

  // ------ 臀鰭 ------
  var analShape = _FishDorsalShape(m.anal, length, false);
  var analFin   = _FishMakeFin(analShape, length * 0.004, m.colors.fins, 0.76);
  analFin.mesh.rotation.y = -Math.PI * 0.5;
  analFin.mesh.rotation.z =  Math.PI;
  var analY = m.bodyH * length * 0.20;
  analFin.mesh.position.set(0, -analY, m.anal.start * length);
  group.add(analFin.mesh);
  disposables.push(analFin.geo, analFin.mat);

  // ------ 胸鰭 (左右) ------
  var pSize  = m.pectoral * length;
  var pShape = new THREE.Shape();
  pShape.moveTo(0, 0);
  pShape.bezierCurveTo(pSize*0.1, pSize*0.4, pSize*0.5, pSize*0.7, pSize*0.7, pSize*0.6);
  pShape.bezierCurveTo(pSize*0.9, pSize*0.45, pSize*0.6, 0, 0, 0);

  for (var ps = -1; ps <= 1; ps += 2) {
    var pFin = _FishMakeFin(pShape, length * 0.004, m.colors.fins, 0.78);
    pFin.mesh.rotation.z = ps === 1 ? -Math.PI * 0.3 : Math.PI * 0.3;
    pFin.mesh.rotation.y = -Math.PI * 0.5;
    pFin.mesh.position.set(ps * m.bodyW * length * 0.45, 0, length * 0.22);
    group.add(pFin.mesh);
    disposables.push(pFin.geo, pFin.mat);
  }

  // ------ 目 ------
  var eyeR   = length * 0.030;
  var eye1   = _FishMakeEye(m.colors.eye, eyeR);
  var eye2   = _FishMakeEye(m.colors.eye, eyeR);

  if (m.profile === 'flat') {
    // flat: 目を上面に配置
    var eyeSpread = m.bodyW * length * 0.25;
    eye1.group.position.set(-eyeSpread * 0.5, m.bodyH * length * 0.12, length * 0.18);
    eye2.group.position.set( eyeSpread * 0.5, m.bodyH * length * 0.12, length * 0.18);
    eye1.group.rotation.z = -Math.PI * 0.5;
    eye2.group.rotation.z = -Math.PI * 0.5;
  } else {
    var eyeLat = m.bodyW * length * 0.42;
    eye1.group.position.set(-eyeLat, length * 0.03, length * 0.14);
    eye2.group.position.set( eyeLat, length * 0.03, length * 0.14);
    eye1.group.rotation.y = -Math.PI * 0.5;
    eye2.group.rotation.y =  Math.PI * 0.5;
  }
  group.add(eye1.group);
  group.add(eye2.group);
  disposables.push.apply(disposables, eye1.geos);
  disposables.push.apply(disposables, eye1.mats);
  disposables.push.apply(disposables, eye2.geos);
  disposables.push.apply(disposables, eye2.mats);

  // ------ squid: ヒレ + 脚 ------
  if (m.profile === 'squid') {
    for (var sqSide = -1; sqSide <= 1; sqSide += 2) {
      var sqFinShape = new THREE.Shape();
      sqFinShape.moveTo(0, 0);
      sqFinShape.lineTo(-length * 0.18, length * 0.28);
      sqFinShape.lineTo(-length * 0.12, length * 0.50);
      sqFinShape.lineTo(0, length * 0.45);
      sqFinShape.lineTo(0, 0);
      var sqFin = _FishMakeFin(sqFinShape, length * 0.004, m.colors.fins, 0.75);
      sqFin.mesh.rotation.y = -Math.PI * 0.5;
      sqFin.mesh.position.set(sqSide * m.bodyW * length * 0.42, 0, length * 0.30);
      group.add(sqFin.mesh);
      disposables.push(sqFin.geo, sqFin.mat);
    }
    for (var li = 0; li < 8; li++) {
      var langle = (li / 8) * Math.PI * 2;
      var leg = _FishMakeTentacle(length * 0.55, length * 0.014, m.colors.fins);
      leg.mesh.position.set(
        length * 0.98,
        Math.sin(langle) * length * 0.07,
        Math.cos(langle) * length * 0.07
      );
      leg.mesh.rotation.x = langle;
      group.add(leg.mesh);
      disposables.push(leg.geo, leg.mat);
    }
  }

  // ------ special 演出 ------
  _FishApplySpecial(m.special, group, length, m, disposables);

  // ghost: 全メッシュを半透明に
  if (m.special === 'ghost') {
    group.traverse(function(child) {
      if (child.isMesh && child.material && child.material !== bodyMat) {
        child.material.transparent = true;
        if (child.material.opacity === undefined || child.material.opacity > 0.45) {
          child.material.opacity = 0.45;
        }
      }
    });
  }

  // ------ userData ------
  group.userData.disposables = disposables;
  group.userData.update = function(t) {
    uniforms.uTime.value = t;
  };

  _FishRegistry.push(group);
  return group;
}

function FishUpdateAll(t) {
  for (var i = 0; i < _FishRegistry.length; i++) {
    var g = _FishRegistry[i];
    if (g && g.userData && typeof g.userData.update === 'function') {
      g.userData.update(t);
    }
  }
}

function FishDispose(group) {
  var idx = _FishRegistry.indexOf(group);
  if (idx !== -1) _FishRegistry.splice(idx, 1);

  var disposables = group.userData.disposables;
  if (disposables) {
    for (var i = 0; i < disposables.length; i++) {
      var d = disposables[i];
      if (d && typeof d.dispose === 'function') {
        d.dispose();
      }
    }
  }
}
