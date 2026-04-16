const getCheckoutScrollInteractionProps = (platformOs) => {
  const isIos = platformOs === 'ios';

  return {
    keyboardShouldPersistTaps: 'handled',
    keyboardDismissMode: isIos ? 'interactive' : 'on-drag',
  };
};

module.exports = {
  getCheckoutScrollInteractionProps,
};
