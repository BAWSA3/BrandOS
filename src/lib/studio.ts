import prisma from '@/lib/db';
import type { CurrentUser } from '@/lib/auth';
import { clampStage, type StageNumber } from '@/lib/studio-stages';

const ARCHETYPES = new Set(['SOURCE', 'RELAY', 'FREQ', 'FORESIGHT', 'BUILD.EXE', 'ARC', 'ENTROPY', 'NULL']);

function validArchetype(a: string | null | undefined): string | null {
  const up = a?.trim().toUpperCase();
  return up && ARCHETYPES.has(up) ? up : null;
}

/**
 * The user's archetype for their station: latest scan of their X handle, then
 * their reservation, then a claimed station. Null when they haven't scanned.
 */
async function resolveArchetype(user: CurrentUser): Promise<string | null> {
  const handle = user.xUsername?.replace(/^@/, '').trim();
  if (handle) {
    const scan = await prisma.brandScans.findFirst({
      where: { username: { equals: handle, mode: 'insensitive' }, archetype: { not: null } },
      orderBy: { createdAt: 'desc' },
      select: { archetype: true },
    });
    const fromScan = validArchetype(scan?.archetype);
    if (fromScan) return fromScan;

    const reservation = await prisma.emailSignup.findFirst({
      where: { xUsername: { equals: handle, mode: 'insensitive' }, reservedArchetype: { not: null } },
      select: { reservedArchetype: true },
    });
    const fromReservation = validArchetype(reservation?.reservedArchetype);
    if (fromReservation) return fromReservation;
  }
  const station = await prisma.station.findUnique({
    where: { ownerUserId: user.id },
    select: { archetype: true },
  });
  return validArchetype(station?.archetype);
}

export interface StudioState {
  archetype: string | null;
  stage: StageNumber;
  foundationAt: string | null;
  workstationAt: string | null;
  billboardAt: string | null;
}

/** Load (or start) the user's studio; fills in the archetype once they've scanned. */
export async function getStudio(user: CurrentUser): Promise<StudioState> {
  let studio = await prisma.studio.findUnique({ where: { userId: user.id } });
  if (!studio || !studio.archetype) {
    const archetype = await resolveArchetype(user);
    studio = await prisma.studio.upsert({
      where: { userId: user.id },
      create: { userId: user.id, archetype },
      update: archetype ? { archetype } : {},
    });
  }
  return {
    archetype: studio.archetype,
    stage: clampStage(studio.stage),
    foundationAt: studio.foundationAt?.toISOString() ?? null,
    workstationAt: studio.workstationAt?.toISOString() ?? null,
    billboardAt: studio.billboardAt?.toISOString() ?? null,
  };
}

/** True when a signed-in user should land in the studio instead of the dashboard. */
export async function needsStudio(userId: string): Promise<boolean> {
  try {
    const studio = await prisma.studio.findUnique({ where: { userId }, select: { stage: true } });
    return !studio || studio.stage < 3;
  } catch (error) {
    // Never block sign-in on this (e.g. migration 028 not applied yet): fall back to the dashboard.
    console.error('[studio] needsStudio failed:', error);
    return false;
  }
}
