import supabase from './supabase';

/**
 * BrandOS Scan Tracking
 *
 * Tracks every brand score scan in Supabase for analytics.
 * Table: BrandScans
 */

export interface BrandScanRecord {
  id?: string;
  username: string;
  score: number;
  archetype: string;
  enhanced: boolean;
  created_at?: string;
}

/**
 * Record a brand scan to Supabase
 */
export async function recordScan(scan: {
  username: string;
  score: number;
  archetype?: string;
  enhanced: boolean;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('BrandScans').insert({
      username: scan.username.toLowerCase(),
      score: scan.score,
      archetype: scan.archetype || 'unknown',
      enhanced: scan.enhanced,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error('[ScanTracking] Supabase error:', error);
      return { success: false, error: error.message };
    }

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
