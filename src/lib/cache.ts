interface CacheEntry<T> {
  value: T;
  expiresAt: number; // Unix timestamp
}

/**
 * Simple in-memory LRU cache with TTL
 */
export class Cache {
  private items: Map<string, CacheEntry<unknown>> = new Map();
  private maxSize: number;

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
  }

  /**
   * Get a value from the cache
   */
  get<T>(key: string): T | null {
    const entry = this.items.get(key);
    if (!entry) {
      return null;
    }

    if (entry.expiresAt < Date.now()) {
      this.items.delete(key);
      return null;
    }

    // Move to end of map (most recently used)
    this.items.delete(key);
    this.items.set(key, entry);

    return entry.value as T;
  }

  /**
   * Set a value in the cache with a TTL
   */
  set<T>(key: string, value: T, ttlSeconds: number): void {
    // If we're at capacity, remove the least recently used item
    if (this.items.size >= this.maxSize) {
      const oldestKey = this.items.keys().next().value;
      if (oldestKey !== undefined) {
        this.items.delete(oldestKey);
      }
    }

    this.items.set(key, {
      value,
      expiresAt: Date.now() + (ttlSeconds * 1000),
    });
  }

  /**
   * Delete a value from the cache
   */
  delete(key: string): void {
    this.items.delete(key);
  }

  /**
   * Clear all items from the cache
   */
  clear(): void {
    this.items.clear();
  }

  /**
   * Get the current size of the cache
   */
  size(): number {
    return this.items.size;
  }
}
