/* global S, ICONS */
const A = S.archetype;
const G = S.github;
const $ = (s, el = document) => el.querySelector(s);
const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const fmt = (n) => Math.round(n).toLocaleString('en-US');
const pad = (n) => String(n).padStart(2, '0');
const ic = (name, size = 16) =>
  `<svg class="ic" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${ICONS[name]}"/></svg>`;

// Apple system colors (dark appearance): [glow A, glow B, accent]
const PAL = {
  indigo: ['#5e5ce6', '#bf5af2', '#b4b2ff'],
  green: ['#30d158', '#64d2ff', '#9af0b4'],
  orange: ['#ff9f0a', '#ff375f', '#ffc970'],
  cyan: ['#64d2ff', '#5e5ce6', '#a8e6ff'],
  pink: ['#ff375f', '#bf5af2', '#ff9fb4'],
  yellow: ['#ffd60a', '#ff9f0a', '#ffe680'],
  teal: ['#40c8e0', '#30d158', '#9eeefa'],
  purple: ['#bf5af2', '#5e5ce6', '#e0b3ff'],
};
const ARCH = [A.palette[1], A.palette[2], A.palette[3]];

const label = (icon, text) => `<div class="label">${ic(icon, 15)}<span>${text}</span></div>`;
const stat = (icon, value, text) => `<div class="stat glass">${ic(icon, 18)}<b>${value}</b><span>${text}</span></div>`;
const chip = (icon, text) => `<span class="chip glass">${ic(icon, 14)}${text}</span>`;

// ---------- slides ----------
const slides = [];
const add = (html, pal, opts = {}) => slides.push({ html, pal, ...opts });
const first = esc(S.name.split(' ')[0]);

add(`${label('commit', `${S.year} in review`)}
<div class="title">Hey ${first}.<br><span class="dim">${S.year} was quite a year.</span></div>
<div class="sub">You wrote code. A lot of it.<br>Let's look back at what you built.</div>`, PAL.indigo);

add(`${label('commit', 'This year you made')}
<div class="num" data-count="${S.commits}">0</div>
<div class="title">commits</div>
<div class="chips">${chip('folder', `${S.repos} repo${S.repos > 1 ? 's' : ''}`)}${chip('calendar', `${S.activeDays} active days`)}${chip('timer', `~${fmt(S.hoursCoding)}h of code`)}</div>`, PAL.green);

if (G) {
  add(`${label('star', 'Your year on GitHub')}
<div class="num" data-count="${G.contributions}">0</div>
<div class="title">contributions</div>
<div class="row">${stat('pr', fmt(G.prs), 'pull requests')}${stat('eye', fmt(G.reviews), 'reviews')}${stat('issue', fmt(G.issues), 'issues')}</div>
<div class="chips">${G.topRepos.slice(0, 3).map((r) => chip('folder', `${esc(r.name)} · ${r.count}`)).join('')}</div>`, PAL.purple);
}

add(`${label('doc', 'Lines of code')}
<div class="row">${stat('plus', `<span data-count="${S.added}">0</span>`, 'lines added')}${stat('minus', `<span data-count="${S.removed}">0</span>`, 'lines removed')}</div>
<div class="sub">Printed out, that's about</div>
<div class="title">${fmt(S.book.pages)} pages.</div>
<div class="sub">${ic('book', 16)} That's ${S.book.times >= 1 ? `<b>${S.book.times.toFixed(1)}×</b> ` : `<b>${Math.round(S.book.times * 100)}%</b> of `}<i>${esc(S.book.title)}</i>.</div>`, PAL.orange);

const late = S.latest && (S.latest.hour < 5 || S.latest.hour >= 23);
add(`${label('clock', 'Your clock')}
<svg id="clock" viewBox="-110 -110 220 220"></svg>
<div class="title">Peak hour<br><span class="dim">${pad(S.peakHour)}:00</span></div>
${late
    ? `<div class="quote glass">"${esc(S.latest.subject)}"<small>Latest commit · ${pad(S.latest.hour)}:${pad(S.latest.minute)} · ${S.latest.day}</small></div>`
    : `<div class="sub">Favorite day of the week: <b>${S.peakWeekday}</b>.</div>`}`, PAL.cyan, { onShow: drawClock });

add(`${label('calendar', 'Your year at a glance')}
<div id="cal" class="glass"></div>
<div class="row">${stat('flame', `${S.longestStreak.length} days`, 'longest streak')}${stat('bolt', S.busiest ? S.busiest.count : 0, S.busiest ? `commits on ${S.busiest.day.slice(5)}` : 'busiest day')}</div>
<div class="sub">Your busiest day of the week was <b>${S.peakWeekday}</b>.</div>`, PAL.pink, { onShow: drawCal });

if (S.languages.length) {
  const top = S.languages[0].share;
  add(`${label('chart', 'You spoke')}
<div class="title">${esc(S.languages[0].name)}<br><span class="dim">fluently.</span></div>
<div class="bars">${S.languages.map((l) => `<div class="bar"><header><span>${esc(l.name)}</span><span>${Math.round(l.share * 100)}%</span></header><div class="track"><div class="fill" style="--w:${(l.share / top) * 100}%"></div></div></div>`).join('')}</div>`, PAL.yellow);
}

const facts = [`${ic('wrench')}<span>You fixed things <b>${S.fixes}</b> times.</span>`];
if (S.wip) facts.push(`${ic('hourglass')}<span><b>${S.wip}</b> commits just said "WIP".</span>`);
if (S.rage) facts.push(`${ic('warning')}<span><b>${S.rage}</b> commits were written in pure frustration.</span>`);
if (S.topFiles[0]) facts.push(`${ic('doc')}<span>You couldn't stop touching <b>${esc(S.topFiles[0].name.split('/').pop())}</b> (${S.topFiles[0].count}×).</span>`);
if (S.shortestMsg && S.shortestMsg.subject.length <= 4) facts.push(`${ic('bubble')}<span>Most eloquent message: <b>"${esc(S.shortestMsg.subject)}"</b></span>`);
add(`${label('bubble', 'Your commit messages')}
<div id="cloud"></div>
<div class="list">${facts.map((f) => `<div>${f}</div>`).join('')}</div>`, PAL.teal, { onShow: drawCloud });

if (S.teammates.length) {
  add(`${label('people', "You didn't build alone")}
<div class="title">Partner in crime<br><span class="dim">${esc(S.teammates[0].name)}</span></div>
<div class="chips">${S.teammates.map((t) => chip('people', `${esc(t.name)} · ${t.count}`)).join('')}</div>`, PAL.indigo);
}

add(`<div class="label" style="justify-content:center">Your developer personality</div>
<div class="tile">${ic(A.icon, 64)}</div>
<div class="title" style="text-align:center">${esc(A.name)}</div>
<div class="sub" style="text-align:center">${esc(A.tagline)}</div>
<div class="sub" style="text-align:center;color:var(--muted);font-size:15px">${esc(A.description)}</div>`, ARCH, { duration: 9000, onShow: () => setTimeout(() => confetti(160), 2400) });

add(`<div class="label" style="justify-content:center">Your ${S.year} card</div>
<img id="card" alt="Your Git Wrapped card">
<div class="btns"><button class="cta" id="dl">${ic('download', 17)}Save image</button><a class="cta ghost" id="tw" target="_blank" rel="noopener">${ic('share', 17)}Share</a><button class="cta ghost" id="again" aria-label="Replay">${ic('replay', 17)}</button></div>`, ARCH, { duration: Infinity, last: true, onShow: showCard });

// ---------- engine ----------
const slidesEl = $('#slides');
const barsEl = $('#bars');
for (const s of slides) {
  const el = document.createElement('section');
  el.className = 'slide' + (s.last ? ' last' : '');
  el.innerHTML = s.html;
  slidesEl.appendChild(el);
  s.el = el;
  barsEl.appendChild(Object.assign(document.createElement('div'), { innerHTML: '<i></i>' }));
}

let cur = -1;
let t0 = 0;
let paused = false;
let pausedAt = 0;
function setPal(p) {
  const r = document.documentElement.style;
  r.setProperty('--a', p[0]);
  r.setProperty('--b', p[1]);
  r.setProperty('--c', p[2]);
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
    const p = Math.min(1, (now - t0) / (s.duration || 6500));
    barsEl.children[cur].firstChild.style.width = p * 100 + '%';
    if (p >= 1) go(cur + 1);
  }
  requestAnimationFrame(tick);
}
document.querySelectorAll('.nav').forEach((n) => {
  let down = 0;
  n.addEventListener('pointerdown', () => {
    down = performance.now();
    paused = true;
    pausedAt = down;
  });
  n.addEventListener('pointerup', () => {
    paused = false;
    t0 += performance.now() - pausedAt;
    if (performance.now() - down < 250) go(cur + Number(n.dataset.d));
  });
});
addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight' || e.key === ' ') go(cur + 1);
  if (e.key === 'ArrowLeft') go(cur - 1);
});

function countUp(el) {
  const target = Number(el.dataset.count);
  const start = performance.now() + 350;
  (function f(now) {
    const p = Math.max(0, Math.min(1, (now - start) / 1900));
    el.textContent = fmt(target * (1 - Math.pow(1 - p, 4)));
    if (p < 1) requestAnimationFrame(f);
  })(start);
}

// ---------- visuals ----------
function drawClock() {
  const max = Math.max(1, ...S.hours);
  let h = `<circle r="36" fill="none" stroke="rgba(255,255,255,.1)"/>`;
  S.hours.forEach((v, i) => {
    const a = (i / 24) * Math.PI * 2 - Math.PI / 2;
    const len = 5 + (v / max) * 58;
    const [x1, y1] = [Math.cos(a) * 44, Math.sin(a) * 44];
    const [x2, y2] = [Math.cos(a) * (44 + len), Math.sin(a) * (44 + len)];
    const peak = i === S.peakHour;
    const anim = (attr, to) => `<animate attributeName="${attr}" to="${to}" dur="1.1s" begin="${0.5 + i * 0.035}s" fill="freeze" calcMode="spline" keySplines=".22 1 .36 1"/>`;
    h += `<line x1="${x1}" y1="${y1}" x2="${x1}" y2="${y1}" stroke="${peak ? 'var(--c)' : 'rgba(255,255,255,.5)'}" stroke-width="${peak ? 6 : 4.5}" stroke-linecap="round">${anim('x2', x2)}${anim('y2', y2)}</line>`;
  });
  [0, 6, 12, 18].forEach((i) => {
    const a = (i / 24) * Math.PI * 2 - Math.PI / 2;
    h += `<text x="${Math.cos(a) * 24}" y="${Math.sin(a) * 24 + 3.5}" fill="rgba(255,255,255,.55)" font-family="Geist Mono, monospace" font-size="9" text-anchor="middle">${pad(i)}</text>`;
  });
  $('#clock').innerHTML = h;
}

function drawCal() {
  const firstDow = (new Date(Date.UTC(S.year, 0, 1)).getUTCDay() + 6) % 7;
  const max = Math.max(1, ...S.calendar);
  let h = '<i style="visibility:hidden"></i>'.repeat(firstDow);
  S.calendar.forEach((v, i) => {
    const o = v ? 0.3 + 0.7 * (v / max) : 0;
    const bg = v ? `background:color-mix(in srgb, var(--c) ${Math.round(o * 100)}%, transparent);` : '';
    h += `<i style="${bg}transition-delay:${(0.6 + i * 0.005).toFixed(3)}s"></i>`;
  });
  $('#cal').innerHTML = h;
}

function drawCloud() {
  const c = $('#cloud');
  const ws = S.words.slice(0, 9);
  if (!ws.length) return void (c.style.display = 'none');
  const max = ws[0].count;
  const spots = [[50, 46], [24, 18], [74, 16], [22, 76], [76, 78], [50, 92], [50, 6], [12, 47], [88, 47]];
  c.innerHTML = ws
    .map((w, i) => `<span style="left:${spots[i][0]}%;top:${spots[i][1]}%;font-size:${Math.round(15 + (w.count / max) * 38)}px;--o:${(1 - i * 0.08).toFixed(2)};color:${i === 0 ? 'var(--c)' : '#f5f5f7'};transition-delay:${(0.5 + i * 0.1).toFixed(2)}s">${esc(w.word)}</span>`)
    .join('');
}

// ---------- confetti (thin, elegant) ----------
const fx = $('#fx');
const fctx = fx.getContext('2d');
let parts = [];
function confetti(n) {
  const r = fx.getBoundingClientRect();
  const d = devicePixelRatio;
  fx.width = r.width * d;
  fx.height = r.height * d;
  const cols = [...ARCH, '#f5f5f7'];
  for (let i = 0; i < n; i++) {
    parts.push({ x: fx.width / 2, y: fx.height * 0.42, vx: (Math.random() - 0.5) * 22 * d, vy: (-Math.random() * 18 - 5) * d, s: (3 + Math.random() * 5) * d, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3, c: cols[i % cols.length], life: 1 });
  }
  if (parts.length === n) requestAnimationFrame(stepFx);
}
function stepFx() {
  fctx.clearRect(0, 0, fx.width, fx.height);
  parts = parts.filter((p) => p.life > 0 && p.y < fx.height + 40);
  for (const p of parts) {
    p.vy += 0.5 * devicePixelRatio;
    p.vx *= 0.985;
    p.x += p.vx;
    p.y += p.vy;
    p.r += p.vr;
    p.life -= 0.007;
    fctx.save();
    fctx.translate(p.x, p.y);
    fctx.rotate(p.r);
    fctx.globalAlpha = Math.min(1, p.life * 2);
    fctx.fillStyle = p.c;
    fctx.fillRect(-p.s / 2, -p.s / 6, p.s, p.s / 3);
    fctx.restore();
  }
  if (parts.length) requestAnimationFrame(stepFx);
}

// ---------- sound (off by default) ----------
let audio = null;
const snd = $('#sound');
snd.innerHTML = ic('mute', 18);
snd.onclick = (e) => {
  e.stopPropagation();
  audio = audio ? (audio.close(), null) : new AudioContext();
  snd.innerHTML = ic(audio ? 'speaker' : 'mute', 18);
};
function blip(i) {
  if (!audio) return;
  const notes = [523.3, 659.3, 784, 1046.5];
  [0, 1].forEach((k) => {
    const o = audio.createOscillator();
    const g = audio.createGain();
    const t = audio.currentTime + k * 0.07;
    o.type = 'sine';
    o.frequency.value = notes[(i + k) % notes.length];
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.08, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
    o.connect(g).connect(audio.destination);
    o.start(t);
    o.stop(t + 0.55);
  });
}

// ---------- share card (1080×1350) ----------
const SANS = 'Geist, -apple-system, "SF Pro Display", system-ui, sans-serif';
const MONO = '"Geist Mono", "SF Mono", ui-monospace, Menlo, monospace';
function rr(x, X, Y, w, h, r) {
  x.beginPath();
  if (x.roundRect) x.roundRect(X, Y, w, h, r);
  else x.rect(X, Y, w, h);
}
function drawIcon(x, name, X, Y, size, color, width = 1.75) {
  x.save();
  x.translate(X, Y);
  x.scale(size / 24, size / 24);
  x.lineWidth = width;
  x.lineCap = 'round';
  x.lineJoin = 'round';
  x.strokeStyle = color;
  x.stroke(new Path2D(ICONS[name]));
  x.restore();
}
function mono(x, text, X, Y, size, alpha = 0.55, align = 'left') {
  x.font = `500 ${size}px ${MONO}`;
  x.fillStyle = `rgba(245,245,247,${alpha})`;
  x.textAlign = align;
  if ('letterSpacing' in x) x.letterSpacing = `${size * 0.14}px`;
  x.fillText(text.toUpperCase(), X, Y);
  if ('letterSpacing' in x) x.letterSpacing = '0px';
  x.textAlign = 'left';
}
function renderCard() {
  const W = 1080;
  const H = 1350;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const x = c.getContext('2d');
  const [ga, gb, acc] = ARCH;
  x.fillStyle = '#000';
  x.fillRect(0, 0, W, H);
  const glow = (cx, cy, r, col, a) => {
    const g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, col);
    g.addColorStop(1, 'transparent');
    x.globalAlpha = a;
    x.fillStyle = g;
    x.fillRect(0, 0, W, H);
    x.globalAlpha = 1;
  };
  glow(120, 80, 820, ga, 0.55);
  glow(1040, 1300, 860, gb, 0.45);
  // dot grid
  x.fillStyle = 'rgba(255,255,255,.07)';
  for (let gx = 30; gx < W; gx += 36) for (let gy = 30; gy < H; gy += 36) x.fillRect(gx, gy, 2, 2);
  x.textBaseline = 'alphabetic';

  // header
  drawIcon(x, 'commit', 78, 72, 34, '#f5f5f7', 2);
  mono(x, G ? `git wrapped · @${G.login}` : 'git wrapped', 126, 99, 22, 0.7);
  mono(x, String(S.year), W - 80, 99, 22, 0.7, 'right');

  // big number
  const num = fmt(S.commits);
  x.font = `700 200px ${SANS}`;
  if ('letterSpacing' in x) x.letterSpacing = '-7px';
  const g = x.createLinearGradient(0, 170, 0, 420);
  g.addColorStop(0.3, '#ffffff');
  g.addColorStop(1, acc);
  x.fillStyle = g;
  x.fillText(num, 68, 345);
  if ('letterSpacing' in x) x.letterSpacing = '0px';
  mono(x, `commits in ${S.year}`, 82, 400, 24, 0.6);

  // archetype
  rr(x, 80, 450, W - 160, 200, 36);
  x.fillStyle = 'rgba(255,255,255,.06)';
  x.fill();
  x.strokeStyle = 'rgba(255,255,255,.12)';
  x.lineWidth = 2;
  x.stroke();
  const tg = x.createLinearGradient(110, 480, 250, 620);
  tg.addColorStop(0, ga);
  tg.addColorStop(1, gb);
  rr(x, 112, 482, 136, 136, 32);
  x.fillStyle = tg;
  x.fill();
  drawIcon(x, A.icon, 136, 506, 88, '#ffffff', 1.9);
  x.fillStyle = '#f5f5f7';
  x.font = `600 54px ${SANS}`;
  if ('letterSpacing' in x) x.letterSpacing = '-2px';
  x.fillText(A.name, 282, 548);
  if ('letterSpacing' in x) x.letterSpacing = '0px';
  x.font = `400 28px ${SANS}`;
  x.fillStyle = 'rgba(245,245,247,.68)';
  wrap(x, A.tagline, 282, 596, W - 400, 36);

  // stats
  const cells = [
    ['plus', '+' + fmt(S.added), 'lines added'],
    ['flame', `${S.longestStreak.length} days`, 'longest streak'],
    ['clock', `${pad(S.peakHour)}:00`, 'peak hour'],
    ['chart', S.languages[0] ? S.languages[0].name : '—', 'top language'],
  ];
  cells.forEach(([icon, v, l], i) => {
    const cx = 80 + (i % 2) * 470;
    const cy = 680 + Math.floor(i / 2) * 190;
    rr(x, cx, cy, 450, 170, 30);
    x.fillStyle = 'rgba(255,255,255,.05)';
    x.fill();
    x.strokeStyle = 'rgba(255,255,255,.1)';
    x.stroke();
    drawIcon(x, icon, cx + 32, cy + 28, 30, acc, 2);
    x.fillStyle = '#f5f5f7';
    x.font = `600 ${v.length > 10 ? 40 : 52}px ${SANS}`;
    if ('letterSpacing' in x) x.letterSpacing = '-2px';
    x.fillText(v, cx + 30, cy + 112);
    if ('letterSpacing' in x) x.letterSpacing = '0px';
    mono(x, l, cx + 32, cy + 146, 18, 0.5);
  });

  // heatmap
  const firstDow = (new Date(Date.UTC(S.year, 0, 1)).getUTCDay() + 6) % 7;
  const max = Math.max(1, ...S.calendar);
  const cs = 14.4;
  const gap = 2.9;
  S.calendar.forEach((v, i) => {
    const k = i + firstDow;
    x.globalAlpha = v ? 0.3 + (0.7 * v) / max : 1;
    x.fillStyle = v ? acc : 'rgba(255,255,255,.07)';
    rr(x, 80 + Math.floor(k / 7) * (cs + gap), 1075 + (k % 7) * (cs + gap), cs, cs, 3);
    x.fill();
  });
  x.globalAlpha = 1;
  mono(x, `${S.activeDays} active days · ${S.repos} repo${S.repos > 1 ? 's' : ''} · ~${fmt(S.hoursCoding)}h`, 80, 1235, 19, 0.5);
  mono(x, `npx dev-wrapped${G ? ' --github' : ''}`, 80, 1282, 22, 0.85);
  return c;
}
function wrap(x, text, tx, ty, maxW, lh) {
  let line = '';
  let y = ty;
  for (const w of text.split(' ')) {
    if (x.measureText(line + w).width > maxW && line) {
      x.fillText(line.trim(), tx, y);
      line = '';
      y += lh;
    }
    line += w + ' ';
  }
  x.fillText(line.trim(), tx, y);
}
let cardUrl = null;
async function showCard(el) {
  if (!cardUrl) {
    try {
      await Promise.all([document.fonts.load(`700 200px Geist`), document.fonts.load(`600 54px Geist`), document.fonts.load(`500 22px "Geist Mono"`)]);
    } catch {
      /* fall back to system fonts */
    }
    cardUrl = renderCard().toDataURL('image/png');
  }
  $('#card', el).src = cardUrl;
  $('#dl', el).onclick = () => Object.assign(document.createElement('a'), { href: cardUrl, download: `git-wrapped-${S.year}.png` }).click();
  const txt = `My ${S.year} Git Wrapped: ${fmt(S.commits)} commits, a ${S.longestStreak.length}-day streak, and apparently I'm ${A.name}.\n\nGet yours: npx dev-wrapped`;
  $('#tw', el).href = 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(txt);
  $('#again', el).onclick = () => go(0);
  confetti(90);
}

go(0);
requestAnimationFrame(tick);
