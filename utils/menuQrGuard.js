const shouldRedirectToOutletSelect = ({ outletDetailsStr, fromQR, outletIdParam }) => {
  if (outletDetailsStr) return false;
  if (fromQR && outletIdParam) return false;
  return true;
};

module.exports = {
  shouldRedirectToOutletSelect,
};

