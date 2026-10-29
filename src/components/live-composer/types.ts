import type { Mark, ProofPost } from '@/lib/live-marks';

/** Everything the live composer shows, from the engine (live) or the script (demo). */
export interface LiveState {
  text: string;
  marks: Mark[];
  /** Live fit 0–100, or null before the first read. */
  score: number | null;
  /** The brand's playbook lines, and which one the draft is on (null = none). */
  pillars: string[];
  pillar: number | null;
  /** Their own best post of the same shape (null when thin or none). */
  proof: ProofPost | null;
  /** A saved idea the draft matches. */
  idea: { id: string; text: string } | null;
  landingReady: boolean;
  /** Enough posts to say how they sound (tier 0 on). */
  voiceReady: boolean;
  posts: number;
  /** A key went down in the last PAUSE_MS. */
  typing: boolean;
  /** Stopped typing, read in flight. */
  reading: boolean;
  error: string | null;
}
