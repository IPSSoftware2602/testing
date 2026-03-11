const REMOTE_IMAGE_CACHE_POLICY = 'memory-disk';

const getCachePath = (rawUri) => {
  try {
    const parsed = new URL(rawUri);
    return parsed.pathname || rawUri.split('?')[0].split('#')[0];
  } catch (_error) {
    return rawUri.split('?')[0].split('#')[0];
  }
};

const buildCachedExpoImageSource = (uri, fallbackSource) => {
  if (!uri) return fallbackSource;

  const normalizedUri = String(uri);
  const cachePath = getCachePath(normalizedUri);
  return {
    uri: normalizedUri,
    cacheKey: `uspizza:${cachePath}`,
  };
};

module.exports = {
  REMOTE_IMAGE_CACHE_POLICY,
  buildCachedExpoImageSource,
};
