#!/usr/bin/env node
// src/*.js を番号順に連結し、単一の index.html を生成する
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, 'src');
const files = fs.readdirSync(SRC).filter(f => f.endsWith('.js')).sort();
const css = fs.readFileSync(path.join(__dirname, 'style.css'), 'utf8');

let code = "import * as THREE from 'three';\n";
for (const f of files) {
  const body = fs.readFileSync(path.join(SRC, f), 'utf8');
  if (/^\s*(import|export)\s/m.test(body)) {
    console.error(`NG: ${f} に import/export 文があります(DESIGN.md参照)`);
    process.exit(1);
  }
  code += `\n//============== ${f} ==============\n${body}\n`;
}

const html = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<title>チヌ釣り三昧 〜磯の主を求めて〜</title>
<style>
${css}
</style>
<script type="importmap">
{ "imports": { "three": "https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.0/three.module.min.js" } }
</script>
</head>
<body>
<div id="ui-root"></div>
<script type="module">
${code}
</script>
</body>
</html>
`;

fs.writeFileSync(path.join(__dirname, 'index.html'), html);
// 構文チェック用に .mjs も出力
fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'dist', 'bundle.mjs'),
  code.replace("import * as THREE from 'three';", 'const THREE = globalThis.THREE ?? {};'));
console.log(`OK: index.html (${(html.length / 1024).toFixed(0)} KB, ${files.length} modules)`);
