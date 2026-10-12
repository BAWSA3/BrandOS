import { prisma } from '@/lib/db';
import type { CurrentUser } from '@/lib/auth';
import { getReservationByHandle } from '@/lib/reservations';
import { normalizeArchetypeName } from '@/lib/archetype-names';
import { getArchetypeInfo } from '@/lib/archetype-descriptions';
import type { BrandPassData } from '@/components/dashboard/BrandPass';
import type { PhaseScore } from '@/components/dashboard/StatTiles';
import type { DashboardData } from '@/components/dashboard/BentoDashboard';
import type { StageNumber } from '@/lib/studio-stages';

// Server-only (Prisma). Real, per-user data for the title screen (/home) and the dashboard bento.
// Everything is read for the signed-in user only (BrandScan by userId, Station
// by ownerUserId, the reservation by their own X handle). Fields with no real
// source yet (post fit scores, weekly streak, follower change, XP, "since last
// visit") are left out, and the UI hides those tiles until they exist.

export interface ScanSummary {
  id: string;
  score: number;
  scannedAt: Date;
  phases?: PhaseScore[];
  insights?: Record<string, string[]>;
  summary?: string | null;
  archetype?: string | null;
  strengths?: string[];
  improvements?: string[];
  nextMoves?: string[];
  pillars?: string[];
}

export interface HomeData {
  handle: string;
  name: string;
  avatarUrl: string | null;
  /** Current archetype name, e.g. 'BUILD.EXE' (null until the first scan / reservation). */
  archetype: string | null;
  /** Interim until the studio build stage is stored: 3 once scanned, 0 before. */
  stage: StageNumber;
  stationNumber: number | null;
  score: number | null;
  /** Oldest first, for the trend line. */
  scans: ScanSummary[];
  phases: PhaseScore[];
  pillars: string[];
  summary: string | null;
  lastScannedAt: Date | null;
}

const PHASES: [string, string][] = [
  ['define', 'Define'],
  ['check', 'Check'],
  ['generate', 'Generate'],
  ['scale', 'Scale'],
];

function phaseValue(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return Math.round(v);
  if (v && typeof v === 'object' && 'score' in v) {
    const s = (v as { score: unknown }).score;
    if (typeof s === 'number' && Number.isFinite(s)) return Math.round(s);
  }
  return null;
}

/** Phase insights keyed by label ('Define' -> ['...']), up to 4 each. */
function toInsights(raw: unknown): Record<string, string[]> {
  if (!raw || typeof raw !== 'object') return {};
  const src = raw as Record<string, unknown>;
  const out: Record<string, string[]> = {};
  for (const [k, label] of PHASES) {
    const v = src[k];
    const list = Array.isArray(v)
      ? v
      : v && typeof v === 'object' && 'insights' in v
        ? (v as { insights: unknown }).insights
        : null;
    if (Array.isArray(list)) {
      const items = list
        .filter((x): x is string => typeof x === 'string')
        .map((x) => x.trim().slice(0, 400))
        .filter(Boolean)
        .slice(0, 4);
      if (items.length) out[label] = items;
    }
  }
  return out;
}

function toPhases(raw: unknown): PhaseScore[] {
  if (!raw || typeof raw !== 'object') return [];
  const ps = raw as Record<string, unknown>;
  const out: PhaseScore[] = [];
  for (const [k, label] of PHASES) {
    const v = phaseValue(ps[k]);
    if (v !== null) out.push({ key: label, value: Math.max(0, Math.min(100, v)) });
  }
  return out;
}

/** A JSON list of strings (scan strengths / fixes / next moves), capped. */
function toList(raw: unknown, max = 4): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((x): x is string => typeof x === 'string')
    .map((x) => x.trim().slice(0, 400))
    .filter(Boolean)
    .slice(0, max);
}

function toPillars(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((p) =>
      typeof p === 'string'
        ? p
        : p && typeof p === 'object' && 'name' in p
          ? String((p as { name: unknown }).name)
          : ''
    )
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 3);
}

export async function getHomeData(user: CurrentUser): Promise<HomeData> {
  const handle = (user.xUsername ?? '').replace(/^@/, '');
  const [scans, station, reservation] = await Promise.all([
    prisma.brandScan.findMany({
      where: { userId: user.id, status: 'active' },
      orderBy: { scannedAt: 'desc' },
      take: 12,
      select: {
        id: true,
        score: true,
        archetype: true,
        phaseScores: true,
        insights: true,
        strengths: true,
        improvements: true,
        nextMoves: true,
        contentPillars: true,
        summary: true,
        scannedAt: true,
      },
    }),
    prisma.station.findUnique({
      where: { ownerUserId: user.id },
      select: { reservationNumber: true, archetype: true },
    }),
    handle ? getReservationByHandle(handle).catch(() => null) : Promise.resolve(null),
  ]);
  const latest = scans[0] ?? null;
  const rawArchetype =
    (latest && latest.archetype !== 'unknown' ? latest.archetype : null) ??
    station?.archetype ??
    reservation?.archetype ??
    null;
  return {
    handle: handle || user.name || 'you',
    name: user.name || handle,
    avatarUrl: user.avatar ?? null,
    archetype: rawArchetype ? normalizeArchetypeName(rawArchetype) : null,
    stage: latest ? 3 : 0,
    stationNumber: station?.reservationNumber ?? reservation?.number ?? null,
    score: latest?.score ?? null,
    scans: scans
      .map((s) => ({
        id: s.id,
        score: s.score,
        scannedAt: s.scannedAt,
        phases: toPhases(s.phaseScores),
        insights: toInsights(s.insights),
        summary: s.summary,
        archetype:
          s.archetype && s.archetype !== 'unknown' ? normalizeArchetypeName(s.archetype) : null,
        strengths: toList(s.strengths),
        improvements: toList(s.improvements),
        nextMoves: toList(s.nextMoves),
        pillars: toPillars(s.contentPillars),
      }))
      .reverse(),
    phases: latest ? toPhases(latest.phaseScores) : [],
    pillars: latest ? toPillars(latest.contentPillars) : [],
    summary: latest?.summary ?? null,
    lastScannedAt: latest?.scannedAt ?? null,
  };
}

/** "2h ago", "3d ago" */
export function ago(d: Date, now = new Date()): string {
  const s = Math.max(0, (now.getTime() - d.getTime()) / 1000);
  if (s < 3600) return `${Math.max(1, Math.round(s / 60))}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  return `${Math.round(s / 86400)}d ago`;
}

/** The Brand Pass for this user, or null without a scan (it needs a score + archetype). */
export function toPass(h: HomeData): BrandPassData | null {
  if (h.score === null || !h.archetype) return null;
  const first = h.summary?.split(/(?<=[.!?])\s/)[0]?.trim();
  const taste =
    first && first.length <= 70 ? first : (getArchetypeInfo(h.archetype)?.tagline ?? h.archetype);
  const issued = h.lastScannedAt ?? new Date();
  return {
    handle: h.handle,
    name: h.name,
    avatarUrl: h.avatarUrl,
    archetype: h.archetype,
    taste,
    pillars: h.pillars,
    stationNumber: h.stationNumber ?? 0,
    score: h.score,
    issued: `${String(issued.getMonth() + 1).padStart(2, '0')}.${issued.getFullYear()}`,
  };
}

/** The dashboard bento from real data only (no fit scores, streak, followers or XP yet), or null before the first scan. */
export function toDashboardData(h: HomeData): DashboardData | null {
  const pass = toPass(h);
  if (!pass || h.score === null) return null;
  const label = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const prev = h.scans.length > 1 ? h.scans[h.scans.length - 2] : null;
  return {
    handle: h.handle,
    avatarUrl: h.avatarUrl,
    stage: h.stage,
    ticker: { score: h.score, scans: h.scans.length },
    scoreHistory: h.scans.map((s) => ({ label: label(s.scannedAt), value: s.score })),
    scoreDelta: prev ? { value: h.score - prev.score, since: label(prev.scannedAt) } : undefined,
    phases: h.phases.length ? h.phases : undefined,
    posts: [],
    scoreDetail: h.scans.map((s) => ({
      id: s.id,
      label: label(s.scannedAt),
      date: s.scannedAt.toISOString(),
      value: s.score,
      phases: s.phases ?? [],
      insights: s.insights ?? {},
      summary: s.summary ?? null,
      archetype: s.archetype ?? null,
      strengths: s.strengths ?? [],
      improvements: s.improvements ?? [],
      nextMoves: s.nextMoves ?? [],
      pillars: s.pillars ?? [],
    })),
    scans: h.scans
      .map((s, i) => ({
        id: s.id,
        label: `Scan · ${label(s.scannedAt)}`,
        score: s.score,
        delta: i > 0 ? s.score - h.scans[i - 1].score : undefined,
      }))
      .reverse()
      .slice(0, 4),
    pass,
  };
}
