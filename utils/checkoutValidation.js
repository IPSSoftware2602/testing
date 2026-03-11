const validateQrCheckoutNote = (isQrOrder, orderNote) => {
  if (!isQrOrder) {
    return { isValid: true };
  }

  const hasNote = typeof orderNote === 'string' && orderNote.trim().length > 0;

  if (!hasNote) {
    return {
      isValid: false,
      message: 'Remark is required for QR checkout.',
    };
  }

  return { isValid: true };
};

module.exports = {
  validateQrCheckoutNote,
};

