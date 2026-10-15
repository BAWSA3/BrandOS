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
