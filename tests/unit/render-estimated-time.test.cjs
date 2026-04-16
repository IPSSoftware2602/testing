// REQ-001: renderEstimatedTime is the single display-layer transform.
// Contract: accepts canonical "YYYY-MM-DD HH:MM" or "ASAP" or null/undefined.
// Returns user-facing string. Never mutates state, never called at write time.

const test = require('node:test');
const assert = require('node:assert/strict');

process.env.TZ = 'UTC';

const { renderEstimatedTime } = require('../../utils/estimatedTimeRequest');

// Pin "now" so "Today" and "not today" are deterministic.
// 2026-04-08 10:00 MY == 2026-04-08 02:00 UTC
const NOW_MY_TODAY = new Date('2026-04-08T02:00:00Z');

test('renderEstimatedTime: null → empty string', () => {
  assert.equal(renderEstimatedTime(null), '');
});

test('renderEstimatedTime: undefined → empty string', () => {
  assert.equal(renderEstimatedTime(undefined), '');
});

test('renderEstimatedTime: "" → empty string', () => {
  assert.equal(renderEstimatedTime(''), '');
});

test('renderEstimatedTime: "ASAP" → "ASAP"', () => {
  assert.equal(renderEstimatedTime('ASAP', NOW_MY_TODAY), 'ASAP');
});

test('renderEstimatedTime: today canonical → "Today HH:MM"', () => {
  assert.equal(
    renderEstimatedTime('2026-04-08 14:30', NOW_MY_TODAY),
    'Today 14:30',
  );
});

test('renderEstimatedTime: future date → "DD Mon HH:MM"', () => {
  assert.equal(
    renderEstimatedTime('2026-04-12 23:00', NOW_MY_TODAY),
    '12 Apr 23:00',
  );
});

test('renderEstimatedTime: single-digit day gets zero-padded', () => {
  assert.equal(
    renderEstimatedTime('2026-04-04 23:00', NOW_MY_TODAY),
    '04 Apr 23:00',
  );
});

test('renderEstimatedTime: past date still renders DD Mon HH:MM', () => {
  assert.equal(
    renderEstimatedTime('2026-03-31 09:15', NOW_MY_TODAY),
    '31 Mar 09:15',
  );
});

test('renderEstimatedTime: object form also works', () => {
  assert.equal(
    renderEstimatedTime(
      { estimatedTime: '2026-04-08 14:30', date: '2026-04-08', time: '14:30' },
      NOW_MY_TODAY,
    ),
    'Today 14:30',
  );
});

test('renderEstimatedTime: bogus string → empty (caller falls back)', () => {
  assert.equal(renderEstimatedTime('Today 14:00', NOW_MY_TODAY), '');
  assert.equal(renderEstimatedTime('garbage', NOW_MY_TODAY), '');
});

test('renderEstimatedTime: canonical with seconds still works', () => {
  assert.equal(
    renderEstimatedTime('2026-04-08 14:30:00', NOW_MY_TODAY),
    'Today 14:30',
  );
});

test('renderEstimatedTime: canonical value in state never matches a display label', () => {
  // Regression: ensure we never round-trip a display label back through this
  // helper and get a "double-transformed" string.
  const canonical = '2026-04-08 14:30';
  const display = renderEstimatedTime(canonical, NOW_MY_TODAY);
  // Now feed the display label back in — should NOT be parsed as canonical.
  const reRender = renderEstimatedTime(display, NOW_MY_TODAY);
  assert.equal(reRender, '', 'display labels must not parse as canonical');
});
