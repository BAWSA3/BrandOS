import { revalidatePath } from 'next/cache';
import prisma from '@/lib/db';

/**
 * Trigger on-demand revalidation of the tier list pages
 */
// In-process: this only runs inside our own route handlers. (It used to call a
// public /api/revalidate that anyone could hit to force re-renders.)
async function revalidateTierList() {
  try {
    revalidatePath('/tier-list');
  } catch (e) {
    console.error('[ScanTracking] Revalidation failed:', e);
  }
}

/**
 * BrandOS Scan Tracking
 *
 * Tracks every brand score scan in Supabase for analytics.
 * Table: BrandScans
 */

export interface ScanIntelligence {
  phaseScores?: { define: number; check: number; generate: number; scale: number };
  insights?: {
    define?: string[];
    check?: string[];
    generate?: string[];
    scale?: string[];
  };
  strengths?: string[];
  improvements?: string[];
  summary?: string;
  influenceTier?: string;
  nextMoves?: string[];
  contentPillars?: string[];
}

export interface BrandScanRecord {
  id?: string;
  username: string;
  score: number;
  archetype: string;
  enhanced: boolean;
  phase_scores?: string;
  insights?: string;
  strengths?: string;
  improvements?: string;
  summary?: string;
  influence_tier?: string;
  next_moves?: string;
  content_pillars?: string;
  created_at?: string;
}

/**
 * Extract intelligence data from a Gemini brandScore response
 */
export function extractIntelligence(brandScore: Record<string, unknown>): ScanIntelligence {
  const phases = brandScore.phases as
    | {
        define?: { score: number; insights: string[] };
        check?: { score: number; insights: string[] };
        generate?: { score: number; insights: string[] };
        scale?: { score: number; insights: string[] };
      }
    | undefined;

  return {
    phaseScores: phases
      ? {
          define: phases.define?.score ?? 0,
          check: phases.check?.score ?? 0,
          generate: phases.generate?.score ?? 0,
          scale: phases.scale?.score ?? 0,
        }
      : undefined,
    insights: phases
      ? {
          define: phases.define?.insights,
          check: phases.check?.insights,
          generate: phases.generate?.insights,
          scale: phases.scale?.insights,
        }
      : undefined,
    strengths: (brandScore.topStrengths as string[]) || undefined,
    improvements: (brandScore.topImprovements as string[]) || undefined,
    summary: (brandScore.summary as string) || undefined,
    influenceTier: (brandScore.influenceTier as string) || undefined,
    nextMoves: (brandScore.nextMoves as string[]) || undefined,
    contentPillars: (brandScore.contentPillars as string[]) || undefined,
  };
}

/**
 * Record a brand scan to Supabase
 */
export async function recordScan(scan: {
  username: string;
  score: number;
  archetype?: string;
  enhanced: boolean;
  intelligence?: ScanIntelligence;
}): Promise<{ success: boolean; error?: string }> {
  try {
    // Server-side write (Prisma / service connection). The anon key no longer
    // has INSERT on BrandScans (migration 031): anyone could forge scan rows,
    // and link previews + breakdown emails read the latest row.
    await prisma.brandScans.create({
      data: {
        username: scan.username.toLowerCase(),
        score: scan.score,
        archetype: scan.archetype || 'unknown',
        enhanced: scan.enhanced,
        phaseScores: scan.intelligence?.phaseScores
          ? JSON.stringify(scan.intelligence.phaseScores)
          : null,
        insights: scan.intelligence?.insights ? JSON.stringify(scan.intelligence.insights) : null,
        strengths: scan.intelligence?.strengths
          ? JSON.stringify(scan.intelligence.strengths)
          : null,
        improvements: scan.intelligence?.improvements
          ? JSON.stringify(scan.intelligence.improvements)
          : null,
        summary: scan.intelligence?.summary || null,
        influenceTier: scan.intelligence?.influenceTier || null,
        nextMoves: scan.intelligence?.nextMoves
          ? JSON.stringify(scan.intelligence.nextMoves)
          : null,
        contentPillars: scan.intelligence?.contentPillars
          ? JSON.stringify(scan.intelligence.contentPillars)
          : null,
      },
    });

    // Revalidate tier list so new scans appear immediately
    revalidateTierList().catch(() => {});

    return { success: true };
  } catch (error) {
    console.error('[ScanTracking] Error recording scan:', error);
    return { success: false, error: String(error) };
  }
}

// Read helpers now live in brand-scans-read (Prisma); these names stay for
// existing callers.
export { totalScanCount as getScanCount } from './brand-scans-read';
export { uniqueScannedCount as getUniqueScanCount } from './brand-scans-read';
export { recentScans as getRecentScans } from './brand-scans-read';
