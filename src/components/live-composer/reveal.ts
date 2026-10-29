import type { Lens } from '@/lib/live-marks';
import type { LiveState, Variant } from './types';

/**
 * How much of BrandOS is showing, per surface, for each reveal variant.
 * Pure (state in, opacities out), so the harness, the real room and a
 * Remotion composition all reveal the same way. Opacity only: the view
 * animates these with opacity/transform, never layout.
 *
 *   a  unlocks by milestone: first sentence (or a pause after 3 words) → voice marks; hook done → score +
 *      lane read; enough text → landing, proof, idea, playbook line lights.
 *   b  ambient: everything faint from the first key, sharpening as they write.
 *   c  one big moment: quiet while typing; on a pause it all assembles at once.
 */

export interface Reveal {
  marks: Record<Lens, number>;
  score: number;
  playbook: number;
  /** The matched playbook line lights up (else lines stay neutral). */
  playbookLit: boolean;
  proof: number;
  idea: number;
  /** Seconds to wait before each surface eases in (c staggers its reveal). */
  delay: { score: number; marks: number; playbook: number; proof: number; idea: number };
}

const NONE = { score: 0, marks: 0, playbook: 0, proof: 0, idea: 0 };
export const ENOUGH_CHARS = 120;

function words(s: string) {
  return s.split(/\s+/).filter(Boolean).length;
}

export function milestones(text: string, paused = false) {
  const t = text.trim();
  const ends = t.match(/[^.!?\n]+[.!?\n]/g) ?? [];
  // a pause after three words counts as finishing the thought
  const firstSentence =
    (ends.length >= 1 && words(ends[0] ?? '') >= 3) || (paused && words(t) >= 3);
  const hook = firstSentence && (ends.length >= 2 || t.length >= 70);
  return { firstSentence, hook, enough: [...t].length >= ENOUGH_CHARS };
}

export function reveal(variant: Variant, s: LiveState): Reveal {
  const has = s.text.trim().length > 0;
  const lit = s.pillar !== null;
  if (variant === 'b') {
    const p = Math.min(1, [...s.text.trim()].length / 180);
    const o = has ? 0.14 + 0.86 * p : 0;
    return {
      marks: { voice: o, lane: o, landing: o },
      score: has ? Math.max(o, s.score !== null ? 0.6 : 0) : 0,
      playbook: o,
      playbookLit: lit,
      proof: s.proof ? o : 0,
      idea: s.idea ? o : 0,
      delay: NONE,
    };
  }
  if (variant === 'c') {
    const on = has && !s.typing && !s.reading && (s.score !== null || s.marks.length > 0) ? 1 : 0;
    return {
      marks: { voice: on, lane: on, landing: on },
      score: on,
      playbook: on,
      playbookLit: lit && !!on,
      proof: s.proof ? on : 0,
      idea: s.idea ? on : 0,
      delay: on ? { score: 0, marks: 0.18, playbook: 0.32, proof: 0.46, idea: 0.6 } : NONE,
    };
  }
  const m = milestones(s.text, !s.typing);
  return {
    marks: { voice: m.firstSentence ? 1 : 0, lane: m.hook ? 1 : 0, landing: m.enough ? 1 : 0 },
    score: m.hook ? 1 : 0,
    playbook: m.hook ? 1 : 0,
    playbookLit: lit && m.enough,
    proof: s.proof && m.enough ? 1 : 0,
    idea: s.idea && m.enough ? 1 : 0,
    delay: NONE,
  };
}
