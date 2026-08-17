/* ─────────────────────────────────────────────────────────────
   Centralized Image Formatter
   Matches Flutter ApiConfig.formatImageUrl() exactly
   - Handles Cloudinary URLs (res.cloudinary.com)
   - Handles full HTTP / HTTPS URLs
   - Handles relative backend upload paths (/uploads/...)
   - Extracts image URL from objects ({ url, imageUrl, secure_url, path })
───────────────────────────────────────────────────────────── */

export const formatImageUrl = (url?: any, fallbackUrl?: string): string => {
  const DEFAULT_FALLBACK = 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1200&auto=format&fit=crop';
  const targetFallback = fallbackUrl || DEFAULT_FALLBACK;

  if (!url) return targetFallback;

  let raw = '';
  if (typeof url === 'string') {
    raw = url.trim();
  } else if (typeof url === 'object') {
    raw = (url.url || url.imageUrl || url.secure_url || url.path || url.banner || url.image || '').trim();
  }

  if (!raw) return targetFallback;

  // 1. If it's a Cloudinary URL or any absolute HTTP/HTTPS URL -> return directly
  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    // Fix localhost backend port if needed
    if (raw.includes(':5000')) {
      const origin = window.location.hostname;
      return raw.replace(/http:\/\/[^\/]+:5000/, `http://${origin}:5000`);
    }
    return raw;
  }

  // 2. If it's a relative path starting with /
  const origin = window.location.hostname;
  const backendBase = `http://${origin}:5000`;

  if (raw.startsWith('/')) {
    return `${backendBase}${raw}`;
  }

  return `${backendBase}/${raw}`;
};
