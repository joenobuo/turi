// 02_ocean.js — 海面・空・環境(磯場)
// トップレベル宣言は Env* / Ocean* 接頭辞のみ

// ============================================================
// Gerstner 波パラメータ (JS側 / GLSL側で共有する定数)
// direction は正規化済み
// ============================================================
var OceanWaves = (function() {
  function normalize2(x, z) {
    var len = Math.sqrt(x * x + z * z);
    return [x / len, z / len];
  }
  var d1 = normalize2(0.8, 0.6);
  var d2 = normalize2(0.5, -0.7);
  var d3 = normalize2(-0.3, 0.9);
  var d4 = normalize2(0.9, 0.4);
  var d5 = normalize2(-0.6, 0.8);
  return [
    { wavelength: 80,  amplitude: 1.20, dx: d1[0], dz: d1[1], speed: 3.0 },
    { wavelength: 40,  amplitude: 0.60, dx: d2[0], dz: d2[1], speed: 4.0 },
    { wavelength: 30,  amplitude: 0.40, dx: d3[0], dz: d3[1], speed: 3.5 },
    { wavelength: 10,  amplitude: 0.12, dx: d4[0], dz: d4[1], speed: 6.0 },
    { wavelength:  6,  amplitude: 0.06, dx: d5[0], dz: d5[1], speed: 7.0 }
  ];
})();

// ============================================================
// GLSL: Gerstner 波ブロック (頂点シェーダ内で展開)
// ============================================================
var OceanVertexShader = [
  'uniform float uTime;',
  'uniform vec3 uSunDir;',
  'varying vec3 vWorldPos;',
  'varying vec3 vNormal;',
  'varying float vHeight;',
  'varying float vFoam;',
  '',
  'const int WAVE_COUNT = 5;',
  'float waveLen[WAVE_COUNT];',
  'float waveAmp[WAVE_COUNT];',
  'vec2  waveDir[WAVE_COUNT];',
  'float waveSpd[WAVE_COUNT];',
  '',
  'void initWaves() {',
  '  waveLen[0]=80.0; waveAmp[0]=1.20; waveDir[0]=normalize(vec2(0.8, 0.6)); waveSpd[0]=3.0;',
  '  waveLen[1]=40.0; waveAmp[1]=0.60; waveDir[1]=normalize(vec2(0.5,-0.7)); waveSpd[1]=4.0;',
  '  waveLen[2]=30.0; waveAmp[2]=0.40; waveDir[2]=normalize(vec2(-0.3,0.9)); waveSpd[2]=3.5;',
  '  waveLen[3]=10.0; waveAmp[3]=0.12; waveDir[3]=normalize(vec2(0.9, 0.4)); waveSpd[3]=6.0;',
  '  waveLen[4]= 6.0; waveAmp[4]=0.06; waveDir[4]=normalize(vec2(-0.6,0.8)); waveSpd[4]=7.0;',
  '}',
  '',
  'vec3 gerstner(vec3 pos) {',
  '  initWaves();',
  '  vec3 p = pos;',
  '  for (int i = 0; i < WAVE_COUNT; i++) {',
  '    float k = 6.28318 / waveLen[i];',
  '    float w = waveSpd[i] * k;',
  '    float phase = k * dot(waveDir[i], vec2(pos.x, pos.z)) - w * uTime;',
  '    float Q = 0.5 / (waveAmp[i] * k * float(WAVE_COUNT));',
  '    p.x += Q * waveAmp[i] * waveDir[i].x * cos(phase);',
  '    p.z += Q * waveAmp[i] * waveDir[i].y * cos(phase);',
  '    p.y += waveAmp[i] * sin(phase);',
  '  }',
  '  return p;',
  '}',
  '',
  'vec3 gerstnerNormal(vec3 pos) {',
  '  initWaves();',
  '  float dydx = 0.0;',
  '  float dydz = 0.0;',
  '  float dxdx = 1.0;',
  '  float dzdz = 1.0;',
  '  for (int i = 0; i < WAVE_COUNT; i++) {',
  '    float k = 6.28318 / waveLen[i];',
  '    float w = waveSpd[i] * k;',
  '    float phase = k * dot(waveDir[i], vec2(pos.x, pos.z)) - w * uTime;',
  '    float Q = 0.5 / (waveAmp[i] * k * float(WAVE_COUNT));',
  '    float WA = waveAmp[i] * k;',
  '    float sinP = sin(phase);',
  '    float cosP = cos(phase);',
  '    dydx += WA * waveDir[i].x * cosP;',
  '    dydz += WA * waveDir[i].y * cosP;',
  '    dxdx -= Q * WA * waveDir[i].x * waveDir[i].x * sinP;',
  '    dzdz -= Q * WA * waveDir[i].y * waveDir[i].y * sinP;',
  '  }',
  '  return normalize(vec3(-dydx, 1.0, -dydz));',
  '}',
  '',
  'void main() {',
  '  vec3 pos = position;',
  '  vec3 displaced = gerstner(pos);',
  '  vHeight = displaced.y;',
  '  vNormal = gerstnerNormal(pos);',
  '  vWorldPos = displaced;',
  '  // foam: 高さ > threshold かつ法線傾きが急峻',
  '  float foamH = step(0.7, displaced.y);',
  '  float foamN = step(0.7, 1.0 - vNormal.y);',
  '  vFoam = foamH * foamN;',
  '  gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);',
  '}'
].join('\n');

var OceanFragmentShader = [
  'uniform float uTime;',
  'uniform vec3 uSunDir;',
  'uniform vec3 uSunColor;',
  'uniform vec3 uSkyColor;',
  'uniform vec3 uFogColor;',
  'uniform float uFogDensity;',
  'varying vec3 vWorldPos;',
  'varying vec3 vNormal;',
  'varying float vHeight;',
  'varying float vFoam;',
  '',
  'void main() {',
  '  vec3 N = normalize(vNormal);',
  '  vec3 V = normalize(cameraPosition - vWorldPos);',
  '',
  '  // 深い藍緑 → 浅瀬グラデーション',
  '  vec3 deepColor    = vec3(0.02, 0.10, 0.22);',
  '  vec3 shallowColor = vec3(0.05, 0.28, 0.38);',
  '  float depthBlend = clamp((vHeight + 1.5) / 3.0, 0.0, 1.0);',
  '  vec3 baseColor = mix(deepColor, shallowColor, depthBlend);',
  '',
  '  // フレネル反射',
  '  float fresnel = pow(1.0 - max(dot(N, V), 0.0), 4.0);',
  '  baseColor = mix(baseColor, uSkyColor, fresnel * 0.65);',
  '',
  '  // 太陽スペキュラ (Blinn-Phong)',
  '  vec3 H = normalize(uSunDir + V);',
  '  float spec = pow(max(dot(N, H), 0.0), 256.0);',
  '  vec3 specColor = uSunColor * spec * 2.5;',
  '',
  '  // 拡散光',
  '  float diff = max(dot(N, uSunDir), 0.0);',
  '  vec3 litColor = baseColor * (0.3 + 0.7 * diff) + specColor;',
  '',
  '  // 波頭の泡',
  '  litColor = mix(litColor, vec3(0.95, 0.97, 1.0), vFoam * 0.85);',
  '',
  '  // 距離フォグ',
  '  float dist = length(vWorldPos - cameraPosition);',
  '  float fogFactor = 1.0 - exp(-uFogDensity * uFogDensity * dist * dist);',
  '  litColor = mix(litColor, uFogColor, clamp(fogFactor, 0.0, 1.0));',
  '',
  '  gl_FragColor = vec4(litColor, 0.92);',
  '}'
].join('\n');

// ============================================================
// 空シェーダ
// ============================================================
var OceanSkyVertexShader = [
  'varying vec3 vWorldDir;',
  'void main() {',
  '  vWorldDir = normalize((modelMatrix * vec4(position, 0.0)).xyz);',
  '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
  '}'
].join('\n');

var OceanSkyFragmentShader = [
  'uniform vec3 uSunDir;',
  'uniform vec3 uZenithColor;',
  'uniform vec3 uHorizonColor;',
  'uniform vec3 uGroundColor;',
  'uniform vec3 uSunColor;',
  'uniform float uStarIntensity;',
  'varying vec3 vWorldDir;',
  '',
  'float hash(vec2 p) {',
  '  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);',
  '}',
  '',
  'void main() {',
  '  vec3 dir = normalize(vWorldDir);',
  '  float elevation = dir.y;',
  '',
  '  // グラデーション',
  '  vec3 skyColor;',
  '  if (elevation >= 0.0) {',
  '    float t = pow(elevation, 0.5);',
  '    skyColor = mix(uHorizonColor, uZenithColor, t);',
  '  } else {',
  '    skyColor = mix(uHorizonColor, uGroundColor, min(-elevation * 5.0, 1.0));',
  '  }',
  '',
  '  // 太陽グロー',
  '  float sunDot = dot(dir, normalize(uSunDir));',
  '  float sunGlow = smoothstep(0.96, 1.0, sunDot);',
  '  float sunHalo = pow(max(sunDot, 0.0), 8.0) * 0.3;',
  '  skyColor += uSunColor * (sunGlow * 3.0 + sunHalo);',
  '',
  '  // 星',
  '  if (uStarIntensity > 0.0) {',
  '    vec2 starUV = vec2(atan(dir.z, dir.x) * 0.1591, asin(dir.y) * 0.3183);',
  '    vec2 cell = floor(starUV * 120.0);',
  '    float starVal = hash(cell);',
  '    float starBright = step(0.985, starVal);',
  '    float twinkle = hash(cell + vec2(0.1, 0.2));',
  '    skyColor += vec3(starBright * twinkle * uStarIntensity);',
  '  }',
  '',
  '  gl_FragColor = vec4(skyColor, 1.0);',
  '}'
].join('\n');

// ============================================================
// 疑似ノイズ (sin ベース fBm 風)
// ============================================================
function OceanNoiseSimple(x, y, z) {
  var s = Math.sin(x * 1.7 + y * 2.3 + z * 0.9) * 0.5
        + Math.sin(x * 3.1 - y * 1.5 + z * 2.7) * 0.25
        + Math.sin(x * 5.3 + y * 4.1 - z * 3.3) * 0.125
        + Math.sin(x * 9.7 - y * 8.3 + z * 7.1) * 0.0625;
  return s / 0.9375;
}

function OceanFbm(x, y, z, octaves) {
  var val = 0.0, amp = 1.0, freq = 1.0, max = 0.0;
  for (var i = 0; i < octaves; i++) {
    val += OceanNoiseSimple(x * freq, y * freq, z * freq) * amp;
    max += amp;
    amp  *= 0.5;
    freq *= 2.1;
  }
  return val / max;
}

// ============================================================
// 磯の岩生成
// ============================================================
function OceanCreateRock(radius, detail, px, py, pz, scaleY) {
  var geo = new THREE.IcosahedronGeometry(radius, detail);
  var pos = geo.attributes.position;
  var count = pos.count;
  var colors = new Float32Array(count * 3);

  for (var i = 0; i < count; i++) {
    var x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    var noise = OceanFbm(x * 0.4, y * 0.4, z * 0.4, 4);
    var disp = 1.0 + noise * 0.45;
    pos.setXYZ(i, x * disp, y * disp * scaleY, z * disp);

    var yN = y * scaleY * disp;
    var wet = Math.max(0.0, Math.min(1.0, (0.3 - yN) * 2.0));
    var r = 0.45 + (1.0 - wet) * 0.25;
    var g = 0.48 + (1.0 - wet) * 0.22;
    var b = 0.42 + (1.0 - wet) * 0.20 + wet * 0.15;
    colors[i * 3]     = r;
    colors[i * 3 + 1] = g;
    colors[i * 3 + 2] = b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();

  var mat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.82,
    metalness: 0.05
  });
  var mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(px, py, pz);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

// ============================================================
// テトラポッド風オブジェクト
// ============================================================
function OceanCreateTetrapod(px, py, pz) {
  var group = new THREE.Group();
  var mat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.9 });
  var angles = [
    [0, 0, 0],
    [Math.PI * 0.5, 0, 0],
    [0, 0, Math.PI * 0.5],
    [Math.PI * 0.33, Math.PI * 0.33, 0]
  ];
  for (var i = 0; i < angles.length; i++) {
    var geo = new THREE.CylinderGeometry(0.12, 0.18, 1.1, 8);
    var mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.set(angles[i][0], angles[i][1], angles[i][2]);
    mesh.castShadow = true;
    group.add(mesh);
  }
  group.position.set(px, py, pz);
  return group;
}

// ============================================================
// 遠景の岬・防波堤シルエット
// ============================================================
function OceanCreateDistantSilhouette() {
  var group = new THREE.Group();
  var mat = new THREE.MeshStandardMaterial({ color: 0x2a3040, roughness: 1.0, metalness: 0.0 });

  // 岬 (複数の Box 合成)
  var capeData = [
    [30, 8, 6, 150, 4, -60],
    [20, 6, 8, 165, 3, -55],
    [15, 10, 5, 145, 5, -65],
    [10, 5, 4, 155, 2.5, -58]
  ];
  for (var i = 0; i < capeData.length; i++) {
    var d = capeData[i];
    var geo = new THREE.BoxGeometry(d[0], d[1], d[2]);
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(d[3], d[4], d[5]);
    group.add(mesh);
  }

  // 防波堤
  var wallGeo = new THREE.BoxGeometry(60, 3, 4);
  var wall = new THREE.Mesh(wallGeo, mat);
  wall.position.set(-80, 1.5, -130);
  wall.rotation.y = 0.3;
  group.add(wall);

  var wallGeo2 = new THREE.BoxGeometry(40, 2.5, 3.5);
  var wall2 = new THREE.Mesh(wallGeo2, mat);
  wall2.position.set(-105, 1.25, -115);
  wall2.rotation.y = -0.15;
  group.add(wall2);

  return group;
}

// ============================================================
// 灯台
// ============================================================
function OceanCreateLighthouse(px, py, pz) {
  var group = new THREE.Group();

  // 塔
  var towerGeo = new THREE.CylinderGeometry(0.8, 1.2, 8, 12);
  var towerMat = new THREE.MeshStandardMaterial({ color: 0xddd8cc, roughness: 0.7 });
  var tower = new THREE.Mesh(towerGeo, towerMat);
  tower.position.y = 4;
  tower.castShadow = true;
  group.add(tower);

  // 縞模様 (リング)
  var stripeMat = new THREE.MeshStandardMaterial({ color: 0xcc3322, roughness: 0.7 });
  for (var i = 0; i < 3; i++) {
    var ringGeo = new THREE.CylinderGeometry(1.05, 1.05, 0.4, 12);
    var ring = new THREE.Mesh(ringGeo, stripeMat);
    ring.position.y = 1.5 + i * 2.5;
    group.add(ring);
  }

  // ランプハウス
  var lampGeo = new THREE.CylinderGeometry(1.0, 1.0, 1.2, 12);
  var lampMat = new THREE.MeshStandardMaterial({ color: 0x88aacc, roughness: 0.3, metalness: 0.5, transparent: true, opacity: 0.7 });
  var lamp = new THREE.Mesh(lampGeo, lampMat);
  lamp.position.y = 8.6;
  group.add(lamp);

  // 屋根
  var roofGeo = new THREE.ConeGeometry(1.2, 1.0, 12);
  var roofMat = new THREE.MeshStandardMaterial({ color: 0x334455, roughness: 0.8 });
  var roof = new THREE.Mesh(roofGeo, roofMat);
  roof.position.y = 9.7;
  group.add(roof);

  // 灯光源
  var pointLight = new THREE.PointLight(0xffffaa, 2.0, 40);
  pointLight.position.y = 8.6;
  group.add(pointLight);

  group.position.set(px, py, pz);
  return group;
}

// ============================================================
// 海中表現 (半透明平面)
// ============================================================
function OceanCreateUnderwaterPlane() {
  var geo = new THREE.PlaneGeometry(180, 180);
  geo.rotateX(-Math.PI / 2);
  var mat = new THREE.MeshBasicMaterial({
    color: 0x021520,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  var mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = -0.5;
  return mesh;
}

// ============================================================
// カモメ
// ============================================================
function OceanCreateSeagull() {
  var group = new THREE.Group();

  // 胴体
  var bodyGeo = new THREE.SphereGeometry(0.18, 8, 6);
  bodyGeo.scale(1.8, 0.7, 0.9);
  var bodyMat = new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.8 });
  var body = new THREE.Mesh(bodyGeo, bodyMat);
  group.add(body);

  // 翼 (左右)
  var wingShape = new THREE.Shape();
  wingShape.moveTo(0, 0);
  wingShape.quadraticCurveTo(0.6, 0.15, 1.4, 0.05);
  wingShape.quadraticCurveTo(1.0, -0.05, 0.3, -0.18);
  wingShape.quadraticCurveTo(0.1, -0.1, 0, 0);

  var extrudeSettings = { depth: 0.04, bevelEnabled: false };
  var wingGeo = new THREE.ExtrudeGeometry(wingShape, extrudeSettings);
  var wingMat = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.8, side: THREE.DoubleSide });

  var wingL = new THREE.Mesh(wingGeo, wingMat);
  wingL.position.set(0, 0, 0);
  group.add(wingL);

  var wingRGeo = new THREE.ExtrudeGeometry(wingShape, extrudeSettings);
  var wingR = new THREE.Mesh(wingRGeo, wingMat);
  wingR.scale.z = -1;
  wingR.position.set(0, 0, 0.04);
  group.add(wingR);

  // 翼への参照を保存
  group.userData.wingL = wingL;
  group.userData.wingR = wingR;

  return group;
}

// ============================================================
// 主要エントリポイント: EnvCreate
// ============================================================
function EnvCreate(scene, renderer) {

  // --- レンダラーシャドウ設定 ---
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // === 内部状態 ===
  var _sunDir = new THREE.Vector3(0.5, 0.8, 0.3).normalize();
  var _sunColor = new THREE.Color(1.0, 0.95, 0.8);
  var _skyColor = new THREE.Color(0.4, 0.7, 1.0);
  var _fogColor = new THREE.Color(0.6, 0.75, 0.9);
  var _currentP = 0.0;

  // === 霧 ===
  scene.fog = new THREE.FogExp2(_fogColor.getHex(), 0.008);

  // ============================================================
  // 海面メッシュ
  // ============================================================
  var waterGeo = new THREE.PlaneGeometry(200, 200, 256, 256);
  waterGeo.rotateX(-Math.PI / 2);

  var waterUniforms = {
    uTime:       { value: 0.0 },
    uSunDir:     { value: _sunDir.clone() },
    uSunColor:   { value: new THREE.Vector3(1.0, 0.95, 0.8) },
    uSkyColor:   { value: new THREE.Vector3(0.4, 0.7, 1.0) },
    uFogColor:   { value: new THREE.Vector3(0.6, 0.75, 0.9) },
    uFogDensity: { value: 0.008 }
  };

  var waterMat = new THREE.ShaderMaterial({
    uniforms:       waterUniforms,
    vertexShader:   OceanVertexShader,
    fragmentShader: OceanFragmentShader,
    transparent:    true,
    side:           THREE.FrontSide
  });

  var water = new THREE.Mesh(waterGeo, waterMat);
  water.receiveShadow = true;
  scene.add(water);

  // ============================================================
  // 空ドーム
  // ============================================================
  var skyGeo = new THREE.SphereGeometry(500, 32, 16);
  var skyUniforms = {
    uSunDir:        { value: _sunDir.clone() },
    uZenithColor:   { value: new THREE.Vector3(0.1, 0.35, 0.8) },
    uHorizonColor:  { value: new THREE.Vector3(0.6, 0.78, 0.95) },
    uGroundColor:   { value: new THREE.Vector3(0.25, 0.22, 0.18) },
    uSunColor:      { value: new THREE.Vector3(1.0, 0.9, 0.7) },
    uStarIntensity: { value: 0.0 }
  };
  var skyMat = new THREE.ShaderMaterial({
    uniforms:       skyUniforms,
    vertexShader:   OceanSkyVertexShader,
    fragmentShader: OceanSkyFragmentShader,
    side:           THREE.BackSide
  });
  var skyMesh = new THREE.Mesh(skyGeo, skyMat);
  scene.add(skyMesh);

  // ============================================================
  // 照明
  // ============================================================
  var sunLight = new THREE.DirectionalLight(0xfff5e0, 2.0);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width  = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.camera.near = 0.5;
  sunLight.shadow.camera.far  = 500;
  sunLight.shadow.camera.left   = -60;
  sunLight.shadow.camera.right  =  60;
  sunLight.shadow.camera.top    =  60;
  sunLight.shadow.camera.bottom = -60;
  sunLight.position.copy(_sunDir).multiplyScalar(100);
  scene.add(sunLight);

  var hemiLight = new THREE.HemisphereLight(0x88aacc, 0x445566, 0.6);
  scene.add(hemiLight);

  var ambientLight = new THREE.AmbientLight(0x223344, 0.3);
  scene.add(ambientLight);

  // ============================================================
  // 磯場
  // ============================================================
  // 主岩
  var rock1 = OceanCreateRock(2.2, 3,  0.0, -0.5, -2.0, 0.55);
  var rock2 = OceanCreateRock(1.6, 3,  2.5, -0.8, -0.5, 0.60);
  var rock3 = OceanCreateRock(1.3, 3, -2.0, -0.7,  0.5, 0.58);
  var rock4 = OceanCreateRock(0.9, 3,  1.2, -0.6,  1.8, 0.65);
  scene.add(rock1);
  scene.add(rock2);
  scene.add(rock3);
  scene.add(rock4);

  // 小岩
  var smallRockData = [
    [0.5, 2, -3.5, 0.0, -1.0, 0.7],
    [0.4, 2,  3.8, 0.1, -3.5, 0.6],
    [0.35, 2, -1.5, 0.0, 2.5, 0.75],
    [0.45, 2,  4.5, -0.1, 1.0, 0.65]
  ];
  for (var sri = 0; sri < smallRockData.length; sri++) {
    var sd = smallRockData[sri];
    scene.add(OceanCreateRock(sd[0], sd[1], sd[2], sd[3], sd[4], sd[5]));
  }

  // テトラポッド
  scene.add(OceanCreateTetrapod(-4.5, 0.0, -3.0));
  scene.add(OceanCreateTetrapod( 5.0, 0.1, -4.5));
  scene.add(OceanCreateTetrapod(-6.0, 0.0,  2.0));

  // 遠景シルエット
  scene.add(OceanCreateDistantSilhouette());

  // 灯台
  scene.add(OceanCreateLighthouse(120, 0.0, -80));

  // 海中平面
  scene.add(OceanCreateUnderwaterPlane());

  // ============================================================
  // カモメ
  // ============================================================
  var seagulls = [];
  var seagullData = [
    { radius: 35, speed: 0.22, yBase: 12, wingSpeed: 3.0, offset: 0.0,   phase: 0.0 },
    { radius: 48, speed: 0.15, yBase: 18, wingSpeed: 2.5, offset: 2.1,   phase: Math.PI * 0.66 },
    { radius: 30, speed: 0.28, yBase:  9, wingSpeed: 3.5, offset: 1.3,   phase: Math.PI * 1.33 }
  ];
  for (var sgi = 0; sgi < seagullData.length; sgi++) {
    var gull = OceanCreateSeagull();
    scene.add(gull);
    seagulls.push({ mesh: gull, data: seagullData[sgi] });
  }

  // ============================================================
  // 再利用ベクトル (毎フレームの new 回避)
  // ============================================================
  var _tmpSunVec3 = new THREE.Vector3();
  var _tmpSunColorVec = new THREE.Vector3();
  var _tmpSkyColorVec = new THREE.Vector3();
  var _tmpFogColorVec = new THREE.Vector3();

  // ============================================================
  // setTimeOfDay
  // ============================================================
  function EnvSetTimeOfDay(p) {
    _currentP = p;

    // 太陽 elevation: p=0→30°, p=0.25→70°, p=0.5→5°, p=0.75→-20°, p=1→30°
    var elevation, azimuth;
    azimuth = 0.3; // 固定 azimuth

    if (p < 0.25) {
      // 朝 (0→0.25)
      var t = p / 0.25;
      elevation = 0.3 + t * 0.9; // 0.3rad→1.2rad
    } else if (p < 0.5) {
      // 昼→夕方 (0.25→0.5)
      var t = (p - 0.25) / 0.25;
      elevation = 1.2 - t * 1.1; // 1.2→0.1
    } else if (p < 0.75) {
      // 夕方→夜 (0.5→0.75)
      var t = (p - 0.5) / 0.25;
      elevation = 0.1 - t * 0.55; // 0.1→-0.45
    } else {
      // 夜→朝前 (0.75→1.0)
      var t = (p - 0.75) / 0.25;
      elevation = -0.45 + t * 0.75; // -0.45→0.3
    }

    _sunDir.set(
      Math.cos(elevation) * Math.sin(azimuth),
      Math.sin(elevation),
      Math.cos(elevation) * Math.cos(azimuth)
    ).normalize();

    // 色の計算
    var dawn = Math.max(0, Math.min(1, 1 - Math.abs(p - 0.0) * 8));
    var noon = Math.max(0, Math.min(1, 1 - Math.abs(p - 0.25) * 6));
    var dusk = Math.max(0, Math.min(1, 1 - Math.abs(p - 0.5) * 8));
    var night = Math.max(0, Math.min(1, 1 - Math.abs(p - 0.75) * 6));
    var total = dawn + noon + dusk + night + 0.001;

    // 太陽色
    var sr = (dawn * 1.0 + noon * 1.0 + dusk * 1.0 + night * 0.1) / total;
    var sg = (dawn * 0.75 + noon * 0.95 + dusk * 0.45 + night * 0.1) / total;
    var sb = (dawn * 0.55 + noon * 0.8 + dusk * 0.2 + night * 0.15) / total;
    _sunColor.setRGB(sr, sg, sb);
    sunLight.color.setRGB(sr, sg, sb);

    // 太陽強度
    var sunIntensity = Math.max(0.0, Math.sin(elevation));
    sunLight.intensity = 0.1 + sunIntensity * 2.2;
    sunLight.position.copy(_sunDir).multiplyScalar(100);

    // 空の天頂色
    var zenithR = (dawn * 0.55 + noon * 0.15 + dusk * 0.25 + night * 0.02) / total;
    var zenithG = (dawn * 0.72 + noon * 0.42 + dusk * 0.18 + night * 0.03) / total;
    var zenithB = (dawn * 0.88 + noon * 0.95 + dusk * 0.35 + night * 0.12) / total;

    // 地平色
    var horizR = (dawn * 0.95 + noon * 0.55 + dusk * 0.88 + night * 0.08) / total;
    var horizG = (dawn * 0.75 + noon * 0.72 + dusk * 0.35 + night * 0.08) / total;
    var horizB = (dawn * 0.65 + noon * 0.90 + dusk * 0.22 + night * 0.15) / total;

    _skyColor.setRGB(horizR, horizG, horizB);

    skyUniforms.uSunDir.value.copy(_sunDir);
    skyUniforms.uZenithColor.value.set(zenithR, zenithG, zenithB);
    skyUniforms.uHorizonColor.value.set(horizR, horizG, horizB);
    skyUniforms.uSunColor.value.set(sr * 1.5, sg * 1.2, sb * 0.8);
    skyUniforms.uStarIntensity.value = night * 0.9;

    // 海面 uniform 更新
    waterUniforms.uSunDir.value.copy(_sunDir);
    waterUniforms.uSunColor.value.set(sr, sg, sb);
    waterUniforms.uSkyColor.value.set(horizR, horizG, horizB);

    // フォグ色
    var fogR = (dawn * 0.75 + noon * 0.62 + dusk * 0.65 + night * 0.08) / total;
    var fogG = (dawn * 0.80 + noon * 0.75 + dusk * 0.42 + night * 0.09) / total;
    var fogB = (dawn * 0.85 + noon * 0.90 + dusk * 0.32 + night * 0.15) / total;
    waterUniforms.uFogColor.value.set(fogR, fogG, fogB);

    if (scene.fog) {
      scene.fog.color.setRGB(fogR, fogG, fogB);
    }

    // ヘミライト更新
    var skyLum = zenithR * 0.3 + zenithG * 0.59 + zenithB * 0.11;
    hemiLight.color.setRGB(horizR * 0.5, horizG * 0.55, horizB * 0.65);
    hemiLight.groundColor.setRGB(0.2, 0.18, 0.15);
    hemiLight.intensity = 0.2 + skyLum * 0.6;
  }

  // 初期値を適用
  EnvSetTimeOfDay(0.22); // 朝

  // ============================================================
  // update
  // ============================================================
  function EnvUpdate(t, dt) {
    // 海面時間
    waterUniforms.uTime.value = t;

    // カモメ更新
    for (var i = 0; i < seagulls.length; i++) {
      var sg2 = seagulls[i];
      var d = sg2.data;
      var angle = d.phase + t * d.speed;
      sg2.mesh.position.set(
        Math.cos(angle) * d.radius,
        d.yBase + Math.sin(t * 0.4 + d.offset) * 1.5,
        Math.sin(angle) * d.radius
      );
      sg2.mesh.rotation.y = -angle - Math.PI * 0.5;

      // 羽ばたき
      var flapAngle = Math.sin(t * d.wingSpeed + d.offset) * 0.5;
      if (sg2.mesh.userData.wingL) {
        sg2.mesh.userData.wingL.rotation.z = flapAngle;
      }
      if (sg2.mesh.userData.wingR) {
        sg2.mesh.userData.wingR.rotation.z = -flapAngle;
      }
    }
  }

  // ============================================================
  // getWaveHeight — CPU 側 Gerstner 実装 (シェーダと同一係数)
  // ============================================================
  function EnvGetWaveHeight(x, z, t) {
    var y = 0.0;
    var px = x, pz = z;
    for (var i = 0; i < OceanWaves.length; i++) {
      var w = OceanWaves[i];
      var k = (2.0 * Math.PI) / w.wavelength;
      var omega = w.speed * k;
      var phase = k * (w.dx * px + w.dz * pz) - omega * t;
      y += w.amplitude * Math.sin(phase);
    }
    return y;
  }

  // ============================================================
  // env オブジェクトを返す
  // ============================================================
  return {
    water:      water,
    sunLight:   sunLight,
    standY:     1.0,
    update:     EnvUpdate,
    getWaveHeight: EnvGetWaveHeight,
    setTimeOfDay:  EnvSetTimeOfDay
  };
}
