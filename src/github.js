import { spawnSync } from 'node:child_process';

const API = 'https://api.github.com/graphql';
const MAX_REPOS = 40; // repos whose commit history we read in detail
const MAX_PAGES = 10; // 100 commits per page -> up to 1000 commits per repo
const CONCURRENCY = 4;

export class GitHubError extends Error {}

/** Token from env, or from the GitHub CLI if the user is logged in. Never from argv (shell history). */
export function resolveToken(env = process.env) {
  if (env.GITHUB_TOKEN) return env.GITHUB_TOKEN.trim();
  if (env.GH_TOKEN) return env.GH_TOKEN.trim();
  try {
    const r = spawnSync('gh', ['auth', 'token'], { encoding: 'utf8' });
    if (r.status === 0 && r.stdout.trim()) return r.stdout.trim();
  } catch {
    /* gh not installed */
  }
  return null;
}

export function makeRequest(token, fetchImpl = globalThis.fetch) {
  return async function request(query, variables) {
    let res;
    try {
      res = await fetchImpl(API, {
        method: 'POST',
        headers: { Authorization: `bearer ${token}`, 'Content-Type': 'application/json', 'User-Agent': 'git-wrapped' },
        body: JSON.stringify({ query, variables }),
      });
    } catch (e) {
      throw new GitHubError(`Could not reach GitHub (${e.cause?.code || e.message}).`);
    }
    if (res.status === 401) throw new GitHubError('GitHub rejected the token (401). Check GITHUB_TOKEN or run `gh auth login`.');
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new GitHubError(`GitHub API error ${res.status}: ${body.message || 'unknown error'}`);
    if (body.errors?.length) {
      const msg = body.errors.map((e) => e.message).join('; ');
      if (body.errors.some((e) => e.type === 'NOT_FOUND')) throw new GitHubError(msg);
      if (!body.data) throw new GitHubError(msg);
    }
    return body.data;
  };
}

const PROFILE_QUERY = `
query($login: String!, $from: DateTime!, $to: DateTime!) {
  user(login: $login) {
    id login name avatarUrl
    contributionsCollection(from: $from, to: $to) {
      totalCommitContributions
      totalPullRequestContributions
      totalIssueContributions
      totalPullRequestReviewContributions
      restrictedContributionsCount
      contributionCalendar {
        totalContributions
        weeks { contributionDays { date contributionCount } }
      }
      commitContributionsByRepository(maxRepositories: 100) {
        contributions { totalCount }
        repository { nameWithOwner name isPrivate stargazerCount primaryLanguage { name } }
      }
    }
  }
}`;

const HISTORY_QUERY = `
query($owner: String!, $name: String!, $author: ID!, $since: GitTimestamp!, $until: GitTimestamp!, $after: String) {
  repository(owner: $owner, name: $name) {
    defaultBranchRef {
      target {
        ... on Commit {
          history(first: 100, after: $after, since: $since, until: $until, author: { id: $author }) {
            pageInfo { hasNextPage endCursor }
            nodes { oid authoredDate messageHeadline additions deletions parents { totalCount } }
          }
        }
      }
    }
  }
}`;

/**
 * Wall-clock time of a commit. Git timestamps that carry their own UTC offset
 * (e.g. 2026-03-01T23:30:00+09:00) are read as-is: that's the author's local time.
 * Timestamps in UTC ("Z") are converted to the fallback time zone.
 */
export function localParts(iso, timeZone) {
  const own = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?[+-]\d{2}:?\d{2}$/.exec(iso);
  if (own) {
    const [, y, mo, d, h, mi] = own;
    const dow = new Date(Date.UTC(+y, +mo - 1, +d)).getUTCDay();
    return { day: `${y}-${mo}-${d}`, hour: +h, minute: +mi, weekday: dow === 0 ? 7 : dow };
  }
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      weekday: 'short',
      hourCycle: 'h23',
    })
      .formatToParts(new Date(iso))
      .map((p) => [p.type, p.value])
  );
  const weekday = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 }[parts.weekday];
  return { day: `${parts.year}-${parts.month}-${parts.day}`, hour: Number(parts.hour) % 24, minute: Number(parts.minute), weekday };
}

async function pool(items, n, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(n, items.length) }, async () => {
      while (i < items.length) {
        const k = i++;
        out[k] = await fn(items[k], k);
      }
    })
  );
  return out;
}

/**
 * Fetch a user's year from GitHub.
 * Returns commits shaped like the local git reader's, plus profile-level extras.
 */
export async function fetchGitHubYear(login, { year, timeZone, request, onProgress = () => {} }) {
  const from = `${year}-01-01T00:00:00Z`;
  const to = `${year}-12-31T23:59:59Z`;
  const data = await request(PROFILE_QUERY, { login, from, to });
  const user = data?.user;
  if (!user) throw new GitHubError(`GitHub user "${login}" not found.`);
  const cc = user.contributionsCollection;

  const byRepo = [...cc.commitContributionsByRepository].sort((a, b) => b.contributions.totalCount - a.contributions.totalCount);
  const repos = byRepo.slice(0, MAX_REPOS);
  onProgress({ phase: 'repos', total: repos.length });

  let done = 0;
  const perRepo = await pool(repos, CONCURRENCY, async ({ repository: r }) => {
    const [owner, name] = r.nameWithOwner.split('/');
    const commits = [];
    let after = null;
    for (let page = 0; page < MAX_PAGES; page++) {
      let d;
      try {
        d = await request(HISTORY_QUERY, { owner, name, author: user.id, since: from, until: to, after });
      } catch (e) {
        if (e instanceof GitHubError) break; // repo gone or no access: keep what we have
        throw e;
      }
      const h = d?.repository?.defaultBranchRef?.target?.history;
      if (!h) break;
      for (const n of h.nodes) {
        if (n.parents?.totalCount > 1) continue; // merge commit
        commits.push({
          repo: r.name,
          hash: n.oid,
          name: user.name || user.login,
          email: user.login.toLowerCase(),
          ...localParts(n.authoredDate, timeZone),
          ts: Date.parse(n.authoredDate),
          subject: n.messageHeadline || '',
          added: n.additions || 0,
          removed: n.deletions || 0,
          lang: r.primaryLanguage?.name || null,
          files: [],
        });
      }
      if (!h.pageInfo.hasNextPage) break;
      after = h.pageInfo.endCursor;
    }
    onProgress({ phase: 'repo', done: ++done, total: repos.length, repo: r.nameWithOwner });
    return commits;
  });

  const calendar = new Map();
  for (const w of cc.contributionCalendar.weeks) for (const d of w.contributionDays) if (d.date.startsWith(String(year))) calendar.set(d.date, d.contributionCount);

  return {
    user,
    commits: perRepo.flat(),
    calendar,
    github: {
      login: user.login,
      avatarUrl: user.avatarUrl,
      contributions: cc.contributionCalendar.totalContributions,
      commits: cc.totalCommitContributions,
      prs: cc.totalPullRequestContributions,
      issues: cc.totalIssueContributions,
      reviews: cc.totalPullRequestReviewContributions,
      privateContributions: cc.restrictedContributionsCount,
      repos: byRepo.length,
      topRepos: byRepo.slice(0, 5).map((x) => ({ name: x.repository.nameWithOwner, count: x.contributions.totalCount, stars: x.repository.stargazerCount })),
    },
  };
}
