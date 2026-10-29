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

/** Shown when a new account tries to sign in without a code (INVITE_ONLY on). */
export const INVITE_ONLY_MESSAGE =
  'BrandOS is invite-only for now. Members get in with a personal code.';
export const INVITE_ONLY_HOW = 'Apply for a code, or ask a member for one of theirs.';

/**
 * The invite-only trial (decided with Bawsa on Oct 28, on from the Nov 2
 * launch). The scan, the read and /@handle pages stay public; the product
 * needs a code. A redeemed code is CODE_TRIAL_DAYS of full access from the
 * moment it's redeemed, no card. Founding stays buyable the whole time. Every
 * member can hand out MEMBER_INVITES codes of their own.
 *
 * NEXT_PUBLIC_CODE_TRIAL=true turns it on (public, so the scan's call to
 * action and the server agree). Off: the old launch offer (everyone free until
 * OPEN_ACCESS_UNTIL) stands.
 */
export const CODE_TRIAL_DAYS = 30;
export const MEMBER_INVITES = 3;

export function codeTrialFrom(value: string | undefined): boolean {
  return (value ?? '').trim().toLowerCase() === 'true';
}
export const CODE_TRIAL = codeTrialFrom(process.env.NEXT_PUBLIC_CODE_TRIAL);

/** When a code's free access ends: CODE_TRIAL_DAYS after it was redeemed. */
export function freeUntilFrom(redeemedAt: Date): Date {
  return new Date(redeemedAt.getTime() + CODE_TRIAL_DAYS * 24 * 60 * 60 * 1000);
}

/**
 * Where "continue / save it to your dashboard" goes from a public page. In the
 * invite-only trial that's the get-a-code step (/access), which also has the
 * sign-in for people who already have an account.
 */
export function joinHref(next: string, codeTrial: boolean = CODE_TRIAL): string {
  return `${codeTrial ? '/access' : '/signup'}?next=${encodeURIComponent(next)}`;
}

/** The apply form's fields, cleaned. Null when the handle or email is unusable. */
export const APPLY_NOTE_MAX = 280;
const APPLY_HANDLE_RE = /^[A-Za-z0-9_]{1,15}$/;
const APPLY_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export function cleanApplication(raw: {
  handle?: unknown;
  email?: unknown;
  note?: unknown;
}): { handle: string; email: string; note: string | null } | null {
  const handle =
    typeof raw.handle === 'string'
      ? raw.handle
          .trim()
          .replace(/^https?:\/\/(www\.)?(x|twitter)\.com\//i, '')
          .replace(/^@/, '')
          .split(/[/?#]/)[0]
      : '';
  const email = typeof raw.email === 'string' ? raw.email.trim().toLowerCase() : '';
  if (!APPLY_HANDLE_RE.test(handle)) return null;
  if (!email || email.length > 254 || !APPLY_EMAIL_RE.test(email)) return null;
  const note = cleanFeedback(raw.note)?.slice(0, APPLY_NOTE_MAX) ?? null;
  return { handle: handle.toLowerCase(), email, note };
}

/** How many more codes a member may make (never below zero). */
export function invitesLeft(made: number, cap: number = MEMBER_INVITES): number {
  return Math.max(0, cap - made);
}

/**
 * Closed beta (decided with Bawsa on Oct 27): with INVITE_ONLY on, a NEW
 * account needs a redeemable code to be created; anyone who already has an
 * account signs in as before. Pure, so the auth callback and tests share it.
 *  - `allow`: sign in as usual (flag off, or an existing account)
 *  - `admit`: create the account and redeem the code in one transaction
 *  - `required`: no code (or the codes table isn't there yet: fail closed)
 *  - `invalid`: a code was carried in, but it's bad, used or revoked
 */
export type GateDecision = 'allow' | 'admit' | 'required' | 'invalid';
export type CodeState = 'none' | 'redeemable' | 'bad' | 'unavailable';

export function signInGate(opts: {
  inviteOnly: boolean;
  existingAccount: boolean;
  code: CodeState;
}): GateDecision {
  if (!opts.inviteOnly || opts.existingAccount) return 'allow';
  if (opts.code === 'redeemable') return 'admit';
  if (opts.code === 'bad') return 'invalid';
  return 'required';
}

/** The env flag, read the same way everywhere ("true" turns the gate on). */
export function inviteOnlyFrom(value: string | undefined): boolean {
  return (value ?? '').trim().toLowerCase() === 'true';
}

/** Where the /signup code box sends a typed code (validated there, kept in the cookie). */
export function typedCodePath(raw: unknown): string | null {
  const code = normalizeCode(raw);
  return code ? `/i/${formatCode(code)}` : null;
}

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
