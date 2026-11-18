import { pickArchetype } from './archetypes.js';

const LANGS = {
  js: 'JavaScript', mjs: 'JavaScript', cjs: 'JavaScript', jsx: 'JavaScript',
  ts: 'TypeScript', tsx: 'TypeScript', mts: 'TypeScript',
  py: 'Python', ipynb: 'Jupyter', rb: 'Ruby', go: 'Go', rs: 'Rust',
  java: 'Java', kt: 'Kotlin', kts: 'Kotlin', scala: 'Scala', swift: 'Swift',
  c: 'C', h: 'C', cpp: 'C++', cc: 'C++', cxx: 'C++', hpp: 'C++', cs: 'C#',
  php: 'PHP', dart: 'Dart', lua: 'Lua', r: 'R', jl: 'Julia', ex: 'Elixir', exs: 'Elixir',
  erl: 'Erlang', hs: 'Haskell', clj: 'Clojure', zig: 'Zig', nim: 'Nim', sol: 'Solidity',
  vue: 'Vue', svelte: 'Svelte', astro: 'Astro', html: 'HTML', htm: 'HTML',
  css: 'CSS', scss: 'SCSS', sass: 'SCSS', less: 'CSS',
  sh: 'Shell', bash: 'Shell', zsh: 'Shell', fish: 'Shell', ps1: 'PowerShell',
  sql: 'SQL', md: 'Markdown', mdx: 'Markdown', tex: 'LaTeX',
  yml: 'YAML', yaml: 'YAML', toml: 'TOML', tf: 'Terraform', nix: 'Nix',
  gd: 'GDScript', m: 'Objective-C', mm: 'Objective-C', ml: 'OCaml', fs: 'F#',
};
const IGNORED_FILES = /(^|\/)(package-lock\.json|yarn\.lock|pnpm-lock\.yaml|Cargo\.lock|poetry\.lock|composer\.lock|Gemfile\.lock|go\.sum|bun\.lockb)$/;
const IGNORED_DIRS = /(^|\/)(node_modules|dist|build|vendor|\.next|coverage)\//;

const STOPWORDS = new Set(
  ('a an the and or of to in on for with from by at as is be it this that into up add added adds update updated ' +
    'updates use make made more some new remove removed change changed changes minor small ' +
    'le la les de des du un une et en pour sur avec dans au aux par ajout ajoute maj').split(' ')
);
const RAGE = /\b(wtf|damn|shit|fuck\w*|merde|putain|argh+|ugh+|please work|pls work|why+)\b/i;

const BOOKS = [
  { title: 'The Little Prince', pages: 96 },
  { title: 'The Great Gatsby', pages: 180 },
  { title: "Harry Potter and the Philosopher's Stone", pages: 320 },
  { title: 'Dune', pages: 610 },
  { title: 'The Lord of the Rings', pages: 1200 },
  { title: 'War and Peace', pages: 1300 },
  { title: 'the entire Harry Potter series', pages: 4100 },
  { title: 'the Encyclopaedia Britannica', pages: 32000 },
];
const LINES_PER_PAGE = 50;

export const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function topN(map, n, keyName = 'name', valName = 'count') {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([k, v]) => ({ [keyName]: k, [valName]: v }));
}

function inc(map, key, by = 1) {
  map.set(key, (map.get(key) || 0) + by);
}

function dayToUTC(day) {
  const [y, m, d] = day.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}
const DAY = 86400000;

function minutesOfNight(c) {
  // rank "how late" a commit is: 00:00-05:59 counts as the latest of the night
  return (c.hour < 6 ? c.hour + 24 : c.hour) * 60 + c.minute;
}

export function bookComparison(linesAdded) {
  const pages = linesAdded / LINES_PER_PAGE;
  let best = null;
  for (const b of BOOKS) if (pages >= b.pages) best = b;
  if (!best) return { pages: Math.round(pages), times: pages / BOOKS[0].pages, title: BOOKS[0].title };
  return { pages: Math.round(pages), times: pages / best.pages, title: best.title };
}

/** Estimate time spent coding: commits closer than 2h belong to the same session. */
export function estimateHours(commits) {
  const times = commits
    .map((c) => dayToUTC(c.day) + (c.hour * 60 + c.minute) * 60000)
    .sort((a, b) => a - b);
  if (!times.length) return 0;
  const MAX_GAP = 2 * 3600000;
  const FIRST = 0.5 * 3600000;
  let total = FIRST;
  for (let i = 1; i < times.length; i++) {
    const gap = times[i] - times[i - 1];
    total += gap < MAX_GAP ? gap : FIRST;
  }
  return Math.round(total / 3600000);
}

/**
 * @param {Array} commits   commits authored by the user
 * @param {Object} opts     { year, allCommits, name, repos }
 */
export function computeStats(commits, { year, allCommits = commits, name = 'you', repos = [] } = {}) {
  const hours = new Array(24).fill(0);
  const weekdays = new Array(7).fill(0);
  const days = new Map();
  const files = new Map();
  const langs = new Map();
  const words = new Map();
  const repoCount = new Map();
  let added = 0;
  let removed = 0;
  let fixes = 0;
  let rage = 0;
  let wip = 0;
  let weekend = 0;
  let nightOwl = 0;
  let earlyBird = 0;
  let officeHours = 0;
  let latest = null;
  let longestMsg = null;
  let shortestMsg = null;

  for (const c of commits) {
    hours[c.hour]++;
    weekdays[c.weekday - 1]++;
    inc(days, c.day);
    inc(repoCount, c.repo);
    if (c.weekday >= 6) weekend++;
    if (c.hour >= 22 || c.hour < 5) nightOwl++;
    if (c.hour >= 5 && c.hour < 9) earlyBird++;
    if (c.weekday <= 5 && c.hour >= 9 && c.hour < 18) officeHours++;
    if (/\bfix(e[sd])?\b|\bbug\b|\bhotfix\b|\bpatch\b/i.test(c.subject)) fixes++;
    if (RAGE.test(c.subject)) rage++;
    if (/\bwip\b/i.test(c.subject)) wip++;
    if (!latest || minutesOfNight(c) > minutesOfNight(latest)) latest = c;
    const msg = c.subject.trim();
    if (msg) {
      if (!longestMsg || msg.length > longestMsg.subject.length) longestMsg = c;
      if (!shortestMsg || msg.length < shortestMsg.subject.length) shortestMsg = c;
    }
    for (const w of c.subject.toLowerCase().match(/[a-zà-ÿ']{3,}/g) || []) {
      if (!STOPWORDS.has(w)) inc(words, w);
    }
    for (const f of c.files) {
      if (IGNORED_FILES.test(f.path) || IGNORED_DIRS.test(f.path)) continue;
      added += f.added;
      removed += f.removed;
      inc(files, `${repos.length > 1 ? c.repo + '/' : ''}${f.path}`);
      const ext = (f.path.split('/').pop().split('.').slice(1).pop() || '').toLowerCase();
      const lang = LANGS[ext];
      if (lang) inc(langs, lang, f.added + f.removed || 1);
    }
  }

  // calendar + streaks
  const start = Date.UTC(year, 0, 1);
  const end = Date.UTC(year + 1, 0, 1);
  const calendar = [];
  let longest = { length: 0, from: null, to: null };
  let run = 0;
  let runStart = null;
  for (let t = start; t < end; t += DAY) {
    const day = new Date(t).toISOString().slice(0, 10);
    const count = days.get(day) || 0;
    calendar.push(count);
    if (count > 0) {
      if (run === 0) runStart = day;
      run++;
      if (run > longest.length) longest = { length: run, from: runStart, to: day };
    } else run = 0;
  }
  const busiest = topN(days, 1, 'day', 'count')[0] || null;

  const totalLang = [...langs.values()].reduce((a, b) => a + b, 0) || 1;
  const languages = topN(langs, 6).map((l) => ({ ...l, share: l.count / totalLang }));

  // teammates = other people committing in the same repos
  const myEmails = new Set(commits.map((c) => c.email));
  const mates = new Map();
  for (const c of allCommits) {
    if (myEmails.has(c.email)) continue;
    if (/\[bot\]|dependabot|renovate|github-actions/i.test(c.name + c.email)) continue;
    inc(mates, c.name);
  }

  const peakHour = hours.indexOf(Math.max(...hours));
  const peakWeekday = weekdays.indexOf(Math.max(...weekdays));
  const n = commits.length || 1;

  const stats = {
    year,
    name,
    commits: commits.length,
    repos: repoCount.size,
    topRepos: topN(repoCount, 5),
    activeDays: days.size,
    added,
    removed,
    net: added - removed,
    hours,
    weekdays,
    calendar,
    peakHour,
    peakWeekday: WEEKDAYS[peakWeekday],
    longestStreak: longest,
    busiest,
    topFiles: topN(files, 5),
    languages,
    words: topN(words, 12, 'word', 'count'),
    fixes,
    rage,
    wip,
    weekendShare: weekend / n,
    nightShare: nightOwl / n,
    earlyShare: earlyBird / n,
    officeShare: officeHours / n,
    fixShare: fixes / n,
    avgLines: (added + removed) / n,
    latest: latest && { subject: latest.subject, day: latest.day, hour: latest.hour, minute: latest.minute, repo: latest.repo },
    longestMsg: longestMsg && { subject: longestMsg.subject, repo: longestMsg.repo },
    shortestMsg: shortestMsg && { subject: shortestMsg.subject, repo: shortestMsg.repo },
    teammates: topN(mates, 3),
    hoursCoding: estimateHours(commits),
    book: bookComparison(added),
  };
  stats.archetype = pickArchetype(stats);
  return stats;
}
