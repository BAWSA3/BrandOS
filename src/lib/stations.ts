import prisma from '@/lib/db';
import type { CurrentUser } from '@/lib/auth';
import { getReservationByHandle } from '@/lib/reservations';

/**
 * Claimed brand stations (Phase 0 of docs/specs/STATION-BOARD-AND-BRAND-REVIEWS.md).
 *
 * A reservation only proves someone typed an email and a handle. Claiming
 * proves ownership: the signed-in user must have an ACTIVE, verified X
 * connection (saved by the Sign in with X callback straight from X) whose
 * username matches the station handle. The station is bound to the X user id,
 * so a later handle change can't move it to someone else. Server-only.
 */

export type ClaimResult =
  | { ok: true; handle: string; alreadyClaimed: boolean }
  | {
      ok: false;
      reason: 'no-reservation' | 'not-x-owner' | 'claimed-by-other' | 'owns-other-station';
    };

export async function getStationClaim(rawHandle: string) {
  const handle = rawHandle.replace(/^@/, '').toLowerCase();
  if (!/^[a-z0-9_]{1,30}$/.test(handle)) return null;
  try {
    return await prisma.station.findUnique({
      where: { handle },
      select: { handle: true, claimedAt: true },
    });
  } catch (e) {
    // Public page must not break if the Station table isn't there yet
    // (migration 026 not applied); treat as unclaimed.
    console.error('[stations] claim lookup failed:', e);
    return null;
  }
}

export async function claimStation(user: CurrentUser, rawHandle: string): Promise<ClaimResult> {
  const handle = rawHandle.replace(/^@/, '').toLowerCase();

  const reservation = await getReservationByHandle(handle);
  if (!reservation) return { ok: false, reason: 'no-reservation' };

  // Proof of ownership: a verified, active X connection for this exact handle.
  const xConn = user.platformConnections.find(
    (c) =>
      c.platform === 'x' && c.status === 'active' && c.platformUsername.toLowerCase() === handle
  );
  if (!xConn) return { ok: false, reason: 'not-x-owner' };

  const existing = await prisma.station.findUnique({ where: { handle } });
  if (existing) {
    return existing.ownerUserId === user.id
      ? { ok: true, handle, alreadyClaimed: true }
      : { ok: false, reason: 'claimed-by-other' };
  }

  try {
    await prisma.station.create({
      data: {
        handle,
        ownerUserId: user.id,
        ownerXId: xConn.platformUserId,
        reservationNumber: reservation.number,
        archetype: reservation.archetype,
      },
    });
  } catch (e) {
    // Unique races: same handle claimed concurrently, or this user/X account
    // already owns a different station.
    if ((e as { code?: string }).code === 'P2002') {
      const now = await prisma.station.findUnique({ where: { handle } });
      if (now?.ownerUserId === user.id) return { ok: true, handle, alreadyClaimed: true };
      return { ok: false, reason: now ? 'claimed-by-other' : 'owns-other-station' };
    }
    throw e;
  }
  return { ok: true, handle, alreadyClaimed: false };
}
