// Builds a single self-contained HTML file: a full-screen, Spotify-Wrapped-style
// animated story, ending with a downloadable 1080×1350 share card.

export function buildHtml(stats) {
  const data = JSON.stringify(stats).replace(/</g, '\\u003c').replace(/\u2028|\u2029/g, '');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Git Wrapped ${stats.year}</title>
<style>
:root{--c0:#111;--c1:#6d28d9;--c2:#c084fc;--c3:#f0abfc;--ink:#fff}
*{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%;background:#000;color:var(--ink);font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;overflow:hidden;-webkit-font-smoothing:antialiased}
#stage{position:fixed;inset:0;display:flex;align-items:center;justify-content:center}
#story{position:relative;width:min(100vw,calc(100vh*9/16));height:min(100vh,calc(100vw*16/9));overflow:hidden;box-shadow:0 0 120px rgba(255,255,255,.08)}
.bg{position:absolute;inset:-20%;background:var(--c0);transition:background 1s}
.blob{position:absolute;width:70%;aspect-ratio:1;border-radius:50%;filter:blur(60px);opacity:.75;transition:background 1s}
.b1{background:var(--c1);top:5%;left:-10%;animation:float1 14s ease-in-out infinite}
.b2{background:var(--c2);bottom:0;right:-15%;animation:float2 17s ease-in-out infinite}
.b3{background:var(--c3);top:45%;left:30%;width:45%;opacity:.45;animation:float3 11s ease-in-out infinite}
@keyframes float1{50%{transform:translate(40%,30%) scale(1.3)}}
@keyframes float2{50%{transform:translate(-45%,-35%) scale(.8)}}
@keyframes float3{50%{transform:translate(-40%,20%) scale(1.4)}}
.grain{position:absolute;inset:0;opacity:.13;mix-blend-mode:overlay;pointer-events:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}
#bars{position:absolute;top:14px;left:14px;right:14px;display:flex;gap:5px;z-index:5}
#bars div{flex:1;height:3px;border-radius:3px;background:rgba(255,255,255,.3);overflow:hidden}
#bars i{display:block;height:100%;width:0;background:#fff}
#brand{position:absolute;top:28px;left:16px;z-index:5;font-weight:800;font-size:13px;letter-spacing:.04em;opacity:.85}
#sound{position:absolute;top:24px;right:14px;z-index:6;background:none;border:0;color:#fff;font-size:18px;cursor:pointer;opacity:.85}
.slide{position:absolute;inset:0;padding:78px 30px 40px;display:flex;flex-direction:column;justify-content:center;gap:14px;opacity:0;pointer-events:none;transition:opacity .5s;z-index:2}
.slide.on{opacity:1;pointer-events:auto}
.slide>*{opacity:0;transform:translateY(30px)}
.slide.on>*{animation:up .8s cubic-bezier(.2,.9,.2,1.15) forwards}
${Array.from({ length: 9 }, (_, i) => `.slide.on>*:nth-child(${i + 1}){animation-delay:${(0.15 + i * 0.35).toFixed(2)}s}`).join('')}
@keyframes up{to{opacity:1;transform:none}}
.k{font-size:15px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;opacity:.8}
.h{font-size:clamp(30px,8.5vmin,46px);font-weight:900;line-height:1.02;letter-spacing:-.03em}
.mega{font-size:clamp(76px,26vmin,150px);font-weight:900;line-height:.9;letter-spacing:-.06em;font-variant-numeric:tabular-nums}
.p{font-size:clamp(16px,4.4vmin,21px);line-height:1.35;opacity:.92}
.pill{display:inline-block;padding:8px 14px;border-radius:99px;background:rgba(0,0,0,.28);backdrop-filter:blur(6px);font-weight:700;font-size:15px}
.quote{font-size:clamp(18px,5vmin,24px);font-weight:800;font-style:italic;padding:16px 18px;border-left:5px solid var(--c3);background:rgba(0,0,0,.25);border-radius:0 14px 14px 0;word-break:break-word}
.row{display:flex;gap:12px;flex-wrap:wrap}
.stat{flex:1;min-width:120px;padding:14px;border-radius:16px;background:rgba(0,0,0,.25)}
.stat b{display:block;font-size:30px;font-weight:900;letter-spacing:-.03em}
.stat>span{font-size:13px;opacity:.75;font-weight:600}
.plus{color:#86efac}.minus{color:#fca5a5}
#clock{width:min(78%,300px);align-self:center}
#cal{display:grid;grid-auto-flow:column;grid-template-rows:repeat(7,1fr);gap:2px;width:100%}
#cal i{aspect-ratio:1;border-radius:2px;background:rgba(255,255,255,.12);transform:scale(0);transition:transform .35s cubic-bezier(.2,.9,.3,1.6)}
.slide.on #cal i{transform:scale(1)}
.lang{display:flex;flex-direction:column;gap:10px}
.lang div{position:relative;padding:12px 14px;border-radius:12px;background:rgba(0,0,0,.25);font-weight:800;display:flex;justify-content:space-between;overflow:hidden}
.lang div::before{content:"";position:absolute;inset:0;width:var(--w);background:rgba(255,255,255,.22);transform-origin:left;transform:scaleX(0);transition:transform 1.2s cubic-bezier(.2,.9,.2,1) .9s}
.slide.on .lang div::before{transform:scaleX(1)}
.lang span{position:relative}
#cloud{position:relative;height:42%;min-height:200px}
#cloud span{position:absolute;font-weight:900;white-space:nowrap;transform:translate(-50%,-50%) scale(0);transition:transform .7s cubic-bezier(.2,.9,.3,1.5)}
.slide.on #cloud span{transform:translate(-50%,-50%) scale(1)}
.emoji{font-size:clamp(90px,30vmin,150px);line-height:1;text-align:center}
.slide.on .emoji{animation:pop 1.2s cubic-bezier(.2,.9,.3,1.5) 2.2s forwards}
@keyframes pop{0%{opacity:0;transform:scale(0) rotate(-30deg)}100%{opacity:1;transform:none}}
.center{text-align:center;align-items:center}
#card{width:100%;max-height:62%;object-fit:contain;border-radius:14px;box-shadow:0 20px 60px rgba(0,0,0,.5)}
.btns{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}
button.cta,a.cta{border:0;cursor:pointer;padding:13px 18px;border-radius:99px;font-weight:800;font-size:15px;background:#fff;color:#000;text-decoration:none}
a.cta.ghost,button.cta.ghost{background:rgba(255,255,255,.18);color:#fff}
.nav{position:absolute;top:0;bottom:0;width:35%;z-index:3;cursor:pointer}
.nav.l{left:0}.nav.r{right:0}
.slide.last.on{z-index:4}
#fx{position:absolute;inset:0;pointer-events:none;z-index:7}
.hint{position:absolute;bottom:14px;width:100%;text-align:center;font-size:12px;opacity:.6;z-index:5}
@media (min-width:600px){#story{border-radius:22px}}
@media (prefers-reduced-motion:reduce){.blob{animation:none}}
</style>
</head>
<body>
<div id="stage"><div id="story">
  <div class="bg"></div><div class="blob b1"></div><div class="blob b2"></div><div class="blob b3"></div><div class="grain"></div>
  <div id="bars"></div>
  <div id="brand">GIT WRAPPED · ${stats.year}</div>
  <div class="nav l" data-d="-1"></div><div class="nav r" data-d="1"></div>
  <div id="slides"></div>
  <canvas id="fx"></canvas>
  <div class="hint">tap ← → · hold to pause</div>
</div></div>
<script>
const S = ${data};
const A = S.archetype;
const $ = (s, el = document) => el.querySelector(s);
const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt = (n) => Math.round(n).toLocaleString('en-US');
const pad = (n) => String(n).padStart(2, '0');
const hourLabel = (h) => pad(h) + ':00';

const PALS = [
  ['#0b0b2b', '#4f46e5', '#ec4899', '#f9a8d4'],
  ['#052e2b', '#059669', '#a3e635', '#ecfccb'],
  ['#2a0a0a', '#e11d48', '#f97316', '#fde68a'],
  ['#081a33', '#0284c7', '#22d3ee', '#a5f3fc'],
  ['#1f0a33', '#9333ea', '#f43f5e', '#fecdd3'],
  ['#1a1405', '#ca8a04', '#f472b6', '#fef08a'],
  ['#0a1f12', '#16a34a', '#38bdf8', '#bbf7d0'],
  ['#160b2e', '#7c3aed', '#06b6d4', '#c4b5fd'],
];

// ---------- slides ----------
const slides = [];
const add = (html, pal, opts = {}) => slides.push({ html, pal, ...opts });

add(\`<div class="k">Hey \${esc(S.name.split(' ')[0])} 👋</div>
<div class="h">\${S.year} was quite a year.</div>
<div class="p">You wrote code. A lot of it.<br>Let's look back at what you built.</div>\`, PALS[0]);

add(\`<div class="k">This year you made</div>
<div class="mega" data-count="\${S.commits}">0</div>
<div class="h">commits</div>
<div class="row"><span class="pill">📁 \${S.repos} repo\${S.repos > 1 ? 's' : ''}</span><span class="pill">📆 \${S.activeDays} active days</span><span class="pill">⏳ ~\${fmt(S.hoursCoding)}h of coding</span></div>\`, PALS[1]);

add(\`<div class="k">Lines of code</div>
<div class="row"><div class="stat"><b class="plus">+<span data-count="\${S.added}">0</span></b><span>added</span></div><div class="stat"><b class="minus">−<span data-count="\${S.removed}">0</span></b><span>removed</span></div></div>
<div class="p">Printed out, that's about</div>
<div class="h">\${fmt(S.book.pages)} pages 📚</div>
<div class="p">\${S.book.times >= 1 ? 'That\\'s <b>' + S.book.times.toFixed(1) + '×</b> ' : 'That\\'s <b>' + Math.round(S.book.times * 100) + '%</b> of '}<i>\${esc(S.book.title)}</i>.</div>\`, PALS[2]);

const latestIsLate = S.latest && (S.latest.hour < 5 || S.latest.hour >= 23);
add(\`<div class="k">Your clock</div>
<svg id="clock" viewBox="-110 -110 220 220"></svg>
<div class="h">Peak hour: \${hourLabel(S.peakHour)}</div>
\${latestIsLate ? \`<div class="p">Your latest commit landed at <b>\${pad(S.latest.hour)}:\${pad(S.latest.minute)}</b> 🌙</div><div class="quote">"\${esc(S.latest.subject)}"</div>\` : \`<div class="p">Favorite day of the week: <b>\${S.peakWeekday}</b>.</div>\`}\`, PALS[3], { onShow: drawClock });

add(\`<div class="k">Your year at a glance</div>
<div id="cal"></div>
<div class="row"><div class="stat"><b>🔥 \${S.longestStreak.length} days</b><span>longest streak</span></div><div class="stat"><b>⚡ \${S.busiest ? S.busiest.count : 0}</b><span>commits on \${S.busiest ? S.busiest.day : '—'}</span></div></div>
<div class="p">Your busiest day of the week was <b>\${S.peakWeekday}</b>.</div>\`, PALS[4], { onShow: drawCal });

if (S.languages.length) {
  const top = S.languages[0].share;
  add(\`<div class="k">You spoke</div>
<div class="h">\${esc(S.languages[0].name)} <span style="opacity:.7">fluently.</span></div>
<div class="lang">\${S.languages.map((l, i) => \`<div style="--w:\${(l.share / top) * 100}%"><span>\${i + 1}. \${esc(l.name)}</span><span>\${Math.round(l.share * 100)}%</span></div>\`).join('')}</div>\`, PALS[5]);
}

const confessions = [];
confessions.push(\`🐛 You fixed things <b>\${S.fixes}</b> times.\`);
if (S.wip) confessions.push(\`🚧 <b>\${S.wip}</b> commits just said "WIP".\`);
if (S.rage) confessions.push(\`🤬 <b>\${S.rage}</b> commits were written in pure rage.\`);
if (S.topFiles[0]) confessions.push(\`📂 You couldn't stop touching <b>\${esc(S.topFiles[0].name.split('/').pop())}</b> (\${S.topFiles[0].count}×).\`);
add(\`<div class="k">Your commit messages</div>
<div id="cloud"></div>
<div class="p">\${confessions.join('<br>')}</div>
\${S.shortestMsg && S.shortestMsg.subject.length <= 4 ? \`<div class="p">Most eloquent message: <b>"\${esc(S.shortestMsg.subject)}"</b></div>\` : ''}\`, PALS[6], { onShow: drawCloud });

if (S.teammates.length) {
  add(\`<div class="k">You didn't build alone</div>
<div class="h">Partner in crime:<br>\${esc(S.teammates[0].name)} 🤝</div>
<div class="p">\${S.teammates.map((t) => \`<span class="pill" style="margin:3px 3px 0 0">\${esc(t.name)} · \${t.count}</span>\`).join('')}</div>\`, PALS[7]);
}

add(\`<div class="k center" style="text-align:center">Your developer personality is…</div>
<div class="emoji">\${A.emoji}</div>
<div class="h" style="text-align:center">\${esc(A.name)}</div>
<div class="p" style="text-align:center"><i>\${esc(A.tagline)}</i></div>
<div class="p" style="text-align:center;opacity:.75">\${esc(A.description)}</div>\`, A.palette, { duration: 9000, onShow: () => setTimeout(() => confetti(220), 2600) });

add(\`<div class="k" style="text-align:center">Your \${S.year} card</div>
<img id="card" alt="Your Git Wrapped card">
<div class="btns"><button class="cta" id="dl">⬇ Download PNG</button><a class="cta ghost" id="tw" target="_blank" rel="noopener">Share on X</a><button class="cta ghost" id="again">↺ Replay</button></div>\`, A.palette, { duration: Infinity, last: true, onShow: showCard });

// ---------- engine ----------
const slidesEl = $('#slides');
const barsEl = $('#bars');
slides.forEach((s, i) => {
  const el = document.createElement('section');
  el.className = 'slide' + (s.last ? ' last' : '');
  el.innerHTML = s.html;
  slidesEl.appendChild(el);
  s.el = el;
  barsEl.appendChild(Object.assign(document.createElement('div'), { innerHTML: '<i></i>' }));
});

let cur = -1, t0 = 0, paused = false, pausedAt = 0;
function setPal(p) {
  const r = document.documentElement.style;
  ['--c0', '--c1', '--c2', '--c3'].forEach((k, i) => r.setProperty(k, p[i]));
}
function go(i) {
  if (i < 0 || i >= slides.length) return;
  if (cur >= 0) slides[cur].el.classList.remove('on');
  cur = i;
  const s = slides[i];
  setPal(s.pal);
  void s.el.offsetWidth;
  s.el.classList.add('on');
  [...barsEl.children].forEach((b, j) => (b.firstChild.style.width = j < i ? '100%' : '0'));
  t0 = performance.now();
  s.el.querySelectorAll('[data-count]').forEach(countUp);
  if (s.onShow) s.onShow(s.el);
  blip(i);
}
function tick(now) {
  const s = slides[cur];
  if (s && !paused && s.duration !== Infinity) {
    const d = s.duration || 6500;
    const p = Math.min(1, (now - t0) / d);
    barsEl.children[cur].firstChild.style.width = p * 100 + '%';
    if (p >= 1) go(cur + 1);
  }
  requestAnimationFrame(tick);
}
document.querySelectorAll('.nav').forEach((n) => {
  let down = 0;
  n.addEventListener('pointerdown', () => { down = performance.now(); paused = true; pausedAt = down; });
  n.addEventListener('pointerup', () => {
    paused = false; t0 += performance.now() - pausedAt;
    if (performance.now() - down < 250) go(cur + Number(n.dataset.d));
  });
});
addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight' || e.key === ' ') go(cur + 1);
  if (e.key === 'ArrowLeft') go(cur - 1);
});

function countUp(el) {
  const target = Number(el.dataset.count);
  const start = performance.now() + 300;
  const dur = 1800;
  (function f(now) {
    const p = Math.max(0, Math.min(1, (now - start) / dur));
    el.textContent = fmt(target * (1 - Math.pow(1 - p, 4)));
    if (p < 1) requestAnimationFrame(f);
  })(start);
}

// ---------- visuals ----------
function drawClock() {
  const svg = $('#clock');
  const max = Math.max(1, ...S.hours);
  let h = '<circle r="34" fill="rgba(0,0,0,.25)"/>';
  S.hours.forEach((v, i) => {
    const a = (i / 24) * Math.PI * 2 - Math.PI / 2;
    const len = 6 + (v / max) * 58;
    const x1 = Math.cos(a) * 40, y1 = Math.sin(a) * 40;
    const x2 = Math.cos(a) * (40 + len), y2 = Math.sin(a) * (40 + len);
    h += \`<line x1="\${x1}" y1="\${y1}" x2="\${x1}" y2="\${y1}" stroke="\${i === S.peakHour ? '#fff' : 'rgba(255,255,255,.55)'}" stroke-width="7" stroke-linecap="round"><animate attributeName="x2" to="\${x2}" dur=".9s" begin="\${0.5 + i * 0.04}s" fill="freeze" calcMode="spline" keySplines=".2 .9 .2 1"/><animate attributeName="y2" to="\${y2}" dur=".9s" begin="\${0.5 + i * 0.04}s" fill="freeze" calcMode="spline" keySplines=".2 .9 .2 1"/></line>\`;
  });
  [0, 6, 12, 18].forEach((i) => {
    const a = (i / 24) * Math.PI * 2 - Math.PI / 2;
    h += \`<text x="\${Math.cos(a) * 22}" y="\${Math.sin(a) * 22 + 4}" fill="#fff" font-size="10" font-weight="800" text-anchor="middle" opacity=".8">\${i}h</text>\`;
  });
  svg.innerHTML = h;
}

function drawCal() {
  const cal = $('#cal');
  const firstDow = (new Date(Date.UTC(S.year, 0, 1)).getUTCDay() + 6) % 7;
  const max = Math.max(1, ...S.calendar);
  let h = '';
  for (let i = 0; i < firstDow; i++) h += '<i style="visibility:hidden"></i>';
  S.calendar.forEach((v, i) => {
    const o = v ? 0.35 + 0.65 * (v / max) : 0;
    h += \`<i style="\${v ? \`background:rgba(255,255,255,\${o.toFixed(2)});\` : ''}transition-delay:\${(0.6 + i * 0.006).toFixed(3)}s"></i>\`;
  });
  cal.innerHTML = h;
}

function drawCloud() {
  const c = $('#cloud');
  const ws = S.words.slice(0, 10);
  if (!ws.length) return (c.style.display = 'none');
  const max = ws[0].count;
  const spots = [[50, 45], [25, 20], [72, 18], [22, 72], [75, 75], [50, 88], [50, 8], [10, 45], [88, 46], [35, 55]];
  c.innerHTML = ws.map((w, i) => \`<span style="left:\${spots[i][0]}%;top:\${spots[i][1]}%;font-size:\${Math.round(16 + (w.count / max) * 40)}px;opacity:\${(1 - i * 0.06).toFixed(2)};transition-delay:\${(0.5 + i * 0.12).toFixed(2)}s">\${esc(w.word)}</span>\`).join('');
}

// ---------- confetti ----------
const fx = $('#fx'), fctx = fx.getContext('2d');
let parts = [];
function confetti(n) {
  const r = fx.getBoundingClientRect();
  fx.width = r.width * devicePixelRatio; fx.height = r.height * devicePixelRatio;
  const cols = [...A.palette.slice(1), '#ffffff', '#fde047'];
  for (let i = 0; i < n; i++) parts.push({ x: fx.width / 2, y: fx.height * 0.45, vx: (Math.random() - 0.5) * 26 * devicePixelRatio, vy: (-Math.random() * 22 - 6) * devicePixelRatio, s: (4 + Math.random() * 7) * devicePixelRatio, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4, c: cols[i % cols.length], life: 1 });
  if (parts.length === n) requestAnimationFrame(stepFx);
}
function stepFx() {
  fctx.clearRect(0, 0, fx.width, fx.height);
  parts = parts.filter((p) => p.life > 0 && p.y < fx.height + 40);
  for (const p of parts) {
    p.vy += 0.6 * devicePixelRatio; p.vx *= 0.985; p.x += p.vx; p.y += p.vy; p.r += p.vr; p.life -= 0.006;
    fctx.save(); fctx.translate(p.x, p.y); fctx.rotate(p.r); fctx.globalAlpha = Math.min(1, p.life * 2);
    fctx.fillStyle = p.c; fctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); fctx.restore();
  }
  if (parts.length) requestAnimationFrame(stepFx);
}

// ---------- sound (tiny synth blips, off by default) ----------
let audio = null;
const snd = Object.assign(document.createElement('button'), { id: 'sound', textContent: '🔇', title: 'Sound' });
$('#story').appendChild(snd);
snd.onclick = (e) => { e.stopPropagation(); audio = audio ? (audio.close(), null) : new AudioContext(); snd.textContent = audio ? '🔊' : '🔇'; };
function blip(i) {
  if (!audio) return;
  const notes = [261.6, 329.6, 392, 523.3, 659.3];
  [0, 1, 2].forEach((k) => {
    const o = audio.createOscillator(), g = audio.createGain();
    o.type = 'triangle'; o.frequency.value = notes[(i + k * 2) % notes.length];
    g.gain.setValueAtTime(0.0001, audio.currentTime + k * 0.09);
    g.gain.exponentialRampToValueAtTime(0.12, audio.currentTime + k * 0.09 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + k * 0.09 + 0.4);
    o.connect(g).connect(audio.destination); o.start(audio.currentTime + k * 0.09); o.stop(audio.currentTime + k * 0.09 + 0.45);
  });
}

// ---------- share card ----------
function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); }
function renderCard() {
  const W = 1080, H = 1350, c = document.createElement('canvas');
  c.width = W; c.height = H;
  const x = c.getContext('2d');
  const [p0, p1, p2, p3] = A.palette;
  x.fillStyle = p0; x.fillRect(0, 0, W, H);
  const blob = (cx, cy, r, col, a) => { const g = x.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, col); g.addColorStop(1, 'transparent'); x.globalAlpha = a; x.fillStyle = g; x.fillRect(0, 0, W, H); x.globalAlpha = 1; };
  blob(150, 250, 700, p1, 0.9); blob(1000, 1150, 750, p2, 0.75); blob(650, 650, 420, p3, 0.35);
  const F = 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
  x.fillStyle = '#fff'; x.textBaseline = 'top';
  x.font = \`800 34px \${F}\`; x.globalAlpha = 0.85; x.fillText('GIT WRAPPED', 80, 80);
  x.textAlign = 'right'; x.fillText(String(S.year), W - 80, 80); x.textAlign = 'left'; x.globalAlpha = 1;
  x.font = \`900 150px \${F}\`; x.fillText(fmt(S.commits), 72, 160);
  x.font = \`800 46px \${F}\`; x.globalAlpha = 0.9; x.fillText('commits this year', 80, 320); x.globalAlpha = 1;
  // archetype block
  rr(x, 80, 420, W - 160, 210, 32); x.fillStyle = 'rgba(0,0,0,.28)'; x.fill();
  x.fillStyle = '#fff'; x.font = \`110px \${F}\`; x.fillText(A.emoji, 115, 470);
  x.font = \`900 58px \${F}\`; x.fillText(A.name, 270, 465);
  x.font = \`italic 600 32px \${F}\`; x.globalAlpha = 0.85; wrap(x, A.tagline, 270, 545, W - 400, 40); x.globalAlpha = 1;
  // stats grid
  const cells = [
    ['+' + fmt(S.added), 'lines added'], ['🔥 ' + S.longestStreak.length + 'd', 'longest streak'],
    [hourLabel(S.peakHour), 'peak hour'], [S.languages[0] ? S.languages[0].name : '—', 'top language'],
  ];
  cells.forEach(([v, l], i) => {
    const cx = 80 + (i % 2) * 470, cy = 670 + Math.floor(i / 2) * 175;
    rr(x, cx, cy, 450, 155, 28); x.fillStyle = 'rgba(0,0,0,.22)'; x.fill();
    x.fillStyle = '#fff'; x.font = \`900 \${v.length > 9 ? 46 : 58}px \${F}\`; x.fillText(v, cx + 32, cy + 30);
    x.font = \`700 26px \${F}\`; x.globalAlpha = 0.75; x.fillText(l.toUpperCase(), cx + 32, cy + 105); x.globalAlpha = 1;
  });
  // mini heatmap
  const firstDow = (new Date(Date.UTC(S.year, 0, 1)).getUTCDay() + 6) % 7;
  const max = Math.max(1, ...S.calendar), cs = 14.4, gap = 2.9;
  S.calendar.forEach((v, i) => {
    const k = i + firstDow, wx = 80 + Math.floor(k / 7) * (cs + gap), wy = 1035 + (k % 7) * (cs + gap);
    x.fillStyle = v ? \`rgba(255,255,255,\${(0.35 + 0.65 * v / max).toFixed(2)})\` : 'rgba(255,255,255,.12)';
    rr(x, wx, wy, cs, cs, 3); x.fill();
  });
  x.font = \`700 28px \${F}\`; x.globalAlpha = 0.8; x.fillStyle = '#fff';
  x.fillText(\`\${S.activeDays} active days · \${S.repos} repo\${S.repos > 1 ? 's' : ''} · ~\${fmt(S.hoursCoding)}h of code\`, 80, 1175);
  x.globalAlpha = 1; x.font = \`800 30px \${F}\`; x.fillText('Get yours →  npx git-wrapped', 80, 1250);
  return c;
}
function wrap(x, text, tx, ty, maxW, lh) {
  let line = '', y = ty;
  for (const w of text.split(' ')) {
    if (x.measureText(line + w).width > maxW && line) { x.fillText(line.trim(), tx, y); line = ''; y += lh; }
    line += w + ' ';
  }
  x.fillText(line.trim(), tx, y);
}
function showCard(el) {
  const c = renderCard();
  const url = c.toDataURL('image/png');
  $('#card', el).src = url;
  $('#dl', el).onclick = () => Object.assign(document.createElement('a'), { href: url, download: \`git-wrapped-\${S.year}.png\` }).click();
  const txt = \`My \${S.year} Git Wrapped: \${fmt(S.commits)} commits, a \${S.longestStreak.length}-day streak, and I'm \${A.name} \${A.emoji}\\n\\nGet yours: npx git-wrapped\`;
  $('#tw', el).href = 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(txt);
  $('#again', el).onclick = () => go(0);
  confetti(120);
}

go(0);
requestAnimationFrame(tick);
</script>
</body>
</html>`;
}
