import prisma from '@/lib/db';
import { getArchetypeInfo } from '@/lib/archetype-descriptions';
import { normalizeArchetypeName } from '@/lib/archetype-names';
import {
  bestAndWorst,
  delta,
  followerSeries,
  formatPerformance,
  peakHour,
  type PostRow,
  type SnapshotRow,
} from '@/lib/growth-metrics';
import { audienceSummary, type AudienceSummary } from '@/lib/audience-metrics';

/**
 * Everything the growth dashboard shows for one brand, as plain JSON (safe to
 * pass to a client component). Server-only; callers own auth and pass the
 * caller's own workspace id.
 */

const PHASES = ['define', 'check', 'generate', 'scale'] as const;
export type Phase = (typeof PHASES)[number];

export interface GrowthView {
  brands: { id: string; handle: string; kind: string }[];
  brand: {
    id: string;
    handle: string;
    kind: string;
    lastSyncedAt: string | null;
    /** From the X profile cache, for the idea board's post composer. */
    name?: string | null;
    avatarUrl?: string | null;
  };
  limits: { brands: number; competitors: number };
  score: {
    value: number;
    archetype: string | null;
    phases: Record<Phase, number> | null;
    weakest: Phase | null;
    scannedAt: string;
    nextMoves: string[];
  } | null;
  growth: {
    followers: number | null;
    followers7: number | null;
    engagement: number | null;
    engagement7: number | null;
    postsPerDay: number | null;
    samplePosts: number;
    avgViews: number | null;
    avgViews7: number | null;
    series: { day: string; followers: number }[];
    trackedDays: number;
  };
  formats: ReturnType<typeof formatPerformance>;
  peakHour: number | null;
  best: { text: string; rate: number; why: string; tweetId: string }[];
  worst: { text: string; rate: number; why: string; tweetId: string } | null;
  /** The brand's idea board (migration 042); empty before it's applied. */
  ideas: {
    id: string;
    text: string;
    hook: string;
    format: string;
    why: string;
    source: string;
    status: string;
    createdAt: string;
  }[];
  /** Null until the audience tables exist (migration 041) or anything was read. */
  audience: AudienceSummary | null;
  competitors: {
    id: string;
    handle: string;
    you: boolean;
    score: number | null;
    engagement: number | null;
    postsPerDay: number | null;
    followers: number | null;
    mediaShare: number | null;
  }[];
}

const parseJson = <T>(v: unknown): T | undefined => {
  if (typeof v !== 'string') return (v ?? undefined) as T | undefined;
  try {
    return JSON.parse(v) as T;
  } catch {
    return undefined;
  }
};

/** Latest stored read for a handle (any age; the dashboard shows when it was scanned). */
async function latestRead(handle: string) {
  const row = await prisma.brandScans
    .findFirst({
      where: { username: { equals: handle, mode: 'insensitive' }, summary: { not: null } },
      orderBy: { createdAt: 'desc' },
      select: {
        score: true,
        archetype: true,
        phaseScores: true,
        nextMoves: true,
        improvements: true,
        createdAt: true,
      },
    })
    .catch(() => null);
  if (!row) return null;
  const phases = parseJson<Record<string, number>>(row.phaseScores);
  const clean =
    phases && PHASES.every((p) => typeof phases[p] === 'number')
      ? (Object.fromEntries(PHASES.map((p) => [p, Math.round(phases[p])])) as Record<Phase, number>)
      : null;
  const arch = row.archetype ? getArchetypeInfo(normalizeArchetypeName(row.archetype)) : null;
  const moves = parseJson<unknown>(row.nextMoves);
  const fixes = parseJson<unknown>(row.improvements);
  const list = (v: unknown) =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
  return {
    value: Math.round(row.score),
    archetype: arch?.name ?? null,
    phases: clean,
    weakest: clean ? PHASES.reduce((a, b) => (clean[b] < clean[a] ? b : a)) : null,
    scannedAt: (row.createdAt ?? new Date()).toISOString(),
    nextMoves: [...list(moves), ...list(fixes)].slice(0, 3),
  };
}

/** Display name and avatar from the X profile cache (pbs.twimg.com only). */
async function brandProfile(handle: string) {
  const row = await prisma.xProfileCache
    .findUnique({ where: { username: handle.toLowerCase() }, select: { profileData: true } })
    .catch(() => null);
  const pd = parseJson<{ name?: unknown; profile_image_url?: unknown }>(row?.profileData);
  const name = typeof pd?.name === 'string' && pd.name.trim() ? pd.name.trim().slice(0, 50) : null;
  const img = pd?.profile_image_url;
  const avatarUrl =
    typeof img === 'string' && img.startsWith('https://pbs.twimg.com/')
      ? img.replace('_normal', '_400x400')
      : null;
  return { name, avatarUrl };
}

const toSnap = (s: {
  day: Date;
  followers: number;
  postsPerDay: number;
  engagementRate: number | null;
  mediaShare: number;
  avgViews: number;
  samplePosts: number;
}): SnapshotRow => s;

export async function getGrowthView(
  workspaceId: string,
  brandId: string | undefined,
  limits: { brands: number; competitors: number }
): Promise<GrowthView | null> {
  const brands = await prisma.trackedAccount.findMany({
    where: { workspaceId, competitorOfId: null },
    orderBy: { createdAt: 'asc' },
    select: { id: true, displayHandle: true, kind: true },
  });
  if (!brands.length) return null;
  const pick = brands.find((b) => b.id === brandId) ?? brands[0];

  const since = new Date(Date.now() - 90 * 86_400_000);
  const [brand, posts, competitors] = await Promise.all([
    prisma.trackedAccount.findUnique({
      where: { id: pick.id },
      include: { snapshots: { where: { day: { gte: since } }, orderBy: { day: 'asc' } } },
    }),
    prisma.accountPost.findMany({
      where: { accountId: pick.id },
      orderBy: { postedAt: 'desc' },
      take: 60,
    }),
    prisma.trackedAccount.findMany({
      where: { competitorOfId: pick.id },
      orderBy: { createdAt: 'asc' },
      include: { snapshots: { orderBy: { day: 'desc' }, take: 1 } },
    }),
  ]);
  if (!brand) return null;

  const snaps = brand.snapshots.map(toSnap);
  const last = snaps[snaps.length - 1] ?? null;
  const rows: PostRow[] = posts;
  const bw = bestAndWorst(rows);
  const audienceRows = await prisma.audienceInteraction
    .findMany({
      where: { accountId: brand.id, at: { gte: new Date(Date.now() - 30 * 86_400_000) } },
      select: {
        tweetId: true,
        handle: true,
        displayHandle: true,
        name: true,
        followers: true,
        kind: true,
      },
    })
    .catch(() => null);
  const ideaRows = await prisma.idea
    .findMany({
      where: { accountId: brand.id },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        suggestion: true,
        hook: true,
        format: true,
        why: true,
        source: true,
        status: true,
        createdAt: true,
      },
    })
    .catch(() => []);
  const profile = await brandProfile(brand.displayHandle);
  const [score, ...compScores] = await Promise.all([
    latestRead(brand.handle),
    ...competitors.map((c) => latestRead(c.handle)),
  ]);

  const pct = (a: number | null, b: number | null) =>
    a === null || b === null || b === 0 ? null : (a / b) * 100;

  return {
    brands: brands.map((b) => ({ id: b.id, handle: b.displayHandle, kind: b.kind })),
    brand: {
      id: brand.id,
      handle: brand.displayHandle,
      kind: brand.kind,
      lastSyncedAt: brand.lastSyncedAt?.toISOString() ?? null,
      name: profile.name,
      avatarUrl: profile.avatarUrl,
    },
    limits,
    score,
    growth: {
      followers: last?.followers ?? null,
      followers7: delta(snaps, (s) => s.followers),
      engagement: last?.engagementRate ?? null,
      engagement7: delta(snaps, (s) => s.engagementRate),
      postsPerDay: last?.postsPerDay ?? null,
      samplePosts: last?.samplePosts ?? 0,
      avgViews: last?.avgViews ?? null,
      avgViews7: (() => {
        const d = delta(snaps, (s) => s.avgViews);
        return d === null || !last ? null : pct(d, last.avgViews - d);
      })(),
      series: followerSeries(snaps, 30),
      trackedDays: snaps.length,
    },
    ideas: ideaRows.map((i) => ({
      id: i.id,
      text: i.suggestion,
      hook: i.hook,
      format: i.format,
      why: i.why,
      source: i.source,
      status: i.status,
      createdAt: i.createdAt.toISOString(),
    })),
    audience: audienceRows?.length ? audienceSummary(audienceRows) : null,
    formats: formatPerformance(rows),
    peakHour: peakHour(rows),
    best: bw.best.map((b) => ({
      text: b.p.text,
      rate: b.rate,
      why: b.why,
      tweetId: b.p.tweetId,
    })),
    worst: bw.worst
      ? {
          text: bw.worst.p.text,
          rate: bw.worst.rate,
          why: bw.worst.why,
          tweetId: bw.worst.p.tweetId,
        }
      : null,
    competitors: [
      {
        id: brand.id,
        handle: brand.displayHandle,
        you: true,
        score: score?.value ?? null,
        engagement: last?.engagementRate ?? null,
        postsPerDay: last?.postsPerDay ?? null,
        followers: last?.followers ?? null,
        mediaShare: last?.mediaShare ?? null,
      },
      ...competitors.map((c, i) => ({
        id: c.id,
        handle: c.displayHandle,
        you: false,
        score: compScores[i]?.value ?? null,
        engagement: c.snapshots[0]?.engagementRate ?? null,
        postsPerDay: c.snapshots[0]?.postsPerDay ?? null,
        followers: c.snapshots[0]?.followers ?? null,
        mediaShare: c.snapshots[0]?.mediaShare ?? null,
      })),
    ],
  };
}
