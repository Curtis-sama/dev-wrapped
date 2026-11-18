import { spawnSync } from 'node:child_process';
import { readdirSync, statSync, existsSync } from 'node:fs';
import { join, basename, resolve } from 'node:path';

const SEP = '\x1f';
const REC = '\x1e';

function git(args, cwd) {
  const res = spawnSync('git', args, { cwd, encoding: 'utf8', maxBuffer: 1024 * 1024 * 1024 });
  if (res.error) throw res.error;
  if (res.status !== 0) return null;
  return res.stdout;
}

export function isGitRepo(dir) {
  const out = git(['rev-parse', '--is-inside-work-tree'], dir);
  return out !== null && out.trim() === 'true';
}

export function repoRoot(dir) {
  const out = git(['rev-parse', '--show-toplevel'], dir);
  return out ? out.trim() : resolve(dir);
}

export function gitConfig(key, dir) {
  const out = git(['config', '--get', key], dir);
  return out ? out.trim() : '';
}

/** Find git repositories under `dir` (up to `depth` levels deep). */
export function findRepos(dir, depth = 3) {
  const found = [];
  const skip = new Set(['node_modules', '.cache', 'vendor', 'dist', 'build', 'target', '.venv', 'venv']);
  (function walk(d, level) {
    if (existsSync(join(d, '.git'))) {
      found.push(d);
      return;
    }
    if (level >= depth) return;
    let entries = [];
    try {
      entries = readdirSync(d, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      if (!e.isDirectory() || e.name.startsWith('.') || skip.has(e.name)) continue;
      walk(join(d, e.name), level + 1);
    }
  })(resolve(dir), 0);
  return found;
}

function normalizePath(p) {
  // "src/{old => new}/file.js" -> "src/new/file.js" ; "a.js => b.js" -> "b.js"
  let out = p.replace(/\{([^{}]*) => ([^{}]*)\}/g, '$2');
  if (out.includes(' => ')) out = out.split(' => ').pop();
  return out.replace(/\/\/+/g, '/');
}

/**
 * Read every non-merge commit of a repo in [since, until).
 * Times are in the author's own local time (what they actually lived).
 */
export function readCommits(repoDir, { since, until }) {
  const args = [
    'log',
    '--all',
    '--no-merges',
    `--since=${since}`,
    `--until=${until}`,
    '--date=format:%Y-%m-%d %H %M %u',
    `--pretty=format:${REC}%H${SEP}%an${SEP}%ae${SEP}%ad${SEP}%s`,
    '--numstat',
  ];
  const out = git(args, repoDir);
  if (!out) return [];
  const repo = basename(repoDir);
  const commits = [];
  const seen = new Set();
  for (const chunk of out.split(REC)) {
    if (!chunk.trim()) continue;
    const [header, ...rest] = chunk.split('\n');
    const [hash, name, email, date, subject = ''] = header.split(SEP);
    if (!hash || seen.has(hash)) continue;
    seen.add(hash);
    const [day, hour, minute, weekday] = (date || '').split(' ');
    const files = [];
    let added = 0;
    let removed = 0;
    for (const line of rest) {
      const m = line.match(/^(\d+|-)\t(\d+|-)\t(.+)$/);
      if (!m) continue;
      const a = m[1] === '-' ? 0 : Number(m[1]);
      const r = m[2] === '-' ? 0 : Number(m[2]);
      added += a;
      removed += r;
      files.push({ path: normalizePath(m[3]), added: a, removed: r });
    }
    commits.push({
      repo,
      hash,
      name,
      email: (email || '').toLowerCase(),
      day,
      hour: Number(hour),
      minute: Number(minute),
      weekday: Number(weekday), // 1 = Monday … 7 = Sunday
      subject,
      added,
      removed,
      files,
    });
  }
  return commits;
}

export function isRepoDir(dir) {
  try {
    return statSync(dir).isDirectory() && isGitRepo(dir);
  } catch {
    return false;
  }
}
