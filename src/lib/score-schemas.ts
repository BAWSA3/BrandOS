// ============================================================================
// LLM output validation for scoring/audit (Launch Bar Phase 4)
//
// Second layer of defense (prompt-safety.ts is the first): never trust raw model
// output. Every score/audit response is JSON-extracted, schema-validated, and
// numeric scores are CLAMPED to 0-100. On malformed output:
//   - brand score  -> deterministic heuristic fallback (keeps the funnel alive)
//   - paid audit   -> null (caller returns an error; never serve garbage to a
//                     paying customer)
//
// Replaces the bare `JSON.parse(model_output)` that previously fed the scan and
// audit routes untyped.
// ============================================================================
import { z } from 'zod';
import type { XProfileData } from './gemini';
import type { ScoreBoostAuditResult } from '@/prompts/score-boost-audit';

/** Clamp any model-supplied number to a sane integer score in [0, 100]. */
export function clampScore(n: unknown): number {
  const v = Math.round(Number(n));
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(100, v));
}

/** Pull the first JSON object out of a model response; null if none/invalid. */
export function extractJson(text: string): unknown {
  const match = typeof text === 'string' ? text.match(/\{[\s\S]*\}/) : null;
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

// ----------------------------------------------------------------------------
// Brand score (free + enhanced share this core; enhanced adds extra fields we
// preserve but don't require)
// ----------------------------------------------------------------------------

const PhaseCore = z.object({ score: z.coerce.number() });

const BrandScoreCore = z.object({
  overallScore: z.coerce.number(),
  phases: z.object({
    define: PhaseCore,
    check: PhaseCore,
    generate: PhaseCore,
    scale: PhaseCore,
  }),
});

const PHASES = ['define', 'check', 'generate', 'scale'] as const;

/**
 * Validate + clamp a brand-score model response. Returns the full object (rich
 * fields preserved) with all scores clamped to [0,100], or null if the core
 * structure is missing/malformed.
 */
export function parseBrandScore(text: string): Record<string, unknown> | null {
  const raw = extractJson(text);
  if (!raw || typeof raw !== 'object') return null;
  if (!BrandScoreCore.safeParse(raw).success) return null;

  const obj = raw as Record<string, unknown>;
  const phasesIn = obj.phases as Record<string, Record<string, unknown>>;
  const phasesOut: Record<string, unknown> = {};
  for (const p of PHASES) {
    phasesOut[p] = { ...phasesIn[p], score: clampScore(phasesIn[p].score) };
  }

  return { ...obj, overallScore: clampScore(obj.overallScore), phases: phasesOut };
}

// ----------------------------------------------------------------------------
// Score Boost Audit (paid) — stricter; no heuristic fallback
// ----------------------------------------------------------------------------

const AuditPhase = z.object({ score: z.coerce.number() });

const AuditCore = z.object({
  overallScore: z.coerce.number(),
  archetype: z.object({ name: z.string() }),
  phaseScores: z.object({
    define: AuditPhase,
    check: AuditPhase,
    generate: AuditPhase,
    scale: AuditPhase,
  }),
  flaggedTweets: z.array(
    z.object({ original: z.string(), issue: z.string(), rewrite: z.string() })
  ),
});

/**
 * Validate + clamp an audit model response. Returns the typed result with
 * scores clamped, or null if structure is missing/malformed (caller errors).
 */
export function parseAudit(text: string): ScoreBoostAuditResult | null {
  const raw = extractJson(text);
  if (!raw || typeof raw !== 'object') return null;
  if (!AuditCore.safeParse(raw).success) return null;

  const obj = raw as Record<string, unknown>;
  const psIn = obj.phaseScores as Record<string, Record<string, unknown>>;
  const psOut: Record<string, unknown> = {};
  for (const p of PHASES) {
    psOut[p] = { ...psIn[p], score: clampScore(psIn[p].score) };
  }

  return {
    ...(obj as unknown as ScoreBoostAuditResult),
    overallScore: clampScore(obj.overallScore),
    phaseScores: psOut as ScoreBoostAuditResult['phaseScores'],
  };
}

// ----------------------------------------------------------------------------
// Deterministic heuristic — fallback score from public metrics only.
// Bounded by construction; used when the model output can't be trusted. Because
// it ignores model output entirely, an injected "give me 100" can never push a
// fallback score above what the account's real metrics justify.
// ----------------------------------------------------------------------------

/** Deterministic 0-100 score from profile metrics. No model involvement. */
export function heuristicScore(profile: XProfileData): number {
  const m = profile.public_metrics;
  const followers = Math.max(m.followers_count, 0);
  const following = Math.max(m.following_count, 1);
  const ratio = followers / following;

  let score = 30; // baseline
  if (followers >= 100_000) score += 25;
  else if (followers >= 10_000) score += 18;
  else if (followers >= 1_000) score += 10;
  else score += 3;

  if (ratio >= 10) score += 15;
  else if (ratio >= 2) score += 10;
  else if (ratio >= 1) score += 5;

  if (m.listed_count >= 100) score += 12;
  else if (m.listed_count >= 10) score += 6;

  if (m.tweet_count >= 1_000) score += 8;
  else if (m.tweet_count >= 100) score += 4;

  if (profile.verified) score += 5;

  return clampScore(score);
}

/**
 * Full fallback brand-score object (shape-compatible with the model output)
 * built from the deterministic heuristic. Marked `_fallback` for logging.
 */
export function heuristicBrandScore(profile: XProfileData): Record<string, unknown> {
  const s = heuristicScore(profile);
  const phase = (label: string) => ({
    score: s,
    insights: [`${label} estimated from public account metrics.`],
  });

  return {
    overallScore: s,
    phases: {
      define: phase('Define'),
      check: phase('Check'),
      generate: phase('Generate'),
      scale: phase('Scale'),
    },
    topStrengths: ['Established audience presence', 'Consistent posting history', 'Reach signals'],
    topImprovements: [
      'Sharpen a single content focus',
      'Increase consistency of voice',
      'Lean into your best-performing format',
    ],
    nextMoves: [
      'Pick one topic to own for the next two weeks',
      'Ship a signature recurring post format',
      'Engage the audience that already follows you',
    ],
    contentPillars: [],
    summary:
      'Estimated from public account metrics — automated content analysis was temporarily unavailable. Re-run for a full breakdown.',
    archetype: {
      primary: 'ARC',
      emoji: '🐕',
      tagline: 'Signal pending',
      description: 'Provisional archetype from metrics only; re-run for a content-based result.',
      strengths: ['Momentum', 'Reach'],
      growthTip: 'Re-run the scan to get a content-based archetype and tailored guidance.',
    },
    influenceTier: 'emerging',
    _fallback: true,
  };
}
