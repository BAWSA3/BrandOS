import type { VoiceConsistencyReport, PostVoiceScore } from '@/lib/schemas/voice-consistency.schema';
import type { VoiceFingerprint } from '@/lib/voice-fingerprint';
import { summarizeFingerprint, formatSummaryForPrompt } from '@/lib/voice-fingerprint';
import {
  analyzeVoiceConsistency as geminiAnalyze,
  type VoiceConsistencyGeminiInput,
  type VoiceConsistencyGeminiOutput,
} from '@/lib/gemini';

interface TweetInput {
  id: string;
  text: string;
  created_at: string;
}

/**
 * Build a prompt-injectable fingerprint string from either a stored
 * VoiceFingerprint or a lightweight description of voice patterns.
 */
function buildFingerprintContext(fingerprint?: VoiceFingerprint | null, fallbackDescription?: string): string {
  if (fingerprint) {
    const summary = summarizeFingerprint(fingerprint);
    return formatSummaryForPrompt(summary);
  }

  if (fallbackDescription) {
    return `VOICE FINGERPRINT (lightweight):\n${fallbackDescription}`;
  }

  return 'VOICE FINGERPRINT: Not available -- score posts against their own internal consistency patterns.';
}

/**
 * Core voice consistency analyzer.
 *
 * Accepts tweets and an optional VoiceFingerprint, sends everything to Gemini
 * in a single batch call, and assembles a VoiceConsistencyReport.
 */
export async function analyzeVoiceConsistency(
  tweets: TweetInput[],
  options?: {
    fingerprint?: VoiceFingerprint | null;
    fallbackDescription?: string;
  }
): Promise<VoiceConsistencyReport | null> {
  if (tweets.length === 0) return null;

  const sorted = [...tweets].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const geminiTweets: VoiceConsistencyGeminiInput[] = sorted.map((t) => ({
    id: t.id,
    text: t.text,
    postedAt: t.created_at,
  }));

  const fingerprintContext = buildFingerprintContext(
    options?.fingerprint,
    options?.fallbackDescription
  );

  const geminiResult = await geminiAnalyze(fingerprintContext, geminiTweets);
  if (!geminiResult) return null;

  return assembleReport(geminiResult, sorted);
}

function assembleReport(
  raw: VoiceConsistencyGeminiOutput,
  sortedTweets: TweetInput[]
): VoiceConsistencyReport {
  const tweetMap = new Map(sortedTweets.map((t) => [t.id, t]));

  const postScores: PostVoiceScore[] = raw.postScores.map((ps) => {
    const tweet = tweetMap.get(ps.tweetId);
    return {
      tweetId: ps.tweetId,
      text: tweet?.text ?? '',
      score: clamp(ps.score, 0, 100),
      flags: ps.flags ?? [],
      postedAt: tweet?.created_at ?? '',
    };
  });

  const outliers = postScores.filter((p) => p.score < 50);

  const overallScore = computeOverallScore(postScores, raw.dimensions);

  return {
    overallScore,
    postScores,
    drift: {
      direction: raw.drift.direction,
      trendLine: raw.drift.trendLine.map((n) => clamp(n, 0, 100)),
      explanation: raw.drift.explanation,
    },
    dimensions: {
      toneConsistency: clamp(raw.dimensions.toneConsistency, 0, 100),
      vocabularyConsistency: clamp(raw.dimensions.vocabularyConsistency, 0, 100),
      structureConsistency: clamp(raw.dimensions.structureConsistency, 0, 100),
      topicConsistency: clamp(raw.dimensions.topicConsistency, 0, 100),
    },
    outliers,
    insights: raw.insights.slice(0, 5),
  };
}

/**
 * Weighted average: 60% dimension average, 40% post-score median.
 * This balances aggregate signal with individual post quality.
 */
function computeOverallScore(
  postScores: PostVoiceScore[],
  dimensions: VoiceConsistencyGeminiOutput['dimensions']
): number {
  const dimAvg =
    (dimensions.toneConsistency +
      dimensions.vocabularyConsistency +
      dimensions.structureConsistency +
      dimensions.topicConsistency) /
    4;

  if (postScores.length === 0) return Math.round(dimAvg);

  const sorted = [...postScores].map((p) => p.score).sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];

  return Math.round(dimAvg * 0.6 + median * 0.4);
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}
