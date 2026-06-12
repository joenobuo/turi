// 01_fishmodel.js — プロシージャル魚メッシュ生成器
// THREE はスコープにある前提。import/export 禁止。
//
// テスト用ダミー species 例:
// const _TEST_CHINU = {
//   id:'chinu', name:'チヌ(クロダイ)',
//   model:{
//     profile:'standard', bodyH:0.35, bodyW:0.14,
//     snout:'blunt', tail:'forked',
//     dorsal:{start:0.28,end:0.62,h:0.12,spiny:true},
//     anal:{start:0.60,end:0.78,h:0.07},
//     pectoral:0.16,
//     colors:{back:'#1a2230',base:'#6a7080',belly:'#e0e0d8',fins:'#505560',eye:'#111'},
//     pattern:{type:'none',color:'#222',count:0,opacity:0},
//     sheen:0.65, special:null
//   }
// };
// const _TEST_HIRAME = {
//   id:'hirame', name:'ヒラメ',
//   model:{
//     profile:'flat', bodyH:0.22, bodyW:0.06,
//     snout:'pointed', tail:'truncate',
//     dorsal:{start:0.15,end:0.88,h:0.08,spiny:false},
//     anal:{start:0.20,end:0.88,h:0.06},
//     pectoral:0.20,
//     colors:{back:'#5a5040',base:'#8a7860',belly:'#e8e4d8',fins:'#706050',eye:'#111'},
//     pattern:{type:'spots',color:'#3a2818',count:8,opacity:0.6},
//     sheen:0.3, special:null
//   }
// };
// const _TEST_IKA = {
//   id:'aoriika', name:'アオリイカ',
//   model:{
//     profile:'squid', bodyH:0.30, bodyW:0.25,
//     snout:'pointed', tail:'pointed',
//     dorsal:{start:0.05,end:0.85,h:0.08,spiny:false},
//     anal:{start:0.05,end:0.85,h:0.08},
//     pectoral:0.15,
//     colors:{back:'#c8b890',base:'#d8c8a0',belly:'#f0ead8',fins:'#b8a878',eye:'#0a0a0a'},
//     pattern:{type:'speckle',color:'#806040',count:12,opacity:0.4},
//     sheen:0.2, special:null
//   }
// };

// ── 内部レジストリ ──────────────────────────────────────────────────
const _FishRegistry = new Set();

// ── テクスチャキャッシュ ─────────────────────────────────────────────
const _FishTexCache = new Map();

// ── ユーティリティ ───────────────────────────────────────────────────

function _fishHex(hex) {
  const c = new THREE.Color(hex);
  return c;
}

function _fishLerp(a, b, t) { return a + (b - a) * t; }

function _fishClamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

// CatmullRomスプライン点列生成
function _fishCatmull(pts, t) {
  const n = pts.length - 1;
  const seg = _fishClamp(Math.floor(t * n), 0, n - 1);
  const lt = t * n - seg;
  const p0 = pts[Math.max(0, seg - 1)];
  const p1 = pts[seg];
  const p2 = pts[Math.min(n, seg + 1)];
  const p3 = pts[Math.min(n, seg + 2)];
  const t2 = lt * lt, t3 = lt * t2;
  return 0.5 * (
    (2 * p1) +
    (-p0 + p2) * lt +
    (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
    (-p0 + 3 * p1 - 3 * p2 + p3) * t3
  );
}

// ── テクスチャ生成 ────────────────────────────────────────────────────

function _fishMakeTexture(species) {
  const m = species.model;
  const key = species.id + '_' + (m.pattern ? m.pattern.type : 'none');
  if (_FishTexCache.has(key)) return _FishTexCache.get(key);

  const W = 512, H = 256;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');

  const c = m.colors;

  // 背→腹 縦グラデ
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0.0, c.back);
  grad.addColorStop(0.35, c.base);
  grad.addColorStop(0.65, c.base);
  grad.addColorStop(1.0, c.belly);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // pattern 描画
  const p = m.pattern;
  if (p && p.type !== 'none') {
    ctx.save();
    ctx.globalAlpha = p.opacity || 0.5;
    ctx.fillStyle = p.color || '#333';
    ctx.strokeStyle = p.color || '#333';
    const cnt = p.count || 6;

    if (p.type === 'vbars') {
      // 縦縞(体軸方向の縞)
      for (let i = 0; i < cnt; i++) {
        const x = (i + 0.5) / cnt * W;
        const bw = W / cnt * 0.35;
        ctx.fillRect(x - bw / 2, 0, bw, H);
      }
    } else if (p.type === 'hstripes') {
      // 横縞
      for (let i = 0; i < cnt; i++) {
        const y = (i + 0.5) / cnt * H;
        const bh = H / cnt * 0.4;
        ctx.fillRect(0, y - bh / 2, W, bh);
      }
    } else if (p.type === 'spots') {
      const rng = _fishSeededRng(species.id);
      for (let i = 0; i < cnt * 3; i++) {
        const x = rng() * W;
        const y = H * 0.1 + rng() * H * 0.8;
        const r = 8 + rng() * 18;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (p.type === 'speckle') {
      const rng = _fishSeededRng(species.id);
      for (let i = 0; i < cnt * 15; i++) {
        const x = rng() * W;
        const y = H * 0.05 + rng() * H * 0.9;
        const r = 2 + rng() * 6;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (p.type === 'marble') {
      // 大理石風の曲線縞
      ctx.lineWidth = 3;
      const rng = _fishSeededRng(species.id);
      for (let i = 0; i < cnt; i++) {
        ctx.beginPath();
        const startX = rng() * W;
        ctx.moveTo(startX, 0);
        for (let y = 0; y <= H; y += 8) {
          const x = startX + Math.sin(y * 0.04 + rng() * 6) * 40 + Math.sin(y * 0.02) * 30;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // 鱗ノイズ(細かい六角格子状の明暗)
  ctx.save();
  ctx.globalAlpha = 0.06;
  const scaleW = 18, scaleH = 14;
  for (let row = 0; row < Math.ceil(H / scaleH) + 1; row++) {
    const offsetX = (row % 2) * (scaleW * 0.5);
    for (let col = 0; col < Math.ceil(W / scaleW) + 1; col++) {
      const sx = col * scaleW + offsetX;
      const sy = row * scaleH;
      // 楕円で鱗一枚
      ctx.beginPath();
      ctx.ellipse(sx, sy, scaleW * 0.45, scaleH * 0.45, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 0.4;
      ctx.stroke();
    }
  }
  ctx.restore();

  // 鰓蓋ライン(体軸 u≈0.18 付近の縦弧)
  ctx.save();
  ctx.globalAlpha = 0.25;
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  const gillX = W * 0.18;
  ctx.beginPath();
  ctx.moveTo(gillX, H * 0.1);
  ctx.quadraticCurveTo(gillX + 18, H * 0.5, gillX, H * 0.9);
  ctx.stroke();
  ctx.restore();

  // 腹部明部ハイライト
  ctx.save();
  const bellyGrad = ctx.createLinearGradient(0, H * 0.55, 0, H);
  bellyGrad.addColorStop(0, 'rgba(255,255,255,0)');
  bellyGrad.addColorStop(1, 'rgba(255,255,255,0.18)');
  ctx.fillStyle = bellyGrad;
  ctx.fillRect(0, H * 0.55, W, H * 0.45);
  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.flipY = false;  // CanvasTexture は flipY=true がデフォルトだが、UVのv=0=背面(上)と合わせるためfalseに
  tex.needsUpdate = true;
  _FishTexCache.set(key, tex);
  return tex;
}

// シード乱数
function _fishSeededRng(seed) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) { h = ((h << 5) - h + seed.charCodeAt(i)) | 0; }
  return function() {
    h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
    h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
    h ^= h >>> 16;
    return ((h >>> 0) / 0xffffffff);
  };
}

// ── スウェイ頂点シェーダ(onBeforeCompile用) ─────────────────────────

function _fishInjectSway(mat) {
  mat.userData.uTime = { value: 0.0 };
  mat.onBeforeCompile = function(shader) {
    shader.uniforms.uTime = mat.userData.uTime;
    // 頂点シェーダ先頭にuniform宣言
    shader.vertexShader = 'uniform float uTime;\n' + shader.vertexShader;
    // #include <begin_vertex> の直後にスウェイ変位を注入
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
      // 体軸後方ほど振幅が増すスウェイ
      // uv.x = 体軸u (0=頭 1=尾)
      float swayU = uv.x;
      float amp = swayU * swayU * 0.06;
      float freq = 2.5;
      float phase = uTime * 3.5 - swayU * 6.0;
      transformed.x += sin(phase) * amp;
      `
    );
  };
}

// ── 胴体BufferGeometry生成(中心スプライン+楕円断面スイープ) ──────────

function _fishMakeBodyGeometry(m, length) {
  const profile = m.profile || 'standard';
  const bodyH = m.bodyH || 0.30;
  const bodyW = m.bodyW || 0.13;

  // 体軸スプラインの制御点(相対z=体軸, x=上下, y=左右ほぼ0)
  // spine は各 u=[0..1] で (偏心x, scaleH, scaleW) を返す
  const SEG_U = 28; // 体軸分割数(28+1=29断面)
  const SEG_V = 20; // 周分割数

  // ── プロファイル別スプライン定義 ──
  // 各制御点: [u, centerY, halfH, halfW]
  // centerY: 断面中心の上下オフセット(背骨カーブ)
  // halfH: 体高の半分, halfW: 体幅の半分
  let ctrlPts; // [[u, cY, hH, hW], ...]

  // NOTE: hH/hW はメートル単位。bodyH/bodyW は「全体高/全体幅の体長比」なので半分にする
  const bH = bodyH * length * 0.5; // 最大体高の半分(m)
  const bW = bodyW * length * 0.5; // 最大体幅の半分(m)

  if (profile === 'standard') {
    // 標準(チヌ・メジナ等)
    ctrlPts = [
      [0.00, 0.00, bH * 0.08, bW * 0.06],  // 口先
      [0.05, 0.00, bH * 0.25, bW * 0.38],  // 口
      [0.12, 0.00, bH * 0.52, bW * 0.65],  // 頭前
      [0.20, 0.00, bH * 0.78, bW * 0.88],  // 鰓蓋
      [0.30, 0.00, bH * 1.00, bW * 1.00],  // 体最大断面
      [0.42, 0.00, bH * 0.98, bW * 0.96],
      [0.55, 0.00, bH * 0.88, bW * 0.86],
      [0.68, 0.00, bH * 0.68, bW * 0.65],
      [0.80, 0.00, bH * 0.42, bW * 0.40],
      [0.90, 0.00, bH * 0.20, bW * 0.18],
      [0.97, 0.00, bH * 0.07, bW * 0.06],
      [1.00, 0.00, bH * 0.025, bW * 0.015],  // 尾柄
    ];
  } else if (profile === 'deep') {
    // タイ型(体高大)
    ctrlPts = [
      [0.00, 0.00,           bH * 0.07, bW * 0.06],
      [0.05, 0.00,           bH * 0.26, bW * 0.38],
      [0.12, 0.00,           bH * 0.55, bW * 0.65],
      [0.20, 0.00,           bH * 0.85, bW * 0.85],
      [0.30, 0.00,           bH * 1.00, bW * 1.00],
      [0.42, bH * 0.05,      bH * 1.10, bW * 0.96],  // 最大高
      [0.55, bH * 0.04,      bH * 1.00, bW * 0.88],
      [0.68, 0.00,           bH * 0.72, bW * 0.65],
      [0.80, 0.00,           bH * 0.40, bW * 0.36],
      [0.90, 0.00,           bH * 0.16, bW * 0.14],
      [1.00, 0.00,           bH * 0.025, bW * 0.015],
    ];
  } else if (profile === 'slender') {
    // サヨリ/タチウオ等 細長
    ctrlPts = [
      [0.00, 0.00, bH * 0.04, bW * 0.04],
      [0.06, 0.00, bH * 0.12, bW * 0.20],
      [0.15, 0.00, bH * 0.32, bW * 0.55],
      [0.25, 0.00, bH * 0.55, bW * 0.80],
      [0.35, 0.00, bH * 0.75, bW * 0.95],
      [0.48, 0.00, bH * 0.82, bW * 1.00],
      [0.60, 0.00, bH * 0.78, bW * 0.94],
      [0.70, 0.00, bH * 0.60, bW * 0.70],
      [0.80, 0.00, bH * 0.38, bW * 0.42],
      [0.90, 0.00, bH * 0.18, bW * 0.18],
      [1.00, 0.00, bH * 0.03, bW * 0.02],
    ];
  } else if (profile === 'flat') {
    // ヒラメ/マゴチ: 横に平たく(bodyWが体幅=大きい、bodyHが体高=小さい)
    // flat では hH=体高方向(Y)、hW=横方向(X左右)
    ctrlPts = [
      [0.00, 0.00, bH * 0.06, bW * 0.12],
      [0.05, 0.00, bH * 0.20, bW * 0.42],
      [0.12, 0.00, bH * 0.45, bW * 0.72],
      [0.20, 0.00, bH * 0.72, bW * 0.90],
      [0.30, 0.00, bH * 0.92, bW * 1.00],
      [0.42, 0.00, bH * 1.00, bW * 1.00],
      [0.55, 0.00, bH * 0.95, bW * 0.96],
      [0.68, 0.00, bH * 0.75, bW * 0.78],
      [0.80, 0.00, bH * 0.48, bW * 0.50],
      [0.90, 0.00, bH * 0.22, bW * 0.22],
      [1.00, 0.00, bH * 0.04, bW * 0.03],
    ];
  } else if (profile === 'eel') {
    // ウナギ/アナゴ/タチウオ: 非常に細長、一様断面が長く続く
    ctrlPts = [
      [0.00, 0.00, bH * 0.12, bW * 0.12],
      [0.04, 0.00, bH * 0.30, bW * 0.45],
      [0.10, 0.00, bH * 0.58, bW * 0.70],
      [0.18, 0.00, bH * 0.80, bW * 0.90],
      [0.28, 0.00, bH * 0.92, bW * 1.00],
      [0.40, 0.00, bH * 0.95, bW * 1.00],
      [0.55, 0.00, bH * 0.94, bW * 0.98],
      [0.68, 0.00, bH * 0.88, bW * 0.90],
      [0.80, 0.00, bH * 0.72, bW * 0.72],
      [0.90, 0.00, bH * 0.45, bW * 0.42],
      [0.96, 0.00, bH * 0.22, bW * 0.18],
      [1.00, 0.00, bH * 0.08, bW * 0.06],
    ];
  } else if (profile === 'round') {
    // フグ/ハリセンボン: 丸くコロッとした体
    ctrlPts = [
      [0.00, 0.00, bH * 0.10, bW * 0.10],
      [0.06, 0.00, bH * 0.40, bW * 0.55],
      [0.14, 0.00, bH * 0.72, bW * 0.85],
      [0.24, 0.00, bH * 0.92, bW * 1.00],
      [0.38, 0.00, bH * 1.00, bW * 1.00],
      [0.52, 0.00, bH * 1.00, bW * 1.00],
      [0.65, 0.00, bH * 0.92, bW * 0.95],
      [0.75, 0.00, bH * 0.72, bW * 0.78],
      [0.85, 0.00, bH * 0.42, bW * 0.45],
      [0.93, 0.00, bH * 0.16, bW * 0.16],
      [1.00, 0.00, bH * 0.04, bW * 0.03],
    ];
  } else {
    // squid/default: standard と同様のfallback
    ctrlPts = [
      [0.00, 0.00, bH * 0.10, bW * 0.08],
      [0.05, 0.00, bH * 0.30, bW * 0.45],
      [0.12, 0.00, bH * 0.55, bW * 0.72],
      [0.20, 0.00, bH * 0.80, bW * 0.90],
      [0.30, 0.00, bH * 1.00, bW * 1.00],
      [0.55, 0.00, bH * 0.88, bW * 0.86],
      [0.80, 0.00, bH * 0.45, bW * 0.42],
      [1.00, 0.00, bH * 0.03, bW * 0.02],
    ];
  }

  // snout 補正: pointed は口先断面をより細く
  if (m.snout === 'pointed') {
    ctrlPts[0][2] *= 0.4;
    ctrlPts[0][3] *= 0.4;
    if (ctrlPts[1]) { ctrlPts[1][2] *= 0.55; ctrlPts[1][3] *= 0.55; }
  } else if (m.snout === 'long') {
    // longは口先u=0の断面を極細化
    ctrlPts[0][2] *= 0.2;
    ctrlPts[0][3] *= 0.2;
    if (ctrlPts[1]) { ctrlPts[1][2] *= 0.3; ctrlPts[1][3] *= 0.3; }
    if (ctrlPts[2]) { ctrlPts[2][2] *= 0.5; ctrlPts[2][3] *= 0.5; }
  }

  // flat プロファイルは bodyW/bodyH比で既に扁平化済み。追加変形不要。
  const flatRatio = 1.0;

  // スプラインから u 地点の断面パラメータを補間
  function sampleProfile(u) {
    const n = ctrlPts.length;
    // u を [0,1] に対応する i を求める
    let i = 0;
    for (let k = 0; k < n - 1; k++) {
      if (u <= ctrlPts[k + 1][0]) { i = k; break; }
      i = k;
    }
    const u0 = ctrlPts[i][0], u1 = ctrlPts[Math.min(i + 1, n - 1)][0];
    const t = (u1 > u0) ? (u - u0) / (u1 - u0) : 0;
    const cY = _fishLerp(ctrlPts[i][1], ctrlPts[Math.min(i+1,n-1)][1], t);
    const hH = _fishLerp(ctrlPts[i][2], ctrlPts[Math.min(i+1,n-1)][2], t);
    const hW = _fishLerp(ctrlPts[i][3], ctrlPts[Math.min(i+1,n-1)][3], t);
    return { cY, hH, hW };
  }

  // ジオメトリ生成
  const numU = SEG_U + 1; // 体軸方向頂点数
  const numV = SEG_V + 1; // 周方向頂点数

  const positions = new Float32Array(numU * numV * 3);
  const normals   = new Float32Array(numU * numV * 3);
  const uvs       = new Float32Array(numU * numV * 2);
  const indices   = [];

  for (let iu = 0; iu < numU; iu++) {
    const u = iu / (numU - 1);
    const zPos = (u - 0.5) * length; // 体軸方向(z軸): 頭が-z、尾が+z
    const sp = sampleProfile(u);

    for (let iv = 0; iv < numV; iv++) {
      const v = iv / (numV - 1);
      // 楕円断面: v=0が背面(上)、v=0.5が腹面(下)
      const theta = v * Math.PI * 2;

      // flat プロファイルは y(左右)を大きく、x(上下)を小さく
      let cosT = Math.cos(theta);
      let sinT = Math.sin(theta);

      const px = sp.hH * cosT * (1.0 / flatRatio) + sp.cY;
      const py = sp.hW * sinT * flatRatio;
      const pz = zPos;

      const idx = iu * numV + iv;
      positions[idx * 3 + 0] = py;     // x = 左右
      positions[idx * 3 + 1] = px;     // y = 上下
      positions[idx * 3 + 2] = pz;     // z = 体軸

      // UV: u=体軸, v=周
      uvs[idx * 2 + 0] = u;
      uvs[idx * 2 + 1] = v;
    }
  }

  // インデックス生成
  for (let iu = 0; iu < SEG_U; iu++) {
    for (let iv = 0; iv < SEG_V; iv++) {
      const a = iu * numV + iv;
      const b = iu * numV + iv + 1;
      const c = (iu + 1) * numV + iv;
      const d = (iu + 1) * numV + iv + 1;
      indices.push(a, c, b);
      indices.push(b, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('normal',   new THREE.BufferAttribute(normals,   3));
  geo.setAttribute('uv',       new THREE.BufferAttribute(uvs,       2));
  geo.setIndex(indices);
  geo.computeVertexNormals();

  // sample(u) で体表断面 {cY, hH, hW}(m) を取れるようにして鰭/目の配置に使う
  return { geo, sample: sampleProfile };
}

// ── 鰭Shape生成 ──────────────────────────────────────────────────────

function _fishFinShape(type, w, h, spiny) {
  const shape = new THREE.Shape();
  if (type === 'dorsal') {
    // 背鰭: 台形〜三角
    shape.moveTo(0, 0);
    if (spiny) {
      // 棘条ギザ輪郭(細かい鋸歯。前方が高く後方へ滑らかに低く)
      const nSpines = 11;
      for (let i = 0; i <= nSpines * 2; i++) {
        const t = i / (nSpines * 2);
        const x = t * w;
        const envelope = h * (0.55 + 0.45 * Math.sin(Math.min(t * 2.2, 1) * Math.PI * 0.5)) * (1 - t * 0.25);
        const y = (i % 2 === 0) ? envelope * 0.78 : envelope;
        shape.lineTo(x, y);
      }
    } else {
      shape.lineTo(w * 0.1, h);
      shape.lineTo(w * 0.85, h * 0.75);
    }
    shape.lineTo(w, 0);
    shape.lineTo(0, 0);
  } else if (type === 'anal') {
    shape.moveTo(0, 0);
    shape.lineTo(w * 0.15, -h);
    shape.lineTo(w * 0.85, -h * 0.65);
    shape.lineTo(w, 0);
    shape.lineTo(0, 0);
  } else if (type === 'pectoral') {
    // 胸鰭: 扇形
    shape.moveTo(0, 0);
    shape.bezierCurveTo(
      -w * 0.3, h * 0.5,
      w * 0.3, h * 1.1,
      w, h * 0.8
    );
    shape.bezierCurveTo(
      w * 1.1, h * 0.4,
      w * 0.5, -h * 0.2,
      0, 0
    );
  }
  return shape;
}

// 尾鰭輪郭
function _fishTailShape(tailType, w, h) {
  const shape = new THREE.Shape();
  if (tailType === 'forked') {
    // 二叉尾
    shape.moveTo(0, 0);
    shape.bezierCurveTo(-w * 0.3, h * 0.3, -w * 0.5, h * 1.0, -w * 0.2, h);
    shape.bezierCurveTo(0, h * 0.9, 0, h * 0.55, 0, h * 0.45);
    shape.bezierCurveTo(0, h * 0.55, 0, h * 0.9, w * 0.2, h);
    shape.bezierCurveTo(w * 0.5, h * 1.0, w * 0.3, h * 0.3, 0, 0);
  } else if (tailType === 'lunate') {
    // 三日月尾(高速遊泳魚)
    shape.moveTo(0, 0);
    shape.bezierCurveTo(-w * 0.2, h * 0.2, -w * 0.8, h * 1.1, -w * 0.15, h * 0.9);
    shape.bezierCurveTo(-w * 0.05, h * 0.6, 0, h * 0.5, 0, h * 0.42);
    shape.bezierCurveTo(0, h * 0.5, w * 0.05, h * 0.6, w * 0.15, h * 0.9);
    shape.bezierCurveTo(w * 0.8, h * 1.1, w * 0.2, h * 0.2, 0, 0);
  } else if (tailType === 'rounded') {
    // 丸尾
    shape.moveTo(0, 0);
    shape.bezierCurveTo(-w * 0.6, h * 0.3, -w * 0.7, h, 0, h * 0.95);
    shape.bezierCurveTo(w * 0.7, h, w * 0.6, h * 0.3, 0, 0);
  } else if (tailType === 'truncate') {
    // 切尾
    shape.moveTo(0, 0);
    shape.lineTo(-w * 0.55, h * 0.2);
    shape.lineTo(-w * 0.6, h * 0.85);
    shape.lineTo(0, h * 0.92);
    shape.lineTo(w * 0.6, h * 0.85);
    shape.lineTo(w * 0.55, h * 0.2);
    shape.lineTo(0, 0);
  } else if (tailType === 'pointed') {
    // 尖尾
    shape.moveTo(0, 0);
    shape.bezierCurveTo(-w * 0.3, h * 0.4, -w * 0.2, h * 0.8, 0, h);
    shape.bezierCurveTo(w * 0.2, h * 0.8, w * 0.3, h * 0.4, 0, 0);
  } else {
    // default: rounded
    shape.moveTo(0, 0);
    shape.bezierCurveTo(-w * 0.6, h * 0.3, -w * 0.7, h, 0, h * 0.95);
    shape.bezierCurveTo(w * 0.7, h, w * 0.6, h * 0.3, 0, 0);
  }
  return shape;
}

// ── 鰭メッシュ生成 ────────────────────────────────────────────────────

// 鰭基部を体表ライン(背線/腹線)に沿って曲げる(geometry空間: X=軸方向オフセット, Y=上下)
function _fishBendFinBase(geo, startU, length, surf, topSign) {
  const pos = geo.attributes.position;
  const s0 = surf(startU);
  const edge0 = s0.cY + topSign * s0.hH;
  for (let i = 0; i < pos.count; i++) {
    const u = _fishClamp(startU + pos.getX(i) / length, 0, 1);
    const s = surf(u);
    pos.setY(i, pos.getY(i) + (s.cY + topSign * s.hH) - edge0);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
}

function _fishMakeFin(shape, depth, finColor, opacity) {
  const extSettings = {
    depth: depth,
    bevelEnabled: false,
    steps: 1
  };
  const geo = new THREE.ExtrudeGeometry(shape, extSettings);
  const mat = new THREE.MeshPhysicalMaterial({
    color: finColor,
    transparent: true,
    opacity: opacity,
    side: THREE.DoubleSide,
    roughness: 0.5,
    metalness: 0.0,
    depthWrite: false
  });
  return new THREE.Mesh(geo, mat);
}

// ── イカ外套膜生成 ─────────────────────────────────────────────────────

function _fishMakeSquidBody(m, length, colors) {
  const group = new THREE.Group();

  // 外套膜: 滑らかな円錐曲面
  const nSeg = 32;
  const nRings = 20;
  const positions = new Float32Array((nRings + 1) * (nSeg + 1) * 3);
  const normals   = new Float32Array((nRings + 1) * (nSeg + 1) * 3);
  const uvs       = new Float32Array((nRings + 1) * (nSeg + 1) * 2);
  const indices   = [];

  for (let ir = 0; ir <= nRings; ir++) {
    const u = ir / nRings;
    // 外套膜: 前方(u=0)が丸く後方(u=1)が先細り
    const r = Math.sin(u * Math.PI) * 0.5 * length * m.bodyH;
    const z = (u - 0.5) * length;

    for (let is = 0; is <= nSeg; is++) {
      const v = is / nSeg;
      const theta = v * Math.PI * 2;
      const idx = ir * (nSeg + 1) + is;

      const x = Math.cos(theta) * r * (m.bodyW / m.bodyH);
      const y = Math.sin(theta) * r;

      positions[idx * 3 + 0] = x;
      positions[idx * 3 + 1] = y;
      positions[idx * 3 + 2] = z;
      uvs[idx * 2 + 0] = u;
      uvs[idx * 2 + 1] = v;
    }
  }
  for (let ir = 0; ir < nRings; ir++) {
    for (let is = 0; is < nSeg; is++) {
      const a = ir * (nSeg + 1) + is;
      const b = ir * (nSeg + 1) + is + 1;
      const c = (ir + 1) * (nSeg + 1) + is;
      const d = (ir + 1) * (nSeg + 1) + is + 1;
      indices.push(a, c, b);
      indices.push(b, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();

  const mat = new THREE.MeshPhysicalMaterial({
    color: colors.base,
    roughness: 0.4,
    metalness: 0.1,
    clearcoat: 0.5,
    clearcoatRoughness: 0.3,
    side: THREE.DoubleSide
  });
  const mantleMesh = new THREE.Mesh(geo, mat);
  group.add(mantleMesh);

  // 脚8本以上 (TubeGeometry、先細り、軽く波打ち)
  const nTentacles = 8;
  const tentacleLen = length * 0.55;
  for (let t = 0; t < nTentacles; t++) {
    const angle = (t / nTentacles) * Math.PI * 2;
    const baseR = length * m.bodyH * 0.25;
    const curve = new THREE.CatmullRomCurve3(
      Array.from({ length: 8 }, (_, k) => {
        const kf = k / 7;
        const wave = Math.sin(kf * Math.PI * 2.5 + angle) * 0.04 * length * kf;
        return new THREE.Vector3(
          Math.cos(angle) * (baseR * (1 - kf * 0.85) + wave),
          Math.sin(angle) * (baseR * (1 - kf * 0.85)),
          -length * 0.5 - kf * tentacleLen
        );
      })
    );
    const tubeRadii = (t) => 0.025 * length * (1 - t * 0.9);
    // TubeGeometry は一定半径 — 先細りは小さめ半径で近似
    const tubeGeo = new THREE.TubeGeometry(curve, 12, 0.018 * length, 6, false);
    const tubeMat = new THREE.MeshPhysicalMaterial({
      color: colors.fins,
      roughness: 0.5,
      metalness: 0.05
    });
    const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
    group.add(tubeMesh);
  }

  // ヒレ (側縁の薄いフラップ)
  const finShape = new THREE.Shape();
  finShape.moveTo(0, 0);
  finShape.bezierCurveTo(length * 0.2, length * m.bodyH * 0.4, length * 0.6, length * m.bodyH * 0.35, length * 0.8, 0);
  finShape.lineTo(0, 0);
  const finGeo = new THREE.ShapeGeometry(finShape);
  const finMat = new THREE.MeshPhysicalMaterial({
    color: colors.fins,
    transparent: true,
    opacity: 0.75,
    side: THREE.DoubleSide,
    roughness: 0.45,
    metalness: 0.0
  });
  for (let side = -1; side <= 1; side += 2) {
    const finMesh = new THREE.Mesh(finGeo, finMat);
    finMesh.rotation.x = Math.PI / 2;
    finMesh.position.set(side * length * m.bodyH * 0.42, 0, -length * 0.4);
    group.add(finMesh);
  }

  return { group, mantleMesh };
}

// ── 目メッシュ生成 ────────────────────────────────────────────────────

function _fishMakeEye(eyeColor, eyeRadius) {
  const eyeGroup = new THREE.Group();

  // 強膜(白目)
  const scleraGeo = new THREE.SphereGeometry(eyeRadius, 12, 10);
  const scleraMat = new THREE.MeshPhysicalMaterial({
    color: '#ddd8cc',
    roughness: 0.3,
    metalness: 0.0,
    clearcoat: 0.8,
    clearcoatRoughness: 0.1
  });
  const scleraMesh = new THREE.Mesh(scleraGeo, scleraMat);
  eyeGroup.add(scleraMesh);

  // 虹彩+瞳孔
  const irisGeo = new THREE.SphereGeometry(eyeRadius * 0.72, 12, 10);
  const irisMat = new THREE.MeshPhysicalMaterial({
    color: eyeColor,
    roughness: 0.25,
    metalness: 0.0,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05
  });
  const irisMesh = new THREE.Mesh(irisGeo, irisMat);
  irisMesh.position.z = eyeRadius * 0.35;
  eyeGroup.add(irisMesh);

  // ハイライト
  const hlGeo = new THREE.SphereGeometry(eyeRadius * 0.22, 8, 8);
  const hlMat = new THREE.MeshBasicMaterial({ color: '#ffffff' });
  const hlMesh = new THREE.Mesh(hlGeo, hlMat);
  hlMesh.position.set(eyeRadius * 0.25, eyeRadius * 0.3, eyeRadius * 0.65);
  eyeGroup.add(hlMesh);

  return eyeGroup;
}

// ── special 演出 ──────────────────────────────────────────────────────

function _fishApplySpecial(group, special, length, bodyMat) {
  if (!special) return;

  if (special === 'whiskers') {
    // 口元ひげ TubeGeometry
    const nWhiskers = 4;
    for (let i = 0; i < nWhiskers; i++) {
      const side = (i % 2 === 0) ? 1 : -1;
      const vert = (i < 2) ? 1 : -1;
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(side * 0.01, vert * 0.01, -length * 0.49),
        new THREE.Vector3(side * 0.04, vert * 0.02, -length * 0.52),
        new THREE.Vector3(side * 0.08, vert * 0.01, -length * 0.56),
        new THREE.Vector3(side * 0.11, vert * -0.01, -length * 0.60)
      ]);
      const geo = new THREE.TubeGeometry(curve, 8, 0.004 * length, 5, false);
      const mat = new THREE.MeshPhysicalMaterial({ color: '#888', roughness: 0.6 });
      group.add(new THREE.Mesh(geo, mat));
    }
  }

  if (special === 'glow') {
    // emissive強化
    if (bodyMat) {
      bodyMat.emissive = new THREE.Color('#00aaff');
      bodyMat.emissiveIntensity = 0.4;
    }
    // 誘引棒
    const stalkCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, length * 0.12, -length * 0.42),
      new THREE.Vector3(0.01 * length, length * 0.22, -length * 0.48),
      new THREE.Vector3(0, length * 0.28, -length * 0.40)
    ]);
    const stalkGeo = new THREE.TubeGeometry(stalkCurve, 8, 0.005 * length, 5, false);
    const stalkMat = new THREE.MeshPhysicalMaterial({ color: '#334', roughness: 0.5 });
    group.add(new THREE.Mesh(stalkGeo, stalkMat));

    // 発光球
    const lureGeo = new THREE.SphereGeometry(0.022 * length, 10, 10);
    const lureMat = new THREE.MeshPhysicalMaterial({
      color: '#88ddff',
      emissive: '#55aaff',
      emissiveIntensity: 1.5,
      roughness: 0.2,
      metalness: 0.0,
      transparent: true,
      opacity: 0.9
    });
    const lureMesh = new THREE.Mesh(lureGeo, lureMat);
    lureMesh.position.set(0, length * 0.28, -length * 0.40);
    group.add(lureMesh);

    // PointLight
    const pl = new THREE.PointLight('#77ccff', 1.5, length * 3);
    pl.position.copy(lureMesh.position);
    group.add(pl);
  }

  if (special === 'horn') {
    // 額の角
    const hornCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, length * 0.15, -length * 0.3),
      new THREE.Vector3(0, length * 0.25, -length * 0.35),
      new THREE.Vector3(0, length * 0.32, -length * 0.42)
    ]);
    const hornGeo = new THREE.TubeGeometry(hornCurve, 8, 0.012 * length, 5, false);
    const hornMat = new THREE.MeshPhysicalMaterial({ color: '#ccaa66', roughness: 0.4, metalness: 0.3 });
    group.add(new THREE.Mesh(hornGeo, hornMat));
  }

  if (special === 'tentacles') {
    // 追加触手(8本)
    for (let t = 0; t < 8; t++) {
      const angle = (t / 8) * Math.PI * 2;
      const r = length * 0.08;
      const tentCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(Math.cos(angle) * r, Math.sin(angle) * r, -length * 0.45),
        new THREE.Vector3(Math.cos(angle) * r * 2, Math.sin(angle) * r * 2, -length * 0.52),
        new THREE.Vector3(Math.cos(angle) * r * 2.5, Math.sin(angle) * r * 2, -length * 0.62),
        new THREE.Vector3(Math.cos(angle) * r * 2.2, Math.sin(angle) * r * 1.5, -length * 0.70)
      ]);
      const tentGeo = new THREE.TubeGeometry(tentCurve, 10, 0.008 * length, 6, false);
      const tentMat = new THREE.MeshPhysicalMaterial({ color: '#cca888', roughness: 0.5 });
      group.add(new THREE.Mesh(tentGeo, tentMat));
    }
  }

  if (special === 'crown') {
    // 頭上の金の冠
    const nPoints = 6;
    for (let i = 0; i < nPoints; i++) {
      const angle = (i / nPoints) * Math.PI * 2;
      const r = 0.06 * length;
      const spike = new THREE.ConeGeometry(0.008 * length, 0.04 * length, 5);
      const spikeMat = new THREE.MeshPhysicalMaterial({
        color: '#ffd700',
        metalness: 0.9,
        roughness: 0.15,
        clearcoat: 1.0
      });
      const spikeMesh = new THREE.Mesh(spike, spikeMat);
      spikeMesh.position.set(
        Math.cos(angle) * r,
        length * 0.16,
        -length * 0.28 + Math.sin(angle) * r * 0.4
      );
      group.add(spikeMesh);
    }
    // 冠輪
    const ringGeo = new THREE.TorusGeometry(0.06 * length, 0.006 * length, 8, 24);
    const ringMat = new THREE.MeshPhysicalMaterial({ color: '#ffd700', metalness: 0.9, roughness: 0.15 });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2;
    ringMesh.position.set(0, length * 0.14, -length * 0.28);
    group.add(ringMesh);
  }

  if (special === 'ghost') {
    // 全体半透明+淡いemissive
    if (bodyMat) {
      bodyMat.transparent = true;
      bodyMat.opacity = 0.55;
      bodyMat.emissive = new THREE.Color('#aaddff');
      bodyMat.emissiveIntensity = 0.25;
    }
  }
}

// ── メイン生成関数 ────────────────────────────────────────────────────

function FishCreateMesh(species, sizeCm) {
  const m = species.model;
  const profile = m.profile || 'standard';
  const length = sizeCm / 100; // 1unit=1m
  const group = new THREE.Group();
  group.name = 'fish_' + species.id;

  const isSquid = (profile === 'squid');

  // カラー
  const c = m.colors;
  const bodyColor   = new THREE.Color(c.base);
  const finColor    = new THREE.Color(c.fins);

  // テクスチャ(squid以外)
  let bodyTex = null;
  if (!isSquid && typeof document !== 'undefined') {
    try { bodyTex = _fishMakeTexture(species); } catch(e) {}
  }

  // ボディマテリアル(スウェイ用)
  // metalness低めにしてテクスチャ色が見えるようにし、clearcoatで銀皮光沢を演出
  const bodyMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#ffffff'),  // テクスチャをそのまま活かす(white掛け算=テクスチャ色)
    map: bodyTex,
    roughness: 0.40,
    metalness: m.sheen * 0.10,         // 非常に低め: テクスチャalbedoを保持
    clearcoat: m.sheen,                // sheen値をそのままclearcoatに
    clearcoatRoughness: 0.20,
    envMapIntensity: 0.8
  });
  _fishInjectSway(bodyMat);

  let bodyMesh = null;

  if (isSquid) {
    // イカ: 外套膜+脚
    const squidResult = _fishMakeSquidBody(m, length, c);
    group.add(squidResult.group);
    bodyMesh = squidResult.mantleMesh;

    // squid は触手自体もスウェイ対象(外套膜のみ)
    _fishApplySpecial(group, m.special, length, squidResult.mantleMesh.material);

  } else {
    // 通常魚: 胴体BufferGeometry
    const bodyRes = _fishMakeBodyGeometry(m, length);
    const surf = bodyRes.sample; // u→{cY,hH,hW} 体表サンプラ
    bodyMesh = new THREE.Mesh(bodyRes.geo, bodyMat);
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    group.add(bodyMesh);

    // ── 鰭配置: 全て ShapeはXY平面(X=幅、Y=高さ)。
    //   ExtrudeのdepthはZ方向(薄い厚み)。
    //   背鰭: 体軸Z方向に幅を向け、Y方向に高さ。
    //     → rotation.y = PI/2 (X→Z に回す)、position.z = start位置、position.y = 体背面
    //   臀鰭: 同様だが下向き。Shapeのhが-Y方向。rotation.y = PI/2、position.y = 体腹面
    //   胸鰭: ShapeはXY平面をそのまま使い、rotation.y でXZ平面に倒す → 体側から扇状に広がる

    // ── 鰭/目の配置はすべて surf(u)={cY,hH,hW}(m) で実際の体表に沿わせる ──
    // 座標系: x=左右, y=上下, z=体軸(頭が-z、尾が+z)。u→z は z=(u-0.5)*length。

    const isFlatP = (profile === 'flat');

    // 背鰭: 中央矢状面(YZ面)。rotation.y=-PI/2 で Shape X→+Z(尾方向)。
    // 基部は背線カーブに沿わせる。flat は水平の周縁鰭として +X 側に倒す。
    if (m.dorsal) {
      const d = m.dorsal;
      const dw = (d.end - d.start) * length;
      const dh = d.h * length;
      const dShape = _fishFinShape('dorsal', dw, dh, d.spiny && !isFlatP);
      const dMesh = _fishMakeFin(dShape, 0.003 * length, finColor, 0.85);
      const s0 = surf(d.start);
      if (isFlatP) {
        // 周縁の縁鰭: 体側(±X)の輪郭に沿う水平鰭
        _fishBendFinBase(dMesh.geometry, d.start, length, surf, +1); // hWでなくhHだが輪郭近似
        dMesh.rotation.order = 'ZYX';
        dMesh.rotation.y = -Math.PI / 2;
        dMesh.rotation.z = -Math.PI / 2 + 0.12;
        dMesh.position.set(surf((d.start + d.end) / 2).hW * 0.72, 0, (d.start - 0.5) * length);
      } else {
        _fishBendFinBase(dMesh.geometry, d.start, length, surf, +1);
        dMesh.rotation.y = -Math.PI / 2;
        dMesh.position.set(0, s0.cY + s0.hH - dh * 0.15, (d.start - 0.5) * length);
      }
      group.add(dMesh);
    }

    // 臀鰭: 同じく中央矢状面、下向き(Shapeのhが-Y方向)。flat は -X 側水平。
    if (m.anal) {
      const a = m.anal;
      const aw = (a.end - a.start) * length;
      const ah = a.h * length;
      const aShape = _fishFinShape('anal', aw, ah, false);
      const aMesh = _fishMakeFin(aShape, 0.003 * length, finColor, 0.80);
      const s0 = surf(a.start);
      if (isFlatP) {
        _fishBendFinBase(aMesh.geometry, a.start, length, surf, -1);
        aMesh.rotation.order = 'ZYX';
        aMesh.rotation.y = -Math.PI / 2;
        aMesh.rotation.z = -Math.PI / 2 - 0.12;
        aMesh.position.set(-surf((a.start + a.end) / 2).hW * 0.72, 0, (a.start - 0.5) * length);
      } else {
        _fishBendFinBase(aMesh.geometry, a.start, length, surf, -1);
        aMesh.rotation.y = -Math.PI / 2;
        aMesh.position.set(0, s0.cY - s0.hH + ah * 0.15, (a.start - 0.5) * length);
      }
      group.add(aMesh);
    }

    // 胸鰭(両側): 体側表面から後方斜め下に開く扇。flat では省略(目立つ破綻防止)
    if (m.pectoral && !isFlatP) {
      const pw = m.pectoral * length;
      const ph = pw * 0.80;
      const pShape = _fishFinShape('pectoral', pw, ph, false);
      const uPec = 0.24;
      const sPec = surf(uPec);
      for (let side = -1; side <= 1; side += 2) {
        const pMesh = _fishMakeFin(pShape, 0.002 * length, finColor, 0.82);
        // 基部を体表に少し埋め込む
        pMesh.position.set(
          side * sPec.hW * 0.80,
          sPec.cY - sPec.hH * 0.10,
          (uPec - 0.5) * length
        );
        // Shape+X(扇の伸び)を後方+Zへ、左右に開き、やや下げる
        pMesh.rotation.order = 'YZX';
        pMesh.rotation.y = -Math.PI / 2 + side * 0.55;
        pMesh.rotation.z = side * -0.35;
        group.add(pMesh);
      }
    }

    // 尾鰭: 中央矢状面で後方に展開。
    // _fishTailShape は X=±半幅(→上下), Y=0..h(→後方) で描かれているため
    // rotation.set(0,-PI/2,-PI/2) で ShapeY→+Z(後方), ShapeX→∓Y(上下対称) に写す。
    {
      const sEnd = surf(0.97);
      const sMax = surf(0.35);
      const tHalf = (isFlatP ? sMax.hW * 0.85 : sMax.hH * 0.95); // flatは水平扇
      const tLen = length * (m.tail === 'lunate' ? 0.20 : m.tail === 'forked' ? 0.18 : 0.15);
      const tShape = _fishTailShape(m.tail, tHalf, tLen);
      const tMesh = _fishMakeFin(tShape, 0.003 * length, finColor, 0.88);
      if (isFlatP) {
        tMesh.rotation.x = Math.PI / 2; // ShapeY→+Z(後方), ShapeX→±X(水平)
      } else {
        tMesh.rotation.set(0, -Math.PI / 2, -Math.PI / 2);
      }
      tMesh.position.set(0, sEnd.cY, length * 0.465); // 尾柄に少し食い込ませる
      group.add(tMesh);
    }

    // 目: 頭部(u≈0.13)の体表に半埋め込み。虹彩(+Z向き)を外側に向ける
    const isFlat = (profile === 'flat');
    const eyeRadius = length * (profile === 'round' ? 0.030 : 0.024);
    const uEye = (m.snout === 'long') ? 0.18 : 0.13;
    const sEye = surf(uEye);

    if (isFlat) {
      // ヒラメ等: 両目とも上面、虹彩は上向き
      for (let side = -1; side <= 1; side += 2) {
        const eyeGrp = _fishMakeEye(c.eye, eyeRadius);
        eyeGrp.position.set(
          side * sEye.hW * 0.30,
          sEye.cY + sEye.hH * 0.85,
          (uEye + 0.04 - 0.5) * length
        );
        eyeGrp.rotation.x = -Math.PI / 2;
        group.add(eyeGrp);
      }
    } else {
      for (let side = -1; side <= 1; side += 2) {
        const eyeGrp = _fishMakeEye(c.eye, eyeRadius);
        eyeGrp.position.set(
          side * sEye.hW * 0.78,    // 体表に半分埋める
          sEye.cY + sEye.hH * 0.28,
          (uEye - 0.5) * length
        );
        eyeGrp.rotation.y = side * Math.PI / 2; // 虹彩を外側へ
        group.add(eyeGrp);
      }
    }

    // special 演出
    _fishApplySpecial(group, m.special, length, bodyMat);
  }

  // eel プロファイル: 連続背鰭ライン(背鰭を長く展開)
  if (profile === 'eel' && m.dorsal) {
    const bHeel = m.bodyH * length * 0.5; // 半体高
    const d = m.dorsal;
    const ew = (0.90 - 0.12) * length; // eel は全長にわたる
    const eh = d.h * length * 0.7;
    const eShape = _fishFinShape('dorsal', ew, eh, false);
    const eMesh = _fishMakeFin(eShape, 0.002 * length, finColor, 0.75);
    const eStartZ = (0.12 - 0.5) * length;
    eMesh.rotation.y = -Math.PI / 2;
    eMesh.position.set(0, bHeel * 0.62, eStartZ);
    group.add(eMesh);
  }

  // userData: update関数(スウェイuniform更新)
  group.userData.update = function(t) {
    if (bodyMat && bodyMat.userData && bodyMat.userData.uTime) {
      bodyMat.userData.uTime.value = t;
    }
  };

  _FishRegistry.add(group);
  return group;
}

// ── 全個体アニメ更新 ──────────────────────────────────────────────────

function FishUpdateAll(t) {
  _FishRegistry.forEach(function(group) {
    if (group.userData && typeof group.userData.update === 'function') {
      group.userData.update(t);
    }
  });
}

// ── 破棄 ──────────────────────────────────────────────────────────────

function FishDispose(group) {
  _FishRegistry.delete(group);

  group.traverse(function(obj) {
    if (obj.isMesh) {
      if (obj.geometry) {
        obj.geometry.dispose();
      }
      if (obj.material) {
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach(function(mat) {
          if (mat.map) mat.map.dispose();
          if (mat.clearcoatMap) mat.clearcoatMap.dispose();
          if (mat.emissiveMap) mat.emissiveMap.dispose();
          mat.dispose();
        });
      }
    }
  });

  // テクスチャキャッシュは共有のため群体ごとには消さない
  // 必要に応じて FishDisposeCache() を別途呼ぶ
}

// ── キャッシュ全クリア ────────────────────────────────────────────────

function FishDisposeCache() {
  _FishTexCache.forEach(function(tex) { tex.dispose(); });
  _FishTexCache.clear();
}
