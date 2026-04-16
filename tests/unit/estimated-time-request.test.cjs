const test = require('node:test');
const assert = require('node:assert/strict');

const {
  getEstimatedTimeFromStorage,
  buildEstimatedTimeFromSelectedDateTime,
  toDisplayEstimatedTimeLabel,
} = require('../../utils/estimatedTimeRequest');
const { validateStoredOrderDateTime } = require('../../utils/order_datetime');

test('returns normalized object for valid scheduled estimatedTime', () => {
  const raw = JSON.stringify({
    estimatedTime: 'Today 20:30',
    date: '2026-03-16',
    time: '20:30',
  });

  const result = getEstimatedTimeFromStorage(raw);
  assert.deepEqual(result, {
    estimatedTime: 'Today 20:30',
    date: '2026-03-16',
    time: '20:30',
  });
});

test('returns ASAP normalized object', () => {
  const raw = JSON.stringify({
    estimatedTime: 'ASAP',
    date: null,
    time: null,
  });

  const result = getEstimatedTimeFromStorage(raw);
  assert.deepEqual(result, {
    estimatedTime: 'ASAP',
    date: null,
    time: null,
  });
});

test('returns null for invalid storage payload', () => {
  assert.equal(getEstimatedTimeFromStorage('not-json'), null);
  assert.equal(getEstimatedTimeFromStorage(JSON.stringify({ estimatedTime: 'Today 20:30' })), null);
});

test('buildEstimatedTimeFromSelectedDateTime supports YYYY-MM-DD HH:mm format', () => {
  const result = buildEstimatedTimeFromSelectedDateTime('2026-03-17 00:00');
  assert.deepEqual(result, {
    estimatedTime: '2026-03-17 00:00',
    date: '2026-03-17',
    time: '00:00',
  });
});

test('toDisplayEstimatedTimeLabel converts storage date/time to DD Mon HH:MM', () => {
  const result = toDisplayEstimatedTimeLabel({
    estimatedTime: '2026-03-17 00:00',
    date: '2026-03-17',
    time: '00:00',
  }, new Date('2026-03-16T12:00:00'));

  // REQ-001 locked format: "DD Mon HH:MM" (DMY for Malaysian users)
  assert.equal(result, '17 Mar 00:00');
});

test('pickup validation uses pickup_lead_time instead of delivery lead_time', () => {
  const now = new Date('2026-03-17T10:00:00');
  const outlet = {
    pickup_lead_time: 30,
    delivery_settings: [
      {
        delivery_available_days: '2',
        delivery_start: '10:00:00',
        delivery_end: '12:00:00',
        delivery_interval: 15,
        lead_time: 120,
      },
    ],
  };

  const result = validateStoredOrderDateTime({
    orderType: 'pickup',
    estimatedTime: {
      estimatedTime: '2026-03-17 10:45',
      date: '2026-03-17',
      time: '10:45',
    },
    outlet,
    now,
  });

  assert.equal(result.isValid, true);
});
