import type { Prisma } from '@prisma/client';
import prisma from '@/lib/db';
import { indexOpenFor, type IndexViewer } from '@/lib/index-rules';
import { randomBytes } from 'node:crypto';
import {
  generateCode,
  inviteLink,
  inviteOnlyFrom,
  invitesLeft,
  MEMBER_INVITES,
  normalizeCode,
  type CodeState,
} from '@/lib/early-access-rules';
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

// ---------------------------------------------------------------------------
// Invite-only trial (migration 051): the apply list and members' own invites.
// Every function here reports "unavailable" instead of throwing when 051 isn't
// applied, so the form and the invite card degrade quietly.
// ---------------------------------------------------------------------------

export type ApplyResult = 'ok' | 'unavailable';

/**
 * Save an "apply for a code" request. One per handle: a repeat (or a new
 * email for the same handle) changes nothing and gets the same answer, so the
 * form says nothing about who has applied.
 */
export async function saveApplication(a: {
  handle: string;
  email: string;
  note: string | null;
}): Promise<ApplyResult> {
  try {
    await prisma.accessApplication.create({ data: a, select: { id: true } });
    return 'ok';
  } catch (e) {
    if ((e as { code?: string }).code === 'P2002') return 'ok';
    console.error('[early-access] application not saved (is 051 applied?)', e);
    return 'unavailable';
  }
}

export interface MemberInvite {
  code: string;
  link: string;
  /** X handle of whoever used it, or null while it's open. */
  usedBy: string | null;
  usedAt: string | null;
}
export interface MemberInvites {
  cap: number;
  left: number;
  invites: MemberInvite[];
}

/** The perks a member's invite carries: theirs (a paid member without a code: none extra). */
async function invitePerks(userId: string) {
  const own = await earlyAccessFor(userId);
  return {
    perkIndex: !!own?.perkIndex,
    perkFoundingPrice: !!own?.perkFoundingPrice,
    perkTester: !!own?.perkTester,
  };
}

/** A member's invites (oldest first), or null before 051. */
export async function memberInvites(
  userId: string,
  origin = 'https://mybrandos.app'
): Promise<MemberInvites | null> {
  try {
    const rows = await prisma.earlyAccessCode.findMany({
      where: { createdByUserId: userId },
      orderBy: { createdAt: 'asc' },
      select: {
        code: true,
        redeemedAt: true,
        revokedAt: true,
        redeemedBy: { select: { xUsername: true } },
      },
    });
    return {
      cap: MEMBER_INVITES,
      left: invitesLeft(rows.length),
      invites: rows
        .filter((r) => !r.revokedAt)
        .map((r) => ({
          code: r.code,
          link: inviteLink(r.code, origin),
          usedBy: r.redeemedAt ? (r.redeemedBy?.xUsername ?? 'someone') : null,
          usedAt: r.redeemedAt ? r.redeemedAt.toISOString() : null,
        })),
    };
  } catch {
    return null;
  }
}

export type MintResult =
  | { ok: true; invite: MemberInvite }
  | { ok: false; reason: 'none-left' | 'unavailable' };

/**
 * Make one of a member's invites (on their first copy, not upfront). The cap
 * is enforced inside a transaction holding a per-member advisory lock, so two
 * quick taps can't make a 4th. Revoked invites still count: revoking never
 * hands out a new one. Callers check the member is eligible first.
 */
export async function mintInvite(
  userId: string,
  handle: string | null,
  origin = 'https://mybrandos.app'
): Promise<MintResult> {
  const perks = await invitePerks(userId);
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCode((n) => randomBytes(n));
    try {
      const made = await prisma.$transaction(async (tx) => {
        await tx.$executeRaw`select pg_advisory_xact_lock(hashtext(${'invites:' + userId}))`;
        const count = await tx.earlyAccessCode.count({ where: { createdByUserId: userId } });
        if (invitesLeft(count) <= 0) return null;
        return tx.earlyAccessCode.create({
          data: {
            code,
            label: handle ? `invite from @${handle}` : 'member invite',
            createdByUserId: userId,
            ...perks,
          },
          select: { code: true },
        });
      });
      if (!made) return { ok: false, reason: 'none-left' };
      return {
        ok: true,
        invite: { code: made.code, link: inviteLink(made.code, origin), usedBy: null, usedAt: null },
      };
    } catch (e) {
      if ((e as { code?: string }).code === 'P2002') continue; // code collision: draw again
      console.error('[early-access] invite not made (is 051 applied?)', e);
      return { ok: false, reason: 'unavailable' };
    }
  }
  return { ok: false, reason: 'unavailable' };
}
