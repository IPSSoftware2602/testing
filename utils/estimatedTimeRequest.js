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
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    return `${month} ${date.getDate()} ${time}`;
  }

  return estimatedTimeObj.estimatedTime || null;
};

module.exports = {
  getEstimatedTimeFromStorage,
  buildEstimatedTimeFromSelectedDateTime,
  toDisplayEstimatedTimeLabel,
};
