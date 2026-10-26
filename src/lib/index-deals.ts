import prisma from '@/lib/db';
import { MAX_DEALS, monthOf, type DealInput, type DealView } from '@/lib/index-deal-rules';

/**
 * Past brand deals on a Creator Index entry, server side (migration 046).
 * Rules and validation live in src/lib/index-deal-rules.ts. Every function
 * takes the signed-in user's id and only ever touches that user's own entry.
 * Reads degrade to "empty" if the table isn't there yet; writes surface a
 * plain error instead.
 */

type DealRow = {
  id: string;
  brand: string;
  brandHandle: string | null;
  dealMonth: Date | null;
  postUrl: string | null;
  confirmedAt: Date | null;
};

const SELECT = {
  id: true,
  brand: true,
  brandHandle: true,
  dealMonth: true,
  postUrl: true,
  confirmedAt: true,
} as const;

const toView = (d: DealRow): DealView => ({
  id: d.id,
  brand: d.brand,
  brandHandle: d.brandHandle,
  month: d.dealMonth ? monthOf(d.dealMonth) : null,
  postUrl: d.postUrl,
  confirmed: d.confirmedAt != null,
});

const entryIdFor = (userId: string) =>
  prisma.indexEntry.findUnique({ where: { userId }, select: { id: true } });

/** The member's own deals, newest first. member=false when they haven't joined. */
export async function listDeals(userId: string): Promise<{ member: boolean; deals: DealView[] }> {
  const entry = await entryIdFor(userId).catch(() => null);
  if (!entry) return { member: false, deals: [] };
  const rows = await prisma.indexDeal
    .findMany({
      where: { entryId: entry.id },
      orderBy: { createdAt: 'desc' },
      take: MAX_DEALS,
      select: SELECT,
    })
    .catch(() => [] as DealRow[]);
  return { member: true, deals: rows.map(toView) };
}

export type AddDealResult =
  | { ok: true; deal: DealView }
  | { ok: false; status: number; error: string };

/** Log a deal on the member's own entry (at most MAX_DEALS). */
export async function addDeal(userId: string, input: DealInput): Promise<AddDealResult> {
  const entry = await entryIdFor(userId).catch(() => null);
  if (!entry) return { ok: false, status: 404, error: 'Join the Index first.' };
  try {
    const count = await prisma.indexDeal.count({ where: { entryId: entry.id } });
    if (count >= MAX_DEALS)
      return { ok: false, status: 409, error: `You can log up to ${MAX_DEALS} deals.` };
    const row = await prisma.indexDeal.create({
      data: {
        entryId: entry.id,
        brand: input.brand,
        brandHandle: input.brandHandle,
        dealMonth: input.month ? new Date(`${input.month}-01T00:00:00Z`) : null,
        postUrl: input.postUrl,
      },
      select: SELECT,
    });
    return { ok: true, deal: toView(row) };
  } catch (e) {
    console.error('[index-deals] add failed:', e);
    return { ok: false, status: 503, error: "Past deals aren't open yet. Try again soon." };
  }
}

/** Remove one of the member's own deals. false when it isn't theirs or doesn't exist. */
export async function removeDeal(userId: string, dealId: string): Promise<boolean> {
  const { count } = await prisma.indexDeal
    .deleteMany({ where: { id: dealId, entry: { userId } } })
    .catch(() => ({ count: 0 }));
  return count > 0;
}
