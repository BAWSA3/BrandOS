/**
 * Score quality + scan reliability (score-signals.ts, score-smoothing.ts,
 * gemini.ts resilientFlash). Pure, no network/DB:
 *   npm run test:signals
 *
 * Regression for the 2026-10-24 prod finding: @levelsio (981K followers) and
 * @jbawsa (31K) both scored 76 with phases 82/74/71/73.
 */
import {
  applyMeasuredSignals,
  blendPhases,
  measuredGenerate,
  measuredScale,
  weightedOverall,
  SCORER_VERSION,
} from '../src/lib/score-signals';
import { scoreCacheKey, smoothingAnchor, smoothScore } from '../src/lib/score-smoothing';
import { heuristicBrandScore } from '../src/lib/score-schemas';
import {
  resilientFlash,
  resetGeminiPause,
  isQuotaExhausted,
  quotaPauseMs,
  toClaudeBlocks,
} from '../src/lib/gemini';
import type { GoogleGenerativeAI } from '@google/generative-ai';
import type { TweetAnalysisStats, XProfileData } from '../src/lib/gemini';

let pass = 0;
let fail = 0;
function test(name: string, ok: boolean, detail?: unknown) {
  if (ok) {
    pass++;
    console.log(`  ✓ ${name}`);
  } else {
    fail++;
    console.log(`  ✗ ${name}${detail === undefined ? '' : ` — ${JSON.stringify(detail)}`}`);
  }
}

// Real public metrics (XProfileCache, 2026-10-24); engagement stats are fixtures.
const jbawsa: XProfileData = {
  name: 'BAWSA',
  username: 'jbawsa',
  description: '',
  profile_image_url: '',
  verified: true,
  public_metrics: {
    followers_count: 31354,
    following_count: 5646,
    tweet_count: 109758,
    listed_count: 585,
  },
};
const levelsio: XProfileData = {
  name: '@levelsio',
  username: 'levelsio',
  description: '',
  profile_image_url: '',
  verified: true,
  public_metrics: {
    followers_count: 981386,
    following_count: 3286,
    tweet_count: 181937,
    listed_count: 10371,
  },
};
const tiny: XProfileData = {
  name: 'new',
  username: 'newcreator',
  description: '',
  profile_image_url: '',
  verified: false,
  public_metrics: { followers_count: 240, following_count: 610, tweet_count: 300, listed_count: 1 },
};

const stats = (s: Partial<TweetAnalysisStats>): TweetAnalysisStats => ({
  totalTweets: 40,
  avgEngagementRate: 1,
  engagementRateKnown: true,
  postsPerDay: 2,
  sampleDays: 20,
  avgLikes: 10,
  avgRetweets: 1,
  avgReplies: 3,
  topHashtags: [],
  postingFrequency: '',
  mostActiveHour: 15,
  mostActiveDay: 'Tuesday',
  ...s,
});
const jbawsaStats = stats({ avgLikes: 22, avgRetweets: 2, avgReplies: 9, avgEngagementRate: 1.4 });
const levelsioStats = stats({
  avgLikes: 820,
  avgRetweets: 41,
  avgReplies: 160,
  avgEngagementRate: 1.1,
  postsPerDay: 7,
});
const tinyStats = stats({
  avgLikes: 1,
  avgRetweets: 0,
  avgReplies: 0.4,
  avgEngagementRate: 0.3,
  postsPerDay: 0.4,
});

// The exact model output both accounts got on prod.
const collapsed = () => ({
  overallScore: 76,
  phases: {
    define: { score: 82, insights: [] },
    check: { score: 74, insights: [] },
    generate: { score: 71, insights: [] },
    scale: { score: 73, insights: [] },
  },
});

console.log('A. Measured signals rank accounts sensibly');
const sJ = measuredScale(jbawsa);
const sL = measuredScale(levelsio);
const sT = measuredScale(tiny);
test(`scale: levelsio ${sL} > jbawsa ${sJ} > tiny ${sT}`, sL > sJ && sJ > sT);
test('scale gap levelsio–jbawsa is at least 20', sL - sJ >= 20, { sL, sJ });
const gJ = measuredGenerate(jbawsaStats, 31354)!;
const gL = measuredGenerate(levelsioStats, 981386)!;
const gT = measuredGenerate(tinyStats, 240)!;
test(`generate: levelsio ${gL} > jbawsa ${gJ} > tiny ${gT}`, gL > gJ && gJ > gT);
test('generate is null with no sampled posts', measuredGenerate(null, 1000) === null);
test(
  'views missing → falls back to interactions per 1K followers (still a number)',
  typeof measuredGenerate(stats({ engagementRateKnown: false, avgEngagementRate: 0 }), 5000) ===
    'number'
);
test(
  'all signals stay within 0–100',
  [sJ, sL, sT, gJ, gL, gT].every((n) => n >= 0 && n <= 100)
);

console.log('B. Same model output, different accounts → different scores (the prod bug)');
const bJ = collapsed();
const bL = collapsed();
const pJ = applyMeasuredSignals(bJ, jbawsa, jbawsaStats);
const pL = applyMeasuredSignals(bL, levelsio, levelsioStats);
test(
  `phases differ: jbawsa ${JSON.stringify(pJ)} vs levelsio ${JSON.stringify(pL)}`,
  pJ.generate !== pL.generate && pJ.scale !== pL.scale
);
test(
  `overall differs: jbawsa ${bJ.overallScore} vs levelsio ${bL.overallScore}`,
  bJ.overallScore !== bL.overallScore
);
test('levelsio scores above jbawsa', bL.overallScore > bJ.overallScore);
test('overall = weighted phases', bJ.overallScore === weightedOverall(pJ));
test('phase objects keep their insights', Array.isArray(bJ.phases.define.insights));
test('define/check untouched without finer sub-scores', pJ.define === 82 && pJ.check === 74);

console.log('C. Blend arithmetic');
const blended = blendPhases({
  model: { define: 80, check: 70, generate: 60, scale: 50 },
  measured: { generate: 100, scale: 100 },
  topicConcentration: 40,
  voiceConsistency: 90,
});
test('generate = 50/50 model + measured', blended.generate === 80, blended);
test('scale = 40/60 model + measured', blended.scale === 80, blended);
test('define nudged 25% toward topic concentration', blended.define === 70, blended);
test('check nudged 25% toward voice consistency', blended.check === 75, blended);
test(
  'profile-only scan (no posts) keeps the model generate score',
  blendPhases({
    model: { define: 1, check: 1, generate: 64, scale: 1 },
    measured: { generate: null, scale: 1 },
  }).generate === 64
);

console.log('D. Fallback path (model unusable → heuristic) still separates accounts');
const hJ = heuristicBrandScore(jbawsa) as ReturnType<typeof collapsed> & { _fallback?: boolean };
const hL = heuristicBrandScore(levelsio) as ReturnType<typeof collapsed>;
const fJ = applyMeasuredSignals(hJ, jbawsa, jbawsaStats);
const fL = applyMeasuredSignals(hL, levelsio, levelsioStats);
test('fallback is marked _fallback', hJ._fallback === true);
test('fallback phases are no longer four equal numbers', new Set(Object.values(fJ)).size > 1, fJ);
test(
  `fallback overall differs (${hJ.overallScore} vs ${hL.overallScore})`,
  hJ.overallScore !== hL.overallScore
);

console.log('E. No cross-handle bleed (cache key, smoothing anchor)');
test('cache keys differ per handle', scoreCacheKey('levelsio') !== scoreCacheKey('jbawsa'));
test('cache key ignores @ and case', scoreCacheKey('@JBawsa') === scoreCacheKey('jbawsa'));
test('brand framing has its own key', scoreCacheKey('acme', 'brand') !== scoreCacheKey('acme'));
const now = Date.now();
const v2Profile = {
  currentScore: 60,
  lastScannedAt: now - 86_400_000,
  scores: [{ v: SCORER_VERSION }],
};
const oldProfile = { currentScore: 76, lastScannedAt: now - 86_400_000, scores: [{}] };
test(
  'no stored profile → no anchor (first scan is raw)',
  smoothingAnchor(null, SCORER_VERSION) === null
);
test('a pre-v2 score is not an anchor', smoothingAnchor(oldProfile, SCORER_VERSION) === null);
const anchor = smoothingAnchor(v2Profile, SCORER_VERSION);
test('a v2 score anchors to that handle’s own score', anchor?.score === 60);
test('next-day rescan held within ±3 of own score', smoothScore(90, anchor) === 63);

console.log('F. Gemini resilience (fake clients, no network)');
const quotaError = Object.assign(
  new Error(
    '[429 Too Many Requests] You exceeded your current quota ... [{"@type":"type.googleapis.com/google.rpc.RetryInfo","retryDelay":"76738s"}]'
  ),
  { status: 429 }
);
const overloaded = Object.assign(new Error('[503 Service Unavailable] high demand'), {
  status: 503,
});
test('quota 429 recognised', isQuotaExhausted(quotaError));
test('503 is not a quota error', !isQuotaExhausted(overloaded));
test('pause honours retryDelay, capped at 6h', quotaPauseMs(quotaError) === 6 * 3_600_000);
test(
  'image parts become Claude image blocks, placed first',
  JSON.stringify(
    toClaudeBlocks(['describe', { inlineData: { mimeType: 'image/png', data: 'AAA' } }]).map(
      (b) => b.type
    )
  ) === '["image","text"]'
);

function fakeClient(fail: Error, calls: { n: number }) {
  return {
    getGenerativeModel: () => ({
      generateContent: async () => {
        calls.n++;
        throw fail;
      },
    }),
  } as unknown as GoogleGenerativeAI;
}

async function asyncTests() {
  resetGeminiPause();
  const geminiCalls = { n: 0 };
  let claudeCalls = 0;
  const flash = resilientFlash(fakeClient(quotaError, geminiCalls), {
    claude: async () => {
      claudeCalls++;
      return '{"archetype":"SOURCE"}';
    },
  });
  const r1 = await flash.generateContent('prompt');
  test('quota → answered by Claude', (await r1.response).text() === '{"archetype":"SOURCE"}');
  test('quota → no retries or second model', geminiCalls.n === 1, geminiCalls);
  await flash.generateContent('prompt 2');
  test('during the pause Gemini is skipped entirely', geminiCalls.n === 1 && claudeCalls === 2);

  resetGeminiPause();
  const calls503 = { n: 0 };
  const flash503 = resilientFlash(fakeClient(overloaded, calls503), { claude: async () => 'ok' });
  const r2 = await flash503.generateContent('prompt');
  test(
    '503 → primary twice, fallback model once, then Claude',
    calls503.n === 3 && (await r2.response).text() === 'ok',
    calls503
  );

  resetGeminiPause();
  const flashDead = resilientFlash(fakeClient(quotaError, { n: 0 }), {
    claude: async () => {
      throw new Error('claude down');
    },
  });
  let thrown: unknown;
  try {
    await flashDead.generateContent('prompt');
  } catch (e) {
    thrown = e;
  }
  test('Claude also down → the original Gemini error surfaces', thrown === quotaError);
  resetGeminiPause();
}

asyncTests().then(() => {
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
});
