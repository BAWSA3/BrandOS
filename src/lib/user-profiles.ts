import fs from 'fs';
import path from 'path';

/**
 * User Profile Storage System
 *
 * Persists user data including archetypes to enable consistency
 * across scans and track evolution over time.
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

interface ProfileStorage {
  profiles: Record<string, UserProfile>;
  lastUpdated: number;
}

// File path for storage
const DATA_DIR = path.join(process.cwd(), 'data');
const PROFILES_FILE = path.join(DATA_DIR, 'user-profiles.json');
const MAX_SCORE_HISTORY = 20;

/**
 * Ensure data directory exists
 */
function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

/**
 * Read all profiles from storage
 */
export function readProfiles(): ProfileStorage {
  ensureDataDir();

  if (!fs.existsSync(PROFILES_FILE)) {
    return { profiles: {}, lastUpdated: Date.now() };
  }

  try {
    const data = fs.readFileSync(PROFILES_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading user profiles:', error);
    return { profiles: {}, lastUpdated: Date.now() };
  }
}

/**
 * Write all profiles to storage
 */
function writeProfiles(storage: ProfileStorage): void {
  ensureDataDir();
  storage.lastUpdated = Date.now();
  fs.writeFileSync(PROFILES_FILE, JSON.stringify(storage, null, 2));
}

/**
 * Normalize username for consistent lookups (lowercase)
 */
export function normalizeUsername(username: string): string {
  return username.toLowerCase().replace(/^@/, '').trim();
}

/**
 * Get a user profile by username
 */
export function getUserProfile(username: string): UserProfile | null {
  const normalized = normalizeUsername(username);
  const storage = readProfiles();
  return storage.profiles[normalized] || null;
}

/**
 * Check if a user exists in storage
 */
export function userExists(username: string): boolean {
  return getUserProfile(username) !== null;
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
    archetypeHistory: [{
      archetype: archetypeWithTimestamp,
      reason: 'initial',
      score,
      timestamp: now,
    }],
    scores: [{ value: score, scannedAt: now }],
    highestScore: score,
    currentScore: score,
    firstScannedAt: now,
    lastScannedAt: now,
    totalScans: 1,
  };

  const storage = readProfiles();
  storage.profiles[normalized] = profile;
  writeProfiles(storage);

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
  const storage = readProfiles();
  const profile = storage.profiles[normalized];

  if (!profile) {
    console.error(`[UserProfiles] Cannot update - user @${username} not found`);
    return null;
  }

  const now = Date.now();

  // Update scan stats
  profile.lastScannedAt = now;
  profile.totalScans += 1;
  profile.currentScore = score;

  if (score > profile.highestScore) {
    profile.highestScore = score;
  }

  // Add to score history (keep last 20)
  profile.scores.push({ value: score, scannedAt: now });
  if (profile.scores.length > MAX_SCORE_HISTORY) {
    profile.scores = profile.scores.slice(-MAX_SCORE_HISTORY);
  }

  // Update archetype if evolution occurred
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
    console.log(`[UserProfiles] @${profile.displayName} evolved: ${historyEntry.previousArchetype} -> ${newArchetype.primary}`);
  }

  storage.profiles[normalized] = profile;
  writeProfiles(storage);

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
 * Get all profiles (for admin/debugging)
 */
export function getAllProfiles(): UserProfile[] {
  const storage = readProfiles();
  return Object.values(storage.profiles);
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
  const daysSinceArchetypeChange = Math.floor((now - profile.archetype.assignedAt) / (1000 * 60 * 60 * 24));

  const scoreSum = profile.scores.reduce((sum, s) => sum + s.value, 0);
  const averageScore = profile.scores.length > 0 ? Math.round(scoreSum / profile.scores.length) : 0;

  // Score change from first to current
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
