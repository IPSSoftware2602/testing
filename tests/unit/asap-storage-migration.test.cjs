const test = require('node:test');
const assert = require('node:assert/strict');

process.env.TZ = 'UTC';

const {
  migrateLegacyEstimatedTime,
  isConformingEstimatedTime,
  ASAP_SHAPE,
} = require('../../utils/estimatedTimeRequest');
const { validateStoredOrderDateTime } = require('../../utils/order_datetime');

// Minimal in-memory AsyncStorage stub
function makeStorage(initial) {
  const store = { ...(initial || {}) };
  return {
    getItem: async (k) => (k in store ? store[k] : null),
    setItem: async (k, v) => { store[k] = v; },
    removeItem: async (k) => { delete store[k]; },
    _store: store,
  };
}

// ───── isConformingEstimatedTime ─────

test('isConformingEstimatedTime accepts ASAP shape', () => {
  assert.equal(isConformingEstimatedTime({ estimatedTime: 'ASAP', date: null, time: null }), true);
});

test('isConformingEstimatedTime accepts canonical YYYY-MM-DD HH:MM shape', () => {
  assert.equal(
    isConformingEstimatedTime({ estimatedTime: '2026-04-08 14:00', date: '2026-04-08', time: '14:00' }),
    true,
  );
});

test('isConformingEstimatedTime rejects display-label legacy shape', () => {
  assert.equal(
    isConformingEstimatedTime({ estimatedTime: 'Today 14:00', date: '2026-04-08', time: '14:00' }),
    false,
  );
  assert.equal(
    isConformingEstimatedTime({ estimatedTime: 'Aug 5 14:00', date: '2026-08-05', time: '14:00' }),
    false,
  );
});

test('isConformingEstimatedTime rejects mismatched date/time vs estimatedTime', () => {
  assert.equal(
    isConformingEstimatedTime({ estimatedTime: '2026-04-08 14:00', date: '2026-04-09', time: '14:00' }),
    false,
  );
});

test('isConformingEstimatedTime rejects nulls and non-objects', () => {
  assert.equal(isConformingEstimatedTime(null), false);
  assert.equal(isConformingEstimatedTime(undefined), false);
  assert.equal(isConformingEstimatedTime('ASAP'), false);
});

// ───── migrateLegacyEstimatedTime ─────

test('migrateLegacyEstimatedTime: empty storage → writes ASAP shape', async () => {
  const storage = makeStorage({});
  const result = await migrateLegacyEstimatedTime(storage);
  assert.deepEqual(result, ASAP_SHAPE);
  assert.deepEqual(JSON.parse(storage._store.estimatedTime), ASAP_SHAPE);
});

test('migrateLegacyEstimatedTime: legacy display label → resets to ASAP', async () => {
  const storage = makeStorage({
    estimatedTime: JSON.stringify({ estimatedTime: 'Today 14:00', date: '2026-04-08', time: '14:00' }),
  });
  const result = await migrateLegacyEstimatedTime(storage);
  assert.deepEqual(result, ASAP_SHAPE);
  assert.deepEqual(JSON.parse(storage._store.estimatedTime), ASAP_SHAPE);
});

test('migrateLegacyEstimatedTime: conforming canonical value → preserved', async () => {
  const valid = { estimatedTime: '2026-04-08 14:00', date: '2026-04-08', time: '14:00' };
  const storage = makeStorage({ estimatedTime: JSON.stringify(valid) });
  const result = await migrateLegacyEstimatedTime(storage);
  assert.deepEqual(result, valid);
});

test('migrateLegacyEstimatedTime: conforming ASAP value → preserved', async () => {
  const storage = makeStorage({ estimatedTime: JSON.stringify(ASAP_SHAPE) });
  const result = await migrateLegacyEstimatedTime(storage);
  assert.deepEqual(result, ASAP_SHAPE);
});

test('migrateLegacyEstimatedTime: corrupted JSON → resets to ASAP', async () => {
  const storage = makeStorage({ estimatedTime: 'not valid json {' });
  const result = await migrateLegacyEstimatedTime(storage);
  assert.deepEqual(result, ASAP_SHAPE);
});

// ───── validateStoredOrderDateTime ASAP behavior ─────

// Stub outlet with full operating hours and one delivery setting that's currently open.
// MY day-of-week numbering: 0=Sun..6=Sat. Build a setting that includes today's MY day.
const { nowInMY } = require('../../utils/timezone');

function buildSchedule(openToday) {
  const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const { toMY } = require('../../utils/timezone');
  const myToday = dayNames[toMY(nowInMY().toDate()).day()];
  const schedule = {};
  for (const d of dayNames) {
    const active = openToday ? d === myToday : d !== myToday;
    schedule[d] = {
      is_operated: active,
      operating_hours: active ? [{ start_time: '00:00:00', end_time: '23:59:59' }] : [],
    };
  }
  return schedule;
}

function makeOpenOutlet(orderType) {
  return {
    serve_method: orderType,
    pickup_lead_time: 5,
    operating_schedule: buildSchedule(true),
  };
}

function makeClosedOutlet(orderType) {
  return {
    serve_method: orderType,
    pickup_lead_time: 5,
    operating_schedule: buildSchedule(false),
  };
}

test('validateStoredOrderDateTime: ASAP valid when outlet open for pickup', () => {
  const result = validateStoredOrderDateTime({
    orderType: 'pickup',
    estimatedTime: ASAP_SHAPE,
    outlet: makeOpenOutlet('pickup'),
  });
  assert.equal(result.isValid, true);
});

test('validateStoredOrderDateTime: ASAP rejected when outlet closed for delivery', () => {
  const result = validateStoredOrderDateTime({
    orderType: 'delivery',
    estimatedTime: ASAP_SHAPE,
    outlet: makeClosedOutlet('delivery'),
  });
  assert.equal(result.isValid, false);
  assert.equal(result.reason, 'outlet_closed');
});

test('validateStoredOrderDateTime: missing storage rejected', () => {
  const result = validateStoredOrderDateTime({
    orderType: 'pickup',
    estimatedTime: { estimatedTime: null, date: null, time: null },
    outlet: makeOpenOutlet('pickup'),
  });
  assert.equal(result.isValid, false);
  assert.equal(result.reason, 'missing');
});
