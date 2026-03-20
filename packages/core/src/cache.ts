/**
 * Simple TTL (Time-To-Live) cache with automatic cleanup of expired entries.
 * Used by the zmanim engine to cache daily calculations.
 */
export class TTLCache<T> {
  private cache: Map<string, { value: T; expires: number }>;
  private defaultTTL: number;

  constructor(defaultTTL: number = 60000) {
    this.cache = new Map();
    this.defaultTTL = defaultTTL;
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: T, ttl?: number): void {
    const expires = Date.now() + (ttl ?? this.defaultTTL);
    this.cache.set(key, { value, expires });
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    this.cleanup();
    return this.cache.size;
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expires) {
        this.cache.delete(key);
      }
    }
  }
}
