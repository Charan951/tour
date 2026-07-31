import { Request, Response, NextFunction } from 'express';
import { getCache, setCache, clearCachePattern } from '../config/redis.js';

export interface CacheOptions {
  ttlSeconds?: number;          // Redis / Memory TTL in seconds
  browserMaxAge?: number;      // Browser Cache TTL (max-age) in seconds
  cdnMaxAge?: number;          // CDN Edge Cache TTL (s-maxage) in seconds
  staleWhileRevalidate?: number; // Stale-while-revalidate TTL in seconds
  isPrivate?: boolean;         // Disable CDN edge caching
}

/**
 * Express middleware for multi-tier caching (Browser, CDN & Redis)
 * Accepts either a numeric ttlSeconds or a CacheOptions configuration object.
 */
export const cacheMiddleware = (opts: number | CacheOptions = 600) => {
  const options: CacheOptions = typeof opts === 'number' ? { ttlSeconds: opts } : opts;

  const {
    ttlSeconds = 600,
    browserMaxAge = 60,
    cdnMaxAge = 600,
    staleWhileRevalidate = 3600,
    isPrivate = false,
  } = options;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = `api:${req.originalUrl || req.url}`;

    // Configure HTTP Browser & CDN Cache-Control Headers
    if (isPrivate) {
      res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    } else {
      res.setHeader(
        'Cache-Control',
        `public, max-age=${browserMaxAge}, s-maxage=${cdnMaxAge}, stale-while-revalidate=${staleWhileRevalidate}`
      );
    }
    res.setHeader('Vary', 'Accept-Encoding');

    try {
      const cachedData = await getCache(cacheKey);

      if (cachedData) {
        res.setHeader('X-Cache-Status', 'HIT');
        res.setHeader('X-Cache-Key', cacheKey);
        res.type('application/json');
        res.send(cachedData);
        return;
      }

      // Cache Miss: Intercept res.send/res.json to populate cache
      res.setHeader('X-Cache-Status', 'MISS');
      res.setHeader('X-Cache-Key', cacheKey);

      const originalSend = res.send.bind(res);

      res.send = ((body: any): Response => {
        if (res.statusCode === 200 && body) {
          const stringBody = typeof body === 'string' ? body : JSON.stringify(body);
          setCache(cacheKey, stringBody, ttlSeconds).catch((err) => {
            console.warn('⚠️ [Cache] Failed to set cache for key:', cacheKey, err);
          });
        }
        return originalSend(body);
      }) as any;

      next();
    } catch (error) {
      console.error('⚠️ [CacheMiddleware Error]:', error);
      next();
    }
  };
};

/**
 * Clear all API cache keys matching pattern
 */
export const clearApiCache = (pattern: string = 'api:*'): Promise<void> => {
  return clearCachePattern(pattern);
};

/**
 * Express middleware to clear cache on data mutation
 */
export const invalidateCacheMiddleware = (pattern: string = 'api:*') => {
  return async (_req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      await clearApiCache(pattern);
    } catch (err) {
      console.warn('⚠️ [Cache] Invalidation error:', err);
    }
    next();
  };
};
