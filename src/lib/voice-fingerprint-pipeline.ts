// ===== VOICE FINGERPRINT PIPELINE =====
// Post-generation authenticity loop: generate → check → rewrite if needed

import { BrandDNA, ContentType } from './types';
import {
  VoiceFingerprint,
  VoiceFingerprintSummary,
  AuthenticityScore,
  summarizeFingerprint,
} from './voice-fingerprint';

interface PipelineOptions {
  threshold?: number; // minimum authenticity score (default: 70)
  maxRetries?: number; // max rewrite attempts (default: 2)
}

interface PipelineResult {
  content: string;
  authenticityScore: AuthenticityScore | null;
  attempts: number;
  improved: boolean; // whether rewrite improved the score
}

/**
 * Generate content with voice fingerprint, then check and rewrite
 * if authenticity falls below threshold.
 */
export async function generateWithAuthenticity(
  brandDNA: BrandDNA,
  fingerprint: VoiceFingerprint,
  params: { prompt: string; contentType?: ContentType },
  options: PipelineOptions = {}
): Promise<PipelineResult> {
  const threshold = options.threshold ?? 70;
  const maxRetries = options.maxRetries ?? 2;
  const summary = summarizeFingerprint(fingerprint);

  // Step 1: Generate content with fingerprint-enhanced prompt
  const generateRes = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      brandDNA,
      prompt: params.prompt,
      contentType: params.contentType || 'general',
      voiceFingerprint: summary,
    }),
  });

  if (!generateRes.ok) {
    const err = await generateRes.json();
    throw new Error(err.error || 'Generation failed');
  }

  const { content: generatedContent } = await generateRes.json();
  let currentContent = generatedContent;
  let currentScore: AuthenticityScore | null = null;
  let attempts = 0;

  // Step 2: Check authenticity
  const checkRes = await fetch('/api/voice-fingerprint/check-authenticity', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: currentContent, fingerprint }),
  });

  if (checkRes.ok) {
    const { score } = await checkRes.json();
    currentScore = score;
  }

  // Step 3: Rewrite loop if below threshold
  while (
    currentScore &&
    currentScore.overall < threshold &&
    currentScore.flags.length > 0 &&
    attempts < maxRetries
  ) {
    attempts++;

    const rewriteRes = await fetch('/api/voice-fingerprint/rewrite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: currentContent,
        fingerprint,
        flags: currentScore.flags,
      }),
    });

    if (!rewriteRes.ok) break;

    const { rewrittenContent, newScore } = await rewriteRes.json();

    // Only accept rewrite if it improved the score
    if (newScore && newScore.overall > (currentScore?.overall || 0)) {
      currentContent = rewrittenContent;
      currentScore = newScore;
    } else {
      break; // Don't keep trying if rewrites aren't helping
    }
  }

  return {
    content: currentContent,
    authenticityScore: currentScore,
    attempts,
    improved: attempts > 0 && (currentScore?.overall || 0) >= threshold,
  };
}

/**
 * Build a fingerprint summary suitable for injection into prompts.
 * Thin wrapper for use in components that don't want to import voice-fingerprint directly.
 */
export function getFingerprintSummary(
  fingerprint: VoiceFingerprint
): VoiceFingerprintSummary {
  return summarizeFingerprint(fingerprint);
}
