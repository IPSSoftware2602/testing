function parseLocalDateTime(dateStr, timeStr) {
  if (!dateStr || !timeStr) return null;

  const [y, m, d] = String(dateStr).split("-").map(Number);
  const timeParts = String(timeStr).split(":").map(Number);
  if (!y || !m || !d || timeParts.length < 2) return null;

  const hh = timeParts[0];
  const mm = timeParts[1];
  const ss = timeParts[2] ?? 0;
  const value = new Date(y, m - 1, d, hh, mm, ss);
  return Number.isNaN(value.getTime()) ? null : value;
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

function getAvailableSlotsForDate(date, outlet, now = new Date()) {
  if (!date || !outlet) return [];

  const slots = [];
  const slotTimes = new Set();
  const matchingSettings = getMatchingSettings(date, outlet);

  matchingSettings.forEach((setting) => {
    const interval = parseInt(setting.delivery_interval || "0", 10);
    if (!setting.delivery_start || !setting.delivery_end || interval <= 0) return;

    const leadTimeMinutes = parseInt(setting.lead_time || "0", 10);
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

function getMinimumLeadTimeForDate(date, outlet) {
  const matchingSettings = getMatchingSettings(date, outlet);
  if (matchingSettings.length === 0) return 0;

  return Math.min(...matchingSettings.map((setting) => Number(setting.lead_time) || 0));
}

function validateStoredOrderDateTime({
  orderType,
  estimatedTime,
  outlet,
  now = new Date(),
}) {
  if (orderType !== "pickup" && orderType !== "delivery") {
    return { isValid: true, reason: null, message: "" };
  }

  if (!estimatedTime?.date || !estimatedTime?.time || !estimatedTime?.estimatedTime || estimatedTime.estimatedTime === "ASAP") {
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

  const minimumLeadMinutes = getMinimumLeadTimeForDate(selectedDateTime, outlet);
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

  const availableSlots = getAvailableSlotsForDate(selectedDateTime, outlet, now);
  if (!availableSlots.includes(estimatedTime.time)) {
    return {
      isValid: false,
      reason: "unavailable",
      message: `Your selected ${orderType} time is no longer available. Please choose another slot.`,
    };
  }

  return { isValid: true, reason: null, message: "" };
}

module.exports = {
  parseLocalDateTime,
  formatLocalDate,
  getAvailableSlotsForDate,
  validateStoredOrderDateTime,
};
