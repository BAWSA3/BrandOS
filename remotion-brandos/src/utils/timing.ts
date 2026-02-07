/**
 * Timing configuration for 15-second Archetypes video
 * 450 frames @ 30fps
 */

export const FPS = 30;
export const DURATION_SECONDS = 15;
export const TOTAL_FRAMES = FPS * DURATION_SECONDS; // 450

// Scene breakdown
export const timing = {
  // Opening: "8 ARCHETYPES" reveal (0-1.5s)
  opening: {
    start: 0,
    duration: 45, // 1.5s
  },

  // Archetypes showcase (1.5-12s = 10.5s for 8 archetypes)
  // ~1.3s per archetype (39 frames each)
  archetypes: {
    start: 45,
    perArchetype: 39, // ~1.3s each
    totalDuration: 312, // 10.4s for all 8
  },

  // Logo reveal (12-15s)
  logo: {
    start: 357,
    duration: 93, // ~3.1s
  },
} as const;

// Helper: get archetype timing by index
export const getArchetypeTiming = (index: number) => {
  const start = timing.archetypes.start + index * timing.archetypes.perArchetype;
  return {
    start,
    duration: timing.archetypes.perArchetype,
  };
};

// Frame to seconds
export const framesToSeconds = (frames: number) => frames / FPS;
