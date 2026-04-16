const test = require('node:test');
const assert = require('node:assert/strict');

const { getHomeQrCleanupPlan } = require('../../utils/homeQrCleanup');

test('clears qr markers and qr delivery address on home load', () => {
  const plan = getHomeQrCleanupPlan(
    JSON.stringify({
      address: 'QR Address',
      isQrAddress: true,
      unique_code: 'ABC123',
    })
  );

  assert.deepEqual(plan.keysToRemove, [
    'uniqueQrData',
    'pendingQrData',
    'deliveryAddressDetails',
  ]);
});

test('keeps delivery address when it is not qr-linked', () => {
  const plan = getHomeQrCleanupPlan(
    JSON.stringify({
      address: 'Normal Address',
      isQrAddress: false,
    })
  );

  assert.deepEqual(plan.keysToRemove, [
    'uniqueQrData',
    'pendingQrData',
  ]);
});
