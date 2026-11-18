import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeStats, estimateHours, bookComparison } from '../src/stats.js';
import { buildHtml } from '../src/html.js';

const c = (day, hour, subject = 'work', extra = {}) => ({
  repo: 'r', hash: Math.random().toString(36), name: 'Me', email: 'me@x.io',
  day, hour, minute: 0, weekday: ((new Date(day + 'T00:00:00Z').getUTCDay() + 6) % 7) + 1,
  subject, added: 10, removed: 2, files: [{ path: 'src/a.ts', added: 10, removed: 2 }], ...extra,
});

test('counts commits, streaks and busiest day', () => {
  const s = computeStats([c('2026-03-01', 10), c('2026-03-02', 11), c('2026-03-03', 12), c('2026-03-03', 13), c('2026-03-10', 9)], { year: 2026 });
  assert.equal(s.commits, 5);
  assert.equal(s.activeDays, 4);
  assert.equal(s.longestStreak.length, 3);
  assert.deepEqual(s.busiest, { day: '2026-03-03', count: 2 });
  assert.equal(s.calendar.length, 365);
  assert.equal(s.languages[0].name, 'TypeScript');
});

test('detects a night owl', () => {
  const s = computeStats(Array.from({ length: 30 }, (_, i) => c(`2026-02-${String(i % 28 + 1).padStart(2, '0')}`, 1)), { year: 2026 });
  assert.equal(s.archetype.id, 'night-owl');
  assert.equal(s.archetype.score, undefined);
});

test('ignores lockfiles and counts fixes', () => {
  const s = computeStats([c('2026-01-05', 10, 'fix the thing', { files: [{ path: 'package-lock.json', added: 9000, removed: 0 }] })], { year: 2026 });
  assert.equal(s.added, 0);
  assert.equal(s.fixes, 1);
});

test('estimates coding hours from sessions', () => {
  assert.equal(estimateHours([c('2026-01-01', 10), c('2026-01-01', 11)]), 2); // 30min + 1h gap -> 1.5 -> rounds to 2
  assert.equal(estimateHours([]), 0);
});

test('book comparison picks the biggest book you beat', () => {
  assert.equal(bookComparison(50 * 1300).title, 'War and Peace');
  assert.equal(bookComparison(10).title, 'The Little Prince');
});

test('html escapes commit messages', () => {
  const s = computeStats([c('2026-01-05', 2, '</script><img src=x onerror=alert(1)>')], { year: 2026 });
  const html = buildHtml(s);
  assert.ok(!html.includes('</script><img'));
});
