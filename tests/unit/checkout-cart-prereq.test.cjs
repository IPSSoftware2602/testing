const test = require('node:test');
const assert = require('node:assert/strict');

const { hasCheckoutCartPrerequisites } = require('../../utils/checkoutCartPrereq');

test('returns false when customer or outlet or orderType is missing', () => {
  assert.equal(
    hasCheckoutCartPrerequisites({ customerId: null, outletId: '1', orderType: 'delivery' }),
    false
  );
  assert.equal(
    hasCheckoutCartPrerequisites({ customerId: 123, outletId: '', orderType: 'delivery' }),
    false
  );
  assert.equal(
    hasCheckoutCartPrerequisites({ customerId: 123, outletId: '1', orderType: '' }),
    false
  );
});

test('returns true when all required fields exist', () => {
  assert.equal(
    hasCheckoutCartPrerequisites({ customerId: 123, outletId: '1', orderType: 'pickup' }),
    true
  );
});
