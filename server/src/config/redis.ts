import { Redis } from 'ioredis';

// In-Memory Cache Fallback Structure
interface MemoryCacheEntry {
  value: string;
  expiresAt: number;
}

class MemoryCache {
  private cache = new Map<string, MemoryCacheEntry>();
  private maxItems = 1000;

  get(key: string): string | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  set(key: string, value: string, ttlSeconds: number): void {
    // Basic LRU eviction if maxItems exceeded
    if (this.cache.size >= this.maxItems) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  deletePattern(pattern: string): void {
    const regexPattern = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    for (const key of this.cache.keys()) {
      if (regexPattern.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

const memoryCache = new MemoryCache();
let redisClient: Redis | null = null;
let isRedisConnected = false;

const redisUrl = process.env.REDIS_URL || process.env.REDIS_HOST;

if (redisUrl) {
  try {
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 2,
      retryStrategy(times) {
        if (times > 3) {
          console.warn('⚠️ [Redis] Max retries reached. Switching to In-Memory Cache Fallback.');
          return null; // Stop retrying
        }
        return Math.min(times * 100, 2000);
      },
      lazyConnect: true,
    });

    redisClient.on('connect', () => {
      isRedisConnected = true;
      console.log('⚡ [Redis] Successfully connected to Redis Memory Cache.');
    });

    redisClient.on('error', (err) => {
      isRedisConnected = false;
      console.warn('⚠️ [Redis] Connection Error:', err.message, '| Using In-Memory Cache Fallback.');
    });

    redisClient.connect().catch(() => {
      isRedisConnected = false;
    });
  } catch (err) {
    console.warn('⚠️ [Redis] Initialization failed, using In-Memory Cache Fallback.');
  }
} else {
  console.log('💡 [Cache] No REDIS_URL found. Using high-performance In-Memory LRU Cache ($0 Cost).');
}

/**
 * Retrieve cached value by key from Redis or In-Memory fallback
 */
export const getCache = async (key: string): Promise<string | null> => {
  if (isRedisConnected && redisClient) {
    try {
      return await redisClient.get(key);
    } catch {
      return memoryCache.get(key);
    }
  }
  return memoryCache.get(key);
};

/**
 * Set cached key with TTL (in seconds)
 */
export const setCache = async (key: string, value: string, ttlSeconds: number): Promise<void> => {
  if (isRedisConnected && redisClient) {
    try {
      await redisClient.setex(key, ttlSeconds, value);
      return;
    } catch {
      // Fallback
    }
  }
  memoryCache.set(key, value, ttlSeconds);
};

/**
 * Invalidate cache keys matching pattern (e.g., 'packages:*', 'cms:*')
 */
export const clearCachePattern = async (pattern: string): Promise<void> => {
  memoryCache.deletePattern(pattern);

  if (isRedisConnected && redisClient) {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(...keys);
      }
    } catch (err) {
      console.warn('⚠️ [Redis] Error clearing cache pattern:', pattern);
    }
  }
};

/**
 * Get cache engine status
 */
export const getCacheStatus = () => {
  return {
    engine: isRedisConnected ? 'Redis Cloud/Server' : 'Node.js In-Memory LRU',
    isRedisConnected,
    memoryItemsCount: memoryCache.size(),
  };
};
