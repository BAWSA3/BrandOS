/**
 * People to know (migration 053): the rules, pure so `npm run test:people`
 * covers them. The server side (X lookups, the model, the table) lives in
 * people-to-know.ts.
 *
 * Decided with Bawsa 2026-10-29:
 * - trigger: few KNOWN accounts engage with their posts, OR Scale is weakest
 * - known account: big relative to the member, or a strong BrandOS read
 * - 3 people a week: 2 peers (about their size) + 1 one step bigger
 * - only accounts that accept DMs; never someone already engaging with them
 */

import { mentionsHashtags, stripHashtagSentences } from './no-hashtag-advice';

/** A known account is at least this big, and at least KNOWN_MULTIPLE × the member. */
export const KNOWN_MIN_FOLLOWERS = 1_000;
export const KNOWN_MULTIPLE = 5;
/** ...or has a BrandOS read at least this strong. */
export const STRONG_READ = 70;
/** Fewer known engagers than this (last 30 days) is the gap. */
export const KNOWN_ENGAGERS_MIN = 2;

export const PEERS = 2;
export const BIGGER = 1;

export function isKnownAccount(
  followers: number,
  memberFollowers: number,
  readScore: number | null = null
): boolean {
  if (readScore !== null && readScore >= STRONG_READ) return true;
  return followers >= Math.max(KNOWN_MIN_FOLLOWERS, KNOWN_MULTIPLE * memberFollowers);
}

export type TriggerReason = 'engagers' | 'scale' | 'both';

/**
 * Whether the member gets People to know. `engagerPosts` is how many of their
 * posts the audience was read from: with none, only the Scale signal counts
 * (no data is not the same as nobody engaging).
 */
export function connectionTrigger(input: {
  knownEngagers: number;
  engagerPosts: number;
  weakest: string | null;
}): { triggered: boolean; reason: TriggerReason | null } {
  const fewKnown = input.engagerPosts > 0 && input.knownEngagers < KNOWN_ENGAGERS_MIN;
  const scaleWeakest = input.weakest?.toLowerCase() === 'scale';
  const reason: TriggerReason | null =
    fewKnown && scaleWeakest ? 'both' : fewKnown ? 'engagers' : scaleWeakest ? 'scale' : null;
  return { triggered: reason !== null, reason };
}

export type Tier = 'peer' | 'bigger';

/** Peer = about their size; bigger = one step up (not a giant who won't read DMs). */
export function sizeTier(followers: number, memberFollowers: number): Tier | null {
  const base = Math.max(memberFollowers, 100);
  if (followers >= base * 0.4 && followers <= base * 2.5) return 'peer';
  if (followers > base * 2.5 && followers <= base * 25) return 'bigger';
  return null;
}

/** That week's Monday (UTC) as YYYY-MM-DD: one list per member per week. */
export function weekOf(d: Date): string {
  const day = d.getUTCDay(); // 0 = Sunday
  const monday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  monday.setUTCDate(monday.getUTCDate() - ((day + 6) % 7));
  return monday.toISOString().slice(0, 10);
}

/** The Monday after this week's, when a new list comes. */
export function nextWeek(d: Date): string {
  const m = new Date(`${weekOf(d)}T00:00:00Z`);
  m.setUTCDate(m.getUTCDate() + 7);
  return m.toISOString().slice(0, 10);
}

const STOP = new Set([
  'and',
  'the',
  'for',
  'with',
  'your',
  'from',
  'into',
  'about',
  'content',
  'culture',
  'tips',
  'life',
  'personal',
  'commentary',
  'insights',
  'updates',
  'news',
]);

/** An X search for top original posts on the member's pillars. Null with no usable words. */
export function pillarQuery(pillars: string[]): string | null {
  const groups = pillars
    .slice(0, 3)
    .map((p) =>
      p
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 2 && !STOP.has(w))
        .slice(0, 2)
    )
    .filter((g) => g.length > 0)
    .map((g) => (g.length > 1 ? `(${g.join(' ')})` : g[0]));
  if (!groups.length) return null;
  return `(${groups.join(' OR ')}) min_faves:20 -filter:replies -filter:retweets`;
}

export interface Candidate {
  handle: string;
  name: string;
  bio: string;
  followers: number;
  canDm: boolean;
  defaultAvatar: boolean;
  avatarUrl: string | null;
}

export interface PoolEntry extends Candidate {
  tier: Tier;
}

/**
 * The people the model may pick from: DM-able, a real profile, the right
 * size, not the member, not already engaging with them, not suggested before.
 */
export function buildPool(
  candidates: Candidate[],
  opts: { memberHandle: string; memberFollowers: number; exclude: Set<string> }
): PoolEntry[] {
  const me = opts.memberHandle.toLowerCase();
  const seen = new Set<string>();
  const pool: PoolEntry[] = [];
  for (const c of candidates) {
    const h = c.handle.toLowerCase();
    if (seen.has(h) || h === me || opts.exclude.has(h)) continue;
    seen.add(h);
    if (!c.canDm || c.defaultAvatar || !c.bio.trim()) continue;
    const tier = sizeTier(c.followers, opts.memberFollowers);
    if (!tier) continue;
    pool.push({ ...c, tier });
  }
  const near = (f: number) =>
    Math.abs(Math.log(Math.max(f, 1) / Math.max(opts.memberFollowers, 1)));
  const peers = pool
    .filter((p) => p.tier === 'peer')
    .sort((a, b) => near(a.followers) - near(b.followers));
  const bigger = pool.filter((p) => p.tier === 'bigger').sort((a, b) => a.followers - b.followers);
  return [...peers.slice(0, 12), ...bigger.slice(0, 8)];
}

export interface Pick {
  handle: string;
  tier: Tier;
  why: string;
  dm: string;
}

const clean = (s: string, max: number) =>
  stripHashtagSentences(s.replace(/\s+/g, ' ').trim()).slice(0, max).trim();

/** Bound the model's picks: only pool members, only people, at most 2 peers + 1 bigger, no hashtags. */
export function validatePicks(raw: unknown, pool: PoolEntry[]): Pick[] {
  if (!Array.isArray(raw)) return [];
  const byHandle = new Map(pool.map((p) => [p.handle.toLowerCase(), p]));
  const taken = new Set<string>();
  const out: Pick[] = [];
  const count = { peer: 0, bigger: 0 };
  for (const r of raw) {
    if (!r || typeof r !== 'object') continue;
    const o = r as Record<string, unknown>;
    const handle = String(o.handle ?? '')
      .replace(/^@/, '')
      .toLowerCase();
    const entry = byHandle.get(handle);
    if (!entry || taken.has(handle)) continue;
    // people, not companies (the model labels each pick)
    if (o.account === 'organization') continue;
    if (count[entry.tier] >= (entry.tier === 'peer' ? PEERS : BIGGER)) continue;
    const why = typeof o.why === 'string' ? clean(o.why, 160) : '';
    const dm =
      typeof o.dm === 'string'
        ? o.dm
            .replace(/(?:^|\s)#[A-Za-z]\w+/g, '')
            .replace(/[ \t]+/g, ' ')
            .trim()
            .slice(0, 500)
        : '';
    if (!why || !dm || mentionsHashtags(why)) continue;
    taken.add(handle);
    count[entry.tier]++;
    out.push({ handle: entry.handle, tier: entry.tier, why, dm });
  }
  return out.sort((a, b) => (a.tier === b.tier ? 0 : a.tier === 'peer' ? -1 : 1));
}
