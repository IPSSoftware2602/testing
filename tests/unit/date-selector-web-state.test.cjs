const test = require('node:test');
const assert = require('node:assert/strict');

const {
  resolveWebCalendarBaseDate,
  applyWebCalendarYearMonthChange,
  detectWebCalendarMonthView,
} = require('../../utils/date_selector_web_state');

test('resolveWebCalendarBaseDate falls back when current value is invalid', () => {
  const result = resolveWebCalendarBaseDate('not-a-date', '2026-03-17');
  assert.equal(result.format('YYYY-MM-DD'), '2026-03-17');
});

test('applyWebCalendarYearMonthChange keeps selected year when month is changed after year change', () => {
  const afterYearChange = applyWebCalendarYearMonthChange('2024-08-20', { year: 2026 });
  assert.equal(afterYearChange.format('YYYY-MM-DD'), '2026-08-20');

  const afterMonthChange = applyWebCalendarYearMonthChange(afterYearChange, { month: 1 });
  assert.equal(afterMonthChange.format('YYYY-MM-DD'), '2026-02-20');
});

test('applyWebCalendarYearMonthChange keeps selected month when year is changed after month change', () => {
  const afterMonthChange = applyWebCalendarYearMonthChange('2024-08-20', { month: 10 });
  assert.equal(afterMonthChange.format('YYYY-MM-DD'), '2024-11-20');

  const afterYearChange = applyWebCalendarYearMonthChange(afterMonthChange, { year: 2027 });
  assert.equal(afterYearChange.format('YYYY-MM-DD'), '2027-11-20');
});

test('detectWebCalendarMonthView returns true when month selector test id exists', () => {
  const fakeDocument = {
    querySelector: (selector) => (selector === '[data-testid="month-selector"]' ? {} : null),
  };

  assert.equal(detectWebCalendarMonthView(fakeDocument), true);
});

test('detectWebCalendarMonthView returns false when month selector is absent', () => {
  const fakeDocument = {
    querySelector: () => null,
  };

  assert.equal(detectWebCalendarMonthView(fakeDocument), false);
});
