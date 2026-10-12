import prisma from '@/lib/db';
import { normalizeArchetypeName } from '@/lib/archetype-names';

/**
 * Server-only. The latest public scan for an X handle, from our own scan log
 * ("BrandScans", written by every homepage scan). Link previews and share
 * pages read this instead of trusting score numbers in the URL, so a shared
 * link always shows the real result and can't be edited into a fake score.
 */

export interface PublicScan {
  handle: string;
  name: string;
  score: number;
  archetype: string | null;
  phases: { define: number; check: number; generate: number; scale: number } | null;
}

const HANDLE_RE = /^[a-z0-9_]{1,30}$/;

export async function getPublicScan(rawHandle: string): Promise<PublicScan | null> {
  const handle = rawHandle.replace(/^@/, '').toLowerCase();
  if (!HANDLE_RE.test(handle)) return null;
  try {
    const [row, profile] = await Promise.all([
      prisma.brandScans.findFirst({
        where: { username: { equals: handle, mode: 'insensitive' } },
        orderBy: { createdAt: 'desc' },
        select: { username: true, score: true, archetype: true, phaseScores: true },
      }),
      prisma.xProfileCache
        .findUnique({ where: { username: handle }, select: { profileData: true } })
        .catch(() => null),
    ]);
    if (!row) return null;
    let phases: PublicScan['phases'] = null;
    try {
      const p = row.phaseScores ? (JSON.parse(row.phaseScores) as Record<string, unknown>) : null;
      const n = (k: string) => (typeof p?.[k] === 'number' ? Math.round(p[k] as number) : null);
      const [d, c, g, s] = ['define', 'check', 'generate', 'scale'].map(n);
      if (d !== null && c !== null && g !== null && s !== null)
        phases = { define: d, check: c, generate: g, scale: s };
    } catch {
      phases = null;
    }
    let name = handle;
    try {
      const pd = profile?.profileData
        ? (JSON.parse(profile.profileData) as { name?: unknown })
        : null;
      if (typeof pd?.name === 'string' && pd.name.trim()) name = pd.name.trim().slice(0, 50);
    } catch {
      // keep the handle as the name
    }
    return {
      handle,
      name,
      score: row.score,
      archetype: row.archetype ? normalizeArchetypeName(row.archetype) : null,
      phases,
    };
  } catch (e) {
    console.error('[public-scan] lookup failed', e);
    return null;
  }
}
