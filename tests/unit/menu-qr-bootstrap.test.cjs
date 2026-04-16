const test = require('node:test');
const assert = require('node:assert/strict');

const { shouldRunQrBootstrap, buildQrBootstrapKey } = require('../../utils/menuQrBootstrap');

test('should run QR bootstrap for first valid QR context', () => {
  const key = buildQrBootstrapKey({ fromQR: true, orderType: 'delivery', outletId: '12' });
  const result = shouldRunQrBootstrap({ previousKey: null, nextKey: key });
  assert.equal(result, true);
});

test('should not rerun QR bootstrap for same QR context key', () => {
  const key = buildQrBootstrapKey({ fromQR: true, orderType: 'delivery', outletId: '12' });
  const result = shouldRunQrBootstrap({ previousKey: key, nextKey: key });
  assert.equal(result, false);
});

test('buildQrBootstrapKey returns null for non-QR or missing params', () => {
  assert.equal(buildQrBootstrapKey({ fromQR: false, orderType: 'delivery', outletId: '12' }), null);
  assert.equal(buildQrBootstrapKey({ fromQR: true, orderType: '', outletId: '12' }), null);
  assert.equal(buildQrBootstrapKey({ fromQR: true, orderType: 'delivery', outletId: '' }), null);
});
