const test = require('node:test');
const assert = require('node:assert/strict');

const { getCheckoutScrollInteractionProps } = require('../../utils/checkoutIosInteraction');

test('uses iOS-friendly scroll interaction props', () => {
  const props = getCheckoutScrollInteractionProps('ios');

  assert.deepEqual(props, {
    keyboardShouldPersistTaps: 'handled',
    keyboardDismissMode: 'interactive',
  });
});

test('uses default scroll interaction props on non-iOS platforms', () => {
  const props = getCheckoutScrollInteractionProps('android');

  assert.deepEqual(props, {
    keyboardShouldPersistTaps: 'handled',
    keyboardDismissMode: 'on-drag',
  });
});
