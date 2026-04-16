const test = require('node:test');
const assert = require('node:assert/strict');

const { extractQrResult, buildQrStorageData } = require('../../utils/qrFlow');

test('extractQrResult reads payload from response.result', () => {
  const payload = {
    result: {
      unique_code: '1C6727E5',
      outlet: { id: 12 },
    },
  };

  const result = extractQrResult(payload);
  assert.equal(result.unique_code, '1C6727E5');
  assert.equal(result.outlet.id, 12);
});

test('extractQrResult reads payload from response.data', () => {
  const payload = {
    data: {
      unique_code: '1C6727E5',
      outlet: { id: 12 },
    },
  };

  const result = extractQrResult(payload);
  assert.equal(result.unique_code, '1C6727E5');
  assert.equal(result.outlet.id, 12);
});

test('buildQrStorageData creates QR menu navigation params', () => {
  const result = buildQrStorageData({
    unique_code: '1C6727E5',
    name: 'QR Name',
    logo: 'logo.png',
    menu_item_ids: [1, 2],
    outlet: { id: 12 },
    delivery_address: { address: 'Address A' },
  });

  assert.equal(result.orderType, 'delivery');
  assert.equal(result.uniqueQrData.unique_code, '1C6727E5');
  assert.equal(result.routeParams.outletId, '12');
  assert.equal(result.routeParams.fromQR, '1');
});
