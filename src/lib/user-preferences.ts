import { prisma } from '@/lib/db';
import { DEFAULT_COLORWAY, isColorway, type Colorway } from '@/lib/colorways';

/** The user's dashboard colorway (default until migration 036 / a choice exists). */
export async function getColorway(userId: string): Promise<Colorway> {
  try {
    const p = await prisma.userPreference.findUnique({
      where: { userId },
      select: { dashboardColorway: true },
    });
    return isColorway(p?.dashboardColorway) ? p.dashboardColorway : DEFAULT_COLORWAY;
  } catch {
    return DEFAULT_COLORWAY; // table not there yet
  }
}

export async function setColorway(userId: string, colorway: Colorway): Promise<void> {
  await prisma.userPreference.upsert({
    where: { userId },
    create: { userId, dashboardColorway: colorway },
    update: { dashboardColorway: colorway },
    // explicit select: the row's newer columns (052) may not exist yet
    select: { userId: true },
  });
}

export const PERSONAS = ['creator', 'founder', 'builder'] as const;
export type Persona = (typeof PERSONAS)[number];
export const isPersona = (v: unknown): v is Persona =>
  typeof v === 'string' && (PERSONAS as readonly string[]).includes(v);

/**
 * The first-run walkthrough state (migration 052). `done` is true when the
 * member finished or skipped it. `saved` is false before 052 is applied (or on
 * a read error): the client then falls back to this-device storage, so the
 * walkthrough never loops on every visit.
 */
export async function getWalkthrough(
  userId: string
): Promise<{ done: boolean; persona: Persona | null; saved: boolean }> {
  try {
    const p = await prisma.userPreference.findUnique({
      where: { userId },
      select: { walkthroughDoneAt: true, persona: true },
    });
    return {
      done: !!p?.walkthroughDoneAt,
      persona: isPersona(p?.persona) ? p.persona : null,
      saved: true,
    };
  } catch {
    return { done: false, persona: null, saved: false }; // 052 not applied yet
  }
}

/** Save the walkthrough as done and/or the persona answer. Own account only (caller checks). */
export async function setWalkthrough(
  userId: string,
  patch: { done?: true; persona?: Persona | null }
): Promise<void> {
  const data: { walkthroughDoneAt?: Date; persona?: Persona | null } = {};
  if (patch.done) data.walkthroughDoneAt = new Date();
  if (patch.persona !== undefined) data.persona = patch.persona;
  if (Object.keys(data).length === 0) return;
  await prisma.userPreference.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
    select: { userId: true },
  });
}

/**
 * A creator's skin by X handle (public page, MCP card). Handles without a
 * BrandOS account, or before migration 036: the default.
 */
export async function colorwayForHandle(handle: string): Promise<Colorway> {
  try {
    const conn = await prisma.platformConnection.findFirst({
      where: { platform: 'x', platformUsername: { equals: handle, mode: 'insensitive' } },
      select: { userId: true },
    });
    const userId =
      conn?.userId ??
      (
        await prisma.user.findFirst({
          where: { xUsername: { equals: handle, mode: 'insensitive' } },
          select: { id: true },
        })
      )?.id;
    return userId ? await getColorway(userId) : DEFAULT_COLORWAY;
  } catch {
    return DEFAULT_COLORWAY;
  }
}
