// ============================================================================
// safe-input — validators for caller-supplied values that end up in a URL.
// Dependency-free so the signup page (client) and route handlers share them.
// ============================================================================

const BASE = 'https://brandos.internal';

/**
 * A same-origin path to send someone to after sign-in, or `fallback`.
 *
 * `startsWith('/') && !startsWith('//')` is not enough: browsers and the URL
 * parser treat `\` like `/`, so `/\evil.example` resolves to
 * https://evil.example. Resolve against a fixed origin and keep the result
 * only if it stayed on that origin.
 */
export function safeNextPath(raw: string | null | undefined, fallback = '/dashboard'): string {
  if (!raw || raw.length > 512 || !raw.startsWith('/')) return fallback;
  // control characters (tab/newline are stripped by the URL parser)
  if (/[\u0000-\u001f\u007f\\]/.test(raw)) return fallback;
  try {
    const url = new URL(raw, BASE);
    if (url.origin !== BASE) return fallback;
    const path = `${url.pathname}${url.search}${url.hash}`;
    return path.startsWith('//') ? fallback : path;
  } catch {
    return fallback;
  }
}

/** X handles: 1-15 letters, digits or underscores. */
export const X_HANDLE_RE = /^[A-Za-z0-9_]{1,15}$/;

/**
 * Normalise what a person typed ("@Name", " name ", "x.com/name") to a bare
 * handle, or null if it isn't one. Never put an unvalidated handle in an
 * upstream API URL: `../search?query=…` would reach other endpoints on our key.
 */
export function normalizeXHandle(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  let h = raw.trim();
  const fromUrl = h.match(/^(?:https?:\/\/)?(?:www\.)?(?:x|twitter)\.com\/([^/?#]+)/i);
  if (fromUrl) h = fromUrl[1];
  h = h.replace(/^@/, '');
  return X_HANDLE_RE.test(h) ? h : null;
}
