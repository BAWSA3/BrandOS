/**
 * Early-access codes: format and rules. Pure (no DB, no network), so routes,
 * pages, the admin script and tests share one definition. The data side lives
 * in src/lib/early-access.ts (server only).
 *
 * Decided with Bawsa on Oct 27: one personal code per person, single use,
 * labelled with who it was given to. A redeemed code gives (1) the Creator
 * Index before it opens, (2) the Founding price ($29/month for life) even after
 * the 100 seats are gone, (3) an "Early access" tag and a feedback line to
 * Bawsa. Each perk is a flag on the code (all on by default).
 *
 * Format: 8 characters from an alphabet without 0/O/1/I, shown as "AU7K-2QX9".
 * Input is forgiving: any case, spaces and dashes ignored.
 */

/** 32 characters: A–Z and 2–9 without the look-alikes 0, O, 1, I. */
export const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const CODE_LENGTH = 8;

/** The cookie that carries a code through sign-in (set by /i/<code>). */
export const INVITE_COOKIE = 'bos_invite';
export const INVITE_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

/** The one message for every failed redemption, so nothing about codes leaks. */
export const INVALID_CODE_MESSAGE = 'That code isn’t valid or was already used.';

export const FEEDBACK_MAX = 2000;

const CODE_RE = new RegExp(`^[${CODE_ALPHABET}]{${CODE_LENGTH}}$`);

/** Canonical form ("AU7K2QX9") of whatever someone typed or pasted, or null. */
export function normalizeCode(raw: unknown): string | null {
  if (typeof raw !== 'string' || raw.length > 64) return null;
  const code = raw.toUpperCase().replace(/[\s-]+/g, '');
  return CODE_RE.test(code) ? code : null;
}

/** "AU7K2QX9" → "AU7K-2QX9" (how codes are shown and shared). */
export function formatCode(code: string): string {
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}

/**
 * A new random code. 256 is a multiple of 32, so `byte & 31` is uniform;
 * 8 characters is 40 bits, far beyond guessing under the rate limits.
 */
export function generateCode(randomBytes: (n: number) => Uint8Array): string {
  return Array.from(randomBytes(CODE_LENGTH), (b) => CODE_ALPHABET[b & 31]).join('');
}

/** The invite link for a code. */
export function inviteLink(code: string, origin = 'https://mybrandos.app'): string {
  return `${origin}/i/${formatCode(code)}`;
}

/** Trim and cap a feedback message; null when there's nothing to send. */
export function cleanFeedback(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const text = raw
    .replace(/\r\n?/g, '\n')
    // control characters other than line breaks and tabs
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
    .slice(0, FEEDBACK_MAX);
  return text ? text : null;
}
