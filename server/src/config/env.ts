/**
 * Centralised environment access + a production sanity check.
 *
 * The old code scattered `process.env.JWT_SECRET || '<hardcoded-string>'`
 * across three files, which meant a mis-configured production deploy silently
 * signed and verified tokens with a public constant. Everything now goes
 * through here, and `assertProductionEnv()` (called once on boot) refuses to
 * start a production server with missing / known-leaked secrets.
 */

// These are the placeholder values that were committed to the repo. If a real
// deployment is still using them, that is a security incident, not a default.
const LEAKED = new Set<string>([
  'holidaycity_super_secret_jwt_access_key_2026',
  'holidaycity_super_secret_jwt_refresh_key_2026',
]);

const DEV_JWT_SECRET = 'dev-only-insecure-jwt-secret-change-me';
const DEV_JWT_REFRESH_SECRET = 'dev-only-insecure-jwt-refresh-secret-change-me';

export const isProduction = process.env.NODE_ENV === 'production';

/** Access-token signing secret. Throws in production if unusable. */
export function jwtSecret(): string {
  const v = (process.env.JWT_SECRET || '').trim();
  if (v && !LEAKED.has(v)) return v;
  if (isProduction) {
    throw new Error(
      'JWT_SECRET is missing or set to a known-leaked value. Set a strong, unique JWT_SECRET in the production environment.'
    );
  }
  return v || DEV_JWT_SECRET;
}

/** Refresh-token signing secret. Throws in production if unusable. */
export function jwtRefreshSecret(): string {
  const v = (process.env.JWT_REFRESH_SECRET || '').trim();
  if (v && !LEAKED.has(v)) return v;
  if (isProduction) {
    throw new Error(
      'JWT_REFRESH_SECRET is missing or set to a known-leaked value. Set a strong, unique JWT_REFRESH_SECRET in the production environment.'
    );
  }
  return v || DEV_JWT_REFRESH_SECRET;
}

/**
 * Called once from index.ts before the server starts listening. Hard-fails on
 * anything that must not reach production; warns on things that merely should
 * be set.
 */
export function assertProductionEnv(): void {
  if (!isProduction) {
    if (!process.env.JWT_SECRET) {
      console.warn('[env] JWT_SECRET not set — using an insecure dev fallback. Fine for local dev only.');
    } else if (LEAKED.has(process.env.JWT_SECRET.trim())) {
      console.warn('[env] JWT_SECRET is a repo placeholder value. Production boot will refuse this — set a real secret before deploying.');
    }
    return;
  }

  const fatal: string[] = [];

  if (!process.env.MONGODB_URI) fatal.push('MONGODB_URI is not set.');
  try { jwtSecret(); } catch (e: any) { fatal.push(e.message); }
  try { jwtRefreshSecret(); } catch (e: any) { fatal.push(e.message); }

  const strongish = (s?: string) => !!s && s.trim().length >= 24;
  if (!strongish(process.env.JWT_SECRET)) fatal.push('JWT_SECRET should be at least 24 characters.');

  if (fatal.length) {
    console.error('\n[env] Refusing to start in production:\n' + fatal.map((f) => '  - ' + f).join('\n') + '\n');
    process.exit(1);
  }

  const warn: string[] = [];
  if (!process.env.CLIENT_URL) warn.push('CLIENT_URL is not set — CORS will fall back to permissive.');
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    warn.push('RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET not set — online payments will be disabled.');
  } else if (process.env.RAZORPAY_KEY_ID.startsWith('rzp_test_')) {
    warn.push('RAZORPAY_KEY_ID is a TEST key — real customers cannot be charged.');
  }
  if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
    warn.push('RAZORPAY_WEBHOOK_SECRET not set — payment reconciliation webhook is disabled.');
  }
  if (!process.env.CLOUDINARY_API_SECRET) warn.push('CLOUDINARY_* not fully set — image uploads may fail.');
  if (warn.length) {
    console.warn('[env] Production warnings:\n' + warn.map((w) => '  - ' + w).join('\n'));
  }
}
