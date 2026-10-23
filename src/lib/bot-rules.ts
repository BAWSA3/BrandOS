/**
 * The bot check's rules, labels, types and handle parsing: pure (no DB, no
 * network), so the /bots page can import it. The check itself lives in
 * src/lib/bot-check.ts (server only).
 */

// ── The rules (one place; tune here) ─────────────────────────────────────────
/**
 * The bot check is parked until it's activated: /bots, its OG image and
 * POST /api/bot-check all 404 unless BOT_CHECK_ENABLED is exactly "true".
 */
export const botCheckEnabled = () => process.env.BOT_CHECK_ENABLED === 'true';

export const BOT_RULES = {
  /** Weight of each signal. */
  weights: {
    noAvatar: 2, // default egg/silhouette profile photo
    lopsided: 2, // follows hundreds, followed by almost no one
    newAccount: 1, // created in the last 60 days
    fewPosts: 1, // fewer than 5 posts ever
    noBio: 1, // empty bio
    numberedHandle: 1, // handle ends in 5+ digits (auto-generated)
    noLikes: 1, // never liked a post
  },
  /** Total weight at which an account reads as suspicious / a likely bot. */
  suspiciousAt: 3,
  botAt: 4,
  newAccountDays: 60,
  fewPosts: 5,
  lopsided: { minFollowing: 200, maxFollowers: 10, ratio: 0.05 },
  numberedHandle: /\d{5,}$/,
  /** Sampling caps (cost control). */
  maxFollowers: 200, // newest followers read
  followerPages: 10, // page cap (pages hold ~20–50)
  engagerPosts: 3, // best recent posts whose audience is read
  engagerDays: 30,
  maxEngagers: 150,
  notableFollowers: 10_000,
  cacheDays: 7,
} as const;

export type BotSignal = keyof typeof BOT_RULES.weights;
export type Verdict = 'real' | 'suspicious' | 'bot';

export const SIGNAL_LABEL: Record<BotSignal, string> = {
  noAvatar: 'no profile photo',
  lopsided: 'follows hundreds, followed by almost no one',
  newAccount: `account under ${BOT_RULES.newAccountDays} days old`,
  fewPosts: `fewer than ${BOT_RULES.fewPosts} posts`,
  noBio: 'no bio',
  numberedHandle: 'handle ends in a long number',
  noLikes: 'never liked a post',
};

export interface GroupResult {
  sampled: number;
  real: number;
  suspicious: number;
  bot: number;
  /** Whole-number % of the sample that reads as real; null when nothing was sampled. */
  pctReal: number | null;
  /** How often each signal fired among suspicious + likely-bot accounts. */
  reasons: Partial<Record<BotSignal, number>>;
}

export interface FlaggedAccount {
  handle: string;
  verdict: Exclude<Verdict, 'real'>;
  signals: BotSignal[];
}

export const HANDLE_RE = /^[A-Za-z0-9_]{1,15}$/;

export function cleanBotHandle(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const h = raw
    .trim()
    .replace(/^@/, '')
    .replace(/^https?:\/\/(www\.)?(x|twitter)\.com\//i, '');
  const first = h.split(/[/?#]/)[0];
  return HANDLE_RE.test(first) ? first : null;
}

export type Viewer = 'public' | 'member' | 'owner';

export interface BotCheckView {
  handle: string;
  name: string;
  followerCount: number;
  followers: Omit<GroupResult, 'reasons'> & { reasons?: GroupResult['reasons'] };
  engagers: (Omit<GroupResult, 'reasons'> & { reasons?: GroupResult['reasons'] }) | null;
  notable: { handle: string; followers: number }[];
  checkedAt: string;
  viewer: Viewer;
  /** Owner only. */
  flagged?: { followers: FlaggedAccount[]; engagers: FlaggedAccount[] };
}
