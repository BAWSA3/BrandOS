/**
 * Who a brand read speaks to. Creators and brand / company accounts get the
 * same score from the same rubric; a company account's read is worded for the
 * team that runs it (campaigns, launches, community, product) instead of a
 * person. Pure (tested in test:scores).
 */

export type AccountKind = 'creator' | 'brand';

// Claude sometimes declined a metadata-only prompt in prose ("I can't access
// their content…"), which failed validation and dropped the scan to the
// heuristic. The system note sets the expectation; the structured-output
// schema makes a JSON answer the only possible one.
const SCORE_SYSTEM =
  'You score creator brands for BrandOS. Always produce a complete score from the data provided, ' +
  'even when it is limited (for example, profile details without posts): base every judgment on ' +
  'what you can see and keep insights specific to it. Never ask for more data or decline to score.';

const COMPANY_NOTE =
  ' This account is a BRAND / COMPANY account run by a team, not a person. Score it with exactly ' +
  'the same rubric and the same numbers you would give any account; only the wording changes. ' +
  'Write the summary, strengths, improvements, next moves and archetype explanation for the team ' +
  'running the account: speak in terms of campaigns, launches, product updates, community and a ' +
  'consistent brand voice across whoever posts. Address them as "your team" or "the account", ' +
  'never as one person, and never assume a founder or gender.';

export function scoreSystem(kind: AccountKind = 'creator'): string {
  return kind === 'brand' ? SCORE_SYSTEM + COMPANY_NOTE : SCORE_SYSTEM;
}
