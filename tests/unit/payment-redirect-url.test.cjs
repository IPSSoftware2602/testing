const test = require('node:test');
const assert = require('node:assert/strict');

const { extractPaymentRedirectUrl } = require('../../utils/paymentRedirectUrl');

test('extracts redirect url from top-level payload', () => {
  const url = extractPaymentRedirectUrl({
    redirect_url: 'https://pay.example.com/session-a',
  });
  assert.equal(url, 'https://pay.example.com/session-a');
});

test('extracts redirect url from nested data payload', () => {
  const url = extractPaymentRedirectUrl({
    data: {
      redirect_url: 'https://pay.example.com/session-b',
    },
  });
  assert.equal(url, 'https://pay.example.com/session-b');
});

test('returns empty string when redirect url is missing', () => {
  const url = extractPaymentRedirectUrl({ status: 200 });
  assert.equal(url, '');
});
