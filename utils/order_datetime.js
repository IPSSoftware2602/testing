// REQ-002: Parse a "YYYY-MM-DD" date and "HH:MM" time as Malaysia local time.
// Returns a Date object representing the absolute UTC instant of that MY moment.
function parseLocalDateTime(dateStr, timeStr) {
  if (!dateStr || !timeStr) return null;
  const { parseMYDateTime } = require('./timezone');
  const parsed = parseMYDateTime(dateStr, timeStr);
  return parsed ? parsed.toDate() : null;
}

function formatLocalDate(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function normalizeSettingsList(outlet) {
  if (Array.isArray(outlet?.delivery_settings) && outlet.delivery_settings.length > 0) {
    return outlet.delivery_settings;
  }

  if (outlet?.delivery_available_days && outlet?.delivery_start) {
    return [
      {
        delivery_available_days: outlet.delivery_available_days,
        delivery_start: outlet.delivery_start,
        delivery_end: outlet.delivery_end,
        delivery_interval: outlet.delivery_interval,
        lead_time: outlet.lead_time,
      },
    ];
  }

  return [];
}

function getLeadTimeMinutes(setting, outlet, orderType) {
  if (orderType === "pickup") {
    const pickupLeadTime = Number(
      outlet?.pickup_lead_time ?? setting?.pickup_lead_time ?? 0
    );
    return Number.isNaN(pickupLeadTime) ? 0 : pickupLeadTime;
  }

  const leadTime = Number(setting?.lead_time ?? 0);
  return Number.isNaN(leadTime) ? 0 : leadTime;
}

function getMatchingSettings(date, outlet) {
  const selectedDay = date.getDay();
  return normalizeSettingsList(outlet).filter((setting) => {
    const days = String(setting.delivery_available_days || "")
      .split(",")
      .map((value) => parseInt(value.trim(), 10))
      .filter((value) => !Number.isNaN(value));

    return days.includes(selectedDay);
  });
}

// REQ-002: All slot generation uses Malaysia time. Callers should pass `now`
// from `nowInMY().toDate()` so device timezone never leaks in.
function getAvailableSlotsForDate(date, outlet, now = require('./timezone').nowInMY().toDate(), orderType = "delivery") {
  if (!date || !outlet) return [];

  const slots = [];
  const slotTimes = new Set();
  const matchingSettings = getMatchingSettings(date, outlet);

  matchingSettings.forEach((setting) => {
    const interval = parseInt(setting.delivery_interval || "0", 10);
    if (!setting.delivery_start || !setting.delivery_end || interval <= 0) return;

    const leadTimeMinutes = getLeadTimeMinutes(setting, outlet, orderType);
    const minimumAllowed = new Date(now.getTime() + leadTimeMinutes * 60000);

    const [startH, startM] = setting.delivery_start.split(":").map(Number);
    const [endH, endM] = setting.delivery_end.split(":").map(Number);

    const current = new Date(date);
    current.setHours(startH, startM, 0, 0);

    const end = new Date(date);
    end.setHours(endH, endM, 0, 0);

    while (current <= end) {
      if (current >= minimumAllowed) {
        const time = `${String(current.getHours()).padStart(2, "0")}:${String(current.getMinutes()).padStart(2, "0")}`;
        if (!slotTimes.has(time)) {
          slotTimes.add(time);
          slots.push(time);
        }
      }

      current.setMinutes(current.getMinutes() + interval);
    }
  });

  return slots.sort((a, b) => a.localeCompare(b));
}

function getMinimumLeadTimeForDate(date, outlet, orderType = "delivery") {
  const matchingSettings = getMatchingSettings(date, outlet);
  if (matchingSettings.length === 0) return 0;

  return Math.min(
    ...matchingSettings.map((setting) =>
      getLeadTimeMinutes(setting, outlet, orderType)
    )
  );
}

// REQ-001: ASAP is now a valid choice. The validator accepts ASAP when the outlet
// is currently open for the given order_type, and rejects ASAP when closed (the
// picker should disable the ASAP pill in that case so the user picks a slot).
function validateStoredOrderDateTime({
  orderType,
  estimatedTime,
  outlet,
  now = require('./timezone').nowInMY().toDate(),
}) {
  if (orderType !== "pickup" && orderType !== "delivery") {
    return { isValid: true, reason: null, message: "" };
  }

  // REQ-001: ASAP branch — valid only if outlet is currently open for this order_type.
  if (estimatedTime?.estimatedTime === "ASAP") {
    if (isOutletOpenNow(outlet, orderType, now)) {
      return { isValid: true, reason: null, message: "" };
    }
    return {
      isValid: false,
      reason: "outlet_closed",
      message: `Outlet is currently closed for ${orderType}. Please pick a future time slot.`,
    };
  }

  if (!estimatedTime?.date || !estimatedTime?.time || !estimatedTime?.estimatedTime) {
    return {
      isValid: false,
      reason: "missing",
      message: `Please select your ${orderType} date and time.`,
    };
  }

  const selectedDateTime = parseLocalDateTime(estimatedTime.date, estimatedTime.time);
  if (!selectedDateTime) {
    return {
      isValid: false,
      reason: "missing",
      message: `Please select your ${orderType} date and time.`,
    };
  }

  const minimumLeadMinutes = getMinimumLeadTimeForDate(selectedDateTime, outlet, orderType);
  if (minimumLeadMinutes > 0) {
    const minimumAllowed = new Date(now.getTime() + minimumLeadMinutes * 60000);
    if (selectedDateTime < minimumAllowed) {
      return {
        isValid: false,
        reason: "lead_time",
        message: `Your selected ${orderType} time is no longer within the required lead time. Please choose again.`,
      };
    }
  }

  const availableSlots = getAvailableSlotsForDate(selectedDateTime, outlet, now, orderType);
  if (!availableSlots.includes(estimatedTime.time)) {
    return {
      isValid: false,
      reason: "unavailable",
      message: `Your selected ${orderType} time is no longer available. Please choose another slot.`,
    };
  }

  return { isValid: true, reason: null, message: "" };
}

// REQ-001: Returns true if the outlet is currently open RIGHT NOW for the
// given order_type (delivery or pickup). ASAP semantics — no slot/lead-time
// math, just "is the outlet currently serving?" This uses the outlet-wide
// `operating_schedule` (keyed by weekday name) which is the authoritative
// source for both pickup and delivery operating hours. `delivery_settings`
// is only consulted for scheduled-slot generation, not for ASAP.
function isOutletOpenNow(outlet, orderType, now = require('./timezone').nowInMY().toDate()) {
  if (!outlet || !orderType) return false;
  if (orderType !== "pickup" && orderType !== "delivery") return false;

  // Outlet must serve this order type
  const serveMethodRaw = String(outlet.serve_method || "").toLowerCase();
  if (serveMethodRaw) {
    const serveMethod = serveMethodRaw
      .split(",")
      .map((v) => v.trim().replace(/[-\s]/g, ""))
      .filter((v) => v.length > 0);
    if (serveMethod.length > 0 && !serveMethod.includes(orderType)) return false;
  }

  // Locate the outlet's operating schedule. Server returns it as
  // `operating_schedule`, the legacy outlet_select.js stored it as
  // `operatingHours`. Support both.
  const schedule = outlet.operating_schedule || outlet.operatingHours || null;
  if (!schedule || typeof schedule !== 'object' || Array.isArray(schedule)) {
    return false;
  }

  const { toMY } = require('./timezone');
  const myNow = toMY(now);
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayName = dayNames[myNow.day()];

  const todaySchedule = schedule[todayName];
  if (!todaySchedule || !todaySchedule.is_operated) return false;

  const hours = Array.isArray(todaySchedule.operating_hours) ? todaySchedule.operating_hours : [];
  if (hours.length === 0) return false;

  // Compare HH:mm:ss strings lexicographically — safe for 24-hour fixed-width.
  const currentTimeStr = myNow.format('HH:mm:ss');
  for (const slot of hours) {
    const start = String(slot.start_time || '').slice(0, 8);
    const end = String(slot.end_time || '').slice(0, 8);
    if (!start || !end) continue;
    const startNorm = start.length === 5 ? `${start}:00` : start;
    const endNorm = end.length === 5 ? `${end}:00` : end;
    if (currentTimeStr >= startNorm && currentTimeStr < endNorm) {
      return true;
    }
  }
  return false;
}

module.exports = {
  parseLocalDateTime,
  formatLocalDate,
  getAvailableSlotsForDate,
  validateStoredOrderDateTime,
  isOutletOpenNow,
};
