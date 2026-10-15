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
