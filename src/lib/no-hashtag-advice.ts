/**
 * BrandOS never pitches hashtag strategy (Bawsa, 2026-10-27). Hashtags are not
 * how creators get found or grow, and advice like "use more hashtags" made
 * reads sound generic. Two layers, like prompt-safety + score-schemas:
 *   1. NO_HASHTAG_ADVICE goes into every prompt that gives advice or drafts copy
 *   2. dropHashtagAdvice / stripHashtagSentences remove whatever slips through
 *      (model output, and older reads stored before this rule)
 * Pure; `npm run test:hashtags`.
 */

export const NO_HASHTAG_ADVICE =
  'NEVER recommend hashtags or a hashtag strategy (using more, fewer, different or trending hashtags), never praise or criticise hashtag use, and never add hashtags to drafted copy. BrandOS does not treat hashtags as a growth or discovery lever.';

const HASHTAG = /\bhash-?tags?\b|(?:^|[\s(])#[A-Za-z][\w]*/i;

/** True when the text mentions hashtags or contains a #tag. */
export function mentionsHashtags(text: string): boolean {
  return HASHTAG.test(String(text ?? ''));
}

/** Drop list items (strengths, holding-it-back, next moves) that are about hashtags. */
export function dropHashtagAdvice<T>(items: T): T {
  if (!Array.isArray(items)) return items;
  return items.filter((i) => typeof i !== 'string' || !mentionsHashtags(i)) as T;
}

/** Remove the sentences of a paragraph that talk about hashtags. */
export function stripHashtagSentences(text: string): string {
  if (typeof text !== 'string' || !mentionsHashtags(text)) return text;
  return text
    .split(/(?<=[.!?])\s+/)
    .filter((s) => !mentionsHashtags(s))
    .join(' ')
    .trim();
}
