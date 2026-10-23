import prisma from '@/lib/db';
import {
  fetchProfile,
  fetchQuoters,
  fetchReposters,
  fetchRepliers,
  fetchUserTweets,
  type AudiencePerson,
  type SocialDataTweet,
} from '@/lib/socialdata';
import { analyzeTweets, type TweetAnalysis } from '@/lib/tweet-analysis';
import { isOpenAccess, isSubscribed, type BillingFields } from '@/lib/billing';

/**
 * Growth dashboard accounts (migration 040, pivot 2026-10-22). A workspace
 * tracks X accounts by public handle: its brands (creators or company
 * accounts) and up to COMPETITORS_PER_BRAND competitors per brand. One sync
 * reads the profile + ~40–60 recent original posts (SocialData, ~4 requests),
 * writes today's AccountSnapshot and upserts AccountPost.
 *
 * Server-only. Callers own auth (workspace membership) and rate limits.
 */

export const COMPETITORS_PER_BRAND = 5;
const HANDLE_RE = /^[A-Za-z0-9_]{1,15}$/;
const POSTS_PER_SYNC = 60;

/** Brands a workspace may track, by plan (Pro 1 · Team 5 · Agency 20). */
export function brandLimit(
  u: BillingFields & { subscriptionTier: string },
  now: Date = new Date()
): number {
  if (u.role === 'admin') return 20;
  if (isSubscribed(u)) {
    if (u.subscriptionTier === 'AGENCY' || u.subscriptionTier === 'ENTERPRISE') return 20;
    if (u.subscriptionTier === 'TEAM') return 5;
    // during the launch window a paid Pro card still gets the window's limit
    return isOpenAccess(now) ? 5 : 1;
  }
  // launch window (free until Dec 3): Team-sized so SMMs can try it properly
  return isOpenAccess(now) ? 5 : 1;
}

/** "@Foo", "x.com/foo", " foo " → "foo"; null if it isn't a valid handle. */
export function cleanHandle(raw: string): string | null {
  let h = raw.trim();
  const url = h.match(/(?:x|twitter)\.com\/([A-Za-z0-9_]{1,15})/i);
  if (url) h = url[1];
  h = h.replace(/^@/, '');
  return HANDLE_RE.test(h) ? h : null;
}

/** The snapshot row for today from a profile + post analysis. Pure. */
export function snapshotFields(
  profile: {
    followers_count: number;
    following_count: number;
    tweet_count: number;
    listed_count: number;
  },
  a: TweetAnalysis
) {
  const n = a.stats.totalTweets;
  const views = a.tweets.reduce((s, t) => s + (t.public_metrics.impression_count || 0), 0);
  return {
    followers: profile.followers_count,
    following: profile.following_count,
    postsTotal: profile.tweet_count,
    listed: profile.listed_count,
    samplePosts: n,
    sampleDays: a.stats.sampleDays,
    postsPerDay: a.stats.postsPerDay,
    engagementRate: a.stats.engagementRateKnown ? a.stats.avgEngagementRate : null,
    mediaShare: n ? a.contentPatterns.mediaUsage / n : 0,
    avgLikes: a.stats.avgLikes,
    avgReplies: a.stats.avgReplies,
    avgReposts: a.stats.avgRetweets,
    avgViews: n ? views / n : 0,
  };
}

function postRow(t: SocialDataTweet) {
  return {
    text: t.text.slice(0, 2000),
    postedAt: new Date(t.created_at),
    likes: t.public_metrics.like_count,
    replies: t.public_metrics.reply_count,
    reposts: t.public_metrics.retweet_count,
    quotes: t.public_metrics.quote_count,
    bookmarks: t.public_metrics.bookmark_count || 0,
    views: t.public_metrics.impression_count || 0,
    media: t.media || [],
    isQuote: !!t.is_quote,
  };
}

export class AccountError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}

/** Read the account from X and write today's snapshot + its recent posts. */
export async function syncAccount(accountId: string): Promise<void> {
  const account = await prisma.trackedAccount.findUnique({ where: { id: accountId } });
  if (!account) throw new AccountError('Account not found', 404);

  const p = await fetchProfile(account.handle);
  if (!p.profile) throw new AccountError(p.error || 'Could not read that account on X', 502);
  const profile = p.profile;

  const { tweets } = await fetchUserTweets(profile.id, POSTS_PER_SYNC);
  const valid = tweets.filter(
    (t) => /^[0-9]{1,25}$/.test(t.id) && !isNaN(Date.parse(t.created_at))
  );
  const analysis = analyzeTweets(valid);
  const fields = snapshotFields(profile.public_metrics, analysis);
  const day = new Date(new Date().toISOString().slice(0, 10));

  await prisma.$transaction([
    prisma.accountSnapshot.upsert({
      where: { accountId_day: { accountId, day } },
      create: { accountId, day, ...fields },
      update: fields,
    }),
    ...valid.map((t) =>
      prisma.accountPost.upsert({
        where: { accountId_tweetId: { accountId, tweetId: t.id } },
        create: { accountId, tweetId: t.id, ...postRow(t) },
        update: { ...postRow(t), updatedAt: new Date() },
      })
    ),
    prisma.trackedAccount.update({
      where: { id: accountId },
      data: {
        lastSyncedAt: new Date(),
        xUserId: profile.id,
        displayHandle: profile.username.slice(0, 15) || account.displayHandle,
      },
    }),
  ]);
}

/** Posts per audience sync, and how long before a post's audience is re-read. */
const AUDIENCE_POSTS = 6;
const AUDIENCE_STALE_MS = 3 * 86_400_000;

/**
 * Read who replied to / reposted / quoted a brand's best recent posts (last 30
 * days, by engagement) whose audience wasn't read in the last 3 days. Brands
 * only (not competitors). ~1–3 SocialData requests per post: reposters and
 * quoters are only fetched when the post has any.
 */
export async function syncAudience(accountId: string): Promise<number> {
  const account = await prisma.trackedAccount.findUnique({ where: { id: accountId } });
  if (!account || account.competitorOfId) return 0;
  const since = new Date(Date.now() - 30 * 86_400_000);
  const stale = new Date(Date.now() - AUDIENCE_STALE_MS);
  const posts = await prisma.accountPost.findMany({
    where: {
      accountId,
      postedAt: { gte: since },
      OR: [{ audienceSyncedAt: null }, { audienceSyncedAt: { lt: stale } }],
    },
  });
  const pick = posts
    .sort(
      (a, b) =>
        b.likes + b.replies + b.reposts + b.quotes - (a.likes + a.replies + a.reposts + a.quotes)
    )
    .slice(0, AUDIENCE_POSTS);

  let saved = 0;
  for (const p of pick) {
    const [replies, reposts, quotes] = await Promise.all([
      p.replies > 0 ? fetchRepliers(p.tweetId, account.handle) : Promise.resolve([]),
      p.reposts > 0 ? fetchReposters(p.tweetId) : Promise.resolve([]),
      p.quotes > 0 ? fetchQuoters(p.tweetId) : Promise.resolve([]),
    ]);
    const rows = (
      [
        ['reply', replies],
        ['repost', reposts],
        ['quote', quotes],
      ] as [string, AudiencePerson[]][]
    ).flatMap(([kind, people]) =>
      people
        .filter((x) => x.handle.toLowerCase() !== account.handle)
        .map((x) => ({
          accountId,
          tweetId: p.tweetId,
          handle: x.handle.toLowerCase(),
          displayHandle: x.handle,
          name: x.name || null,
          followers: x.followers,
          kind,
          at: isNaN(Date.parse(x.at)) ? new Date() : new Date(x.at),
        }))
    );
    if (rows.length) {
      const r = await prisma.audienceInteraction.createMany({ data: rows, skipDuplicates: true });
      saved += r.count;
    }
    await prisma.accountPost.update({
      where: { accountId_tweetId: { accountId, tweetId: p.tweetId } },
      data: { audienceSyncedAt: new Date() },
    });
  }
  return saved;
}

/** A brand-kind tracked row and who added it (for `trackedKind`). */
export interface BrandVouch {
  xUserId: string | null;
  addedBy: { role: string; xUserIds: string[] } | null;
}

/**
 * Whether a row marking a handle as a brand / company account comes from
 * someone allowed to decide that for everyone: an admin, or the handle's owner
 * (signed in with that X account, matched by X user id, not by handle text).
 * Anyone else's choice stays in their own workspace. Pure (test:accounts).
 */
export function vouchesForCompany(row: BrandVouch): boolean {
  if (!row.addedBy) return false;
  if (row.addedBy.role === 'admin') return true;
  return !!row.xUserId && row.addedBy.xUserIds.includes(row.xUserId);
}

/**
 * 'brand' when the handle is tracked as a brand / company account (not as a
 * competitor) by its owner or an admin, else 'creator'. The brand read is
 * shared by everyone who looks the handle up (/@handle, scans, MCP, every
 * dashboard), so one workspace marking a creator as a "brand" must not reword
 * that creator's read for everyone else. Only changes wording, never the
 * score. Never throws.
 */
export async function trackedKind(rawHandle: string): Promise<'creator' | 'brand'> {
  const handle = cleanHandle(rawHandle);
  if (!handle) return 'creator';
  const rows = await prisma.trackedAccount
    .findMany({
      where: {
        handle: handle.toLowerCase(),
        kind: 'brand',
        competitorOfId: null,
        addedByUserId: { not: null },
      },
      select: {
        xUserId: true,
        addedBy: {
          select: {
            role: true,
            platformConnections: { where: { platform: 'x' }, select: { platformUserId: true } },
          },
        },
      },
      take: 50,
    })
    .catch(() => []);
  const vouched = rows.some((r) =>
    vouchesForCompany({
      xUserId: r.xUserId,
      addedBy: r.addedBy
        ? {
            role: String(r.addedBy.role),
            xUserIds: r.addedBy.platformConnections.map((c) => c.platformUserId),
          }
        : null,
    })
  );
  return vouched ? 'brand' : 'creator';
}

/**
 * Add a brand (or a competitor of one) to a workspace by public handle.
 * Verifies the handle exists on X, enforces plan limits, then runs the first
 * sync so the dashboard has data immediately.
 */
export async function addAccount(input: {
  workspaceId: string;
  userId: string;
  limit: number;
  rawHandle: string;
  kind: 'creator' | 'brand';
  competitorOfId?: string;
}) {
  const handle = cleanHandle(input.rawHandle);
  if (!handle) throw new AccountError("That isn't a valid X handle.", 400);
  const lower = handle.toLowerCase();

  if (input.competitorOfId) {
    const brand = await prisma.trackedAccount.findFirst({
      where: { id: input.competitorOfId, workspaceId: input.workspaceId, competitorOfId: null },
      include: { _count: { select: { competitors: true } } },
    });
    if (!brand) throw new AccountError('Brand not found', 404);
    if (brand.handle === lower) throw new AccountError("A brand can't be its own competitor.", 400);
    if (brand._count.competitors >= COMPETITORS_PER_BRAND)
      throw new AccountError(`Up to ${COMPETITORS_PER_BRAND} competitors per brand.`, 403);
    const dupe = await prisma.trackedAccount.findFirst({
      where: { competitorOfId: brand.id, handle: lower },
    });
    if (dupe) return dupe;
  } else {
    const dupe = await prisma.trackedAccount.findFirst({
      where: { workspaceId: input.workspaceId, handle: lower, competitorOfId: null },
    });
    if (dupe) return dupe;
    const brands = await prisma.trackedAccount.count({
      where: { workspaceId: input.workspaceId, competitorOfId: null },
    });
    if (brands >= input.limit)
      throw new AccountError(
        `Your plan tracks up to ${input.limit} brand${input.limit === 1 ? '' : 's'}.`,
        403
      );
  }

  const p = await fetchProfile(lower);
  if (!p.profile) {
    throw new AccountError(
      p.status === 404 ? `Couldn't find @${handle} on X.` : 'Could not reach X. Try again shortly.',
      p.status === 404 ? 404 : 502
    );
  }
  if (p.profile.protected) throw new AccountError(`@${handle} is private.`, 400);

  const account = await prisma.trackedAccount.create({
    data: {
      workspaceId: input.workspaceId,
      handle: lower,
      displayHandle: p.profile.username.slice(0, 15) || handle,
      xUserId: p.profile.id,
      kind: input.kind,
      competitorOfId: input.competitorOfId ?? null,
      addedByUserId: input.userId,
    },
  });
  await syncAccount(account.id).catch((e) => console.error('[accounts] first sync failed', e));
  if (!account.competitorOfId) {
    await syncAudience(account.id).catch((e) =>
      console.error('[accounts] first audience failed', e)
    );
  }
  return account;
}
