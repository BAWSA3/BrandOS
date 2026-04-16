import supabase from './supabase';

/**
 * Trigger on-demand revalidation of the tier list pages
 */
async function revalidateTierList() {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mybrandos.app';
    await fetch(`${appUrl}/api/revalidate?path=/tier-list`, { method: 'GET' });
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
  const phases = brandScore.phases as {
    define?: { score: number; insights: string[] };
    check?: { score: number; insights: string[] };
    generate?: { score: number; insights: string[] };
    scale?: { score: number; insights: string[] };
  } | undefined;

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
    const { error } = await supabase.from('BrandScans').insert({
      username: scan.username.toLowerCase(),
      score: scan.score,
      archetype: scan.archetype || 'unknown',
      enhanced: scan.enhanced,
      phase_scores: scan.intelligence?.phaseScores
        ? JSON.stringify(scan.intelligence.phaseScores)
        : null,
      insights: scan.intelligence?.insights
        ? JSON.stringify(scan.intelligence.insights)
        : null,
      strengths: scan.intelligence?.strengths
        ? JSON.stringify(scan.intelligence.strengths)
        : null,
      improvements: scan.intelligence?.improvements
        ? JSON.stringify(scan.intelligence.improvements)
        : null,
      summary: scan.intelligence?.summary || null,
      influence_tier: scan.intelligence?.influenceTier || null,
      next_moves: scan.intelligence?.nextMoves
        ? JSON.stringify(scan.intelligence.nextMoves)
        : null,
      content_pillars: scan.intelligence?.contentPillars
        ? JSON.stringify(scan.intelligence.contentPillars)
        : null,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error('[ScanTracking] Supabase error:', error);
      return { success: false, error: error.message };
    }

    // Revalidate tier list so new scans appear immediately
    revalidateTierList().catch(() => {});

    return { success: true };
  } catch (error) {
    console.error('[ScanTracking] Error recording scan:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Get total scan count
 */
export async function getScanCount(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('BrandScans')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('[ScanTracking] Error getting count:', error);
      return 0;
    }

    return count || 0;
  } catch {
    return 0;
  }
}

/**
 * Get unique users scanned
 */
export async function getUniqueScanCount(): Promise<number> {
  try {
    const { data, error } = await supabase.from('BrandScans').select('username');

    if (error) {
      console.error('[ScanTracking] Error getting unique count:', error);
      return 0;
    }

    const unique = new Set(data?.map((d) => d.username) || []);
    return unique.size;
  } catch {
    return 0;
  }
}

/**
 * Get recent scans
 */
export async function getRecentScans(limit = 50): Promise<BrandScanRecord[]> {
  try {
    const { data, error } = await supabase
      .from('BrandScans')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[ScanTracking] Error getting recent scans:', error);
      return [];
    }

    return data || [];
  } catch {
    return [];
  }
}
