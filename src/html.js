// Builds a single self-contained HTML file: a full-screen animated story,
// ending with a downloadable 1080×1350 share card. Fonts are embedded so the
// page looks identical everywhere, even offline.
import { readFileSync } from 'node:fs';
import { ICONS, STROKE, svgIcon } from './icons.js';

const here = (p) => new URL(p, import.meta.url);
const read = (p) => readFileSync(here(p));

// Make any string safe to drop inside a <script> or <style> element.
const safe = (s) => s.replace(/</g, '\\u003c').replace(/\u2028|\u2029/g, '');

export function buildHtml(stats) {
  const sans = read('./fonts/Geist-Variable.woff2').toString('base64');
  const mono = read('./fonts/GeistMono-Variable.woff2').toString('base64');
  const css = read('./story/style.css').toString('utf8');
  const app = read('./story/app.js').toString('utf8');
  const data = safe(JSON.stringify(stats));
  const icons = safe(JSON.stringify(ICONS));

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#000000">
<title>Git Wrapped ${stats.year}</title>
<style>
@font-face{font-family:'Geist';src:url(data:font/woff2;base64,${sans}) format('woff2');font-weight:100 900;font-display:block}
@font-face{font-family:'Geist Mono';src:url(data:font/woff2;base64,${mono}) format('woff2');font-weight:100 900;font-display:block}
${css.replace(/<\//g, '<\\/')}
</style>
</head>
<body>
<div id="stage"><div id="story">
  <div class="glow g1"></div><div class="glow g2"></div><div class="grid"></div>
  <div id="bars"></div>
  <div id="top"><div class="brand">${svgIcon('commit', 18)}<span>Git Wrapped · ${stats.year}</span></div><button id="sound" aria-label="Sound"></button></div>
  <div class="nav l" data-d="-1"></div><div class="nav r" data-d="1"></div>
  <div id="slides"></div>
  <canvas id="fx"></canvas>
  <div class="hint">Tap or ← → to navigate · hold to pause</div>
</div></div>
<script>
const S = ${data};
const ICONS = ${icons};
const STROKE = ${JSON.stringify(STROKE)};
${app.replace(/<\/script/gi, '<\\/script')}
</script>
</body>
</html>`;
}
