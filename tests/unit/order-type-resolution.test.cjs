const test = require('node:test');
const assert = require('node:assert/strict');

const { resolveMenuOrderType } = require('../../utils/order_type');

test('prefers active order type over stale route param', () => {
  const result = resolveMenuOrderType({
    routeOrderType: 'delivery',
    activeOrderType: 'pickup',
    storedOrderType: 'delivery',
  });

  assert.equal(result, 'pickup');
});

test('falls back to stored order type when active is invalid', () => {
  const result = resolveMenuOrderType({
    routeOrderType: 'delivery',
    activeOrderType: '',
    storedOrderType: 'pickup',
  });

  assert.equal(result, 'pickup');
});

test('falls back to route param when no active/stored value exists', () => {
  const result = resolveMenuOrderType({
    routeOrderType: 'dinein',
    activeOrderType: '',
    storedOrderType: null,
  });

  assert.equal(result, 'dinein');
});

