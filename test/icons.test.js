import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STROKE, svgIcon } from '../src/icons.js';
import { computeStats } from '../src/stats.js';
import { buildHtml } from '../src/html.js';
import { buildSvg } from '../src/svg.js';

const stats = computeStats(
  [{ repo: 'r', hash: 'h', name: 'Me', email: 'm', day: '2026-02-02', hour: 10, minute: 0, weekday: 1, subject: 'x', added: 1, removed: 0, files: [] }],
  { year: 2026 }
);

test('every renderer takes its stroke style from STROKE', () => {
  const style = `stroke-linecap="${STROKE.cap}" stroke-linejoin="${STROKE.join}"`;
  assert.ok(svgIcon('moon').includes(`stroke-width="${STROKE.regular}" ${style}`));
  assert.ok(buildSvg(stats).includes(style));
  assert.ok(buildHtml(stats).includes(`const STROKE = ${JSON.stringify(STROKE)};`));
});
