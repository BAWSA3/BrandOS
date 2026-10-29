import type { Lens } from '@/lib/live-marks';
import type { LiveState } from './types';

/**
 * How much of BrandOS is showing, per surface: it unlocks by milestone as the
 * draft grows (Bawsa's pick, 2026-10-28).
 *   first sentence (or a pause after 3 words) → voice marks
 *   hook done (first sentence ended, then a     → score + lane read + playbook
 *   pause or more writing)
 *   enough text                                → landing, proof, idea; the
 *                                                playbook line lights up
 * Pure (state in, opacities out), so the harness, the real room and a
 * Remotion composition all reveal the same way. The view animates these with
 * opacity/transform only, never layout.
 */

export interface Reveal {
  marks: Record<Lens, number>;
  score: number;
  playbook: number;
  /** The matched playbook line lights up (else lines stay neutral). */
  playbookLit: boolean;
  proof: number;
  idea: number;
}

export const ENOUGH_CHARS = 100;

function words(s: string) {
  return s.split(/\s+/).filter(Boolean).length;
}

export function milestones(text: string, paused = false) {
  const t = text.trim();
  const ends = t.match(/[^.!?\n]+[.!?\n]/g) ?? [];
  const ended = ends.length >= 1 && words(ends[0] ?? '') >= 3;
  // a pause after three words counts as finishing the thought
  const firstSentence = ended || (paused && words(t) >= 3);
  // the hook is done once the first sentence has ended and they've paused on
  // it or kept writing past it (so it stays done while they type on)
  const hook = ended && (paused || text.trimStart().length > (ends[0] ?? '').trim().length);
  return { firstSentence, hook, enough: [...t].length >= ENOUGH_CHARS };
}

export function reveal(s: LiveState): Reveal {
  const m = milestones(s.text, !s.typing);
  return {
    marks: { voice: m.firstSentence ? 1 : 0, lane: m.hook ? 1 : 0, landing: m.enough ? 1 : 0 },
    score: m.hook ? 1 : 0,
    playbook: m.hook ? 1 : 0,
    playbookLit: s.pillar !== null && m.enough,
    proof: s.proof && m.enough ? 1 : 0,
    idea: s.idea && m.enough ? 1 : 0,
  };
}
