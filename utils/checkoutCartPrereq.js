const hasCheckoutCartPrerequisites = ({ customerId, outletId, orderType }) =>
  Boolean(customerId && outletId && orderType);

module.exports = {
  hasCheckoutCartPrerequisites,
};
