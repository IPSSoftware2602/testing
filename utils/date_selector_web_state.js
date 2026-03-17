const dayjs = require('dayjs');

function resolveWebCalendarBaseDate(currentValue, fallbackValue) {
  const current = dayjs(currentValue);
  if (current.isValid()) return current;

  const fallback = dayjs(fallbackValue);
  if (fallback.isValid()) return fallback;

  return dayjs();
}

function applyWebCalendarYearMonthChange(currentValue, { month, year }) {
  let next = resolveWebCalendarBaseDate(currentValue);

  if (Number.isInteger(year) && year >= 0) {
    next = next.year(year);
  }

  if (Number.isInteger(month) && month >= 0 && month <= 11) {
    next = next.month(month);
  }

  return next;
}

function detectWebCalendarMonthView(doc) {
  if (!doc || typeof doc.querySelector !== 'function') return false;
  return Boolean(doc.querySelector('[data-testid="month-selector"]'));
}

module.exports = {
  resolveWebCalendarBaseDate,
  applyWebCalendarYearMonthChange,
  detectWebCalendarMonthView,
};
