import { unstable_cache } from 'next/cache';
import prisma from '@/lib/db';
import { foundingSpotsLeft } from '@/lib/founding';
import { scannedLabel } from '@/lib/index-reservations';
import { listIndex, type IndexCard } from '@/lib/creator-index';
import { classify } from '@/lib/classifications';
import {
  indexOpen,
  parsePhases,
  pickRecentReads,
  type Phases,
  type ReadCandidate,
  type RecentRead,
} from '@/lib/landing-rules';

/**
 * Live numbers for the homepage landing scroll (Direction 03). Only real data:
 * how many brands BrandOS has read, Founding seats left, @jbawsa's latest read
 * as the worked example, whether the Index is open, and (until it opens) the
 * top recent reads of real public accounts. Cached for an hour so
 * the homepage stays static; every read falls back instead of throwing.
 */

export interface ExampleRead {
  handle: string;
  score: number;
  archetype: string | null;
  phases: Phases;
}

export interface LandingData {
  /** "4,700+" style label (distinct handles read), or null when unavailable. */
  brandsRead: string | null;
  seatsLeft: number;
  example: ExampleRead;
  /** `reads`: real accounts' recent reads, shown before the Index opens (never as entries). */
  index: { open: boolean; members: number; recent: IndexCard[]; reads: RecentRead[] };
}

const EXAMPLE_HANDLE = 'jbawsa';

/** The fallback example: @jbawsa's read on 22 Oct 2026 (ARC, 72). */
export const SAMPLE_EXAMPLE: ExampleRead = {
  handle: EXAMPLE_HANDLE,
  score: 72,
  archetype: 'ARC',
  phases: { define: 78, check: 71, generate: 68, scale: 69 },
};

async function example(): Promise<ExampleRead> {
  const row = await prisma.brandScans
    .findFirst({
      where: { username: { equals: EXAMPLE_HANDLE, mode: 'insensitive' } },
      orderBy: { createdAt: 'desc' },
      select: { score: true, archetype: true, phaseScores: true },
    })
    .catch(() => null);
  const phases = parsePhases(row?.phaseScores);
  if (!row || !phases) return SAMPLE_EXAMPLE;
  return { handle: EXAMPLE_HANDLE, score: row.score, archetype: row.archetype, phases };
}

async function brandsRead(): Promise<string | null> {
  const rows = await prisma.$queryRaw<{ n: bigint }[]>`
    select count(distinct lower(username)) as n from "BrandScans"`.catch(() => []);
  return scannedLabel(Number(rows[0]?.n ?? 0));
}

const READS_WINDOW_DAYS = 14;

/** The best recent reads of real accounts: latest read per handle, last 14 days. */
async function recentReads(): Promise<RecentRead[]> {
  const rows = await prisma.$queryRaw<
    {
      handle: string;
      score: number;
      archetype: string | null;
      phase_scores: string | null;
      summary: string | null;
      content_pillars: string | null;
      created_at: Date | null;
    }[]
  >`
    select * from (
      select distinct on (lower(username))
        lower(username) as handle, score, archetype, phase_scores, summary, content_pillars, created_at
      from "BrandScans"
      where created_at > now() - make_interval(days => ${READS_WINDOW_DAYS}::int)
      order by lower(username), created_at desc
    ) latest
    order by score desc
    limit 60`.catch(() => []);
  if (rows.length === 0) return [];
  const profiles = await prisma.xProfileCache
    .findMany({
      where: { username: { in: rows.map((r) => r.handle) } },
      select: { username: true, profileData: true },
    })
    .catch(() => []);
  const byHandle = new Map(profiles.map((p) => [p.username.toLowerCase(), p.profileData]));
  const candidates: ReadCandidate[] = rows.map((r) => {
    let avatar: string | null = null;
    let name: string | null = null;
    try {
      const pd = JSON.parse(byHandle.get(r.handle) ?? 'null') as {
        name?: unknown;
        profile_image_url?: unknown;
      } | null;
      if (
        typeof pd?.profile_image_url === 'string' &&
        pd.profile_image_url.startsWith('https://pbs.twimg.com/')
      )
        avatar = pd.profile_image_url;
      if (typeof pd?.name === 'string' && pd.name.trim()) name = pd.name.trim().slice(0, 50);
    } catch {
      // no picture: the read is skipped
    }
    let pillars: string[] = [];
    try {
      const p = JSON.parse(r.content_pillars ?? '[]') as unknown;
      if (Array.isArray(p)) pillars = p.filter((x): x is string => typeof x === 'string');
    } catch {
      pillars = [];
    }
    return {
      handle: r.handle,
      score: r.score,
      archetype: r.archetype,
      phases: parsePhases(r.phase_scores),
      summary: r.summary,
      pillars,
      avatar,
      name,
      readAt: (r.created_at ?? new Date()).toISOString(),
    };
  });
  return pickRecentReads(candidates, (a) => classify(a)?.code ?? null);
}

async function index(): Promise<LandingData['index']> {
  const open = indexOpen();
  if (!open) return { open, members: 0, recent: [], reads: await recentReads().catch(() => []) };
  const page = await listIndex({ niche: null, archetype: null, min: 0, max: 100, page: 1 }).catch(
    () => null
  );
  return {
    open,
    members: page?.members ?? 0,
    recent: [...(page?.featured ?? []), ...(page?.cards ?? [])].slice(0, 3),
    reads: [],
  };
}

export const getLandingData = unstable_cache(
  async (): Promise<LandingData> => {
    const [read, seats, ex, idx] = await Promise.all([
      brandsRead().catch(() => null),
      foundingSpotsLeft(),
      example(),
      index(),
    ]);
    return { brandsRead: read, seatsLeft: seats, example: ex, index: idx };
  },
  ['landing-data-v2'],
  { revalidate: 3600 }
);
