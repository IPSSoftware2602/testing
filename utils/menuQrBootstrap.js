const buildQrBootstrapKey = ({ fromQR, orderType, outletId }) => {
  if (!fromQR || !orderType || !outletId) return null;
  return `${String(orderType)}:${String(outletId)}`;
};

const shouldRunQrBootstrap = ({ previousKey, nextKey }) => {
  if (!nextKey) return false;
  return previousKey !== nextKey;
};

module.exports = {
  buildQrBootstrapKey,
  shouldRunQrBootstrap,
};
