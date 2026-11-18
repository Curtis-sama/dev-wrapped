import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fetchGitHubYear, localParts, makeRequest, GitHubError } from '../src/github.js';
import { computeStats } from '../src/stats.js';
import { buildHtml } from '../src/html.js';

function fakeApi() {
  const calls = [];
  const request = async (query, vars) => {
    calls.push(vars);
    if (query.includes('contributionsCollection')) {
      return {
        user: {
          id: 'U1', login: 'octo', name: 'Octo Cat', avatarUrl: 'https://x/a.png',
          contributionsCollection: {
            totalCommitContributions: 3, totalPullRequestContributions: 7, totalIssueContributions: 2,
            totalPullRequestReviewContributions: 11, restrictedContributionsCount: 40,
            contributionCalendar: {
              totalContributions: 63,
              weeks: [{ contributionDays: [{ date: '2025-12-31', contributionCount: 9 }, { date: '2026-03-01', contributionCount: 4 }, { date: '2026-03-02', contributionCount: 6 }] }],
            },
            commitContributionsByRepository: [
              { contributions: { totalCount: 1 }, repository: { nameWithOwner: 'octo/b', name: 'b', isPrivate: false, stargazerCount: 0, primaryLanguage: null } },
              { contributions: { totalCount: 2 }, repository: { nameWithOwner: 'octo/a', name: 'a', isPrivate: false, stargazerCount: 42, primaryLanguage: { name: 'Go' } } },
            ],
          },
        },
      };
    }
    if (vars.name === 'a') {
      const page1 = !vars.after;
      return { repository: { defaultBranchRef: { target: { history: {
        pageInfo: { hasNextPage: page1, endCursor: 'c1' },
        nodes: page1
          ? [{ oid: '1', authoredDate: '2026-03-01T23:30:00Z', messageHeadline: 'fix bug', additions: 100, deletions: 10, parents: { totalCount: 1 } },
             { oid: 'm', authoredDate: '2026-03-01T12:00:00Z', messageHeadline: 'Merge', additions: 999, deletions: 0, parents: { totalCount: 2 } }]
          : [{ oid: '2', authoredDate: '2026-03-02T08:00:00Z', messageHeadline: 'add api', additions: 50, deletions: 5, parents: { totalCount: 1 } }],
      } } } } };
    }
    throw new GitHubError('Could not resolve to a Repository');
  };
  return { request, calls };
}

test('fetches a GitHub year, paginates, skips merges and unreachable repos', async () => {
  const { request, calls } = fakeApi();
  const res = await fetchGitHubYear('octo', { year: 2026, timeZone: 'Europe/Paris', request });
  assert.equal(res.commits.length, 2);
  assert.equal(calls.filter((c) => c.name === 'a').length, 2); // two pages
  assert.equal(res.github.topRepos[0].name, 'octo/a'); // sorted by contributions
  assert.equal(res.calendar.has('2025-12-31'), false); // other years dropped
  // 23:30 UTC on March 1st is 00:30 on March 2nd in Paris
  assert.deepEqual([res.commits[0].day, res.commits[0].hour], ['2026-03-02', 0]);

  const s = computeStats(res.commits, { year: 2026, name: 'Octo', calendar: res.calendar, github: res.github });
  assert.equal(s.added, 150);
  assert.equal(s.languages[0].name, 'Go');
  assert.equal(s.activeDays, 2); // from the official calendar
  assert.equal(s.repos, 2);
  assert.equal(s.github.prs, 7);
  assert.ok(buildHtml(s).includes('"login":"octo"'));
});

test('unknown user gives a clear error', async () => {
  await assert.rejects(fetchGitHubYear('nobody', { year: 2026, timeZone: 'UTC', request: async () => ({ user: null }) }), /not found/);
});

test('localParts converts time zones', () => {
  assert.deepEqual(localParts('2026-01-05T03:15:00Z', 'America/New_York'), { day: '2026-01-04', hour: 22, minute: 15, weekday: 7 });
});

test('request maps 401 to a friendly error', async () => {
  const req = makeRequest('t', async () => ({ status: 401, ok: false, json: async () => ({}) }));
  await assert.rejects(req('q', {}), /rejected the token/);
});

test('localParts keeps the offset a commit carries', () => {
  // 01:15 in Tokyo stays 01:15, whatever the fallback zone
  assert.deepEqual(localParts('2026-03-05T01:15:00+09:00', 'Europe/Paris'), { day: '2026-03-05', hour: 1, minute: 15, weekday: 4 });
  assert.deepEqual(localParts('2026-03-08T23:59:00-05:00', 'UTC'), { day: '2026-03-08', hour: 23, minute: 59, weekday: 7 });
});
