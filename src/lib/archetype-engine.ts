import {
  getUserProfile,
  createUserProfile,
  updateUserScan,
  updateUserArchetype,
  getUserStats,
  ArchetypeData,
  UserProfile,
} from './user-profiles';

/**
 * Archetype Consistency Engine
 *
 * Ensures archetypes remain stable for returning users and only
 * change through earned evolution, not random LLM variance.
 */

// Evolution configuration
const EVOLUTION_CONFIG = {
  MIN_DAYS_SINCE_LAST_CHANGE: 30,
  MIN_TOTAL_SCANS: 3,
  MIN_SCORE_CHANGE_FOR_EVOLUTION: 15,
  MAX_DAYS_BEFORE_AUTO_ELIGIBLE: 90,
};

// Archetype evolution paths (directional progression)
// Key = current archetype, Value = array of valid next archetypes
const EVOLUTION_PATHS: Record<string, string[]> = {
  'Underdog Arc': ['The Degen', 'The Anon', 'Chief Vibes Officer', 'The Plug', 'Ship or Die', 'The Professor', 'The Prophet'],
  'The Degen': ['Ship or Die', 'The Prophet'],
  'The Anon': ['The Prophet', 'The Professor'],
  'Chief Vibes Officer': ['The Plug', 'The Prophet'],
  'The Plug': ['The Prophet', 'The Professor'],
  'Ship or Die': ['The Professor', 'The Prophet'],
  'The Professor': [], // Terminal - doesn't evolve
  'The Prophet': [], // Terminal - peak archetype
};

// Archetype tier levels (higher = more evolved)
const ARCHETYPE_TIERS: Record<string, number> = {
  'Underdog Arc': 1,
  'The Degen': 2,
  'The Anon': 2,
  'Chief Vibes Officer': 2,
  'The Plug': 3,
  'Ship or Die': 3,
  'The Professor': 4,
  'The Prophet': 5, // Peak
};

export interface ArchetypeDecision {
  archetype: ArchetypeData;
  isNew: boolean;
  evolved: boolean;
  reason: 'new_user' | 'cached' | 'evolved' | 'forced_reevaluate';
  previousArchetype?: string;
  profile: UserProfile;
}

/**
 * Check if an evolution path is valid
 */
function isValidEvolutionPath(currentArchetype: string, newArchetype: string): boolean {
  const validPaths = EVOLUTION_PATHS[currentArchetype];
  if (!validPaths) return false;
  return validPaths.includes(newArchetype);
}

/**
 * Check if user is eligible for archetype evolution
 */
function checkEvolutionEligibility(
  profile: UserProfile,
  newScore: number
): { eligible: boolean; reason: string } {
  const stats = getUserStats(profile.username);
  if (!stats) {
    return { eligible: false, reason: 'Could not compute stats' };
  }

  const { daysSinceArchetypeChange, totalScans, scoreChange } = stats;

  // Check minimum time since last archetype change
  if (daysSinceArchetypeChange < EVOLUTION_CONFIG.MIN_DAYS_SINCE_LAST_CHANGE) {
    return {
      eligible: false,
      reason: `Only ${daysSinceArchetypeChange} days since last archetype change (need ${EVOLUTION_CONFIG.MIN_DAYS_SINCE_LAST_CHANGE})`,
    };
  }

  // Check minimum total scans
  if (totalScans < EVOLUTION_CONFIG.MIN_TOTAL_SCANS) {
    return {
      eligible: false,
      reason: `Only ${totalScans} scans (need ${EVOLUTION_CONFIG.MIN_TOTAL_SCANS})`,
    };
  }

  // Check score change OR time threshold
  const scoreChangedEnough = Math.abs(scoreChange) >= EVOLUTION_CONFIG.MIN_SCORE_CHANGE_FOR_EVOLUTION;
  const timeThresholdMet = daysSinceArchetypeChange >= EVOLUTION_CONFIG.MAX_DAYS_BEFORE_AUTO_ELIGIBLE;

  if (!scoreChangedEnough && !timeThresholdMet) {
    return {
      eligible: false,
      reason: `Score change (${scoreChange}) below threshold (${EVOLUTION_CONFIG.MIN_SCORE_CHANGE_FOR_EVOLUTION}) and not enough time passed`,
    };
  }

  // Check if new score exceeds highest score (evolution should be earned)
  if (newScore <= profile.highestScore) {
    return {
      eligible: false,
      reason: `New score (${newScore}) doesn't exceed highest score (${profile.highestScore})`,
    };
  }

  return { eligible: true, reason: 'All evolution criteria met' };
}

/**
 * Determine if a proposed evolution is an upgrade
 */
function isUpgrade(currentArchetype: string, newArchetype: string): boolean {
  const currentTier = ARCHETYPE_TIERS[currentArchetype] || 1;
  const newTier = ARCHETYPE_TIERS[newArchetype] || 1;
  return newTier > currentTier;
}

/**
 * Main function: Resolve archetype for a user
 *
 * This is THE KEY FUNCTION that ensures consistency:
 * - New users get Gemini's result
 * - Returning users get their cached archetype
 * - Evolution only happens when earned
 */
export async function resolveArchetype(
  username: string,
  displayName: string,
  geminiArchetype: Omit<ArchetypeData, 'assignedAt'>,
  newScore: number,
  forceReevaluate: boolean = false
): Promise<ArchetypeDecision> {
  const existingProfile = getUserProfile(username);

  // === CASE 1: New User ===
  if (!existingProfile) {
    console.log(`[ArchetypeEngine] New user @${displayName} - assigning Gemini result: ${geminiArchetype.primary}`);

    const profile = createUserProfile(username, displayName, geminiArchetype, newScore);

    return {
      archetype: profile.archetype,
      isNew: true,
      evolved: false,
      reason: 'new_user',
      profile,
    };
  }

  // === CASE 2: Force Reevaluate ===
  if (forceReevaluate) {
    console.log(`[ArchetypeEngine] Force reevaluate for @${displayName}`);

    const updatedProfile = updateUserArchetype(username, geminiArchetype, newScore);
    if (!updatedProfile) {
      throw new Error(`Failed to update archetype for ${username}`);
    }

    return {
      archetype: updatedProfile.archetype,
      isNew: false,
      evolved: true,
      reason: 'forced_reevaluate',
      previousArchetype: existingProfile.archetype.primary,
      profile: updatedProfile,
    };
  }

  // === CASE 3: Returning User - Check for Evolution ===
  const currentArchetype = existingProfile.archetype.primary;
  const proposedArchetype = geminiArchetype.primary;

  // If Gemini suggests the same archetype, just update scan stats
  if (currentArchetype === proposedArchetype) {
    const updatedProfile = updateUserScan(username, newScore);
    if (!updatedProfile) {
      throw new Error(`Failed to update scan for ${username}`);
    }

    console.log(`[ArchetypeEngine] @${displayName} - archetype unchanged: ${currentArchetype}`);

    return {
      archetype: updatedProfile.archetype,
      isNew: false,
      evolved: false,
      reason: 'cached',
      profile: updatedProfile,
    };
  }

  // Gemini suggests a different archetype - check if evolution is allowed
  console.log(`[ArchetypeEngine] @${displayName} - Gemini suggests ${proposedArchetype} (current: ${currentArchetype})`);

  // Check evolution eligibility
  const eligibility = checkEvolutionEligibility(existingProfile, newScore);

  if (!eligibility.eligible) {
    console.log(`[ArchetypeEngine] Evolution blocked: ${eligibility.reason}`);

    // Update scan but keep current archetype
    const updatedProfile = updateUserScan(username, newScore);
    if (!updatedProfile) {
      throw new Error(`Failed to update scan for ${username}`);
    }

    return {
      archetype: updatedProfile.archetype, // Keep existing
      isNew: false,
      evolved: false,
      reason: 'cached',
      profile: updatedProfile,
    };
  }

  // Check if this is a valid evolution path
  const validPath = isValidEvolutionPath(currentArchetype, proposedArchetype);
  const upgradeCheck = isUpgrade(currentArchetype, proposedArchetype);

  if (!validPath) {
    console.log(`[ArchetypeEngine] Invalid evolution path: ${currentArchetype} -> ${proposedArchetype}`);

    const updatedProfile = updateUserScan(username, newScore);
    if (!updatedProfile) {
      throw new Error(`Failed to update scan for ${username}`);
    }

    return {
      archetype: updatedProfile.archetype, // Keep existing
      isNew: false,
      evolved: false,
      reason: 'cached',
      profile: updatedProfile,
    };
  }

  if (!upgradeCheck) {
    console.log(`[ArchetypeEngine] Not an upgrade: ${currentArchetype} (tier ${ARCHETYPE_TIERS[currentArchetype]}) -> ${proposedArchetype} (tier ${ARCHETYPE_TIERS[proposedArchetype]})`);

    const updatedProfile = updateUserScan(username, newScore);
    if (!updatedProfile) {
      throw new Error(`Failed to update scan for ${username}`);
    }

    return {
      archetype: updatedProfile.archetype, // Keep existing
      isNew: false,
      evolved: false,
      reason: 'cached',
      profile: updatedProfile,
    };
  }

  // === EVOLUTION APPROVED ===
  console.log(`[ArchetypeEngine] EVOLUTION APPROVED: @${displayName} ${currentArchetype} -> ${proposedArchetype}`);

  const archetypeWithTimestamp: ArchetypeData = {
    ...geminiArchetype,
    assignedAt: Date.now(),
  };

  const updatedProfile = updateUserScan(username, newScore, archetypeWithTimestamp, 'evolution');
  if (!updatedProfile) {
    throw new Error(`Failed to evolve archetype for ${username}`);
  }

  return {
    archetype: updatedProfile.archetype,
    isNew: false,
    evolved: true,
    reason: 'evolved',
    previousArchetype: currentArchetype,
    profile: updatedProfile,
  };
}

/**
 * Get evolution info for a user (for UI display)
 */
export function getEvolutionInfo(username: string): {
  currentArchetype: string;
  currentTier: number;
  possibleEvolutions: string[];
  eligibilityStatus: { eligible: boolean; reason: string } | null;
} | null {
  const profile = getUserProfile(username);
  if (!profile) return null;

  const currentArchetype = profile.archetype.primary;
  const possibleEvolutions = EVOLUTION_PATHS[currentArchetype] || [];
  const currentTier = ARCHETYPE_TIERS[currentArchetype] || 1;

  // Check eligibility for informational purposes
  const eligibility = checkEvolutionEligibility(profile, profile.currentScore);

  return {
    currentArchetype,
    currentTier,
    possibleEvolutions,
    eligibilityStatus: eligibility,
  };
}

/**
 * Get all archetype definitions (for reference)
 */
export function getArchetypeDefinitions(): { name: string; tier: number; evolvesTo: string[] }[] {
  return Object.entries(ARCHETYPE_TIERS).map(([name, tier]) => ({
    name,
    tier,
    evolvesTo: EVOLUTION_PATHS[name] || [],
  }));
}
