import { unstable_cache } from 'next/cache';
import prisma from '@/lib/db';
import { foundingSpotsLeft } from '@/lib/founding';
import { scannedLabel } from '@/lib/index-reservations';
import { listIndex, type IndexCard } from '@/lib/creator-index';
import { indexOpen, parsePhases, type Phases } from '@/lib/landing-rules';

/**
 * Live numbers for the homepage landing scroll (Direction 03). Only real data:
 * how many brands BrandOS has read, Founding seats left, @jbawsa's latest read
 * as the worked example, and whether the Index is open. Cached for an hour so
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
  index: { open: boolean; members: number; recent: IndexCard[] };
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

async function index(): Promise<LandingData['index']> {
  const open = indexOpen();
  if (!open) return { open, members: 0, recent: [] };
  const page = await listIndex({ niche: null, archetype: null, min: 0, max: 100, page: 1 }).catch(
    () => null
  );
  return {
    open,
    members: page?.members ?? 0,
    recent: [...(page?.featured ?? []), ...(page?.cards ?? [])].slice(0, 3),
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
  ['landing-data-v1'],
  { revalidate: 3600 }
);
