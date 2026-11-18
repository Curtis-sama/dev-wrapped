#!/usr/bin/env node
import { writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { spawn } from 'node:child_process';
import { readCommits, findRepos, isRepoDir, repoRoot, gitConfig } from '../src/git.js';
import { computeStats } from '../src/stats.js';
import { render, rawLine, style } from '../src/terminal.js';
import { buildHtml } from '../src/html.js';
import { buildSvg } from '../src/svg.js';
import { resolveToken, makeRequest, fetchGitHubYear, GitHubError } from '../src/github.js';

const { DIM, BOLD, RESET } = style;

const HELP = `
  ${BOLD}git-wrapped${RESET} — Spotify Wrapped, but for your Git history

  ${BOLD}Usage${RESET}
    npx dev-wrapped [options]

  ${BOLD}Examples${RESET}
    npx dev-wrapped                     ${DIM}# this repo${RESET}
    npx dev-wrapped --scan ~/code       ${DIM}# every repo on your machine${RESET}
    npx dev-wrapped --github            ${DIM}# your whole GitHub account${RESET}
    npx dev-wrapped --github torvalds   ${DIM}# anyone's GitHub year${RESET}

  ${BOLD}GitHub mode${RESET} needs a token: it uses ${BOLD}gh auth token${RESET} if you have the GitHub CLI,
  otherwise set ${BOLD}GITHUB_TOKEN${RESET} (create one at https://github.com/settings/tokens,
  no scope needed for public data, "repo" to include your private repos).

  ${BOLD}Options${RESET}
    -y, --year <year>      Year to wrap (default: current year)
    -s, --scan <dir>       Scan every git repo inside <dir> (e.g. ~/code)
    -g, --github [user]    Wrap a whole GitHub account, no cloning needed
                           (default: the account of your token)
        --tz <zone>        Time zone for --github hours (default: yours)
    -a, --author <who>     Name or email to match (repeatable). Default: your git config
        --everyone         Count every author (great for team recaps)
        --no-open          Don't open the story in the browser
        --no-anim          Disable terminal animations
    -o, --out <file>       Where to save the HTML story
        --svg <file>       Write an animated SVG card (for your GitHub profile README)
        --theme <mode>     SVG theme: auto (follows the viewer), dark or light
        --json             Print raw stats as JSON
    -h, --help             Show this help
`;

function parseArgs(argv) {
  const o = { year: new Date().getFullYear(), scan: null, github: undefined, tz: Intl.DateTimeFormat().resolvedOptions().timeZone, authors: [], everyone: false, open: true, anim: true, out: null, json: false, svg: null, theme: 'auto' };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => {
      const v = argv[++i];
      if (v === undefined) fail(`Missing value for ${a}`);
      return v;
    };
    if (a === '-y' || a === '--year') o.year = Number(next());
    else if (a === '-s' || a === '--scan') o.scan = next();
    else if (a === '-g' || a === '--github') o.github = argv[i + 1] && !argv[i + 1].startsWith('-') ? argv[++i].replace(/^@/, '') : null;
    else if (a === '--tz') o.tz = next();
    else if (a === '-a' || a === '--author') o.authors.push(next().toLowerCase());
    else if (a === '--everyone') o.everyone = true;
    else if (a === '--no-open') o.open = false;
    else if (a === '--no-anim') o.anim = false;
    else if (a === '-o' || a === '--out') o.out = next();
    else if (a === '--json') o.json = true;
    else if (a === '--svg') o.svg = next();
    else if (a === '--theme') o.theme = next();
    else if (a === '-h' || a === '--help') {
      rawLine(HELP);
      process.exit(0);
    } else fail(`Unknown option: ${a}`);
  }
  if (!Number.isInteger(o.year) || o.year < 1970 || o.year > 3000) fail('Invalid --year');
  if (!['auto', 'dark', 'light'].includes(o.theme)) fail('Invalid --theme (use auto, dark or light)');
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: o.tz });
  } catch {
    fail(`Unknown time zone: ${o.tz} (example: Europe/Paris)`);
  }
  if (o.github !== undefined && o.github !== null && !/^[a-z\d](?:[a-z\d-]{0,38})$/i.test(o.github)) fail(`Invalid GitHub username: ${o.github}`);
  return o;
}

function fail(msg) {
  console.error(`\n  ${msg}\n`);
  process.exit(1);
}

function openFile(file) {
  const cmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'cmd' : 'xdg-open';
  const args = process.platform === 'win32' ? ['/c', 'start', '""', file] : [file];
  try {
    const child = spawn(cmd, args, { stdio: 'ignore', detached: true });
    child.on('error', () => {});
    child.unref();
    return true;
  } catch {
    return false;
  }
}

async function loadGitHub(o) {
  const token = resolveToken();
  if (!token) {
    fail(
      'GitHub mode needs a token.\n' +
        '    • If you have the GitHub CLI: gh auth login\n' +
        '    • Otherwise: create a token at https://github.com/settings/tokens and run\n' +
        '      GITHUB_TOKEN=<your token> npx dev-wrapped --github'
    );
  }
  const request = makeRequest(token);
  let login = o.github;
  if (!login) login = (await request('query { viewer { login } }')).viewer.login;
  const status = (msg) => process.stderr.isTTY && process.stderr.write(`\r\x1b[2K  ${DIM}${msg}${RESET}`);
  status(`Fetching @${login}'s ${o.year} from GitHub…`);
  const res = await fetchGitHubYear(login, {
    year: o.year,
    timeZone: o.tz,
    request,
    onProgress: (p) => p.phase === 'repo' && status(`Reading commits… ${p.done}/${p.total} repos (${p.repo})`),
  });
  if (process.stderr.isTTY) process.stderr.write('\r\x1b[2K');
  if (!res.commits.length && !res.github.contributions) fail(`@${login} has no public activity in ${o.year}.`);
  return computeStats(res.commits, {
    year: o.year,
    name: res.user.name || res.user.login,
    calendar: res.calendar,
    github: res.github,
  });
}

async function main() {
  const o = parseArgs(process.argv.slice(2));
  const stats = o.github !== undefined ? await loadGitHub(o) : loadLocal(o);
  await output(stats, o);
}

function loadLocal(o) {
  let repos;
  if (o.scan) {
    repos = findRepos(o.scan);
    if (!repos.length) fail(`No git repositories found in ${o.scan}`);
  } else {
    if (!isRepoDir(process.cwd())) fail('Not inside a git repository. Run it in a repo, or use --scan ~/code to wrap all your projects.');
    repos = [repoRoot(process.cwd())];
  }

  const since = `${o.year}-01-01T00:00:00`;
  const until = `${o.year + 1}-01-01T00:00:00`;
  const all = repos.flatMap((r) => readCommits(r, { since, until }));

  const cwd = o.scan ? repos[0] : process.cwd();
  const myEmail = gitConfig('user.email', cwd).toLowerCase();
  const myName = gitConfig('user.name', cwd);
  let who = o.authors;
  if (!who.length && !o.everyone) who = [myEmail, myName.toLowerCase()].filter(Boolean);
  const mine = o.everyone || !who.length ? all : all.filter((c) => who.some((w) => c.email.includes(w) || c.name.toLowerCase().includes(w)));

  if (!mine.length) {
    fail(
      all.length
        ? `Found ${all.length} commits in ${o.year}, but none by ${who.join(' / ')}.\n    Try --author <name|email> or --everyone.`
        : `No commits found in ${o.year}. Try another --year.`
    );
  }

  const name = o.everyone ? 'Team ' + (repos.length === 1 ? repos[0].split(/[\\/]/).pop() : 'recap') : myName || mine[0].name;
  return computeStats(mine, { year: o.year, allCommits: all, name, repos });
}

async function output(stats, o) {
  if (o.svg) {
    const file = resolve(o.svg);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, buildSvg(stats, { theme: o.theme }));
    rawLine(`  ${BOLD}◆ SVG card written:${RESET} ${file}`);
    rawLine(`  ${DIM}${stats.commits} commits · ${stats.archetype.name}${RESET}`);
    return;
  }
  if (o.json) {
    process.stdout.write(JSON.stringify(stats, null, 2) + '\n');
    return;
  }

  await render(stats, { anim: o.anim });

  const file = resolve(o.out || join(tmpdir(), `git-wrapped-${o.year}.html`));
  writeFileSync(file, buildHtml(stats));
  const opened = o.open && process.stdout.isTTY && openFile(file);
  rawLine(`  ${BOLD}◆ Your animated story${RESET} ${DIM}${opened ? 'is opening in your browser' : 'is ready'}:${RESET}`);
  rawLine(`     ${DIM}file://${file}${RESET}`);
  rawLine(`  ${DIM}Download your card at the end and share it with${RESET} ${BOLD}#GitWrapped${RESET}\n`);
}

main().catch((e) => fail(e instanceof GitHubError ? e.message : e.stack || e.message));
