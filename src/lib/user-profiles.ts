import supabase from './supabase';

/**
 * User Profile Storage System
 *
 * Persists user archetype data in Supabase to enable consistency
 * across scans and track evolution over time.
 *
 * Table: UserProfiles (created via Supabase)
 */

// Types
export interface ArchetypeData {
  primary: string;
  emoji: string;
  tagline: string;
  description?: string;
  strengths?: string[];
  growthTip?: string;
  assignedAt: number; // timestamp
}

export interface ScoreRecord {
  value: number;
  scannedAt: number;
}

export interface ArchetypeHistoryEntry {
  archetype: ArchetypeData;
  previousArchetype?: string;
  reason: 'initial' | 'evolution' | 'manual_reevaluate';
  score: number;
  timestamp: number;
}

export interface UserProfile {
  username: string; // normalized, lowercase
  displayName: string; // original casing
  archetype: ArchetypeData;
  archetypeHistory: ArchetypeHistoryEntry[];
  scores: ScoreRecord[]; // last 20 scans
  highestScore: number;
  currentScore: number;
  firstScannedAt: number;
  lastScannedAt: number;
  totalScans: number;
}

const MAX_SCORE_HISTORY = 20;

// Security: Keys that could cause prototype pollution
const DANGEROUS_KEYS = ['__proto__', 'constructor', 'prototype'];

/**
 * Normalize username for consistent lookups (lowercase)
 */
export function normalizeUsername(username: string): string {
  const normalized = username.toLowerCase().replace(/^@/, '').trim();

  if (DANGEROUS_KEYS.includes(normalized)) {
    throw new Error('Invalid username');
  }

  return normalized;
}

/**
 * Get a user profile by username from Supabase
 */
export function getUserProfile(username: string): UserProfile | null {
  // This is called synchronously by the archetype engine, but we need async DB access.
  // We use a cache that gets populated by the async versions below.
  const normalized = normalizeUsername(username);
  return profileCache[normalized] || null;
}

// In-memory cache populated by async calls (lives for the duration of the serverless invocation)
const profileCache: Record<string, UserProfile> = {};

/**
 * Async: Get a user profile from Supabase
 */
export async function getUserProfileAsync(username: string): Promise<UserProfile | null> {
  const normalized = normalizeUsername(username);

  // Check in-memory cache first
  if (profileCache[normalized]) {
    return profileCache[normalized];
  }

  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('username', normalized)
      .single();

    if (error || !data) return null;

    const profile: UserProfile = {
      username: data.username,
      displayName: data.display_name,
      archetype: JSON.parse(data.archetype),
      archetypeHistory: JSON.parse(data.archetype_history || '[]'),
      scores: JSON.parse(data.scores || '[]'),
      highestScore: data.highest_score,
      currentScore: data.current_score,
      firstScannedAt: data.first_scanned_at,
      lastScannedAt: data.last_scanned_at,
      totalScans: data.total_scans,
    };

    // Cache it for the duration of this request
    profileCache[normalized] = profile;
    return profile;
  } catch (err) {
    console.error('[UserProfiles] Error fetching profile:', err);
    return null;
  }
}

/**
 * Check if a user exists in storage
 */
export function userExists(username: string): boolean {
  return getUserProfile(username) !== null;
}

/**
 * Save/upsert a profile to Supabase
 */
async function saveProfile(profile: UserProfile): Promise<void> {
  const normalized = normalizeUsername(profile.username);
  profileCache[normalized] = profile;

  try {
    const { error } = await supabase
      .from('user_profiles')
      .upsert({
        username: normalized,
        display_name: profile.displayName,
        archetype: JSON.stringify(profile.archetype),
        archetype_history: JSON.stringify(profile.archetypeHistory),
        scores: JSON.stringify(profile.scores),
        highest_score: profile.highestScore,
        current_score: profile.currentScore,
        first_scanned_at: profile.firstScannedAt,
        last_scanned_at: profile.lastScannedAt,
        total_scans: profile.totalScans,
      }, { onConflict: 'username' });

    if (error) {
      console.error('[UserProfiles] Supabase upsert error:', error);
    }
  } catch (err) {
    console.error('[UserProfiles] Error saving profile:', err);
  }
}

/**
 * Create a new user profile
 */
export function createUserProfile(
  username: string,
  displayName: string,
  archetype: Omit<ArchetypeData, 'assignedAt'>,
  score: number
): UserProfile {
  const normalized = normalizeUsername(username);
  const now = Date.now();

  const archetypeWithTimestamp: ArchetypeData = {
    ...archetype,
    assignedAt: now,
  };

  const profile: UserProfile = {
    username: normalized,
    displayName,
    archetype: archetypeWithTimestamp,
    archetypeHistory: [
      {
        archetype: archetypeWithTimestamp,
        reason: 'initial',
        score,
        timestamp: now,
      },
    ],
    scores: [{ value: score, scannedAt: now }],
    highestScore: score,
    currentScore: score,
    firstScannedAt: now,
    lastScannedAt: now,
    totalScans: 1,
  };

  // Cache immediately (sync) + persist to DB (async, non-blocking)
  profileCache[normalized] = profile;
  saveProfile(profile).catch((err) => console.error('[UserProfiles] Save error:', err));

  console.log(`[UserProfiles] Created new profile for @${displayName}`);
  return profile;
}

/**
 * Update an existing user profile with a new scan
 */
export function updateUserScan(
  username: string,
  score: number,
  newArchetype?: ArchetypeData,
  evolutionReason?: 'evolution' | 'manual_reevaluate'
): UserProfile | null {
  const normalized = normalizeUsername(username);
  const profile = profileCache[normalized];

  if (!profile) {
    console.error(`[UserProfiles] Cannot update - user @${username} not found in cache`);
    return null;
  }

  const now = Date.now();

  profile.lastScannedAt = now;
  profile.totalScans += 1;
  profile.currentScore = score;

  if (score > profile.highestScore) {
    profile.highestScore = score;
  }

  profile.scores.push({ value: score, scannedAt: now });
  if (profile.scores.length > MAX_SCORE_HISTORY) {
    profile.scores = profile.scores.slice(-MAX_SCORE_HISTORY);
  }

  if (newArchetype && evolutionReason) {
    const historyEntry: ArchetypeHistoryEntry = {
      archetype: newArchetype,
      previousArchetype: profile.archetype.primary,
      reason: evolutionReason,
      score,
      timestamp: now,
    };
    profile.archetypeHistory.push(historyEntry);
    profile.archetype = newArchetype;
    console.log(
      `[UserProfiles] @${profile.displayName} evolved: ${historyEntry.previousArchetype} -> ${newArchetype.primary}`
    );
  }

  profileCache[normalized] = profile;
  saveProfile(profile).catch((err) => console.error('[UserProfiles] Save error:', err));

  return profile;
}

/**
 * Force update a user's archetype (for manual reevaluation)
 */
export function updateUserArchetype(
  username: string,
  newArchetype: Omit<ArchetypeData, 'assignedAt'>,
  score: number
): UserProfile | null {
  const archetypeWithTimestamp: ArchetypeData = {
    ...newArchetype,
    assignedAt: Date.now(),
  };

  return updateUserScan(username, score, archetypeWithTimestamp, 'manual_reevaluate');
}

/**
 * Get archetype history for a user
 */
export function getArchetypeHistory(username: string): ArchetypeHistoryEntry[] {
  const profile = getUserProfile(username);
  return profile?.archetypeHistory || [];
}

/**
 * Get a recent score for a user (within maxAge ms, default 24h)
 */
export function getRecentScore(
  username: string,
  maxAgeMs: number = 24 * 60 * 60 * 1000
): UserProfile | null {
  const profile = getUserProfile(username);
  if (!profile) return null;

  if (Date.now() - profile.lastScannedAt > maxAgeMs) return null;

  return profile;
}

/**
 * Get all profiles (for admin/debugging)
 */
export function getAllProfiles(): UserProfile[] {
  return Object.values(profileCache);
}

/**
 * Get user stats summary
 */
export function getUserStats(username: string): {
  totalScans: number;
  daysSinceFirstScan: number;
  daysSinceArchetypeChange: number;
  scoreChange: number;
  averageScore: number;
} | null {
  const profile = getUserProfile(username);
  if (!profile) return null;

  const now = Date.now();
  const daysSinceFirstScan = Math.floor((now - profile.firstScannedAt) / (1000 * 60 * 60 * 24));
  const daysSinceArchetypeChange = Math.floor(
    (now - profile.archetype.assignedAt) / (1000 * 60 * 60 * 24)
  );

  const scoreSum = profile.scores.reduce((sum, s) => sum + s.value, 0);
  const averageScore = profile.scores.length > 0 ? Math.round(scoreSum / profile.scores.length) : 0;

  const firstScore = profile.scores[0]?.value || profile.currentScore;
  const scoreChange = profile.currentScore - firstScore;

  return {
    totalScans: profile.totalScans,
    daysSinceFirstScan,
    daysSinceArchetypeChange,
    scoreChange,
    averageScore,
  };
}

// Re-export for backwards compat (no longer used but prevents import errors)
export function readProfiles(): { profiles: Record<string, UserProfile>; lastUpdated: number } {
  return { profiles: profileCache, lastUpdated: Date.now() };
}
