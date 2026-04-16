const test = require('node:test');
const assert = require('node:assert/strict');

const { shouldRedirectToOutletSelect } = require('../../utils/menuQrGuard');

test('redirects to outlet select for non-QR flow with missing outletDetails', () => {
  const result = shouldRedirectToOutletSelect({
    outletDetailsStr: null,
    fromQR: false,
    outletIdParam: '',
  });

  assert.equal(result, true);
});

test('does not redirect while QR flow is hydrating with outletId param', () => {
  const result = shouldRedirectToOutletSelect({
    outletDetailsStr: null,
    fromQR: true,
    outletIdParam: '12',
  });

  assert.equal(result, false);
});

test('does not redirect when outletDetails already exists', () => {
  const result = shouldRedirectToOutletSelect({
    outletDetailsStr: '{"outletId":"12"}',
    fromQR: false,
    outletIdParam: '',
  });

  assert.equal(result, false);
});

