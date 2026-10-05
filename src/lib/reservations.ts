import prisma from '@/lib/db';

/** Reservations #1-250 get first access to the 250 Founding Member spots. */
export const FOUNDING_PRIORITY_CAP = 250;

export interface PublicReservation {
  handle: string;
  number: number;
  archetype: string | null;
  reservedAt: Date;
  foundingPriority: boolean;
}

/**
 * The public face of a reservation, looked up by X handle, for the
 * /station/[handle] page and its share image. Never exposes the email. If a
 * handle was reserved more than once, the earliest (lowest) number wins.
 */
export async function getReservationByHandle(rawHandle: string): Promise<PublicReservation | null> {
  const handle = rawHandle.replace(/^@/, '').toLowerCase();
  if (!/^[a-z0-9_]{1,30}$/.test(handle)) return null;
  const row = await prisma.emailSignup.findFirst({
    where: { xUsername: handle, reservedAt: { not: null }, reservationNumber: { not: null } },
    orderBy: { reservationNumber: 'asc' },
    select: { xUsername: true, reservationNumber: true, reservedArchetype: true, reservedAt: true },
  });
  if (!row?.xUsername || row.reservationNumber == null || !row.reservedAt) return null;
  return {
    handle: row.xUsername,
    number: row.reservationNumber,
    archetype: row.reservedArchetype,
    reservedAt: row.reservedAt,
    foundingPriority: row.reservationNumber <= FOUNDING_PRIORITY_CAP,
  };
}
