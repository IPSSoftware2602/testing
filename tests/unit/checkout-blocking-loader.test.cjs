const test = require('node:test');
const assert = require('node:assert/strict');

const { shouldShowCheckoutBlockingLoader } = require('../../utils/checkoutBlockingLoader');

test('shows blocking loader only while checkout submit is processing', () => {
  assert.equal(shouldShowCheckoutBlockingLoader({ isCheckoutProcessing: true }), true);
  assert.equal(shouldShowCheckoutBlockingLoader({ isCheckoutProcessing: false }), false);
});
