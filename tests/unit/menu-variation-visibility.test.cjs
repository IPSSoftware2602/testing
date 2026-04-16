const test = require('node:test');
const assert = require('node:assert/strict');

const { buildVisibleVariationOptions } = require('../../utils/menu_variation_visibility');

test('QR order hides disabled variations', () => {
  const result = buildVisibleVariationOptions({
    crustOptions: [
      { id: 1, isDisabled: false },
      { id: 2, isDisabled: true },
      { id: 3, isDisabled: false },
    ],
    isQrOrder: true,
    selectedVariationId: 2,
  });

  assert.deepEqual(result.visibleOptions.map((option) => option.id), [1, 3]);
  assert.equal(result.selectedCount, 0);
});

test('normal order keeps disabled variations visible', () => {
  const result = buildVisibleVariationOptions({
    crustOptions: [
      { id: 1, isDisabled: false },
      { id: 2, isDisabled: true },
    ],
    isQrOrder: false,
    selectedVariationId: 2,
  });

  assert.deepEqual(result.visibleOptions.map((option) => option.id), [1, 2]);
  assert.equal(result.selectedCount, 1);
});
