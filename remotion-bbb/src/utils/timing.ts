export const FPS = 30;
export const TOTAL_DURATION_SECONDS = 28;
export const TOTAL_FRAMES = FPS * TOTAL_DURATION_SECONDS; // 840 frames

// Scene timing in frames
export const scenes = {
  // ACT 1: THE WEIGHT (0:00 - 0:08)
  scene1: { start: 0, duration: 90 },      // 0:00 - 0:03 "Nobody taught you this."
  scene2: { start: 90, duration: 75 },     // 0:03 - 0:05.5 "How to keep going."
  scene3: { start: 165, duration: 75 },    // 0:05.5 - 0:08 "When it's just you."

  // ACT 2: THE BUILD (0:08 - 0:18)
  scene4: { start: 240, duration: 75 },    // 0:08 - 0:10.5 "So you learn."
  scene5: { start: 315, duration: 60 },    // 0:10.5 - 0:12.5 "One day."
  scene6: { start: 375, duration: 60 },    // 0:12.5 - 0:14.5 "One brick."
  scene7: { start: 435, duration: 105 },   // 0:14.5 - 0:18 Quick cuts montage

  // ACT 3: THE RISE (0:18 - 0:28)
  scene8: { start: 540, duration: 150 },   // 0:18 - 0:23 Rapid montage (scenes 8-10)
  scene11: { start: 690, duration: 60 },   // 0:23 - 0:25 "Until it's built."
  scene12: { start: 750, duration: 90 },   // 0:25 - 0:28 Brand reveal
} as const;

// Helper to convert seconds to frames
export const secondsToFrames = (seconds: number): number => Math.round(seconds * FPS);

// Helper to convert frames to seconds
export const framesToSeconds = (frames: number): number => frames / FPS;

// Get scene end frame
export const getSceneEnd = (scene: { start: number; duration: number }): number => {
  return scene.start + scene.duration;
};
