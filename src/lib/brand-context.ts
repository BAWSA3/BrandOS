import prisma from '@/lib/db';
import type { BrandDNA } from '@/lib/types';
import { ownedBrandsWhere } from '@/lib/workspace-auth';

// Load a user's current brand (most recently updated one they own) as BrandDNA,
// for server-side callers such as the BrandOS MCP. Malformed JSON columns fall
// back to empty values instead of throwing.

function parseJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function loadCurrentBrand(
  userId: string,
  workspaceId: string | null
): Promise<BrandDNA | null> {
  const brand = await prisma.brand.findFirst({
    where: ownedBrandsWhere(workspaceId, userId),
    orderBy: { updatedAt: 'desc' },
  });
  if (!brand) return null;
  return {
    id: brand.id,
    name: brand.name,
    colors: parseJson(brand.colors, {
      primary: '#000000',
      secondary: '#ffffff',
      accent: '#0047FF',
    }),
    tone: parseJson(brand.tone, { minimal: 50, playful: 50, bold: 50, experimental: 50 }),
    keywords: parseJson<string[]>(brand.keywords, []),
    doPatterns: parseJson<string[]>(brand.doPatterns, []),
    dontPatterns: parseJson<string[]>(brand.dontPatterns, []),
    voiceSamples: parseJson<string[]>(brand.voiceSamples, []),
    voiceFingerprint: brand.voiceFingerprint ?? undefined,
    createdAt: brand.createdAt,
    updatedAt: brand.updatedAt,
  };
}
