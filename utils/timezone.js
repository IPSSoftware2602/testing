// Malaysia timezone helpers — REQ-002.
//
// All date/time logic in the customer app MUST go through this module.
// Never call `new Date()` directly in date logic — use `nowInMY()`.
// Never format with toLocaleDateString without a timezone — use `formatMY*()`.
//
// The timezone is `Asia/Kuala_Lumpur` (UTC+8, no DST).
// dayjs plugins are initialized in app/_layout.js (the Expo Router root layout)
// before any other date-aware code runs.

const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

// Idempotent: extending twice is a no-op so this is safe to require from tests
// even though _layout.js also extends.
dayjs.extend(utc);
dayjs.extend(timezone);

const MY_TZ = 'Asia/Kuala_Lumpur';

// Returns the current moment in Malaysia time as a dayjs object.
// Always anchored to MY_TZ regardless of device timezone.
function nowInMY() {
  return dayjs().tz(MY_TZ);
}

// Coerces any input (Date, dayjs, ISO string, "YYYY-MM-DD HH:MM", null) into
// a dayjs object in Malaysia time. Null/undefined returns nowInMY().
function toMY(input) {
  if (input == null) return nowInMY();
  if (dayjs.isDayjs(input)) return input.tz(MY_TZ);
  return dayjs(input).tz(MY_TZ);
}

// Returns "YYYY-MM-DD" in Malaysia time.
function formatMYDate(input) {
  return toMY(input).format('YYYY-MM-DD');
}

// Returns "HH:MM" in Malaysia time.
function formatMYTime(input) {
  return toMY(input).format('HH:mm');
}

// Returns "YYYY-MM-DD HH:MM" in Malaysia time. This is the canonical
// `estimatedTime` storage format per DECISIONS.md REQ-001.
function formatMYDateTime(input) {
  return toMY(input).format('YYYY-MM-DD HH:mm');
}

// Returns "YYYY-MM-DD HH:MM:SS" in Malaysia time. Use for DB-style timestamps.
function formatMYDateTimeFull(input) {
  return toMY(input).format('YYYY-MM-DD HH:mm:ss');
}

// Parses a "YYYY-MM-DD" date and "HH:MM" time as Malaysia local time.
// Returns a dayjs object anchored to MY_TZ. Returns null on bad input.
function parseMYDateTime(dateStr, timeStr) {
  if (!dateStr || !timeStr) return null;
  try {
    const combined = `${dateStr} ${timeStr}`;
    const parsed = dayjs.tz(combined, 'YYYY-MM-DD HH:mm', MY_TZ);
    return parsed.isValid() ? parsed : null;
  } catch (_err) {
    // dayjs.tz throws on truly malformed input (RangeError from
    // Intl.DateTimeFormat). Treat as invalid input.
    return null;
  }
}

// Returns a Date object for `nowInMY()`. Useful when you must hand a Date to
// a third-party API that doesn't accept dayjs. The Date object itself is
// timezone-less (it's an absolute UTC instant), but Date.parse'ing the
// formatMYDateTime() string round-trips correctly.
function nowInMYAsDate() {
  return nowInMY().toDate();
}

module.exports = {
  MY_TZ,
  nowInMY,
  toMY,
  formatMYDate,
  formatMYTime,
  formatMYDateTime,
  formatMYDateTimeFull,
  parseMYDateTime,
  nowInMYAsDate,
};
