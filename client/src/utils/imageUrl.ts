/* ─────────────────────────────────────────────────────────────
   Centralized Image Formatter
   - Handles Cloudinary URLs (res.cloudinary.com) — injects f_auto,q_auto,w_<n>
   - Handles full HTTP / HTTPS URLs
   - Handles relative backend upload paths (/uploads/...)
   - Extracts image URL from objects ({ url, imageUrl, secure_url, path })
   Note: transform injection is web-only; the Flutter app keeps raw URLs.
───────────────────────────────────────────────────────────── */

const DEFAULT_FALLBACK =
  'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1200&auto=format&fit=crop';

const extractRaw = (url?: any): string => {
  if (!url) return '';
  if (typeof url === 'string') return url.trim();
  if (typeof url === 'object') {
    return (url.url || url.imageUrl || url.secure_url || url.path || url.banner || url.image || '').trim();
  }
  return '';
};

const withOrigin = (raw: string): string => {
  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    if (raw.includes('cloudinary.com') || raw.includes('unsplash.com')) {
      return raw;
    }
    if (/http:\/\/[^/]+:\d+/.test(raw)) {
      const origin = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
      return raw.replace(/http:\/\/[^/]+:\d+/, `http://${origin}:5000`);
    }
    return raw;
  }
  const origin = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  const backendBase = `http://${origin}:5000`;
  return raw.startsWith('/') ? `${backendBase}${raw}` : `${backendBase}/${raw}`;
};

/** Inject Cloudinary delivery transforms (auto format + quality, optional width). */
const applyCloudinaryTransform = (url: string, width?: number): string => {
  if (!/res\.cloudinary\.com\/.+\/(image|video)\/upload\//.test(url)) return url;
  // Don't double-transform if the URL already carries an f_/q_/w_ segment.
  const parts = url.split('/upload/');
  if (parts.length !== 2) return url;
  // Skip only if the segment after /upload/ is an actual transform string
  // (`key_value` tokens, comma-separated), not a public_id that merely contains "w_".
  if (/^(v\d+\/)?[a-z]{1,3}_[^/,\s]+(,[a-z]{1,3}_[^/,\s]+)*\//.test(parts[1])) return url;
  const t = ['f_auto', 'q_auto', width ? `w_${width}` : 'w_auto', 'c_limit', 'dpr_auto'].join(',');
  return `${parts[0]}/upload/${t}/${parts[1]}`;
};

export const formatImageUrl = (url?: any, fallbackUrl?: string, width?: number): string => {
  const targetFallback = fallbackUrl || DEFAULT_FALLBACK;
  const raw = extractRaw(url);
  if (!raw) return targetFallback;
  return applyCloudinaryTransform(withOrigin(raw), width);
};

/** Build a responsive `srcset` string; returns '' for non-Cloudinary URLs. */
export const formatSrcSet = (
  url?: any,
  widths: number[] = [480, 768, 1024, 1440, 2000]
): string => {
  const raw = extractRaw(url);
  if (!raw) return '';
  const abs = withOrigin(raw);
  if (!/res\.cloudinary\.com\//.test(abs)) return '';
  return widths.map((w) => `${applyCloudinaryTransform(abs, w)} ${w}w`).join(', ');
};
