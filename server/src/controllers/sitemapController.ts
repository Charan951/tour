import { Request, Response } from 'express';
import { SitemapStream, streamToPromise } from 'sitemap';
import { Destination } from '../models/Destination.js';
import { Package } from '../models/Package.js';

let sitemapCache: Buffer | null = null;
let lastCacheTime = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 Hour Cache

export const generateSitemap = async (req: Request, res: Response) => {
  try {
    const now = Date.now();
    if (sitemapCache && now - lastCacheTime < CACHE_DURATION) {
      res.header('Content-Type', 'application/xml');
      return res.send(sitemapCache);
    }

    const hostname = process.env.CLIENT_URL || 'https://holidaycity.com';
    const smStream = new SitemapStream({ hostname });

    // Core static routes
    smStream.write({ url: '/', changefreq: 'daily', priority: 1.0 });
    smStream.write({ url: '/destinations', changefreq: 'daily', priority: 0.9 });
    smStream.write({ url: '/destinations?category=Domestic', changefreq: 'daily', priority: 0.9 });
    smStream.write({ url: '/destinations?category=International', changefreq: 'daily', priority: 0.9 });
    smStream.write({ url: '/packages', changefreq: 'daily', priority: 0.9 });
    smStream.write({ url: '/themes', changefreq: 'weekly', priority: 0.8 });
    smStream.write({ url: '/blogs', changefreq: 'weekly', priority: 0.7 });
    smStream.write({ url: '/contact', changefreq: 'monthly', priority: 0.6 });

    // Dynamic Destinations
    const destinations = await Destination.find({ status: 'Active', isDeleted: false }).select('slug updatedAt').lean();
    for (const dest of destinations) {
      smStream.write({
        url: `/destination/${dest.slug}`,
        lastmod: dest.updatedAt ? new Date(dest.updatedAt).toISOString() : new Date().toISOString(),
        changefreq: 'weekly',
        priority: 0.8
      });
    }

    // Dynamic Packages
    const packages = await Package.find({ status: 'Active', isDeleted: false }).select('slug updatedAt').lean();
    for (const pkg of packages) {
      smStream.write({
        url: `/package/${pkg.slug}`,
        lastmod: pkg.updatedAt ? new Date(pkg.updatedAt).toISOString() : new Date().toISOString(),
        changefreq: 'weekly',
        priority: 0.8
      });
    }

    smStream.end();

    const sitemapBuffer = await streamToPromise(smStream);
    sitemapCache = sitemapBuffer;
    lastCacheTime = now;

    res.header('Content-Type', 'application/xml');
    return res.send(sitemapBuffer);
  } catch (err) {
    console.error('Failed to generate sitemap XML', err);
    return res.status(500).json({ success: false, message: 'Failed to generate sitemap' });
  }
};

export const getSitemapXML = generateSitemap;

