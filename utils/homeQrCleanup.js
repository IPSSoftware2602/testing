const getHomeQrCleanupPlan = (deliveryAddressRaw) => {
  const keysToRemove = ['uniqueQrData', 'pendingQrData'];

  if (!deliveryAddressRaw) {
    return { keysToRemove };
  }

  try {
    const parsedAddress = JSON.parse(deliveryAddressRaw);
    if (parsedAddress?.isQrAddress) {
      keysToRemove.push('deliveryAddressDetails');
    }
  } catch (error) {
    // Ignore invalid legacy payloads and keep base cleanup keys only.
  }

  return { keysToRemove };
};

module.exports = {
  getHomeQrCleanupPlan,
};
