import prisma from '@/lib/db';

// Server-side reads of the legacy "BrandScans" table. These used to go through
// the public anon key, which meant the anon key could read the whole table
// (6.7K rows incl. userId) straight from Supabase's REST API. Reads now use
// Prisma (service connection) so migration 047 can revoke anon SELECT.
//
// Rows come back in the table's snake_case shape so existing callers keep
// working unchanged.

export interface BrandScanRow {
  id: string;
  username: string;
  score: number;
  archetype: string | null;
  enhanced: boolean | null;
  userId: string | null;
  phase_scores: string | null;
  insights: string | null;
  strengths: string | null;
  improvements: string | null;
  summary: string | null;
  influence_tier: string | null;
  next_moves: string | null;
  content_pillars: string | null;
  created_at: string | null;
}

type PrismaScan = Awaited<ReturnType<typeof prisma.brandScans.findFirst>>;

function toRow(s: NonNullable<PrismaScan>): BrandScanRow {
  return {
    id: s.id,
    username: s.username,
    score: s.score,
    archetype: s.archetype,
    enhanced: s.enhanced,
    userId: s.userId,
    phase_scores: s.phaseScores,
    insights: s.insights,
    strengths: s.strengths,
    improvements: s.improvements,
    summary: s.summary,
    influence_tier: s.influenceTier,
    next_moves: s.nextMoves,
    content_pillars: s.contentPillars,
    created_at: s.createdAt ? s.createdAt.toISOString() : null,
  };
}

/** A handle's scans, newest first. */
export async function scansForUsername(username: string, limit = 20): Promise<BrandScanRow[]> {
  const rows = await prisma.brandScans.findMany({
    where: { username },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
  return rows.map(toRow);
}

/** Newest scan for a handle that has an archetype, or null. */
export async function latestArchetypeScan(
  username: string
): Promise<Pick<BrandScanRow, 'archetype' | 'score'> | null> {
  return prisma.brandScans.findFirst({
    where: { username, archetype: { not: null } },
    orderBy: { createdAt: 'desc' },
    select: { archetype: true, score: true },
  });
}

/** Scans in an archetype that carry phase scores (score, phases, tier). */
export async function cohortPhaseScans(
  archetype: string,
  limit = 1000
): Promise<Pick<BrandScanRow, 'score' | 'phase_scores' | 'influence_tier'>[]> {
  const rows = await prisma.brandScans.findMany({
    where: { archetype, phaseScores: { not: null } },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: { score: true, phaseScores: true, influenceTier: true },
  });
  return rows.map((r) => ({
    score: r.score,
    phase_scores: r.phaseScores,
    influence_tier: r.influenceTier,
  }));
}

export function archetypeScanCount(archetype: string): Promise<number> {
  return prisma.brandScans.count({ where: { archetype } });
}

/** Distinct handles scanned into an archetype. */
export async function archetypeCreatorCount(archetype: string): Promise<number> {
  const rows = await prisma.brandScans.groupBy({ by: ['username'], where: { archetype } });
  return rows.length;
}

/** Recent scans within a score band (for opponent matching). */
export async function scansInScoreBand(opts: {
  min: number;
  max: number;
  excludeUsername: string;
  archetype?: string;
  limit?: number;
}): Promise<Pick<BrandScanRow, 'username' | 'score' | 'archetype'>[]> {
  return prisma.brandScans.findMany({
    where: {
      score: { gte: opts.min, lte: opts.max },
      username: { not: opts.excludeUsername },
      ...(opts.archetype ? { archetype: opts.archetype } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: opts.limit ?? 50,
    select: { username: true, score: true, archetype: true },
  });
}

export function totalScanCount(): Promise<number> {
  return prisma.brandScans.count();
}

export async function uniqueScannedCount(): Promise<number> {
  const rows = await prisma.brandScans.groupBy({ by: ['username'] });
  return rows.length;
}

export async function recentScans(limit = 50): Promise<BrandScanRow[]> {
  const rows = await prisma.brandScans.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
  return rows.map(toRow);
}
