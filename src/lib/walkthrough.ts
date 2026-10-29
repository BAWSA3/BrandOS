/**
 * The first-run walkthrough (docs/FIRST-RUN-WALKTHROUGH-SPEC.md): which steps
 * a member sees and what each one says. Pure, so the thin-read rules are
 * testable (scripts/test-walkthrough.ts). Plain words; brand terms are kept
 * and explained in one sentence next to them.
 *
 * Steps: score → known for → what's working → one thing to sharpen → Write.
 * A step with nothing honest to show is skipped, never shown empty.
 */

export interface WalkthroughInput {
  handle: string;
  score: number | null;
  /** "CLASS 04 / ARC" */
  classification: string | null;
  strengths: string[];
  working: { label: string; rate: number; top: boolean }[];
  gap: string | null;
}

export type WalkStep =
  | { kind: 'score'; score: number; classification: string | null; body: string; term: string }
  | { kind: 'known'; lines: string[]; body: string }
  | { kind: 'working'; label: string; rate: number; body: string }
  | { kind: 'sharpen'; gap: string | null; body: string };

const fmtRate = (r: number) => (Math.round(r * 10) / 10).toFixed(1);

export function walkthroughSteps(d: WalkthroughInput): WalkStep[] {
  const steps: WalkStep[] = [];
  if (d.score !== null && Number.isFinite(d.score)) {
    steps.push({
      kind: 'score',
      score: Math.round(d.score),
      classification: d.classification,
      body: 'This is your score: how clearly your posts say who you are, and how well they land. Out of 100.',
      term: 'We call it your Record because it keeps the history: it moves as you post, and every read is kept.',
    });
  }
  const known = d.strengths
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 3);
  if (known.length > 0) {
    steps.push({
      kind: 'known',
      lines: known,
      body: "This is what your posts say you're known for. Not your bio. Your posts.",
    });
  }
  // A "best" format needs something to beat: two or more rated formats.
  const rated = d.working.filter((f) => f.rate > 0);
  const top = rated.find((f) => f.top);
  if (top && rated.length >= 2) {
    steps.push({
      kind: 'working',
      label: top.label,
      rate: Math.round(top.rate * 10) / 10,
      body: `Of everything you post, these land best: ${fmtRate(top.rate)}% of the people who see them like, reply, repost or quote. From your own posts.`,
    });
  }
  steps.push(
    d.gap && d.gap.trim()
      ? { kind: 'sharpen', gap: d.gap.trim(), body: 'If you fix one thing, fix this.' }
      : {
          kind: 'sharpen',
          gap: null,
          body: "Nothing big to fix right now. Keep doing what's working, and it'll show you the moment something slips.",
        }
  );
  return steps;
}

/** Label for each step's dot and heading (VCR micro-label). */
export const STEP_LABEL: Record<WalkStep['kind'], string> = {
  score: 'Your score',
  known: 'Known for',
  working: "What's working",
  sharpen: 'One thing to sharpen',
};

/** This-device fallback before migration 052 (or when the account save fails). */
export const LOCAL_DONE_KEY = 'brandos:walkthrough-done';
