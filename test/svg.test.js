import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeStats } from '../src/stats.js';
import { buildSvg } from '../src/svg.js';

const commit = (day, hour, extra = {}) => ({
  repo: 'r', hash: Math.random().toString(36), name: 'Me', email: 'me@x.io', day, hour, minute: 0,
  weekday: ((new Date(day + 'T00:00:00Z').getUTCDay() + 6) % 7) + 1, subject: 'work', added: 5, removed: 1,
  files: [{ path: 'a.ts', added: 5, removed: 1 }], ...extra,
});

const stats = computeStats([commit('2026-02-01', 23), commit('2026-02-02', 1)], { year: 2026, name: 'Me <script>' });

test('svg is well-formed and escapes user content', () => {
  const svg = buildSvg({ ...stats, github: { login: 'octo&cat', repos: 3 } });
  assert.ok(svg.startsWith('<svg'));
  assert.ok(svg.includes('@octo&amp;cat'));
  assert.ok(!svg.includes('<script>'));
  assert.equal((svg.match(/<rect [^>]*class="c (on|off)"/g) || []).length, 365);
});

test('auto theme follows the viewer, forced themes do not', () => {
  assert.match(buildSvg(stats, { theme: 'auto' }), /prefers-color-scheme: light/);
  assert.doesNotMatch(buildSvg(stats, { theme: 'dark' }), /prefers-color-scheme: light/);
  assert.match(buildSvg(stats, { theme: 'light' }), /--bg:#fbfbfd/);
});
