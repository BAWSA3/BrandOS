import prisma from '@/lib/db';

const CACHE_WINDOW_HOURS = 24;

export async function getCachedScan(platformConnectionId: string) {
  const cutoff = new Date(Date.now() - CACHE_WINDOW_HOURS * 60 * 60 * 1000);

  const cached = await prisma.brandScan.findFirst({
    where: {
      platformConnectionId,
      status: 'active',
      scannedAt: { gte: cutoff },
    },
    orderBy: { scannedAt: 'desc' },
  });

  return cached;
}

export async function countScansToday(workspaceId: string): Promise<number> {
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);

  const count = await prisma.brandScan.count({
    where: {
      workspaceId,
      scannedAt: { gte: startOfDay },
    },
  });

  return count;
}
