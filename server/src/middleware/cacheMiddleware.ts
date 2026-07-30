import { Request, Response, NextFunction } from 'express';

interface CacheEntry {
  data: any;
  headers: Record<string, string>;
  expiresAt: number;
}

const cacheStore = new Map<string, CacheEntry>();

export const clearApiCache = () => {
  cacheStore.clear();
};

export const cacheMiddleware = (durationSeconds = 120) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = req.originalUrl || req.url;
    const cached = cacheStore.get(cacheKey);
    const now = Date.now();

    if (cached && cached.expiresAt > now) {
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('Cache-Control', `public, max-age=${durationSeconds}, stale-while-revalidate=60`);
      return res.status(200).json(cached.data);
    }

    // Override res.json to capture response payload
    const originalJson = res.json.bind(res);
    res.json = (body: any): Response => {
      if (res.statusCode >= 200 && res.statusCode < 300 && body && body.success !== false) {
        cacheStore.set(cacheKey, {
          data: body,
          headers: {},
          expiresAt: Date.now() + durationSeconds * 1000
        });
      }
      res.setHeader('X-Cache', 'MISS');
      res.setHeader('Cache-Control', `public, max-age=${durationSeconds}, stale-while-revalidate=60`);
      return originalJson(body);
    };

    next();
  };
};
