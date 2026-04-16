const shouldShowCheckoutBlockingLoader = ({ isCheckoutProcessing }) =>
  Boolean(isCheckoutProcessing);

module.exports = {
  shouldShowCheckoutBlockingLoader,
};
