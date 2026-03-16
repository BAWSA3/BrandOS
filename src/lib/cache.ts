/**
 * Simple in-memory cache with TTL support
 * Used to reduce X API calls and avoid rate limiting
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private defaultTTL: number;

  constructor(defaultTTLMinutes: number = 30) {
    this.defaultTTL = defaultTTLMinutes * 60 * 1000;
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  set<T>(key: string, data: T, ttlMinutes?: number): void {
    const ttl = ttlMinutes ? ttlMinutes * 60 * 1000 : this.defaultTTL;
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttl,
    });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }
}

// X Profile cache - 24 hour TTL (profiles rarely change, and Basic tier only allows 100 lookups/day)
export const profileCache = new MemoryCache(1440);

// X Tweets cache - 15 minute TTL (tweets are more dynamic)
export const tweetsCache = new MemoryCache(15);

// Negative cache - remember "not found" usernames for 1 hour to avoid wasting lookups
export const notFoundCache = new MemoryCache(60);
