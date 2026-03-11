const extractQrResult = (payload) => {
  if (!payload || typeof payload !== 'object') return null;
  if (payload.result && typeof payload.result === 'object') return payload.result;
  if (payload.data && typeof payload.data === 'object') return payload.data;
  return null;
};

const buildQrStorageData = (qrResult) => {
  if (!qrResult?.outlet?.id) return null;

  return {
    orderType: 'delivery',
    deliveryAddress: {
      name: qrResult.delivery_address?.name || '',
      phone: qrResult.delivery_address?.phone || '',
      address: qrResult.delivery_address?.address || '',
      unit: qrResult.delivery_address?.unit || '',
      note: qrResult.delivery_address?.note || '',
      latitude: qrResult.delivery_address?.latitude || '',
      longitude: qrResult.delivery_address?.longitude || '',
      isQrAddress: true,
      unique_code: qrResult.unique_code || '',
    },
    uniqueQrData: {
      unique_code: qrResult.unique_code || '',
      name: qrResult.name || '',
      logo: qrResult.logo || '',
      address: qrResult.delivery_address?.address || '',
      menu_item_ids: Array.isArray(qrResult.menu_item_ids) ? qrResult.menu_item_ids : [],
    },
    routeParams: {
      orderType: 'delivery',
      outletId: String(qrResult.outlet.id),
      fromQR: '1',
    },
  };
};

module.exports = {
  extractQrResult,
  buildQrStorageData,
};

