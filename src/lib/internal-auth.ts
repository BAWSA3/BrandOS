/**
 * Internal service-to-service authentication.
 *
 * Some routes (e.g. /api/x-tweets) fetch paid third-party data and are called
 * both by the public client AND by other first-party API routes server-side.
 * We rate-limit public callers by IP, but first-party server callers all share
 * one origin and would collide in a single IP bucket — and we want them to skip
 * the public cap entirely. They prove they're first-party by sending the
 * INTERNAL_API_SECRET in the `x-internal-token` header.
 *
 * IMPORTANT: only send this token from routes that are THEMSELVES protected
 * (authenticated via assertCanScan, or rate-limited at their own edge).
 * Sending it from an unprotected public route turns that route into an
 * unthrottled proxy and reopens the abuse vector this guard closes.
 */
import { timingSafeEqual } from 'crypto';

const HEADER = 'x-internal-token';

/** Constant-time string compare that won't throw on length mismatch. */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/**
 * True if the request carries a valid internal service token.
 * Returns false (never trusts the header) when INTERNAL_API_SECRET is unset,
 * so a missing env var fails closed rather than granting a bypass.
 */
export function isInternalRequest(request: Request): boolean {
  const secret = process.env.INTERNAL_API_SECRET;
  if (!secret) return false;
  const provided = request.headers.get(HEADER);
  if (!provided) return false;
  return safeEqual(provided, secret);
}

/**
 * Headers to attach to a first-party server-to-server fetch so the callee
 * recognizes it as internal. Empty (no bypass) when the secret is unset.
 */
export function internalHeaders(): Record<string, string> {
  const secret = process.env.INTERNAL_API_SECRET;
  return secret ? { [HEADER]: secret } : {};
}
