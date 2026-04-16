const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildCachedExpoImageSource,
  REMOTE_IMAGE_CACHE_POLICY,
} = require('../../utils/remoteImage');

test('buildCachedExpoImageSource returns fallback when uri is missing', () => {
  const fallback = { test: 'fallback' };
  const source = buildCachedExpoImageSource('', fallback);

  assert.equal(source, fallback);
});

test('buildCachedExpoImageSource returns source with stable cacheKey for remote uri', () => {
  const uri = 'https://uspizza-uploads.s3.ap-southeast-5.amazonaws.com/menu_images/pizza.jpg';
  const source = buildCachedExpoImageSource(uri, null);

  assert.deepEqual(source, {
    uri,
    cacheKey: 'uspizza:/menu_images/pizza.jpg',
  });
  assert.equal(REMOTE_IMAGE_CACHE_POLICY, 'memory-disk');
});

test('buildCachedExpoImageSource ignores query params in cacheKey', () => {
  const uri = 'https://uspizza-uploads.s3.ap-southeast-5.amazonaws.com/menu_images/pizza.jpg?token=abc123&expires=123';
  const source = buildCachedExpoImageSource(uri, null);

  assert.deepEqual(source, {
    uri,
    cacheKey: 'uspizza:/menu_images/pizza.jpg',
  });
});

test('buildCachedExpoImageSource keeps same cacheKey for same path with different query params', () => {
  const first = buildCachedExpoImageSource('https://uspizza-uploads.s3.ap-southeast-5.amazonaws.com/menu_images/pizza.jpg?token=one', null);
  const second = buildCachedExpoImageSource('https://uspizza-uploads.s3.ap-southeast-5.amazonaws.com/menu_images/pizza.jpg?token=two', null);

  assert.equal(first.cacheKey, second.cacheKey);
  assert.equal(first.cacheKey, 'uspizza:/menu_images/pizza.jpg');
});
