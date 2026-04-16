const getEstimatedTimeFromStorage = (estimatedTimeStr) => {
  if (!estimatedTimeStr) return null;

  try {
    const parsed = JSON.parse(estimatedTimeStr);
    if (!parsed || typeof parsed !== 'object') return null;

    if (!parsed.estimatedTime || parsed.estimatedTime === 'ASAP') {
      return { estimatedTime: 'ASAP', date: null, time: null };
    }

    if (!parsed.date || !parsed.time) return null;
    return {
      estimatedTime: parsed.estimatedTime,
      date: parsed.date,
      time: parsed.time,
    };
  } catch (_err) {
    return null;
  }
};

const pad2 = (value) => String(value).padStart(2, '0');

const formatDate = (date) => {
  const yyyy = date.getFullYear();
  const mm = pad2(date.getMonth() + 1);
  const dd = pad2(date.getDate());
  return `${yyyy}-${mm}-${dd}`;
};

const buildEstimatedTimeFromSelectedDateTime = (selectedDateTime, now = new Date()) => {
  if (!selectedDateTime) return null;

  const value = String(selectedDateTime).trim();
  if (!value) return null;

  if (value.toUpperCase() === 'ASAP') {
    return { estimatedTime: 'ASAP', date: null, time: null };
  }

  const isoMatch = value.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})(?::\d{2})?$/);
  if (isoMatch) {
    return {
      estimatedTime: `${isoMatch[1]} ${isoMatch[2]}`,
      date: isoMatch[1],
      time: isoMatch[2],
    };
  }

  const todayMatch = value.match(/^Today\s+(\d{2}:\d{2})$/i);
  if (todayMatch) {
    return {
      estimatedTime: value,
      date: formatDate(now),
      time: todayMatch[1],
    };
  }

  const monthMatch = value.match(/^([A-Za-z]{3})\s+(\d{1,2})\s+(\d{2}:\d{2})$/);
  if (monthMatch) {
    const monthIndex = new Date(`${monthMatch[1]} 1, ${now.getFullYear()}`).getMonth();
    if (Number.isNaN(monthIndex)) return null;
    const day = Number(monthMatch[2]);
    if (Number.isNaN(day)) return null;
    return {
      estimatedTime: value,
      date: `${now.getFullYear()}-${pad2(monthIndex + 1)}-${pad2(day)}`,
      time: monthMatch[3],
    };
  }

  return null;
};

// REQ-001: Transform canonical storage to a user-facing display label.
// Format rules (locked):
//   - ASAP        → "ASAP"
//   - today       → "Today HH:MM"
//   - other day   → "DD Mon HH:MM"   (e.g. "04 Apr 23:00", DMY for MY users)
//   - missing/bad → null
const toDisplayEstimatedTimeLabel = (estimatedTimeObj, now = new Date()) => {
  if (!estimatedTimeObj) return null;
  if (estimatedTimeObj.estimatedTime === 'ASAP') return 'ASAP';

  if (estimatedTimeObj.date && estimatedTimeObj.time) {
    const [yyyy, mm, dd] = String(estimatedTimeObj.date).split('-').map(Number);
    if (!yyyy || !mm || !dd) return estimatedTimeObj.estimatedTime || null;
    const date = new Date(yyyy, mm - 1, dd);
    const time = String(estimatedTimeObj.time).slice(0, 5);
    const isToday = date.getFullYear() === now.getFullYear()
      && date.getMonth() === now.getMonth()
      && date.getDate() === now.getDate();

    if (isToday) return `Today ${time}`;
    const day = String(date.getDate()).padStart(2, '0');
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    return `${day} ${month} ${time}`;
  }

  return estimatedTimeObj.estimatedTime || null;
};

// REQ-001: Single entry point for rendering a canonical estimatedTime string
// as a display label. Accepts either the raw canonical string ("YYYY-MM-DD HH:MM"
// or "ASAP") or the full stored object. ALL display sites (menu header, checkout
// card, any preview) must go through this. Never store the return value back to
// state or AsyncStorage — canonical is the source of truth.
const renderEstimatedTime = (canonicalOrObject, now) => {
  if (canonicalOrObject == null || canonicalOrObject === '') return '';
  const nowDate = now || new Date();

  // Object form: { estimatedTime, date, time }
  if (typeof canonicalOrObject === 'object') {
    return toDisplayEstimatedTimeLabel(canonicalOrObject, nowDate) || '';
  }

  // String form
  const s = String(canonicalOrObject);
  if (s === 'ASAP') return 'ASAP';

  const match = s.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})(?::\d{2})?$/);
  if (!match) return ''; // bogus/legacy — render nothing so caller can fall back
  return toDisplayEstimatedTimeLabel(
    { estimatedTime: s, date: match[1], time: match[2] },
    nowDate,
  ) || '';
};

// REQ-001: Storage migration. On app launch we reset any non-conforming
// `estimatedTime` value (e.g. legacy display labels like "Today 14:00" or
// "Aug 5 14:00") to the canonical ASAP shape so the new validator doesn't
// trip on stale storage.
//
// Conforming values are:
//   { estimatedTime: "ASAP", date: null, time: null }
//   { estimatedTime: "YYYY-MM-DD HH:MM", date: "YYYY-MM-DD", time: "HH:MM" }
//
// Anything else is considered legacy and rewritten to ASAP.
const ASAP_SHAPE = { estimatedTime: 'ASAP', date: null, time: null };
const ISO_DATETIME_RE = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const ISO_TIME_RE = /^\d{2}:\d{2}$/;

function isConformingEstimatedTime(parsed) {
  if (!parsed || typeof parsed !== 'object') return false;
  if (parsed.estimatedTime === 'ASAP' && parsed.date == null && parsed.time == null) {
    return true;
  }
  if (
    typeof parsed.estimatedTime === 'string' &&
    ISO_DATETIME_RE.test(parsed.estimatedTime) &&
    typeof parsed.date === 'string' && ISO_DATE_RE.test(parsed.date) &&
    typeof parsed.time === 'string' && ISO_TIME_RE.test(parsed.time) &&
    parsed.estimatedTime === `${parsed.date} ${parsed.time}`
  ) {
    return true;
  }
  return false;
}

// Reads storage, validates shape, and writes back ASAP if non-conforming.
// AsyncStorage is injected so the helper is testable without mocking the
// react-native module. Returns the canonical value that ended up in storage.
async function migrateLegacyEstimatedTime(asyncStorage) {
  if (!asyncStorage || typeof asyncStorage.getItem !== 'function') return ASAP_SHAPE;
  try {
    const raw = await asyncStorage.getItem('estimatedTime');
    if (!raw) {
      await asyncStorage.setItem('estimatedTime', JSON.stringify(ASAP_SHAPE));
      return ASAP_SHAPE;
    }
    let parsed = null;
    try { parsed = JSON.parse(raw); } catch (_e) { parsed = null; }
    if (isConformingEstimatedTime(parsed)) return parsed;
    await asyncStorage.setItem('estimatedTime', JSON.stringify(ASAP_SHAPE));
    return ASAP_SHAPE;
  } catch (_err) {
    return ASAP_SHAPE;
  }
}

module.exports = {
  getEstimatedTimeFromStorage,
  buildEstimatedTimeFromSelectedDateTime,
  toDisplayEstimatedTimeLabel,
  renderEstimatedTime,
  migrateLegacyEstimatedTime,
  isConformingEstimatedTime,
  ASAP_SHAPE,
};
