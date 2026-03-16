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

module.exports = {
  getEstimatedTimeFromStorage,
};
