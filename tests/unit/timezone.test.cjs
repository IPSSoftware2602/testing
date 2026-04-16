const test = require('node:test');
const assert = require('node:assert/strict');

// Force the test process to a non-MY timezone so we prove the helpers are
// independent of process.env.TZ. UTC is the natural choice — every helper
// must still emit Malaysia time. We set this BEFORE requiring the module
// so dayjs cannot cache process tz at import time.
process.env.TZ = 'UTC';

const {
  MY_TZ,
  nowInMY,
  toMY,
  formatMYDate,
  formatMYTime,
  formatMYDateTime,
  formatMYDateTimeFull,
  parseMYDateTime,
} = require('../../utils/timezone');

test('MY_TZ constant is Asia/Kuala_Lumpur', () => {
  assert.equal(MY_TZ, 'Asia/Kuala_Lumpur');
});

test('nowInMY returns a dayjs object anchored to Malaysia time', () => {
  const now = nowInMY();
  // dayjs.tz objects expose .utcOffset() — Malaysia is UTC+8 → 480 minutes.
  assert.equal(now.utcOffset(), 480);
});

test('formatMYDate converts a UTC instant to the correct MY date (next-day rollover)', () => {
  // 2026-04-07 16:00 UTC = 2026-04-08 00:00 MY (UTC+8)
  const input = new Date('2026-04-07T16:00:00Z');
  assert.equal(formatMYDate(input), '2026-04-08');
});

test('formatMYDate handles same-day case', () => {
  // 2026-04-07 02:00 UTC = 2026-04-07 10:00 MY
  const input = new Date('2026-04-07T02:00:00Z');
  assert.equal(formatMYDate(input), '2026-04-07');
});

test('formatMYTime emits HH:MM in Malaysia time', () => {
  const input = new Date('2026-04-07T02:00:00Z');
  assert.equal(formatMYTime(input), '10:00');
});

test('formatMYDateTime emits canonical YYYY-MM-DD HH:MM storage format', () => {
  const input = new Date('2026-04-07T02:00:00Z');
  assert.equal(formatMYDateTime(input), '2026-04-07 10:00');
});

test('formatMYDateTimeFull emits seconds for DB timestamps', () => {
  const input = new Date('2026-04-07T02:30:45Z');
  assert.equal(formatMYDateTimeFull(input), '2026-04-07 10:30:45');
});

test('parseMYDateTime parses YYYY-MM-DD + HH:MM as Malaysia local time', () => {
  const parsed = parseMYDateTime('2026-04-08', '00:00');
  assert.ok(parsed, 'parseMYDateTime returned null');
  // 2026-04-08 00:00 MY = 2026-04-07 16:00 UTC
  assert.equal(parsed.toISOString(), '2026-04-07T16:00:00.000Z');
});

test('parseMYDateTime returns null on missing inputs', () => {
  assert.equal(parseMYDateTime(null, '00:00'), null);
  assert.equal(parseMYDateTime('2026-04-08', null), null);
  assert.equal(parseMYDateTime('', ''), null);
});

test('parseMYDateTime returns null on bogus inputs', () => {
  assert.equal(parseMYDateTime('not-a-date', '99:99'), null);
});

test('toMY accepts dayjs, Date, ISO string, and re-anchors to MY', () => {
  const dateInput = new Date('2026-04-07T02:00:00Z');
  const isoInput = '2026-04-07T02:00:00Z';
  assert.equal(toMY(dateInput).format('YYYY-MM-DD HH:mm'), '2026-04-07 10:00');
  assert.equal(toMY(isoInput).format('YYYY-MM-DD HH:mm'), '2026-04-07 10:00');
});

test('roundtrip: formatMYDateTime → parseMYDateTime preserves the instant', () => {
  const original = new Date('2026-04-07T16:30:00Z');
  const formatted = formatMYDateTime(original);
  const [d, t] = formatted.split(' ');
  const parsed = parseMYDateTime(d, t);
  assert.equal(parsed.toISOString(), original.toISOString());
});
