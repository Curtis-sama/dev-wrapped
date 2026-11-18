import { WEEKDAYS } from './stats.js';

const out = process.stdout;
const COLOR = !process.env.NO_COLOR && (out.isTTY || process.env.FORCE_COLOR);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const fg = ([r, g, b]) => (COLOR ? `\x1b[38;2;${r};${g};${b}m` : '');
const RESET = COLOR ? '\x1b[0m' : '';
const BOLD = COLOR ? '\x1b[1m' : '';
const DIM = COLOR ? '\x1b[2m' : '';
const ITALIC = COLOR ? '\x1b[3m' : '';
const fmt = (n) => Math.round(n).toLocaleString('en-US');

function lerp(stops, t) {
  t = Math.min(1, Math.max(0, t));
  const seg = t * (stops.length - 1);
  const i = Math.min(stops.length - 2, Math.floor(seg));
  const k = seg - i;
  return stops[i].map((v, j) => Math.round(v + (stops[i + 1][j] - v) * k));
}

function gradient(text, stops, offset = 0) {
  if (!COLOR) return text;
  const chars = [...text];
  return (
    chars.map((ch, i) => (ch === ' ' ? ch : fg(lerp(stops, (i / Math.max(1, chars.length - 1) + offset) % 1.0001)) + ch)).join('') + RESET
  );
}

// ---------- big block font ----------
const FONT = {
  G: [' ███ ', '█    ', '█  ██', '█   █', ' ███ '],
  I: ['███', ' █ ', ' █ ', ' █ ', '███'],
  T: ['█████', '  █  ', '  █  ', '  █  ', '  █  '],
  W: ['█   █', '█   █', '█ █ █', '██ ██', '█   █'],
  R: ['████ ', '█   █', '████ ', '█  █ ', '█   █'],
  A: [' ███ ', '█   █', '█████', '█   █', '█   █'],
  P: ['████ ', '█   █', '████ ', '█    ', '█    '],
  E: ['█████', '█    ', '████ ', '█    ', '█████'],
  D: ['████ ', '█   █', '█   █', '█   █', '████ '],
  0: [' ███ ', '█   █', '█   █', '█   █', ' ███ '],
  1: ['  █  ', ' ██  ', '  █  ', '  █  ', ' ███ '],
  2: [' ███ ', '█   █', '  ██ ', ' █   ', '█████'],
  3: ['████ ', '    █', ' ███ ', '    █', '████ '],
  4: ['█   █', '█   █', '█████', '    █', '    █'],
  5: ['█████', '█    ', '████ ', '    █', '████ '],
  6: [' ███ ', '█    ', '████ ', '█   █', ' ███ '],
  7: ['█████', '    █', '   █ ', '  █  ', '  █  '],
  8: [' ███ ', '█   █', ' ███ ', '█   █', ' ███ '],
  9: [' ███ ', '█   █', ' ████', '    █', ' ███ '],
  ',': ['  ', '  ', '  ', ' █', '█ '],
  ' ': ['  ', '  ', '  ', '  ', '  '],
};
function big(text) {
  const rows = ['', '', '', '', ''];
  for (const ch of text.toUpperCase()) {
    const g = FONT[ch] || FONT[' '];
    for (let r = 0; r < 5; r++) rows[r] += g[r] + ' ';
  }
  return rows;
}

// ---------- helpers ----------
function makeWriter(anim) {
  const pause = (ms) => (anim ? sleep(ms) : Promise.resolve());
  const line = (s = '') => out.write(s + '\n');
  async function type(s, speed = 12) {
    if (!anim) return line(s);
    // type visible characters, keep ANSI codes intact
    const parts = s.split(/(\x1b\[[0-9;]*m)/);
    for (const p of parts) {
      if (p.startsWith('\x1b[')) out.write(p);
      else
        for (const ch of p) {
          out.write(ch);
          await sleep(speed);
        }
    }
    out.write('\n');
  }
  return { pause, line, type };
}

function heading(title, pal) {
  return `\n  ${gradient('━━ ' + title.toUpperCase() + ' ', pal)}${fg(pal[1])}${'━'.repeat(Math.max(4, 54 - title.length))}${RESET}\n`;
}

function heatmap(calendar, year, pal) {
  const firstDow = (new Date(Date.UTC(year, 0, 1)).getUTCDay() + 6) % 7; // Monday = 0
  const max = Math.max(1, ...calendar);
  const weeks = Math.ceil((calendar.length + firstDow) / 7);
  const levels = [[40, 40, 48], ...[0.25, 0.5, 0.75, 1].map((t) => lerp(pal.slice(1), t))];
  const rows = [];
  const labels = ['Mon', '   ', 'Wed', '   ', 'Fri', '   ', 'Sun'];
  for (let d = 0; d < 7; d++) {
    let row = `  ${DIM}${labels[d]}${RESET} `;
    for (let w = 0; w < weeks; w++) {
      const idx = w * 7 + d - firstDow;
      if (idx < 0 || idx >= calendar.length) {
        row += ' ';
        continue;
      }
      const v = calendar[idx];
      const lvl = v === 0 ? 0 : Math.min(4, 1 + Math.floor((v / max) * 3.999));
      row += COLOR ? fg(levels[lvl]) + '■' : v ? '■' : '·';
    }
    rows.push(row + RESET);
  }
  const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  let months = ' '.repeat(weeks + 3);
  for (let m = 0; m < 12; m++) {
    const idx = (Date.UTC(year, m, 1) - Date.UTC(year, 0, 1)) / 86400000;
    const col = Math.floor((idx + firstDow) / 7);
    if (months.slice(col, col + 4).trim() === '') months = months.slice(0, col) + names[m] + months.slice(col + 3);
  }
  rows.unshift(`      ${DIM}${months.trimEnd()}${RESET}`);
  return rows;
}

function hourChart(hours, pal) {
  const blocks = ' ▁▂▃▄▅▆▇█';
  const max = Math.max(1, ...hours);
  let bars = '';
  hours.forEach((h, i) => {
    const b = blocks[Math.round((h / max) * 8)];
    bars += fg(lerp(pal.slice(1), i / 23)) + b + b;
  });
  return [`  ${bars}${RESET}`, `  ${DIM}00    04    08    12    16    20  23${RESET}`];
}

function barRow(label, value, max, width, color, suffix = '') {
  const len = Math.max(value > 0 ? 1 : 0, Math.round((value / Math.max(1, max)) * width));
  return `  ${label.padEnd(12)} ${fg(color)}${'█'.repeat(len)}${RESET}${DIM}${'░'.repeat(width - len)}${RESET} ${suffix}`;
}

async function countUp(n, pal, anim) {
  const steps = anim ? 28 : 1;
  for (let s = 1; s <= steps; s++) {
    const v = Math.round(n * (1 - Math.pow(1 - s / steps, 3)));
    const rows = big(fmt(v));
    if (s > 1) out.write(`\x1b[${rows.length}A`);
    for (const r of rows) out.write((anim ? '\x1b[2K' : '') + '  ' + gradient(r, pal.slice(1).map(hex)) + '\n');
    if (anim) await sleep(35);
  }
}

const pad2 = (n) => String(n).padStart(2, '0');

// ---------- main render ----------
export async function render(stats, { anim = true } = {}) {
  const A = stats.archetype;
  const pal = A.palette;
  const P = pal.map(hex);
  const { pause, line, type } = makeWriter(anim && out.isTTY);
  const accent = fg(P[2]);
  const hot = fg(P[3]);

  line();
  const title = big('GIT WRAPPED');
  const titleStops = [hex('#f472b6'), hex('#a78bfa'), hex('#60a5fa'), hex('#34d399')];
  for (const r of title) {
    line('  ' + gradient(r, titleStops));
    await pause(60);
  }
  line(`  ${DIM}${'─'.repeat(title[0].length)}${RESET}`);
  await type(`  ${BOLD}${stats.year}${RESET} ${DIM}·${RESET} ${stats.name}${stats.github ? ` ${DIM}(@${stats.github.login})${RESET}` : ''} ${DIM}· ${stats.repos} repo${stats.repos > 1 ? 's' : ''}${RESET}`);
  await pause(500);

  // commits
  line(heading('Your year in commits', P));
  await countUp(stats.commits, pal, anim && out.isTTY);
  line(`  ${DIM}commits on${RESET} ${BOLD}${stats.activeDays}${RESET} ${DIM}different days ·${RESET} ~${BOLD}${fmt(stats.hoursCoding)}h${RESET} ${DIM}of coding${RESET}`);
  await pause(400);
  line();
  await type(`  ${fg(hex('#4ade80'))}+${fmt(stats.added)}${RESET} lines added   ${fg(hex('#f87171'))}-${fmt(stats.removed)}${RESET} lines removed`);
  const b = stats.book;
  if (stats.added > 0) {
    await type(
      `  ${ITALIC}${DIM}That's ~${fmt(b.pages)} printed pages: ${RESET}${ITALIC}${hot}${b.times >= 1 ? b.times.toFixed(1) + '×' : Math.round(b.times * 100) + '% of'} ${b.title}${RESET}`
    );
  }
  await pause(700);

  // GitHub extras
  const G = stats.github;
  if (G) {
    line(heading('Your year on GitHub', P));
    await type(`  ${BOLD}${hot}${fmt(G.contributions)}${RESET} ${DIM}contributions on your profile${RESET}`);
    await type(`  🔀 ${BOLD}${fmt(G.prs)}${RESET} pull requests   👀 ${BOLD}${fmt(G.reviews)}${RESET} reviews   🐞 ${BOLD}${fmt(G.issues)}${RESET} issues`);
    if (G.privateContributions) await type(`  🔒 ${BOLD}${fmt(G.privateContributions)}${RESET} ${DIM}private contributions (top secret)${RESET}`);
    if (G.topRepos.length) {
      line();
      const maxR = G.topRepos[0].count;
      for (let i = 0; i < G.topRepos.length; i++) {
        const r = G.topRepos[i];
        const label = r.name.length > 26 ? '…' + r.name.slice(-25) : r.name;
        line(barRow(label.padEnd(26), r.count, maxR, 18, lerp(P.slice(1), 1 - i / 5), `${DIM}${r.count} commits${r.stars ? ` · ★ ${fmt(r.stars)}` : ''}${RESET}`));
        await pause(60);
      }
    }
    await pause(700);
  }

  // calendar
  line(heading('Your year at a glance', P));
  for (const r of heatmap(stats.calendar, stats.year, P)) {
    line(r);
    await pause(45);
  }
  line();
  if (stats.longestStreak.length)
    await type(`  🔥 Longest streak   ${BOLD}${hot}${stats.longestStreak.length} days${RESET} ${DIM}(${stats.longestStreak.from} → ${stats.longestStreak.to})${RESET}`);
  if (stats.busiest) await type(`  ⚡ Busiest day      ${BOLD}${hot}${stats.busiest.count} commits${RESET} ${DIM}on ${stats.busiest.day}${RESET}`);
  await pause(700);

  // time
  line(heading('When you code', P));
  for (const r of hourChart(stats.hours, P)) line(r);
  line();
  const maxW = Math.max(...stats.weekdays);
  for (let i = 0; i < 7; i++) {
    line(barRow(WEEKDAYS[i], stats.weekdays[i], maxW, 30, lerp(P.slice(1), i / 6), `${DIM}${stats.weekdays[i]}${RESET}`));
    await pause(40);
  }
  line();
  await type(`  ⏰ Peak hour  ${BOLD}${accent}${pad2(stats.peakHour)}:00${RESET}   📅 Favorite day  ${BOLD}${accent}${stats.peakWeekday}${RESET}`);
  if (stats.latest && (stats.latest.hour < 5 || stats.latest.hour >= 23)) {
    await type(
      `  🌙 Latest commit  ${BOLD}${hot}${pad2(stats.latest.hour)}:${pad2(stats.latest.minute)}${RESET} ${DIM}on ${stats.latest.day} —${RESET} ${ITALIC}"${stats.latest.subject.slice(0, 50)}"${RESET}`
    );
  }
  await pause(700);

  // languages
  if (stats.languages.length) {
    line(heading('Your languages', P));
    const top = stats.languages[0].share;
    for (let i = 0; i < stats.languages.length; i++) {
      const l = stats.languages[i];
      line(barRow(l.name, l.share, top, 30, lerp(P.slice(1), 1 - i / 6), `${BOLD}${Math.round(l.share * 100)}%${RESET}`));
      await pause(70);
    }
  }

  // words & confessions
  line(heading('Your commit messages', P));
  if (stats.words.length) {
    await type(`  ${DIM}Your favorite words:${RESET} ${stats.words.slice(0, 6).map((w, i) => `${fg(lerp(P.slice(1), 1 - i / 6))}${BOLD}${w.word}${RESET}${DIM}×${w.count}${RESET}`).join('  ')}`);
  }
  await type(`  🐛 You fixed things ${BOLD}${stats.fixes}${RESET} times${stats.wip ? `  ·  🚧 ${BOLD}${stats.wip}${RESET} WIP commits` : ''}${stats.rage ? `  ·  🤬 ${BOLD}${stats.rage}${RESET} rage commits` : ''}`);
  if (stats.shortestMsg && stats.shortestMsg.subject.length <= 4)
    await type(`  🤐 Most eloquent message: ${ITALIC}${hot}"${stats.shortestMsg.subject}"${RESET}`);
  if (stats.topFiles[0]) await type(`  📂 Most edited file: ${BOLD}${stats.topFiles[0].name}${RESET} ${DIM}(${stats.topFiles[0].count}×)${RESET}`);
  if (stats.teammates[0]) await type(`  🤝 Partner in crime: ${BOLD}${stats.teammates[0].name}${RESET} ${DIM}(${stats.teammates[0].count} commits alongside you)${RESET}`);
  await pause(900);

  // archetype reveal
  line(heading('Your developer personality', P));
  if (anim && out.isTTY) {
    const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    for (let i = 0; i < 24; i++) {
      out.write(`\r  ${accent}${frames[i % frames.length]}${RESET} ${DIM}analyzing ${fmt(stats.commits)} commits...${RESET}   `);
      await sleep(70);
    }
    out.write('\r\x1b[2K');
  }
  const nameRow = `${A.emoji}  ${A.name.toUpperCase()}`;
  const nameW = 4 + A.name.length; // emoji renders 2 columns wide whatever its code length
  const boxW = Math.max(nameW, A.tagline.length, A.description.length) + 6;
  const border = (l, r) => '  ' + gradient(l + '─'.repeat(boxW) + r, P.slice(1));
  const inner = (s, style = '', w = s.length) => `  ${fg(P[1])}│${RESET}   ${style}${s}${RESET}${' '.repeat(Math.max(0, boxW - w - 3))}${fg(P[3])}│${RESET}`;
  line(border('╭', '╮'));
  line(inner('', '', 0));
  line(inner(nameRow, BOLD + hot, nameW));
  line(inner(A.tagline, ITALIC + accent));
  line(inner('', '', 0));
  line(inner(A.description, DIM));
  line(inner('', '', 0));
  line(border('╰', '╯'));
  line();
}

export function rawLine(s = '') {
  out.write(s + '\n');
}
export const style = { DIM, BOLD, RESET, ITALIC, fg, hex, gradient };
