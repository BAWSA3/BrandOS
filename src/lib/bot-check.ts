import prisma from '@/lib/db';
import {
  fetchEngagerAccounts,
  fetchFollowerAccounts,
  fetchProfile,
  fetchUserTweets,
  type XAccount,
} from '@/lib/socialdata';
import {
  BOT_RULES,
  type BotCheckView,
  type BotSignal,
  type FlaggedAccount,
  type GroupResult,
  type Verdict,
  type Viewer,
} from '@/lib/bot-rules';

export * from '@/lib/bot-rules';

/**
 * "How many bots follow you?" (/bots). Reads an account's newest ~200
 * followers and the people who engage with its best recent posts, and sorts
 * each account into real / suspicious / likely bot with simple, explainable
 * signals. These are heuristics on public profile data: the page always says
 * "look like bots", never that an account IS a bot.
 *
 * Who sees what (enforced in shapeBotCheck): everyone gets counts and the
 * % real; signed-in people also get the reason counts; only the owner of the
 * handle (signed in with that X account) gets the list of flagged accounts.
 * Third parties are never named as bots to anyone else.
 *
 * Cached per handle for 7 days in "BotCheck" (migration 043). Before 043 is
 * applied every cache read/write is a no-op, so checks still work (uncached).
 */

export function signalsOf(a: XAccount, now = Date.now()): BotSignal[] {
  const s: BotSignal[] = [];
  const R = BOT_RULES;
  if (a.defaultAvatar) s.push('noAvatar');
  if (
    a.following >= R.lopsided.minFollowing &&
    a.followers <= R.lopsided.maxFollowers &&
    a.followers <= a.following * R.lopsided.ratio
  )
    s.push('lopsided');
  const created = Date.parse(a.createdAt);
  if (Number.isFinite(created) && now - created < R.newAccountDays * 86_400_000)
    s.push('newAccount');
  if (a.posts < R.fewPosts) s.push('fewPosts');
  if (!a.bio.trim()) s.push('noBio');
  if (R.numberedHandle.test(a.handle)) s.push('numberedHandle');
  if (a.likes === 0) s.push('noLikes');
  return s;
}

export function classify(
  a: XAccount,
  now = Date.now()
): { verdict: Verdict; signals: BotSignal[] } {
  const signals = signalsOf(a, now);
  const w = signals.reduce((sum, k) => sum + BOT_RULES.weights[k], 0);
  const verdict: Verdict =
    w >= BOT_RULES.botAt ? 'bot' : w >= BOT_RULES.suspiciousAt ? 'suspicious' : 'real';
  return { verdict, signals };
}

// ── Results ──────────────────────────────────────────────────────────────────
/** What is stored. `flagged` never leaves the server except to the owner. */
export interface BotCheckRecord {
  handle: string; // display casing
  xUserId: string;
  name: string;
  followerCount: number;
  followers: GroupResult;
  engagers: GroupResult | null;
  notable: { handle: string; followers: number }[];
  checkedAt: string;
  flagged: { followers: FlaggedAccount[]; engagers: FlaggedAccount[] };
}

export function summarize(accounts: XAccount[], now = Date.now()) {
  const g: GroupResult = { sampled: 0, real: 0, suspicious: 0, bot: 0, pctReal: null, reasons: {} };
  const flagged: FlaggedAccount[] = [];
  for (const a of accounts) {
    const { verdict, signals } = classify(a, now);
    g.sampled++;
    g[verdict]++;
    if (verdict !== 'real') {
      flagged.push({ handle: a.handle, verdict, signals });
      for (const s of signals) g.reasons[s] = (g.reasons[s] ?? 0) + 1;
    }
  }
  g.pctReal = g.sampled ? Math.round((g.real / g.sampled) * 100) : null;
  return { group: g, flagged };
}

export class BotCheckError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}

/** Run a fresh check against SocialData (~20–25 requests). */
export async function runBotCheck(
  handle: string
): Promise<{ record: BotCheckRecord; requests: number }> {
  const R = BOT_RULES;
  const { profile, status } = await fetchProfile(handle);
  if (!profile)
    throw new BotCheckError(
      status === 404 ? `@${handle} isn't on X.` : 'X is slow right now. Try again.',
      status === 404 ? 404 : 502
    );
  if (profile.protected)
    throw new BotCheckError('That account is private, so its followers can’t be checked.', 403);
  let requests = 1;

  const now = Date.now();
  const [followersRes, tweetsRes] = await Promise.all([
    fetchFollowerAccounts(profile.id, R.maxFollowers, R.followerPages),
    fetchUserTweets(profile.id, 20),
  ]);
  requests += followersRes.requests + 1;

  const recent = tweetsRes.tweets
    .filter((t) => now - Date.parse(t.created_at) < R.engagerDays * 86_400_000)
    .map((t) => ({
      id: t.id,
      weight:
        t.public_metrics.reply_count +
        t.public_metrics.retweet_count +
        t.public_metrics.quote_count,
    }))
    .filter((t) => t.weight > 0)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, R.engagerPosts);
  const engagerLists = await Promise.all(
    recent.map((t) => fetchEngagerAccounts(t.id, profile.username))
  );
  requests += recent.length * 3;
  const seen = new Set<string>();
  const engagers: XAccount[] = [];
  for (const a of engagerLists.flat()) {
    if (seen.has(a.id) || engagers.length >= R.maxEngagers) continue;
    seen.add(a.id);
    engagers.push(a);
  }

  const f = summarize(followersRes.accounts, now);
  const e = summarize(engagers, now);
  const realEngagers = engagers.filter((a) => classify(a, now).verdict === 'real');
  const notable = realEngagers
    .filter((a) => a.followers >= R.notableFollowers)
    .sort((a, b) => b.followers - a.followers)
    .slice(0, 5)
    .map((a) => ({ handle: a.handle, followers: a.followers }));

  return {
    requests,
    record: {
      handle: profile.username,
      xUserId: profile.id,
      name: profile.name,
      followerCount: profile.public_metrics.followers_count,
      followers: f.group,
      engagers: engagers.length ? e.group : null,
      notable,
      checkedAt: new Date(now).toISOString(),
      flagged: { followers: f.flagged, engagers: e.flagged },
    },
  };
}

// ── Cache + daily budget (migration 043; no-ops before it's applied) ─────────
export async function cachedBotCheck(handle: string): Promise<BotCheckRecord | null> {
  try {
    const row = await prisma.botCheck.findUnique({ where: { handle: handle.toLowerCase() } });
    if (!row) return null;
    if (Date.now() - row.checkedAt.getTime() > BOT_RULES.cacheDays * 86_400_000) return null;
    return row.record as unknown as BotCheckRecord;
  } catch {
    return null;
  }
}

export async function saveBotCheck(r: BotCheckRecord): Promise<void> {
  try {
    const data = {
      xUserId: r.xUserId,
      record: r as unknown as object,
      checkedAt: new Date(r.checkedAt),
    };
    await prisma.botCheck.upsert({
      where: { handle: r.handle.toLowerCase() },
      create: { handle: r.handle.toLowerCase(), ...data },
      update: data,
    });
  } catch {
    // table not there yet: the check still works, just uncached
  }
}

let memDay = '';
let memCount = 0;

/**
 * Count one fresh (uncached) check against today's global budget. Returns
 * false when the budget is spent. Uses the stored checks when 043 is there,
 * else a per-instance counter.
 */
export async function takeBudget(limit: number): Promise<boolean> {
  const day = new Date().toISOString().slice(0, 10);
  if (day !== memDay) {
    memDay = day;
    memCount = 0;
  }
  let used = memCount;
  try {
    used = Math.max(
      used,
      await prisma.botCheck.count({ where: { checkedAt: { gte: new Date(`${day}T00:00:00Z`) } } })
    );
  } catch {
    // no table: fall back to the in-memory count
  }
  if (used >= limit) return false;
  memCount++;
  return true;
}

export function dailyLimit(): number {
  const n = Number(process.env.BOT_CHECK_DAILY_LIMIT);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 1500;
}

// ── What each viewer gets ────────────────────────────────────────────────────
function counts(g: GroupResult, withReasons: boolean) {
  const { reasons, ...rest } = g;
  return withReasons ? { ...rest, reasons } : rest;
}

export function shapeBotCheck(r: BotCheckRecord, viewer: Viewer): BotCheckView {
  const reasons = viewer !== 'public';
  return {
    handle: r.handle,
    name: r.name,
    followerCount: r.followerCount,
    followers: counts(r.followers, reasons),
    engagers: r.engagers ? counts(r.engagers, reasons) : null,
    notable: r.notable,
    checkedAt: r.checkedAt,
    viewer,
    ...(viewer === 'owner' ? { flagged: r.flagged } : {}),
  };
}

/** 'owner' when the signed-in user's connected X account is this handle's (by X user id). */
export function viewerFor(
  user: { xUserIds: string[] } | null,
  record: Pick<BotCheckRecord, 'xUserId'>
): Viewer {
  if (!user) return 'public';
  return record.xUserId && user.xUserIds.includes(record.xUserId) ? 'owner' : 'member';
}
