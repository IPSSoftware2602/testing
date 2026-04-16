const normalizeUrl = (value) => {
  if (typeof value !== 'string') return '';
  return value.trim();
};

const extractPaymentRedirectUrl = (payload) => {
  const direct = normalizeUrl(payload?.redirect_url);
  if (direct) return direct;

  const nestedData = normalizeUrl(payload?.data?.redirect_url);
  if (nestedData) return nestedData;

  const nestedResult = normalizeUrl(payload?.result?.redirect_url);
  if (nestedResult) return nestedResult;

  const nestedOrder = normalizeUrl(payload?.order?.redirect_url);
  if (nestedOrder) return nestedOrder;

  return '';
};

module.exports = {
  extractPaymentRedirectUrl,
};
