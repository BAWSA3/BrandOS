import type { Prisma } from '@prisma/client';
import prisma from '@/lib/db';
import { indexOpenFor, type IndexViewer } from '@/lib/index-rules';
import { inviteOnlyFrom, normalizeCode, type CodeState } from '@/lib/early-access-rules';
import { welcomeAfterRedeem } from '@/lib/early-access-welcome';

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
  return (await codeState(raw)) === 'redeemable';
}

let warnedUnavailable = false;

/**
 * A carried code's state, without using it. `unavailable` means the codes
 * table can't be read (049 not applied yet): the gate fails closed on it.
 */
export async function codeState(raw: unknown): Promise<CodeState> {
  if (raw === undefined || raw === null || raw === '') return 'none';
  const code = normalizeCode(raw);
  if (!code) return 'bad';
  try {
    const c = await prisma.earlyAccessCode.findUnique({
      where: { code },
      select: { redeemedAt: true, revokedAt: true },
    });
    return c && !c.redeemedAt && !c.revokedAt ? 'redeemable' : 'bad';
  } catch (e) {
    if (!warnedUnavailable) {
      warnedUnavailable = true;
      console.error('[early-access] codes table unavailable (is 049 applied?)', e);
    }
    return 'unavailable';
  }
}

/** The closed-beta flag (env INVITE_ONLY=true). */
export function inviteOnly(): boolean {
  return inviteOnlyFrom(process.env.INVITE_ONLY);
}

/**
 * INVITE_ONLY: may this Supabase identity use BrandOS? Only if it already has a
 * BrandOS account (accounts are created by the auth callback, which is gated).
 * Used by sign-in paths that don't go through the callback (the extension).
 */
export async function hasAccount(supabaseId: string): Promise<boolean> {
  const u = await prisma.user
    .findUnique({ where: { supabaseId }, select: { id: true } })
    .catch(() => null);
  return !!u;
}

export class CodeTakenError extends Error {
  constructor() {
    super('early-access code taken');
  }
}

/**
 * Create a new account and redeem its code in ONE transaction: if the code
 * was taken in the meantime (or the table is missing), nothing is created, so
 * there's never an account with access but no code.
 */
export async function createAccountWithCode<T extends { id: string }>(
  raw: string,
  create: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  const code = normalizeCode(raw);
  if (!code) throw new CodeTakenError();
  const created = await prisma.$transaction(async (tx) => {
    const user = await create(tx);
    const { count } = await tx.earlyAccessCode.updateMany({
      where: { code, redeemedAt: null, revokedAt: null },
      data: { redeemedAt: new Date(), redeemedByUserId: user.id },
    });
    if (count !== 1) throw new CodeTakenError();
    return user;
  });
  welcomeAfterRedeem(created.id);
  return created;
}

export type RedeemResult = { ok: true; already: boolean } | { ok: false };

/**
 * Redeem a code for a signed-in user. Single use is the database's job: one
 * conditional UPDATE claims the code only if nobody has (redeemedAt null, not
 * revoked), and "redeemedByUserId" is UNIQUE, so two people racing for one
 * code, or one person redeeming two codes, can't both win. A user who already
 * has early access keeps it and the new code stays unused. A fresh redemption
 * queues the welcome email (src/lib/early-access-welcome.ts).
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
    if (count !== 1) return { ok: false };
    welcomeAfterRedeem(userId);
    return { ok: true, already: false };
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
