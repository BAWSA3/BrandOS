import prisma from '@/lib/db';
import { FOUNDING_SPOTS } from '@/lib/plans';

/**
 * Founding 100 (migration 038). Reads fall back gracefully before the table
 * exists: the counter shows every spot open and numbering is skipped.
 */

/** Spots still open (FOUNDING_SPOTS when the table is missing). */
export async function foundingSpotsLeft(): Promise<number> {
  try {
    const taken = await prisma.foundingMember.count();
    return Math.max(0, FOUNDING_SPOTS - taken);
  } catch {
    return FOUNDING_SPOTS;
  }
}

/** The user's founding number, or null. */
export async function foundingNumber(userId: string): Promise<number | null> {
  try {
    const m = await prisma.foundingMember.findUnique({
      where: { userId },
      select: { number: true },
    });
    return m?.number ?? null;
  } catch {
    return null;
  }
}

/**
 * Give a paying user the next founding spot, once. Returns their number, or
 * null when all spots are taken (or the table isn't there yet). The number is
 * the primary key, so a concurrent conversion that grabs the same number
 * fails and we retry with the next one.
 */
export async function claimFoundingSpot(userId: string): Promise<number | null> {
  try {
    const existing = await prisma.foundingMember.findUnique({ where: { userId } });
    if (existing) return existing.number;
    for (let attempt = 0; attempt < 5; attempt++) {
      const top = await prisma.foundingMember.aggregate({ _max: { number: true } });
      const next = (top._max.number ?? 0) + 1;
      if (next > FOUNDING_SPOTS) return null;
      try {
        const m = await prisma.foundingMember.create({ data: { number: next, userId } });
        return m.number;
      } catch (e) {
        const code = (e as { code?: string }).code;
        if (code !== 'P2002') throw e;
        // P2002: either the number was just taken (retry) or this user already has one
        const mine = await prisma.foundingMember.findUnique({ where: { userId } });
        if (mine) return mine.number;
      }
    }
    return null;
  } catch (e) {
    console.error('[founding] claim failed', e);
    return null;
  }
}
