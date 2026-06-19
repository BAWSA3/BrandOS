/**
 * Score Boost Audit — Claude prompt
 *
 * Deep brand audit on last 50 tweets. Distinct from the free scan:
 * - Tweet-by-tweet analysis with specific issue identification
 * - AI-generated rewrite for each flagged tweet
 * - Phase score breakdown (DEFINE / CHECK / GENERATE / SCALE)
 * - Archetype-specific insights
 * - Top 3 actionable next steps
 *
 * Output is strict JSON for downstream rendering + MD generation.
 */

import {
  GUARD_PREAMBLE,
  sanitizeInline,
  sanitizeUntrusted,
  wrapUntrusted,
  INPUT_CAPS,
} from '@/lib/prompt-safety';

export interface ScoreBoostAuditResult {
  handle: string;
  overallScore: number; // 0-100
  archetype: {
    name: string;
    emoji: string;
    description: string;
    strengths: string[];
    misalignments: string[];
  };
  phaseScores: {
    define: { score: number; status: 'strong' | 'moderate' | 'weak'; insight: string };
    check: { score: number; status: 'strong' | 'moderate' | 'weak'; insight: string };
    generate: { score: number; status: 'strong' | 'moderate' | 'weak'; insight: string };
    scale: { score: number; status: 'strong' | 'moderate' | 'weak'; insight: string };
  };
  weakestPhase: 'define' | 'check' | 'generate' | 'scale';
  flaggedTweets: Array<{
    original: string;
    issue: string; // what's dragging the score
    rewrite: string; // AI-generated on-brand rewrite
  }>;
  topActions: string[]; // 3 actionable next steps
  summary: string; // 2-3 sentences, personal
}

export function buildAuditPrompt(
  handle: string,
  tweets: { text: string; likes: number; replies: number; retweets: number }[]
): string {
  const safeHandle = sanitizeInline(handle, INPUT_CAPS.username);
  // Tweet text is untrusted user content — sanitize each line; the whole block
  // is fenced via wrapUntrusted so injected "instructions" are treated as data.
  const tweetBlock = wrapUntrusted(
    tweets
      .slice(0, INPUT_CAPS.tweetCount)
      .map(
        (t, i) =>
          `TWEET ${i + 1} (${t.likes} likes, ${t.replies} replies, ${t.retweets} RTs):\n${sanitizeUntrusted(t.text).slice(0, INPUT_CAPS.tweetText)}`
      )
      .join('\n\n---\n\n'),
    'tweets'
  );

  return `${GUARD_PREAMBLE}You are a senior brand strategist auditing @${safeHandle}'s X account. The user paid $19 for this audit. Be specific, brutal, and actionable. Generic advice = refund.

You will analyze ${tweets.length} recent tweets and produce a deep brand audit.

SCORING FRAMEWORK (the BrandOS framework):
- DEFINE (30%): Is there a clear brand identity? Can a stranger tell what they stand for in 10 seconds?
- CHECK (25%): Do the tweets signal expertise and consistency? Are they reinforcing one identity or scattered?
- GENERATE (25%): Is the content actually good? Does it have hooks, specificity, payoff? Or generic?
- SCALE (20%): Are they building a system for growth? Repeated formats, franchises, community loops?

ARCHETYPES (pick ONE that fits best based on their tweets):
- SIGNAL: authoritative, thesis-driven, intellectual frameworks
- SOURCE: primary reporter, breaking news, data
- BUILDER: maker, shipping in public, product stories
- TASTEMAKER: aesthetic authority, curation, opinion
- OPERATOR: systems, process, "how I did X"
- CATALYST: community, movement-building, calls to action
- VOICE: identity-forward, entertainment, personality
- SCHOLAR: deep research, long-form, contrarian analysis

TWEETS TO ANALYZE:
${tweetBlock}

TASK:
1. Score each phase 0-100. Be honest. Most creators score 40-70. 80+ is rare.
2. Identify the weakest phase (lowest score).
3. Pick the 5-8 weakest tweets. For each: explain the specific issue and write a rewrite that fixes it while sounding like the user.
4. Identify their archetype.
5. Write 3 top actions this week, tied to their weakest phase.
6. Write a personal 2-3 sentence summary.

RULES:
- NO generic advice ("post more consistently", "engage with your audience"). Be specific to their actual tweets.
- Rewrites must sound like the user wrote them — study their cadence, punctuation, capitalization. Match it.
- Call out real patterns — "Your tweets 3, 7, and 12 all have the same structural flaw: they bury the hook."
- The user is paying for insight they couldn't write themselves.

RETURN ONLY VALID JSON matching this exact shape (no markdown, no prose outside the JSON):
{
  "handle": "${safeHandle}",
  "overallScore": <0-100>,
  "archetype": {
    "name": "<ARCHETYPE>",
    "emoji": "<single emoji>",
    "description": "<2 sentences on what this archetype means>",
    "strengths": ["<3 strengths tied to the archetype>"],
    "misalignments": ["<2-3 specific ways their tweets misalign with their archetype>"]
  },
  "phaseScores": {
    "define":   { "score": <n>, "status": "<strong|moderate|weak>", "insight": "<specific 2-3 sentence insight referencing their tweets>" },
    "check":    { "score": <n>, "status": "<strong|moderate|weak>", "insight": "<specific 2-3 sentence insight>" },
    "generate": { "score": <n>, "status": "<strong|moderate|weak>", "insight": "<specific 2-3 sentence insight>" },
    "scale":    { "score": <n>, "status": "<strong|moderate|weak>", "insight": "<specific 2-3 sentence insight>" }
  },
  "weakestPhase": "<define|check|generate|scale>",
  "flaggedTweets": [
    {
      "original": "<tweet text verbatim>",
      "issue": "<specific diagnosis — no generic 'needs better hook'>",
      "rewrite": "<rewrite matching their voice>"
    }
  ],
  "topActions": [
    "<action 1 — specific, executable this week>",
    "<action 2>",
    "<action 3>"
  ],
  "summary": "<2-3 sentences, direct, personal, references their actual tweets>"
}`;
}

export function statusEmoji(status: 'strong' | 'moderate' | 'weak'): string {
  return status === 'strong' ? '✓' : status === 'moderate' ? '~' : '✗';
}
