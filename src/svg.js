// Renders a self-contained, animated SVG card for GitHub profile READMEs.
// It follows the viewer's light/dark preference (theme: 'auto'), or can be forced.
import { readFileSync } from 'node:fs';
import { ICONS, STROKE } from './icons.js';

const W = 840;
const H = 420;
const font = (f) => readFileSync(new URL(`./fonts/subset/${f}`, import.meta.url)).toString('base64');
const fmt = (n) => Math.round(n).toLocaleString('en-US');
const pad = (n) => String(n).padStart(2, '0');
const xml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]);
const clip = (s, n) => (s.length > n ? s.slice(0, n - 1) + '…' : s);

function icon(name, x, y, size, cls, width = STROKE.regular) {
  const k = size / 24;
  return `<path d="${ICONS[name]}" transform="translate(${x} ${y}) scale(${k})" class="${cls}" fill="none" stroke-width="${width}" stroke-linecap="${STROKE.cap}" stroke-linejoin="${STROKE.join}"/>`;
}

const THEMES = {
  dark: `--bg:#000;--ink:#f5f5f7;--muted:rgba(245,245,247,.56);--panel:rgba(255,255,255,.055);--hair:rgba(255,255,255,.11);--empty:rgba(255,255,255,.07);--glow:.5;`,
  light: `--bg:#fbfbfd;--ink:#1d1d1f;--muted:rgba(29,29,31,.56);--panel:rgba(0,0,0,.035);--hair:rgba(0,0,0,.08);--empty:rgba(0,0,0,.06);--glow:.22;`,
};

export function buildSvg(stats, { theme = 'auto' } = {}) {
  const A = stats.archetype;
  const [, pa, pb, pc] = A.palette;
  const G = stats.github;
  const accentDark = pb;
  const accentLight = pa;

  const vars = (t) => `${THEMES[t]}--acc:${t === 'dark' ? accentDark : accentLight};`;
  const themeCss =
    theme === 'auto'
      ? `svg{${vars('dark')}}@media (prefers-color-scheme: light){svg{${vars('light')}}}`
      : `svg{${vars(theme === 'light' ? 'light' : 'dark')}}`;

  // stats grid
  const cells = [
    ['plus', '+' + fmt(stats.added), 'lines added'],
    ['flame', `${stats.longestStreak.length} days`, 'longest streak'],
    ['clock', `${pad(stats.peakHour)}:00`, 'peak hour'],
    ['chart', stats.languages[0] ? clip(stats.languages[0].name, 12) : '—', 'top language'],
  ];
  const grid = cells
    .map(([ic, value, label], i) => {
      const x = 432 + (i % 2) * 194;
      const y = 72 + Math.floor(i / 2) * 94;
      return `<g class="a" style="animation-delay:${(0.35 + i * 0.1).toFixed(2)}s">
<rect x="${x}" y="${y}" width="182" height="82" rx="16" class="panel"/>
${icon(ic, x + 16, y + 14, 16, 'acc-s', STROKE.bold)}
<text x="${x + 16}" y="${y + 56}" class="sans val">${xml(value)}</text>
<text x="${x + 16}" y="${y + 72}" class="mono lbl">${xml(label.toUpperCase())}</text>
</g>`;
    })
    .join('\n');

  // heatmap
  const firstDow = (new Date(Date.UTC(stats.year, 0, 1)).getUTCDay() + 6) % 7;
  const max = Math.max(1, ...stats.calendar);
  const step = 14.6;
  const size = 11.4;
  let heat = '';
  stats.calendar.forEach((v, i) => {
    const k = i + firstDow;
    const col = Math.floor(k / 7);
    const x = (32 + col * step).toFixed(1);
    const y = (276 + (k % 7) * step).toFixed(1);
    const delay = (0.6 + col * 0.018).toFixed(3);
    heat += v
      ? `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="2.5" class="c on" style="opacity:${(0.28 + (0.72 * v) / max).toFixed(2)};animation-delay:${delay}s"/>`
      : `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="2.5" class="c off" style="animation-delay:${delay}s"/>`;
  });

  const repos = `${stats.repos} repo${stats.repos === 1 ? '' : 's'}`;
  const handle = G ? `@${G.login}` : stats.name;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${xml(`Git Wrapped ${stats.year}: ${fmt(stats.commits)} commits, ${A.name}`)}">
<title>${xml(`Git Wrapped ${stats.year} · ${handle}`)}</title>
<style>
@font-face{font-family:GW;src:url(data:font/woff2;base64,${font('Geist-Latin.woff2')}) format('woff2');font-weight:400 700}
@font-face{font-family:GWM;src:url(data:font/woff2;base64,${font('GeistMono-Latin.woff2')}) format('woff2');font-weight:500}
${themeCss}
.sans{font-family:GW,-apple-system,'SF Pro Display','Segoe UI',Helvetica,Arial,sans-serif}
.mono{font-family:GWM,'SF Mono',ui-monospace,Menlo,Consolas,monospace;font-weight:500}
.bg{fill:var(--bg);stroke:var(--hair)}
.glow{opacity:var(--glow)}
.ink{fill:var(--ink)}
.muted{fill:var(--muted)}
.panel{fill:var(--panel);stroke:var(--hair)}
.acc-s{stroke:var(--acc)}
.ink-s{stroke:var(--ink)}
.s0{stop-color:var(--ink)}
.s1{stop-color:var(--acc)}
.head{font-size:12px;letter-spacing:2px;fill:var(--muted)}
.num{font-size:78px;font-weight:700;letter-spacing:-3.5px;fill:url(#num)}
.cap{font-size:11px;letter-spacing:1.8px;fill:var(--muted)}
.name{font-size:20px;font-weight:600;letter-spacing:-.5px;fill:var(--ink)}
.tag{font-size:12px;fill:var(--muted)}
.val{font-size:24px;font-weight:600;letter-spacing:-.8px;fill:var(--ink)}
.lbl{font-size:9.5px;letter-spacing:1.4px;fill:var(--muted)}
.foot{font-size:10.5px;letter-spacing:1px;fill:var(--muted)}
.cmd{font-size:10.5px;letter-spacing:1px;fill:var(--ink)}
.on{fill:var(--acc)}
.off{fill:var(--empty)}
.a{animation:in .9s cubic-bezier(.22,1,.36,1) both}
.c{animation:pop .5s cubic-bezier(.22,1,.36,1) both;transform-box:fill-box;transform-origin:center}
@keyframes in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
@keyframes pop{from{transform:scale(0)}to{transform:scale(1)}}
@media (prefers-reduced-motion: reduce){.a,.c{animation:none}}
</style>
<defs>
<clipPath id="r"><rect width="${W}" height="${H}" rx="18"/></clipPath>
<radialGradient id="g1"><stop offset="0" stop-color="${pa}"/><stop offset="1" stop-color="${pa}" stop-opacity="0"/></radialGradient>
<radialGradient id="g2"><stop offset="0" stop-color="${pb}"/><stop offset="1" stop-color="${pb}" stop-opacity="0"/></radialGradient>
<linearGradient id="num" x1="0" y1="0" x2="0" y2="1"><stop offset=".35" class="s0"/><stop offset="1.1" class="s1"/></linearGradient>
<linearGradient id="tile" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${pa}"/><stop offset="1" stop-color="${pb}"/></linearGradient>
</defs>
<g clip-path="url(#r)">
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="18" class="bg"/>
<circle cx="60" cy="10" r="320" fill="url(#g1)" class="glow"/>
<circle cx="820" cy="430" r="340" fill="url(#g2)" class="glow"/>
</g>
<g class="a">
${icon('commit', 30, 25, 20, 'ink-s', STROKE.bold)}
<text x="58" y="40" class="mono head">GIT WRAPPED · ${stats.year}</text>
<text x="${W - 32}" y="40" text-anchor="end" class="mono head">${xml(clip(handle, 32))}</text>
</g>
<g class="a" style="animation-delay:.1s">
<text x="28" y="136" class="sans num">${fmt(stats.commits)}</text>
<text x="32" y="160" class="mono cap">COMMITS IN ${stats.year}</text>
</g>
<g class="a" style="animation-delay:.25s">
<rect x="32" y="178" width="376" height="76" rx="16" class="panel"/>
<rect x="44" y="190" width="52" height="52" rx="13" fill="url(#tile)"/>
${icon(A.icon, 55, 201, 30, '', STROKE.bold).replace('class=""', 'stroke="#fff"')}
<text x="110" y="213" class="sans name">${xml(A.name)}</text>
<text x="110" y="234" class="sans tag">${xml(clip(A.tagline, 50))}</text>
</g>
${grid}
<g>${heat}</g>
<g class="a" style="animation-delay:1.2s">
<text x="32" y="400" class="mono foot">${xml(`${fmt(stats.activeDays)} ACTIVE DAYS · ${repos.toUpperCase()} · ~${fmt(stats.hoursCoding)}H OF CODE`)}</text>
<text x="${W - 32}" y="400" text-anchor="end" class="mono cmd">npx dev-wrapped</text>
</g>
</svg>
`;
}
