// ============================================================================
// email-safety — helpers for public endpoints that put caller-supplied text
// into outgoing email.
//
// sendEmail (src/lib/email.ts) turns plain-text bodies into HTML without
// escaping (templates carry their own markup), so anything a caller sends must
// be escaped and length-capped before it reaches a template. Otherwise a public
// form becomes a relay for links and markup sent from our domain.
// ============================================================================

const EMAIL_RE = /^[^\s@<>"']{1,64}@[^\s@<>"']{1,190}\.[^\s@<>"']{2,}$/;

export function isValidEmail(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 254 && EMAIL_RE.test(value);
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Escape + cap a single caller-supplied string; non-strings become ''. */
export function safeText(value: unknown, max = 200): string {
  if (typeof value !== 'string') return '';
  return escapeHtml(
    value
      .replace(/[\r\n]+/g, ' ')
      .trim()
      .slice(0, max)
  );
}

/**
 * Escape every string in a caller-supplied object (arrays and nested objects
 * included), cap string lengths and array sizes, and clamp nothing else.
 * Depth-limited so a crafted payload can't recurse forever.
 */
export function sanitizeDeep<T>(value: T, maxString = 600, maxItems = 12, depth = 0): T {
  if (depth > 4) return undefined as T;
  if (typeof value === 'string') return safeText(value, maxString) as T;
  if (typeof value === 'number') return (Number.isFinite(value) ? value : 0) as T;
  if (typeof value === 'boolean' || value == null) return value;
  if (Array.isArray(value)) {
    return value
      .slice(0, maxItems)
      .map((v) => sanitizeDeep(v, maxString, maxItems, depth + 1)) as T;
  }
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>).slice(0, 60)) {
      out[k] = sanitizeDeep(v, maxString, maxItems, depth + 1);
    }
    return out as T;
  }
  return undefined as T;
}
