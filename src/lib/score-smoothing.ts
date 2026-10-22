/**
 * Score smoothing for returning handles. The model is non-deterministic, so a
 * rescan of the same feed can land several points away; a creator who sees
 * 74 → 66 overnight stops trusting the number. A new score may move at most
 * MAX_DRIFT points from the stored one, and the allowance grows with time
 * since the last scan, so real change over months still shows. Pure: no DB.
 */

const DAY_MS = 86_400_000;

/** How far a new score may move from the stored one, by days since that scan. */
export function maxDrift(daysSinceLastScan: number): number {
  if (daysSinceLastScan <= 7) return 3;
  if (daysSinceLastScan <= 30) return 5;
  return 12;
}

export function smoothScore(
  raw: number,
  stored: { score: number; scannedAt: Date } | null,
  now: Date = new Date()
): number {
  if (!stored) return raw;
  const drift = maxDrift((now.getTime() - stored.scannedAt.getTime()) / DAY_MS);
  return Math.min(stored.score + drift, Math.max(stored.score - drift, raw));
}
