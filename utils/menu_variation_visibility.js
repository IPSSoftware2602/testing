const buildVisibleVariationOptions = ({
  crustOptions = [],
  isQrOrder = false,
  selectedVariationId = null,
}) => {
  const options = Array.isArray(crustOptions) ? crustOptions : [];
  const visibleOptions = isQrOrder
    ? options.filter((option) => option?.isDisabled !== true)
    : options;

  const hasVisibleSelected = visibleOptions.some(
    (option) => String(option?.id) === String(selectedVariationId)
  );

  return {
    visibleOptions,
    selectedCount: hasVisibleSelected ? 1 : 0,
  };
};

module.exports = {
  buildVisibleVariationOptions,
};
