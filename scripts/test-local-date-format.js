const assert = require('node:assert/strict');
const { formatLocalDate } = require('../utils/order_datetime');

const earlyMorning = new Date(2026, 2, 9, 1, 15, 0);
assert.equal(formatLocalDate(earlyMorning), '2026-03-09');

console.log('local date format tests passed');
