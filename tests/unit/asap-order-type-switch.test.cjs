// Regression tests for QA-reported picker bugs.
//
// Bug 1: Switching order type (pickup → delivery) with stored ASAP should NOT
//        re-prompt the picker if the outlet is currently open for the new type.
//        Root cause was passing device-time `new Date()` into the validator,
//        which mis-computed getDay() on non-MY devices.
//
// Bug 3: When ASAP is not available (outlet closed), the picker must default
//        to the earliest real slot, NOT still show ASAP as selected.

const test = require('node:test');
const assert = require('node:assert/strict');

process.env.TZ = 'UTC'; // Force device non-MY so bug 1 regressions would fail.

const { validateStoredOrderDateTime, isOutletOpenNow } = require('../../utils/order_datetime');
const { nowInMY } = require('../../utils/timezone');
const { ASAP_SHAPE } = require('../../utils/estimatedTimeRequest');

// Helper: build an operating_schedule that is OPEN 24h today in MY tz.
function makeAlwaysOpenScheduleToday() {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const { toMY } = require('../../utils/timezone');
  const myToday = dayNames[toMY(nowInMY().toDate()).day()];
  const schedule = {};
  for (const d of dayNames) {
    schedule[d] = {
      is_operated: d === myToday,
      operating_hours: d === myToday ? [{ start_time: '00:00:00', end_time: '23:59:59' }] : [],
    };
  }
  return schedule;
}

// Outlet that serves BOTH pickup and delivery, currently open for both.
function makeOpenForBothOutlet() {
  return {
    serve_method: 'pickup,delivery',
    pickup_lead_time: 5,
    lead_time: 5,
    operating_schedule: makeAlwaysOpenScheduleToday(),
    delivery_settings: [
      {
        delivery_available_days: String(nowInMY().toDate().getDay()),
        delivery_start: '00:00',
        delivery_end: '23:59',
        delivery_interval: 15,
        lead_time: 5,
      },
    ],
  };
}

// Outlet open only for pickup, not delivery.
function makePickupOnlyOutlet() {
  return {
    serve_method: 'pickup',
    pickup_lead_time: 5,
    operating_schedule: makeAlwaysOpenScheduleToday(),
  };
}

// ─── Bug 1: order-type switch with ASAP stays valid ───

test('BUG-1: ASAP stored, switch pickup→delivery, outlet open for both → still valid (no picker re-prompt)', () => {
  const outlet = makeOpenForBothOutlet();
  const nowMY = nowInMY().toDate();

  const pickupValid = validateStoredOrderDateTime({
    orderType: 'pickup',
    estimatedTime: ASAP_SHAPE,
    outlet,
    now: nowMY,
  });
  assert.equal(pickupValid.isValid, true, 'ASAP must be valid for pickup');

  const deliveryValid = validateStoredOrderDateTime({
    orderType: 'delivery',
    estimatedTime: ASAP_SHAPE,
    outlet,
    now: nowMY,
  });
  assert.equal(deliveryValid.isValid, true, 'ASAP must also be valid for delivery on same outlet');
});

test('BUG-1 root cause: isOutletOpenNow works with MY time on UTC device', () => {
  const outlet = makeOpenForBothOutlet();
  const nowMY = nowInMY().toDate();
  assert.equal(isOutletOpenNow(outlet, 'pickup', nowMY), true);
  assert.equal(isOutletOpenNow(outlet, 'delivery', nowMY), true);
});

test('BUG-1: ASAP stored, switch pickup→delivery, outlet pickup-only → delivery IS rejected (correct behavior)', () => {
  const outlet = makePickupOnlyOutlet();
  const nowMY = nowInMY().toDate();

  const pickupValid = validateStoredOrderDateTime({
    orderType: 'pickup',
    estimatedTime: ASAP_SHAPE,
    outlet,
    now: nowMY,
  });
  assert.equal(pickupValid.isValid, true);

  const deliveryValid = validateStoredOrderDateTime({
    orderType: 'delivery',
    estimatedTime: ASAP_SHAPE,
    outlet,
    now: nowMY,
  });
  assert.equal(deliveryValid.isValid, false);
  assert.equal(deliveryValid.reason, 'outlet_closed');
});

// ─── Bug 3: picker default when ASAP disabled ───
//
// The picker's generateTimesForDate is what sets the default selected time.
// We simulate it here by replicating its logic against the utils. The picker
// component itself isn't importable (JSX + react-native deps), so we test
// the slot generator + the rule that "when asapEnabled is false, the first
// selectable option must be a real slot, not ASAP."

test('BUG-3: when outlet closed right now, isOutletOpenNow returns false (operating_schedule path)', () => {
  // Outlet has operating_schedule but today is_operated=false.
  const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const { toMY } = require('../../utils/timezone');
  const myToday = dayNames[toMY(nowInMY().toDate()).day()];
  const closedSchedule = {};
  for (const d of dayNames) {
    closedSchedule[d] = { is_operated: d !== myToday, operating_hours: d !== myToday ? [{ start_time: '09:00:00', end_time: '18:00:00' }] : [] };
  }
  const closedTodayOutlet = {
    serve_method: 'delivery',
    lead_time: 5,
    operating_schedule: closedSchedule,
    delivery_settings: [
      {
        delivery_available_days: String((nowInMY().toDate().getDay() + 3) % 7),
        delivery_start: '00:00',
        delivery_end: '23:59',
        delivery_interval: 15,
        lead_time: 5,
      },
    ],
  };

  assert.equal(isOutletOpenNow(closedTodayOutlet, 'delivery', nowInMY().toDate()), false);

  // That means the picker's ASAP pill will be `isOperate: false` and
  // generateTimesForDate will default to the earliest real slot. Because
  // today is closed in this test outlet, there are zero real slots either,
  // so both ASAP and real-slot are empty — the picker should expose the
  // "no time selection" empty state rather than silently selecting ASAP.
  const { getAvailableSlotsForDate } = require('../../utils/order_datetime');
  const realSlots = getAvailableSlotsForDate(nowInMY().toDate(), closedTodayOutlet, nowInMY().toDate(), 'delivery');
  assert.equal(realSlots.length, 0, 'no real slots today when outlet closed');
});

test('BUG-3: outlet OPEN but ASAP disabled via future-date selection → picker shows real slots, not ASAP', () => {
  // When user picks tomorrow in the date row, ASAP should NOT appear at all
  // (generateTimesForDate only injects ASAP when `isToday`). Real slots only.
  const outlet = makeOpenForBothOutlet();
  const tomorrow = new Date(nowInMY().toDate());
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Make tomorrow's day-of-week match so slots exist.
  const tomorrowDow = tomorrow.getDay();
  outlet.delivery_settings[0].delivery_available_days = String(tomorrowDow);

  const { getAvailableSlotsForDate } = require('../../utils/order_datetime');
  const slots = getAvailableSlotsForDate(tomorrow, outlet, nowInMY().toDate(), 'delivery');
  assert.ok(slots.length > 0, 'tomorrow must have real slots');
  // The actual ASAP injection happens in the picker component, not here,
  // but this test pins the invariant: real-slot generator returns slots
  // that do NOT include the string "ASAP".
  assert.ok(slots.every((t) => t !== 'ASAP'));
});
