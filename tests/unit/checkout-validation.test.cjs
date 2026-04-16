const test = require('node:test');
const assert = require('node:assert/strict');

const { validateQrCheckoutNote } = require('../../utils/checkoutValidation');

test('validateQrCheckoutNote rejects empty note for QR checkout', () => {
  const result = validateQrCheckoutNote(true, '   ');

  assert.equal(result.isValid, false);
});

test('validateQrCheckoutNote allows non-empty note for QR checkout', () => {
  const result = validateQrCheckoutNote(true, 'Table near window');

  assert.equal(result.isValid, true);
});

test('validateQrCheckoutNote allows empty note for non-QR checkout', () => {
  const result = validateQrCheckoutNote(false, '');

  assert.equal(result.isValid, true);
});

