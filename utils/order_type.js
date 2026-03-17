const VALID_MENU_ORDER_TYPES = new Set(["dinein", "pickup", "delivery"]);

function normalizeOrderType(value) {
  const normalized = String(value || "").toLowerCase();
  return VALID_MENU_ORDER_TYPES.has(normalized) ? normalized : null;
}

function resolveMenuOrderType({ routeOrderType, activeOrderType, storedOrderType }) {
  const active = normalizeOrderType(activeOrderType);
  if (active) return active;

  const stored = normalizeOrderType(storedOrderType);
  if (stored) return stored;

  const route = normalizeOrderType(routeOrderType);
  if (route) return route;

  return "delivery";
}

module.exports = {
  resolveMenuOrderType,
  VALID_MENU_ORDER_TYPES,
};

