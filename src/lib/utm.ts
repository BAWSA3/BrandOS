/**
 * First-touch UTM attribution for the launch funnel (docs/LAUNCH-PLAYBOOK.md).
 * Middleware stores the first utm_* a visitor arrives with in a 30-day cookie;
 * the auth callback attaches it to signup_completed. Pure: values are
 * re-validated on read, so a hand-edited cookie can only carry short slugs.
 */

export const UTM_COOKIE = 'bos_utm';
export const UTM_MAX_AGE = 60 * 60 * 24 * 30;
const KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'] as const;
export type Utm = Partial<Record<(typeof KEYS)[number], string>>;

const clean = (v: unknown) =>
  typeof v === 'string' && /^[A-Za-z0-9._~+-]{1,64}$/.test(v) ? v.toLowerCase() : undefined;

/** The UTM params on a URL, or null when there's no utm_source. */
export function utmFromSearch(sp: URLSearchParams): Utm | null {
  const out: Utm = {};
  for (const k of KEYS) {
    const v = clean(sp.get(k));
    if (v) out[k] = v;
  }
  return out.utm_source ? out : null;
}

/** The cookie value (Next URL-encodes cookie values itself). */
export const encodeUtm = (u: Utm) => JSON.stringify(u);

/** The cookie's UTMs (validated), or {} for a missing or bad cookie. */
export function decodeUtm(raw: string | undefined | null): Utm {
  if (!raw) return {};
  try {
    const text = raw.startsWith('%') ? decodeURIComponent(raw) : raw;
    const parsed = JSON.parse(text) as Record<string, unknown>;
    const out: Utm = {};
    for (const k of KEYS) {
      const v = clean(parsed?.[k]);
      if (v) out[k] = v;
    }
    return out;
  } catch {
    return {};
  }
}
