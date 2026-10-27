import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Server-only. The BrandOS for Chrome token: a signed, scoped bearer token the
 * extension uses to score drafts. It is NOT the member's Supabase session
 * (that used to be handed to the extension, which could read everything): it
 * carries only the member id, a scope and an expiry, so a leaked token can do
 * one thing (score drafts as that member) for at most 30 days.
 *
 * Format: "bx1.<payload base64url>.<HMAC-SHA256 base64url>".
 * Secret: EXTENSION_TOKEN_SECRET, else derived from SUPABASE_SECRET_KEY with a
 * domain-separation label. Rotating the secret signs every member out.
 */

const PREFIX = 'bx1';
const SCOPE = 'draft-score';
export const EXTENSION_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function secret(): Buffer | null {
  const own = process.env.EXTENSION_TOKEN_SECRET?.trim();
  if (own && own.length >= 32) return Buffer.from(own);
  const base = process.env.SUPABASE_SECRET_KEY?.trim();
  if (!base) return null;
  return createHmac('sha256', base).update('brandos-extension-token-v1').digest();
}

const b64 = (b: Buffer) => b.toString('base64url');
const sign = (key: Buffer, data: string) => createHmac('sha256', key).update(data).digest();

export function extensionTokensConfigured(): boolean {
  return secret() !== null;
}

export function mintExtensionToken(userId: string, now = Date.now()) {
  const key = secret();
  if (!key) throw new Error('Extension tokens are not configured');
  const exp = now + EXTENSION_TOKEN_TTL_MS;
  const payload = b64(Buffer.from(JSON.stringify({ u: userId, s: SCOPE, e: exp })));
  return {
    token: `${PREFIX}.${payload}.${b64(sign(key, `${PREFIX}.${payload}`))}`,
    expiresAt: exp,
  };
}

/** The member id in a valid, unexpired token, else null. */
export function verifyExtensionToken(token: unknown, now = Date.now()): string | null {
  if (typeof token !== 'string' || token.length > 600) return null;
  const key = secret();
  if (!key) return null;
  const parts = token.split('.');
  if (parts.length !== 3 || parts[0] !== PREFIX) return null;
  const expected = sign(key, `${parts[0]}.${parts[1]}`);
  let given: Buffer;
  try {
    given = Buffer.from(parts[2], 'base64url');
  } catch {
    return null;
  }
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  try {
    const p = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')) as {
      u?: unknown;
      s?: unknown;
      e?: unknown;
    };
    if (p.s !== SCOPE || typeof p.u !== 'string' || typeof p.e !== 'number') return null;
    if (p.e <= now || p.u.length > 64) return null;
    return p.u;
  } catch {
    return null;
  }
}

/** The Authorization: Bearer token, if any. */
export function bearer(request: Request): string | null {
  const h = request.headers.get('authorization');
  return h?.startsWith('Bearer ') ? h.slice(7).trim() : null;
}

/**
 * CORS for the extension's API calls: only the published extension's origin
 * (BRANDOS_CHROME_EXTENSION_ID); any chrome-extension:// origin while that
 * isn't set (unpacked builds in development). Never a website origin.
 */
export function extensionCors(origin: string | null): Record<string, string> {
  const id = process.env.BRANDOS_CHROME_EXTENSION_ID?.trim();
  const ok =
    !!origin &&
    origin.startsWith('chrome-extension://') &&
    (!id || origin === `chrome-extension://${id}`);
  return {
    ...(ok ? { 'Access-Control-Allow-Origin': origin! } : {}),
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}
