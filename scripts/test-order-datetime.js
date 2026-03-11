const assert = require("node:assert/strict");
const {
  validateStoredOrderDateTime,
} = require("../utils/order_datetime");

const outlet = {
  delivery_settings: [
    {
      delivery_available_days: "1",
      delivery_start: "10:00",
      delivery_end: "12:00",
      delivery_interval: "30",
      lead_time: "60",
    },
  ],
};

const mondayMorning = new Date(2026, 2, 9, 9, 0, 0);

const missingSelection = validateStoredOrderDateTime({
  orderType: "pickup",
  estimatedTime: null,
  outlet,
  now: mondayMorning,
});
assert.equal(missingSelection.reason, "missing");

const leadTimeInvalid = validateStoredOrderDateTime({
  orderType: "delivery",
  estimatedTime: { estimatedTime: "2026-03-09 09:30", date: "2026-03-09", time: "09:30" },
  outlet,
  now: mondayMorning,
});
assert.equal(leadTimeInvalid.reason, "lead_time");

const unavailableSelection = validateStoredOrderDateTime({
  orderType: "pickup",
  estimatedTime: { estimatedTime: "2026-03-09 12:30", date: "2026-03-09", time: "12:30" },
  outlet,
  now: mondayMorning,
});
assert.equal(unavailableSelection.reason, "unavailable");

const validSelection = validateStoredOrderDateTime({
  orderType: "pickup",
  estimatedTime: { estimatedTime: "2026-03-09 10:30", date: "2026-03-09", time: "10:30" },
  outlet,
  now: mondayMorning,
});
assert.equal(validSelection.reason, null);

console.log("order datetime validation tests passed");
