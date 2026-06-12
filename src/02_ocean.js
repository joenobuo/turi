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
  'varying float vFoamNoise;',
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
  'float hash21(vec2 p) {',
  '  return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453);',
  '}',
  'float noise21(vec2 p) {',
  '  vec2 i = floor(p); vec2 f = fract(p);',
  '  vec2 u = f*f*(3.0-2.0*f);',
  '  return mix(mix(hash21(i),hash21(i+vec2(1,0)),u.x),',
  '             mix(hash21(i+vec2(0,1)),hash21(i+vec2(1,1)),u.x),u.y);',
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
  '  // さざ波ノイズを法線に加算',
  '  float nz1 = noise21(vec2(pos.x * 0.8, pos.z * 0.8) + uTime * 0.3) * 2.0 - 1.0;',
  '  float nz2 = noise21(vec2(pos.x * 2.0 + 3.7, pos.z * 2.0 - 1.3) + uTime * 0.5) * 2.0 - 1.0;',
  '  dydx += nz1 * 0.08 + nz2 * 0.04;',
  '  dydz += nz1 * 0.06 + nz2 * 0.03;',
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
  '  float foamH = step(0.65, displaced.y);',
  '  float foamN = step(0.6, 1.0 - vNormal.y);',
  '  // ノイズで途切れる泡筋',
  '  float foamNoiseVal = noise21(vec2(pos.x * 0.3 + uTime * 0.4, pos.z * 0.3));',
  '  vFoamNoise = foamNoiseVal;',
  '  vFoam = foamH * foamN;',
  '  gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);',
  '}'
].join('\n');

var OceanFragmentShader = [
  'uniform float uTime;',
  'uniform vec3 uSunDir;',
  'uniform vec3 uSunColor;',
  'uniform vec3 uSkyColor;',
  'uniform vec3 uHorizonColor;',
  'uniform vec3 uFogColor;',
  'uniform float uFogDensity;',
  'varying vec3 vWorldPos;',
  'varying vec3 vNormal;',
  'varying float vHeight;',
  'varying float vFoam;',
  'varying float vFoamNoise;',
  '',
  'float hash21f(vec2 p) {',
  '  return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453);',
  '}',
  'float noise21f(vec2 p) {',
  '  vec2 i = floor(p); vec2 f = fract(p);',
  '  vec2 u = f*f*(3.0-2.0*f);',
  '  return mix(mix(hash21f(i),hash21f(i+vec2(1,0)),u.x),',
  '             mix(hash21f(i+vec2(0,1)),hash21f(i+vec2(1,1)),u.x),u.y);',
  '}',
  '',
  'void main() {',
  '  vec3 N = normalize(vNormal);',
  '  vec3 V = normalize(cameraPosition - vWorldPos);',
  '',
  '  // 深い藍緑 → 浅瀬グラデーション',
  '  vec3 deepColor    = vec3(0.01, 0.06, 0.18);',
  '  vec3 shallowColor = vec3(0.03, 0.22, 0.35);',
  '  float depthBlend = clamp((vHeight + 1.5) / 3.0, 0.0, 1.0);',
  '  vec3 baseColor = mix(deepColor, shallowColor, depthBlend);',
  '',
  '  // フレネル反射: 視線角で深い藍緑→水平線で空色に溶ける（強化）',
  '  float cosTheta = max(dot(N, V), 0.0);',
  '  float fresnel = pow(1.0 - cosTheta, 5.0);',
  '  fresnel = mix(0.02, 1.0, fresnel); // Schlick近似',
  '  // 水平線方向は地平線色（空の色）に溶ける',
  '  float horizonBlend = pow(1.0 - max(V.y, 0.0), 3.0);',
  '  vec3 reflectColor = mix(uSkyColor, uHorizonColor, horizonBlend);',
  '  baseColor = mix(baseColor, reflectColor, fresnel * 0.85);',
  '',
  '  // 太陽スペキュラ (Blinn-Phong)',
  '  vec3 H = normalize(uSunDir + V);',
  '  float spec = pow(max(dot(N, H), 0.0), 512.0);',
  '  vec3 specColor = uSunColor * spec * 4.0;',
  '',
  '  // マイクロスペキュラのグリッター (ノイズで揺らぐキラキラ)',
  '  vec2 glitterUV = vec2(vWorldPos.x * 3.5 + uTime * 0.8, vWorldPos.z * 3.5 + uTime * 0.5);',
  '  float glitterNoise = noise21f(glitterUV);',
  '  vec2 glitterUV2 = vec2(vWorldPos.x * 7.0 - uTime * 0.3, vWorldPos.z * 7.0 + uTime * 0.6);',
  '  float glitterNoise2 = noise21f(glitterUV2);',
  '  float glitter = pow(max(glitterNoise * glitterNoise2, 0.0), 3.0) * fresnel * 0.6;',
  '  specColor += uSunColor * glitter * 2.0;',
  '',
  '  // 拡散光',
  '  float diff = max(dot(N, uSunDir), 0.0);',
  '  vec3 litColor = baseColor * (0.25 + 0.75 * diff) + specColor;',
  '',
  '  // 波頭の泡筋 (ノイズマスクで途切れる)',
  '  float foamMask = smoothstep(0.35, 0.65, vFoamNoise);',
  '  float foamFinal = vFoam * foamMask;',
  '  litColor = mix(litColor, vec3(0.92, 0.96, 1.0), foamFinal * 0.9);',
  '',
  '  // 距離フォグ（水平線で自然に溶ける）',
  '  float dist = length(vWorldPos.xz - cameraPosition.xz);',
  '  float fogFactor = 1.0 - exp(-uFogDensity * uFogDensity * dist * dist);',
  '  litColor = mix(litColor, uHorizonColor, clamp(fogFactor, 0.0, 1.0));',
  '',
  '  gl_FragColor = vec4(litColor, 0.93);',
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
  'uniform float uTime;',
  'varying vec3 vWorldDir;',
  '',
  'float hash(vec2 p) {',
  '  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);',
  '}',
  'float noise2(vec2 p) {',
  '  vec2 i = floor(p); vec2 f = fract(p);',
  '  vec2 u = f*f*(3.0-2.0*f);',
  '  return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),',
  '             mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x),u.y);',
  '}',
  'float fbm2(vec2 p) {',
  '  float v=0.0,a=0.5; vec2 s=vec2(1.0);',
  '  for(int i=0;i<4;i++){v+=a*noise2(p*s);s*=2.03;a*=0.5;}',
  '  return v;',
  '}',
  '',
  'void main() {',
  '  vec3 dir = normalize(vWorldDir);',
  '  float elevation = dir.y;',
  '',
  '  // 昼空: 天頂の青 → 地平の白茶けたヘイズ',
  '  vec3 skyColor;',
  '  if (elevation >= 0.0) {',
  '    // より強い冪乗でヘイズ感を強調',
  '    float t = pow(elevation, 0.45);',
  '    skyColor = mix(uHorizonColor, uZenithColor, t);',
  '    // ヘイズのブルーミング: 地平線付近を少し明るく',
  '    float haze = pow(1.0 - elevation, 4.0) * 0.15;',
  '    skyColor += vec3(haze * 0.9, haze * 0.85, haze * 0.7);',
  '  } else {',
  '    skyColor = mix(uHorizonColor, uGroundColor, min(-elevation * 5.0, 1.0));',
  '  }',
  '',
  '  // 太陽ディスク + ハロ',
  '  float sunDot = dot(dir, normalize(uSunDir));',
  '  float sunDisk = smoothstep(0.9985, 1.0, sunDot);',
  '  float sunHalo1 = pow(max(sunDot, 0.0), 16.0) * 0.5;',
  '  float sunHalo2 = pow(max(sunDot, 0.0), 6.0) * 0.18;',
  '  float sunGlow = pow(max(sunDot, 0.0), 48.0) * 1.2;',
  '  // 太陽ディスク本体は非常に明るく',
  '  vec3 sunContrib = uSunColor * (sunDisk * 8.0 + sunGlow * 2.5 + sunHalo1 * 1.2 + sunHalo2 * 0.6);',
  '  skyColor += sunContrib;',
  '',
  '  // 薄い巻雲 (2-3筋のノイズストライプ)',
  '  if (elevation > 0.05 && uStarIntensity < 0.5) {',
  '    float cirrY = elevation;',
  '    vec2 cirrUV1 = vec2(dir.x / (cirrY + 0.01) * 0.18 + uTime * 0.002, dir.z / (cirrY + 0.01) * 0.06);',
  '    vec2 cirrUV2 = vec2(dir.x / (cirrY + 0.01) * 0.22 + 3.5 + uTime * 0.0015, dir.z / (cirrY + 0.01) * 0.08 + 2.0);',
  '    vec2 cirrUV3 = vec2(dir.x / (cirrY + 0.01) * 0.15 - 2.1 + uTime * 0.0025, dir.z / (cirrY + 0.01) * 0.07 - 1.5);',
  '    float cirr1 = smoothstep(0.55, 0.75, fbm2(cirrUV1)) * smoothstep(0.0, 0.15, cirrY - 0.05);',
  '    float cirr2 = smoothstep(0.58, 0.76, fbm2(cirrUV2)) * smoothstep(0.0, 0.15, cirrY - 0.08);',
  '    float cirr3 = smoothstep(0.52, 0.72, fbm2(cirrUV3)) * smoothstep(0.0, 0.12, cirrY - 0.06);',
  '    float cirrTotal = max(max(cirr1, cirr2), cirr3) * 0.28 * (1.0 - uStarIntensity * 2.0);',
  '    cirrTotal = clamp(cirrTotal, 0.0, 1.0);',
  '    skyColor = mix(skyColor, vec3(0.95, 0.97, 1.0), cirrTotal);',
  '  }',
  '',
  '  // 星 + 月',
  '  if (uStarIntensity > 0.0) {',
  '    vec2 starUV = vec2(atan(dir.z, dir.x) * 0.1591, asin(clamp(dir.y,-0.999,0.999)) * 0.3183);',
  '    vec2 cell = floor(starUV * 140.0);',
  '    float starVal = hash(cell);',
  '    float starBright = step(0.982, starVal);',
  '    float twinkle = 0.7 + 0.3 * sin(hash(cell + vec2(0.3, 0.7)) * 6.28 + uTime * 2.0);',
  '    skyColor += vec3(starBright * twinkle * uStarIntensity * 1.2);',
  '    // 月',
  '    vec3 moonDir = normalize(vec3(-uSunDir.x, -uSunDir.y + 0.3, -uSunDir.z));',
  '    float moonDot = dot(dir, moonDir);',
  '    float moonDisk = smoothstep(0.997, 1.0, moonDot);',
  '    float moonGlow = pow(max(moonDot, 0.0), 12.0) * 0.15;',
  '    skyColor += vec3(0.92, 0.95, 1.0) * (moonDisk * 3.0 + moonGlow) * uStarIntensity;',
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
// 磯の岩生成 (スムーズシェーディング対応)
// ============================================================
function OceanCreateRock(radius, detail, px, py, pz, scaleY) {
  // SphereGeometry ベース: 頂点共有が完全で computeVertexNormals が正しく働く
  var geo = new THREE.SphereGeometry(radius, 32, 24);
  var pos = geo.attributes.position;
  var count = pos.count;
  var colors = new Float32Array(count * 3);

  // 上面が平らで立てる自然な磯岩: 上部を平坦化 + 非対称ノイズ変位
  for (var i = 0; i < count; i++) {
    var x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    var len = Math.sqrt(x*x + y*y + z*z);
    var nx = x/len, ny = y/len, nz = z/len;

    // 粗い起伏 (低周波)
    var noiseCoarse = OceanFbm(nx * 1.2, ny * 1.2, nz * 1.2, 3);
    // 細かい凹凸 (高周波)
    var noiseFine   = OceanFbm(nx * 4.5, ny * 4.5, nz * 4.5, 4);
    // 中間スケール
    var noiseMid    = OceanFbm(nx * 2.5 + 1.3, ny * 2.5 - 0.7, nz * 2.5 + 0.4, 3);

    var disp = 1.0 + noiseCoarse * 0.38 + noiseMid * 0.18 + noiseFine * 0.08;

    // 非対称: x/z方向に追加変形で自然な形に
    var asymX = Math.sin(nx * 2.1 + 0.7) * 0.12;
    var asymZ = Math.cos(nz * 1.8 - 1.1) * 0.10;

    var newX = x * (disp + asymX);
    // 上面: y > 0 を圧縮してフラットなトップ、さらに上面にもノイズ凹凸を加える
    var topFlatten = y > 0 ? Math.pow(y / radius, 0.55) * radius * 0.22 : 0.0;
    // 上面に追加の凹凸ノイズ (岩の割れ目・凸凹感)
    var topNoise = y > 0 ? OceanFbm(nx * 6.0 + 2.1, nz * 6.0 - 1.3, ny * 3.0, 3) * 0.08 * (y / radius) : 0.0;
    var newY = y * disp * scaleY - topFlatten + topNoise;
    var newZ = z * (disp + asymZ);

    pos.setXYZ(i, newX, newY, newZ);

    // 頂点カラー: 上部=乾いた灰褐色、波打ち際=濡れた暗色
    // ACEStonemapping+sRGB変換を考慮して線形空間でかなり暗く設定
    var yN = newY;
    var wet = Math.max(0.0, Math.min(1.0, (0.3 - yN) * 2.5));
    // 乾燥した灰褐色 (上部): 磯岩の灰色 sRGB≈(130,118,105) → 線形≈(0.23,0.20,0.16)
    var dryR = 0.23, dryG = 0.20, dryB = 0.16;
    // 濡れた暗色 (波打ち際): 湿った黒岩 sRGB≈(45,50,58) → 線形≈(0.028,0.036,0.048)
    var wetR = 0.028, wetG = 0.036, wetB = 0.048;
    colors[i * 3]     = dryR + (wetR - dryR) * wet;
    colors[i * 3 + 1] = dryG + (wetG - dryG) * wet;
    colors[i * 3 + 2] = dryB + (wetB - dryB) * wet;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  pos.needsUpdate = true;
  geo.computeVertexNormals();

  // 濡れた部分はroughness低め、乾燥部分はroughness高め
  // vertexColorで近似: roughness=0.85で統一 (濡れ感はカラーの暗さで表現)
  var mat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.85,
    metalness: 0.04
  });
  var mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(px, py, pz);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

// ============================================================
// 沈み根の岩（テトラポッドの代替: 自然な「沈み根」数個）
// ============================================================
function OceanCreateSinkingRock(px, py, pz) {
  var group = new THREE.Group();
  // メインの沈み根 (扁平な大岩)
  var rockData = [
    { r: 0.85, sx: 1.4, sy: 0.55, sz: 1.2, ox: 0.0,  oy: 0.0,  oz: 0.0,  rx: 0.2,  ry: 0.5,  rz: 0.1  },
    { r: 0.55, sx: 1.1, sy: 0.65, sz: 0.9, ox: 0.8,  oy: -0.2, oz: 0.3,  rx: -0.3, ry: 1.0,  rz: 0.2  },
    { r: 0.45, sx: 0.9, sy: 0.7,  sz: 1.1, ox: -0.6, oy: -0.3, oz: 0.6,  rx: 0.1,  ry: 1.8,  rz: -0.1 },
    { r: 0.35, sx: 1.2, sy: 0.5,  sz: 0.8, ox: 0.3,  oy: -0.4, oz: -0.7, rx: 0.4,  ry: 0.3,  rz: 0.3  }
  ];
  var mat = new THREE.MeshStandardMaterial({
    color: 0x3a3830,
    roughness: 0.9,
    metalness: 0.03
  });
  for (var ri = 0; ri < rockData.length; ri++) {
    var rd = rockData[ri];
    var geo = new THREE.SphereGeometry(rd.r, 16, 12);
    var posAttr = geo.attributes.position;
    // ノイズ変位
    for (var vi = 0; vi < posAttr.count; vi++) {
      var vx = posAttr.getX(vi), vy = posAttr.getY(vi), vz = posAttr.getZ(vi);
      var vlen = Math.sqrt(vx*vx+vy*vy+vz*vz);
      var vn = [vx/vlen, vy/vlen, vz/vlen];
      var dn = 1.0 + OceanFbm(vn[0]*2.1, vn[1]*2.1, vn[2]*2.1, 3) * 0.25;
      posAttr.setXYZ(vi, vx * rd.sx * dn, vy * rd.sy * dn, vz * rd.sz * dn);
    }
    posAttr.needsUpdate = true;
    geo.computeVertexNormals();
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(rd.ox, rd.oy, rd.oz);
    mesh.rotation.set(rd.rx, rd.ry, rd.rz);
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
  // 遠景は霞んだ青灰色
  var mat = new THREE.MeshStandardMaterial({
    color: 0x3a4555,
    roughness: 1.0,
    metalness: 0.0,
    fog: true
  });

  // 岬: 起伏のあるシルエットメッシュ (複数の球体+変形ジオメトリ)
  var capePositions = [
    { x: 150, y: 2,   z: -60, rx: 60, ry: 14, rz: 28 },
    { x: 165, y: 1.5, z: -55, rx: 40, ry: 10, rz: 22 },
    { x: 145, y: 3,   z: -65, rx: 35, ry: 18, rz: 20 },
    { x: 155, y: 1.2, z: -58, rx: 25, ry: 8,  rz: 15 },
    { x: 140, y: 4,   z: -70, rx: 28, ry: 12, rz: 18 },
    { x: 170, y: 0.8, z: -50, rx: 22, ry: 8,  rz: 12 }
  ];
  for (var ci = 0; ci < capePositions.length; ci++) {
    var cp = capePositions[ci];
    // SphereGeometry で起伏感を出す
    var capeGeo = new THREE.SphereGeometry(1, 8, 6);
    var cpAttr = capeGeo.attributes.position;
    for (var cvi = 0; cvi < cpAttr.count; cvi++) {
      var cvx = cpAttr.getX(cvi), cvy = cpAttr.getY(cvi), cvz = cpAttr.getZ(cvi);
      cpAttr.setXYZ(cvi, cvx * cp.rx, cvy * cp.ry, cvz * cp.rz);
    }
    cpAttr.needsUpdate = true;
    capeGeo.computeVertexNormals();
    var capeMesh = new THREE.Mesh(capeGeo, mat);
    capeMesh.position.set(cp.x, cp.y, cp.z);
    group.add(capeMesh);
  }

  // 防波堤: 上面に灯台、距離感のある霞んだ色
  var wallMat = new THREE.MeshStandardMaterial({
    color: 0x4a5060,
    roughness: 0.95,
    metalness: 0.0,
    fog: true
  });
  var wallGeo = new THREE.BoxGeometry(60, 3, 4);
  var wall = new THREE.Mesh(wallGeo, wallMat);
  wall.position.set(-80, 1.5, -130);
  wall.rotation.y = 0.3;
  group.add(wall);

  var wallGeo2 = new THREE.BoxGeometry(40, 2.5, 3.5);
  var wall2 = new THREE.Mesh(wallGeo2, wallMat);
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
  var towerGeo = new THREE.CylinderGeometry(0.8, 1.2, 8, 16);
  var towerMat = new THREE.MeshStandardMaterial({ color: 0xddd8cc, roughness: 0.7 });
  var tower = new THREE.Mesh(towerGeo, towerMat);
  tower.position.y = 4;
  tower.castShadow = true;
  group.add(tower);

  // 縞模様 (リング)
  var stripeMat = new THREE.MeshStandardMaterial({ color: 0xcc3322, roughness: 0.7 });
  for (var i = 0; i < 3; i++) {
    var ringGeo = new THREE.CylinderGeometry(1.05, 1.05, 0.4, 16);
    var ring = new THREE.Mesh(ringGeo, stripeMat);
    ring.position.y = 1.5 + i * 2.5;
    group.add(ring);
  }

  // ランプハウス
  var lampGeo = new THREE.CylinderGeometry(1.0, 1.0, 1.2, 16);
  var lampMat = new THREE.MeshStandardMaterial({ color: 0x88aacc, roughness: 0.3, metalness: 0.5, transparent: true, opacity: 0.7 });
  var lamp = new THREE.Mesh(lampGeo, lampMat);
  lamp.position.y = 8.6;
  group.add(lamp);

  // 屋根
  var roofGeo = new THREE.ConeGeometry(1.2, 1.0, 16);
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
  var _horizonColor = new THREE.Color(0.72, 0.82, 0.95);
  var _fogColor = new THREE.Color(0.6, 0.75, 0.9);
  var _currentP = 0.0;

  // === 霧 (薄め: 水平線で空と自然に溶ける) ===
  scene.fog = new THREE.FogExp2(_fogColor.getHex(), 0.006);

  // ============================================================
  // 海面メッシュ
  // ============================================================
  var waterGeo = new THREE.PlaneGeometry(220, 220, 256, 256);
  waterGeo.rotateX(-Math.PI / 2);

  var waterUniforms = {
    uTime:         { value: 0.0 },
    uSunDir:       { value: _sunDir.clone() },
    uSunColor:     { value: new THREE.Vector3(1.0, 0.95, 0.8) },
    uSkyColor:     { value: new THREE.Vector3(0.4, 0.7, 1.0) },
    uHorizonColor: { value: new THREE.Vector3(0.72, 0.82, 0.95) },
    uFogColor:     { value: new THREE.Vector3(0.6, 0.75, 0.9) },
    uFogDensity:   { value: 0.006 }
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
    uZenithColor:   { value: new THREE.Vector3(0.08, 0.30, 0.78) },
    uHorizonColor:  { value: new THREE.Vector3(0.72, 0.82, 0.95) },
    uGroundColor:   { value: new THREE.Vector3(0.25, 0.22, 0.18) },
    uSunColor:      { value: new THREE.Vector3(1.0, 0.9, 0.7) },
    uStarIntensity: { value: 0.0 },
    uTime:          { value: 0.0 }
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
  // 照明 (昼: 暖色太陽光 + 空色環境光)
  // ============================================================
  var sunLight = new THREE.DirectionalLight(0xfff5e0, 2.2);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width  = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.camera.near = 0.5;
  sunLight.shadow.camera.far  = 500;
  sunLight.shadow.camera.left   = -60;
  sunLight.shadow.camera.right  =  60;
  sunLight.shadow.camera.top    =  60;
  sunLight.shadow.camera.bottom = -60;
  sunLight.shadow.radius = 4; // 柔らかい影
  sunLight.position.copy(_sunDir).multiplyScalar(100);
  scene.add(sunLight);

  // 空色の環境光で立体感
  var hemiLight = new THREE.HemisphereLight(0x7ab0e0, 0x445566, 0.7);
  scene.add(hemiLight);

  var ambientLight = new THREE.AmbientLight(0x334466, 0.25);
  scene.add(ambientLight);

  // ============================================================
  // 磯場
  // ============================================================
  // 主岩 (detail上げ, スムーズシェーディング)
  var rock1 = OceanCreateRock(2.2, 5,  0.0, -0.5, -2.0, 0.55);
  var rock2 = OceanCreateRock(1.6, 5,  2.5, -0.8, -0.5, 0.60);
  var rock3 = OceanCreateRock(1.3, 5, -2.0, -0.7,  0.5, 0.58);
  var rock4 = OceanCreateRock(0.9, 4,  1.2, -0.6,  1.8, 0.65);
  scene.add(rock1);
  scene.add(rock2);
  scene.add(rock3);
  scene.add(rock4);

  // 小岩
  var smallRockData = [
    [0.5, 3, -3.5, 0.0, -1.0, 0.7],
    [0.4, 3,  3.8, 0.1, -3.5, 0.6],
    [0.35, 3, -1.5, 0.0, 2.5, 0.75],
    [0.45, 3,  4.5, -0.1, 1.0, 0.65]
  ];
  for (var sri = 0; sri < smallRockData.length; sri++) {
    var sd = smallRockData[sri];
    scene.add(OceanCreateRock(sd[0], sd[1], sd[2], sd[3], sd[4], sd[5]));
  }

  // 沈み根の岩 (テトラポッドの代わり)
  scene.add(OceanCreateSinkingRock(-4.5, -0.5, -3.0));
  scene.add(OceanCreateSinkingRock( 5.0, -0.4, -4.5));
  scene.add(OceanCreateSinkingRock(-6.0, -0.5,  2.0));

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
    sunLight.intensity = 0.1 + sunIntensity * 2.4;
    sunLight.position.copy(_sunDir).multiplyScalar(100);

    // 空の天頂色 (昼: 深い青)
    var zenithR = (dawn * 0.45 + noon * 0.08 + dusk * 0.22 + night * 0.02) / total;
    var zenithG = (dawn * 0.65 + noon * 0.32 + dusk * 0.15 + night * 0.03) / total;
    var zenithB = (dawn * 0.85 + noon * 0.92 + dusk * 0.28 + night * 0.12) / total;

    // 地平色 (昼: 白茶けたヘイズ)
    var horizR = (dawn * 0.95 + noon * 0.72 + dusk * 0.92 + night * 0.08) / total;
    var horizG = (dawn * 0.75 + noon * 0.80 + dusk * 0.38 + night * 0.08) / total;
    var horizB = (dawn * 0.65 + noon * 0.92 + dusk * 0.22 + night * 0.15) / total;

    _skyColor.setRGB(horizR, horizG, horizB);
    _horizonColor.setRGB(horizR, horizG, horizB);

    skyUniforms.uSunDir.value.copy(_sunDir);
    skyUniforms.uZenithColor.value.set(zenithR, zenithG, zenithB);
    skyUniforms.uHorizonColor.value.set(horizR, horizG, horizB);
    skyUniforms.uSunColor.value.set(sr * 1.6, sg * 1.25, sb * 0.85);
    skyUniforms.uStarIntensity.value = night * 0.9;

    // 海面 uniform 更新
    waterUniforms.uSunDir.value.copy(_sunDir);
    waterUniforms.uSunColor.value.set(sr, sg, sb);
    waterUniforms.uSkyColor.value.set(zenithR, zenithG, zenithB);
    waterUniforms.uHorizonColor.value.set(horizR, horizG, horizB);

    // フォグ色 (地平線と同調)
    var fogR = horizR * 0.9 + 0.05;
    var fogG = horizG * 0.9 + 0.04;
    var fogB = horizB * 0.9 + 0.06;
    waterUniforms.uFogColor.value.set(fogR, fogG, fogB);
    waterUniforms.uFogDensity.value = 0.006;

    if (scene.fog) {
      scene.fog.color.setRGB(fogR, fogG, fogB);
    }

    // ヘミライト更新
    var skyLum = zenithR * 0.3 + zenithG * 0.59 + zenithB * 0.11;
    hemiLight.color.setRGB(horizR * 0.55 + 0.05, horizG * 0.6 + 0.04, horizB * 0.7 + 0.05);
    hemiLight.groundColor.setRGB(0.22, 0.20, 0.17);
    hemiLight.intensity = 0.2 + skyLum * 0.7;
  }

  // 初期値を適用
  EnvSetTimeOfDay(0.22); // 朝

  // ============================================================
  // update
  // ============================================================
  function EnvUpdate(t, dt) {
    // 海面時間
    waterUniforms.uTime.value = t;
    // 空の時間 (巻雲アニメ用)
    skyUniforms.uTime.value = t;

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
