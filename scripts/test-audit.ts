/**
 * Dry-run the Score Boost Audit pipeline without going through Stripe.
 *
 * Verifies:
 * - SocialData fetches tweets
 * - Claude Haiku returns valid audit JSON
 * - MD generator produces the expected output
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/test-audit.ts @handle
 *
 * Writes the generated MD to /tmp/brandos-audit-{handle}.md for inspection.
 */

import { writeFileSync } from 'node:fs';
import Anthropic from '@anthropic-ai/sdk';
import { fetchTweetsByUsername } from '../src/lib/socialdata';
import {
  buildAuditPrompt,
  type ScoreBoostAuditResult,
} from '../src/prompts/score-boost-audit';
import { generateAuditMarkdown } from '../src/lib/generate-audit-md';

const HAIKU_MODEL = 'claude-haiku-4-5-20251001';

async function main() {
  const arg = process.argv[2];
  if (!arg) {
    console.error('Usage: npx tsx --env-file=.env.local scripts/test-audit.ts @handle');
    process.exit(1);
  }
  const handle = arg.replace(/^@/, '').trim();

  console.log(`\n[1/4] Fetching tweets for @${handle}...`);
  const tweetResult = await fetchTweetsByUsername(handle, 50);
  if (tweetResult.error || tweetResult.tweets.length === 0) {
    console.error(`  → failed: ${tweetResult.error || 'no tweets'}`);
    process.exit(1);
  }
  const tweets = tweetResult.tweets
    .filter((t) => t.text && t.text.length > 10)
    .slice(0, 50)
    .map((t) => ({
      text: t.text,
      likes: t.public_metrics.like_count,
      replies: t.public_metrics.reply_count,
      retweets: t.public_metrics.retweet_count,
    }));
  console.log(`  → got ${tweets.length} tweets`);

  console.log('\n[2/4] Running Claude Haiku audit...');
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('  → ANTHROPIC_API_KEY not set');
    process.exit(1);
  }
  const anthropic = new Anthropic({ apiKey });
  const prompt = buildAuditPrompt(handle, tweets);

  const t0 = Date.now();
  const message = await anthropic.messages.create({
    model: HAIKU_MODEL,
    max_tokens: 4000,
    messages: [{ role: 'user', content: prompt }],
  });
  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`  → model: ${HAIKU_MODEL}, elapsed: ${elapsed}s`);
  console.log(`  → input tokens: ${message.usage.input_tokens}, output tokens: ${message.usage.output_tokens}`);

  // Rough cost estimate — Haiku 4.5 pricing: $1/MTok input, $5/MTok output (approx)
  const costEst =
    (message.usage.input_tokens / 1_000_000) * 1 +
    (message.usage.output_tokens / 1_000_000) * 5;
  console.log(`  → approx cost: $${costEst.toFixed(4)}`);

  const text = message.content[0]?.type === 'text' ? message.content[0].text : '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error('  → NO JSON in output. Raw response:');
    console.error(text);
    process.exit(1);
  }

  console.log('\n[3/4] Parsing audit JSON...');
  let audit: ScoreBoostAuditResult;
  try {
    audit = JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.error('  → parse error:', err);
    console.error('  → raw JSON:', jsonMatch[0].slice(0, 500));
    process.exit(1);
  }

  console.log('  → parsed successfully');
  console.log(`\n==== AUDIT SUMMARY ====`);
  console.log(`Handle: @${audit.handle}`);
  console.log(`Overall score: ${audit.overallScore}/100`);
  console.log(`Archetype: ${audit.archetype.emoji} ${audit.archetype.name}`);
  console.log(`Weakest phase: ${audit.weakestPhase}`);
  console.log(`Phase scores:`);
  console.log(`  DEFINE:   ${audit.phaseScores.define.score} (${audit.phaseScores.define.status})`);
  console.log(`  CHECK:    ${audit.phaseScores.check.score} (${audit.phaseScores.check.status})`);
  console.log(`  GENERATE: ${audit.phaseScores.generate.score} (${audit.phaseScores.generate.status})`);
  console.log(`  SCALE:    ${audit.phaseScores.scale.score} (${audit.phaseScores.scale.status})`);
  console.log(`Flagged tweets: ${audit.flaggedTweets.length}`);
  console.log(`Top actions: ${audit.topActions.length}`);
  console.log(`\nSummary: ${audit.summary}`);

  console.log('\n[4/4] Generating MD file...');
  const md = generateAuditMarkdown(audit);
  const outPath = `/tmp/brandos-audit-${handle}.md`;
  writeFileSync(outPath, md, 'utf-8');
  console.log(`  → wrote ${md.length} chars to ${outPath}`);

  console.log('\n✓ Done. Inspect with:');
  console.log(`    cat ${outPath}`);
  console.log('\nFull JSON:');
  console.log(JSON.stringify(audit, null, 2).slice(0, 2000) + (JSON.stringify(audit).length > 2000 ? '\n...[truncated]' : ''));
}

main().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});
