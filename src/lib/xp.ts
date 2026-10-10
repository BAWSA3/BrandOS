// BrandOS XP: a level that only goes up, earned by showing up, growing the
// brand score, doing the work, and posting. Private to the creator for now;
// later the highest levels get first look at agency brand deals.
// Preview-only so far: nothing awards XP from real events yet.

/** XP per event. */
export const XP_RULES = {
  /** first dashboard visit of the day */
  dailyVisit: 25,
  /** per consecutive day in the current streak (capped at 7 days) */
  streakDay: 10,
  streakCap: 7,
  /** per brand-score point gained (drops never take XP away) */
  scorePoint: 40,
  rescan: 30,
  /** a station floor built (Foundation, Workstation, Billboard) */
  floorBuilt: 150,
  /** a coaching / 30-Day Build task finished */
  task: 50,
  /** a scanned post with fit >= ON_BRAND_FIT */
  onBrandPost: 60,
  /** any other scored post */
  scoredPost: 20,
} as const;

export const ON_BRAND_FIT = 80;

/** XP needed to go from `level` to `level + 1`: 250, 500, 750, ... */
export function xpToNext(level: number): number {
  return 250 * level;
}

/** Total XP at which `level` starts (level 1 starts at 0). */
export function xpAtLevel(level: number): number {
  return 125 * level * (level - 1);
}

/** Where a running XP total sits: its level and progress into that level. */
export function levelFor(total: number): { level: number; into: number; need: number } {
  let level = 1;
  while (xpAtLevel(level + 1) <= total) level++;
  return { level, into: total - xpAtLevel(level), need: xpToNext(level) };
}

/** One line of XP earned since the last visit (shown under the bar). */
export type XPGain = { label: string; xp: number };
