import prisma from '@/lib/db';
import { getArchetypeInfo } from '@/lib/archetype-descriptions';
import { extractIntelligence, type ScanIntelligence } from '@/lib/scan-tracking';
import { brandLink } from '@/lib/post-analysis';

/**
 * The MCP's analyze_profile answer: the full brand read a BrandOS scan
 * already produces (summary, the four phases, pillars, what's working, what's
 * holding it back, next moves), not just score + archetype.
 *
 * Source, in order: the asker's own account scan (their dashboard's read), a
 * public scan from the last 7 days with its full read, else a fresh scan.
 */

const SITE = 'https://mybrandos.app';
const RECENT_DAYS = 7;
const DAY_MS = 86_400_000;

export interface ProfileRead {
  handle: string;
  score: number;
  archetype: string | null;
  intel: ScanIntelligence;
  scannedAt: Date | null;
  own: boolean;
}

const parse = <T>(v: unknown): T | undefined => {
  if (v == null) return undefined;
  if (typeof v !== 'string') return v as T;
  try {
    return JSON.parse(v) as T;
  } catch {
    return undefined;
  }
};
const strs = (v: unknown): string[] | undefined => {
  const a = parse<unknown>(v);
  return Array.isArray(a) ? a.filter((x): x is string => typeof x === 'string') : undefined;
};

function intelFrom(row: {
  phaseScores: unknown;
  strengths: unknown;
  improvements: unknown;
  summary: string | null;
  influenceTier: string | null;
  nextMoves: unknown;
  contentPillars: unknown;
}): ScanIntelligence {
  return {
    phaseScores: parse<ScanIntelligence['phaseScores']>(row.phaseScores),
    strengths: strs(row.strengths),
    improvements: strs(row.improvements),
    summary: row.summary ?? undefined,
    influenceTier: row.influenceTier ?? undefined,
    nextMoves: strs(row.nextMoves),
    contentPillars: strs(row.contentPillars),
  };
}

/** A read is worth returning only if the scan produced its analysis. */
const isFull = (i: ScanIntelligence) => !!i.summary && !!i.phaseScores;

const SELECT = {
  score: true,
  archetype: true,
  phaseScores: true,
  strengths: true,
  improvements: true,
  summary: true,
  influenceTier: true,
  nextMoves: true,
  contentPillars: true,
} as const;

/** A stored read (no new scan, not metered), or null when a fresh scan is needed. */
export async function storedRead(handle: string, viewerId: string): Promise<ProfileRead | null> {
  const mine = await prisma.platformConnection
    .findFirst({
      where: { userId: viewerId, platform: 'x', status: 'active' },
      select: { platformUsername: true },
    })
    .catch(() => null);
  if (mine && mine.platformUsername.toLowerCase() === handle.toLowerCase()) {
    const scan = await prisma.brandScan
      .findFirst({
        where: { userId: viewerId, status: 'active' },
        orderBy: { scannedAt: 'desc' },
        select: { ...SELECT, scannedAt: true },
      })
      .catch(() => null);
    if (scan) {
      const intel = intelFrom(scan);
      if (isFull(intel))
        return {
          handle,
          score: scan.score,
          archetype: scan.archetype,
          intel,
          scannedAt: scan.scannedAt,
          own: true,
        };
    }
  }
  const pub = await prisma.brandScans
    .findFirst({
      where: {
        username: { equals: handle, mode: 'insensitive' },
        createdAt: { gte: new Date(Date.now() - RECENT_DAYS * DAY_MS) },
        summary: { not: null },
      },
      orderBy: { createdAt: 'desc' },
      select: { ...SELECT, createdAt: true },
    })
    .catch(() => null);
  if (!pub) return null;
  const intel = intelFrom(pub);
  return isFull(intel)
    ? {
        handle,
        score: pub.score,
        archetype: pub.archetype,
        intel,
        scannedAt: pub.createdAt,
        own: false,
      }
    : null;
}

/** Build a read from a fresh computeBrandScore() result. */
export function freshRead(handle: string, brandScore: Record<string, unknown>): ProfileRead {
  const archetype = (brandScore.archetype as { primary?: string } | undefined)?.primary ?? null;
  return {
    handle,
    score: Math.round(Number(brandScore.overallScore) || 0),
    archetype,
    intel: brandScore._fallback ? {} : extractIntelligence(brandScore),
    scannedAt: new Date(),
    own: false,
  };
}

const PHASES = [
  ['define', 'Define'],
  ['check', 'Check'],
  ['generate', 'Generate'],
  ['scale', 'Scale'],
] as const;

export function renderProfileRead(r: ProfileRead): string {
  const info = r.archetype ? getArchetypeInfo(r.archetype) : null;
  const who = r.own ? 'Your brand' : `@${r.handle}`;
  const i = r.intel;
  const lines: string[] = [
    `${who} · BrandOS score ${r.score}/100${info ? ` · ${info.name}: ${info.tagline}` : ''}`,
  ];
  if (i.summary) lines.push('', i.summary);
  if (i.phaseScores) {
    const p = i.phaseScores;
    const weakest = PHASES.reduce((a, b) => (p[b[0]] < p[a[0]] ? b : a));
    lines.push(
      '',
      `Phases: ${PHASES.map(([k, l]) => `${l} ${p[k]}`).join(' · ')} (weakest: ${weakest[1]})`
    );
  }
  const meta = [
    i.contentPillars?.length ? `Pillars: ${i.contentPillars.slice(0, 4).join(' · ')}` : null,
    i.influenceTier ? `Influence: ${i.influenceTier}` : null,
  ].filter(Boolean);
  if (meta.length) lines.push(meta.join(' · '));
  const list = (title: string, items?: string[], numbered = false) => {
    if (!items?.length) return;
    lines.push('', title);
    items.slice(0, 3).forEach((t, n) => lines.push(numbered ? `${n + 1}) ${t}` : `- ${t}`));
  };
  list("What's working", i.strengths);
  list("What's holding it back", i.improvements);
  list('Next moves', i.nextMoves, true);
  if (!i.summary && !i.phaseScores)
    lines.push('', 'This was a quick read; the full breakdown is on the dashboard.');
  lines.push(
    '',
    `Go deeper: paste any of ${r.own ? 'your' : `@${r.handle}'s`} X post links for a post-by-post breakdown.`,
    r.own
      ? `Your dashboard: ${SITE}/dashboard?utm_source=mcp&utm_medium=analyze_profile`
      : `Full brand dashboard: ${brandLink(r.handle, 'analyze_profile')}`
  );
  return lines.join('\n');
}

/** Structured data for the BrandOS card (MCP App view). */
export function profileCard(r: ProfileRead) {
  const info = r.archetype ? getArchetypeInfo(r.archetype) : null;
  const i = r.intel;
  return {
    kind: 'profile' as const,
    handle: r.handle,
    own: r.own,
    score: r.score,
    archetype: info ? { name: info.name, tagline: info.tagline } : null,
    // the card keeps the read scannable: the first two sentences of the summary
    summary: i.summary
      ? (i.summary
          .match(/[^.!?]+[.!?]+/g)
          ?.slice(0, 2)
          .join('')
          .trim() ?? i.summary)
      : null,
    phases: i.phaseScores ?? null,
    pillars: i.contentPillars?.slice(0, 4) ?? [],
    influence: i.influenceTier ? i.influenceTier.split(/[\s(]/)[0] : null,
    strengths: i.strengths?.slice(0, 3) ?? [],
    improvements: i.improvements?.slice(0, 3) ?? [],
    nextMoves: i.nextMoves?.slice(0, 3) ?? [],
    dashboardUrl: r.own
      ? `${SITE}/dashboard?utm_source=mcp&utm_medium=analyze_profile`
      : brandLink(r.handle, 'analyze_profile'),
  };
}
