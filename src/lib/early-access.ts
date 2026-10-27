import prisma from '@/lib/db';
import { indexOpenFor, type IndexViewer } from '@/lib/index-rules';
import { normalizeCode } from '@/lib/early-access-rules';

/**
 * Early-access codes, data side (migration 049). Rules and format live in
 * src/lib/early-access-rules.ts. Every read falls back to "no early access"
 * when the tables aren't there yet, so nothing depends on the migration being
 * applied (sign-in, the Index gate and checkout keep working before it).
 */

export interface EarlyAccess {
  redeemedAt: Date;
  perkIndex: boolean;
  perkFoundingPrice: boolean;
  perkTester: boolean;
}

/** The user's redeemed early-access code, or null (also before 049). */
export async function earlyAccessFor(userId: string): Promise<EarlyAccess | null> {
  try {
    const c = await prisma.earlyAccessCode.findUnique({
      where: { redeemedByUserId: userId },
      select: {
        redeemedAt: true,
        revokedAt: true,
        perkIndex: true,
        perkFoundingPrice: true,
        perkTester: true,
      },
    });
    if (!c || !c.redeemedAt || c.revokedAt) return null;
    return {
      redeemedAt: c.redeemedAt,
      perkIndex: c.perkIndex,
      perkFoundingPrice: c.perkFoundingPrice,
      perkTester: c.perkTester,
    };
  } catch {
    return null;
  }
}

/**
 * The Index gate for a signed-in viewer: the rules in index-rules.ts
 * (public / admin / INDEX_ALLOWLIST), or a redeemed code with the Index perk.
 */
export async function indexOpenForUser(
  viewer: (IndexViewer & { id: string }) | null | undefined
): Promise<boolean> {
  if (indexOpenFor(viewer)) return true;
  if (!viewer) return false;
  return !!(await earlyAccessFor(viewer.id))?.perkIndex;
}

/** Can this code still be redeemed? (For the signed-out invite link; false before 049.) */
export async function codeIsRedeemable(raw: unknown): Promise<boolean> {
  const code = normalizeCode(raw);
  if (!code) return false;
  try {
    const c = await prisma.earlyAccessCode.findUnique({
      where: { code },
      select: { redeemedAt: true, revokedAt: true },
    });
    return !!c && !c.redeemedAt && !c.revokedAt;
  } catch {
    return false;
  }
}

export type RedeemResult = { ok: true; already: boolean } | { ok: false };

/**
 * Redeem a code for a signed-in user. Single use is the database's job: one
 * conditional UPDATE claims the code only if nobody has (redeemedAt null, not
 * revoked), and "redeemedByUserId" is UNIQUE, so two people racing for one
 * code, or one person redeeming two codes, can't both win. A user who already
 * has early access keeps it and the new code stays unused.
 */
export async function redeemCode(userId: string, raw: unknown): Promise<RedeemResult> {
  const code = normalizeCode(raw);
  if (!code) return { ok: false };
  if (await earlyAccessFor(userId)) return { ok: true, already: true };
  try {
    const { count } = await prisma.earlyAccessCode.updateMany({
      where: { code, redeemedAt: null, revokedAt: null },
      data: { redeemedAt: new Date(), redeemedByUserId: userId },
    });
    return count === 1 ? { ok: true, already: false } : { ok: false };
  } catch (e) {
    // P2002: this user redeemed another code in the same moment
    if ((e as { code?: string }).code === 'P2002') return { ok: true, already: true };
    console.error('[early-access] redeem failed', e);
    return { ok: false };
  }
}

/** Where tester feedback is emailed: the address the app already uses for team mail. */
export function teamInbox(): string {
  return process.env.ENTERPRISE_NOTIFY_EMAIL || process.env.EMAIL_FROM || 'team@mybrandos.app';
}
