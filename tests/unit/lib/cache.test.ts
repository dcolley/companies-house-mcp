import { Cache } from '../../../src/lib/cache.js';

describe('Cache', () => {
  let cache: Cache;
  const maxSize = 3;

  beforeEach(() => {
    cache = new Cache(maxSize);
  });

  it('should store and retrieve values', () => {
    cache.set('key1', 'value1', 60);
    expect(cache.get('key1')).toBe('value1');
  });

  it('should return null for non-existent keys', () => {
    expect(cache.get('nonexistent')).toBeNull();
  });

  it('should respect TTL', async () => {
    cache.set('key1', 'value1', 1); // 1 second TTL

    // Value should exist initially
    expect(cache.get('key1')).toBe('value1');

    // Wait for TTL to expire
    await new Promise(resolve => setTimeout(resolve, 1100));

    // Value should be expired
    expect(cache.get('key1')).toBeNull();
  });

  it('should respect max size', () => {
    // Fill cache to max
    cache.set('key1', 'value1', 60);
    cache.set('key2', 'value2', 60);
    cache.set('key3', 'value3', 60);

    // Add one more item
    cache.set('key4', 'value4', 60);

    // First item should be evicted
    expect(cache.get('key1')).toBeNull();
    expect(cache.get('key2')).toBe('value2');
    expect(cache.get('key3')).toBe('value3');
    expect(cache.get('key4')).toBe('value4');
  });

  it('should clear all entries', () => {
    cache.set('key1', 'value1', 60);
    cache.set('key2', 'value2', 60);

    cache.clear();

    expect(cache.size()).toBe(0);
    expect(cache.get('key1')).toBeNull();
    expect(cache.get('key2')).toBeNull();
  });

  it('should report correct size', () => {
    expect(cache.size()).toBe(0);

    cache.set('key1', 'value1', 60);
    expect(cache.size()).toBe(1);

    cache.set('key2', 'value2', 60);
    expect(cache.size()).toBe(2);

    cache.set('key1', 'updated', 60); // Overwrite existing key
    expect(cache.size()).toBe(2);
  });
});
