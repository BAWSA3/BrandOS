// Tiny haptic ticks for touch devices (the "touch" half of the dashboard's game
// feel; sounds are the other half, src/lib/ui-sounds.ts). Uses the Vibration
// API, so it works on Android browsers; iOS Safari has no web haptics and this
// silently does nothing there. Skipped under reduced motion and when the user
// has turned UI sounds off (one switch for all feedback).

import { isSoundOn } from '@/lib/ui-sounds';

const PATTERNS = {
  /** a button / link / tile press */
  tap: 6,
  /** an XP gain landing */
  tick: 10,
  /** level up: three quick pulses */
  levelUp: [18, 40, 18, 40, 36],
  /** brand score changed */
  alert: [12, 60, 24],
} as const;

export type Haptic = keyof typeof PATTERNS;

export function haptic(kind: Haptic) {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!window.matchMedia('(pointer: coarse)').matches) return;
  if (!isSoundOn()) return;
  try {
    navigator.vibrate(PATTERNS[kind] as number | number[]);
  } catch {
    // some browsers throw before a user gesture; feedback is optional
  }
}
