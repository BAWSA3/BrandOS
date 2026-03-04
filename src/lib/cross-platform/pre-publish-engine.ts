// =============================================================================
// PRE-PUBLISH BRAND CHECKER ENGINE
// Check content BEFORE posting — voice alignment, tone, platform best practices.
// =============================================================================

import { GoogleGenerativeAI } from '@google/generative-ai';
import type {
  SocialPlatform,
  CrossPlatformContentType,
  PrePublishCheck,
} from './types';
import { PLATFORM_NORMS, PLATFORM_LABELS } from './types';
import type { BrandDNA } from '@/lib/types';
import type { VoiceFingerprint } from '@/lib/voice-fingerprint';
import { summarizeFingerprint, formatSummaryForPrompt } from '@/lib/voice-fingerprint';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '');

function buildPrePublishPrompt(
  content: string,
  platform: SocialPlatform,
  brandDNA: BrandDNA,
  contentType?: CrossPlatformContentType,
  fingerprint?: VoiceFingerprint | null
): string {
  const norms = PLATFORM_NORMS[platform];

  let fingerprintSection = '';
  if (fingerprint) {
    const summary = summarizeFingerprint(fingerprint);
    fingerprintSection = `\n\n${formatSummaryForPrompt(summary)}`;
  }

  return `You are a brand consistency checker. Analyze this content BEFORE it gets published and score how well it aligns with the brand's voice and the target platform's norms.

CONTENT TO CHECK:
"${content}"

TARGET PLATFORM: ${PLATFORM_LABELS[platform]}
CONTENT TYPE: ${contentType ?? 'text'}

PLATFORM NORMS for ${PLATFORM_LABELS[platform]}:
- Expected Formality: ${norms.expectedFormality}/100
- Length Range: ${norms.expectedLength.min}-${norms.expectedLength.max} characters
- Hashtag Usage: ${norms.hashtagNorms}
- Emoji Usage: ${norms.emojiNorms}
- Platform Style: ${norms.description}

BRAND DNA:
- Brand Name: ${brandDNA.name}
- Tone: minimal=${brandDNA.tone.minimal}/100, playful=${brandDNA.tone.playful}/100, bold=${brandDNA.tone.bold}/100, experimental=${brandDNA.tone.experimental}/100
- Keywords to use: ${brandDNA.keywords.join(', ')}
- Do Patterns: ${brandDNA.doPatterns.join('; ')}
- Don't Patterns: ${brandDNA.dontPatterns.join('; ')}
- Voice Samples: ${brandDNA.voiceSamples.slice(0, 3).map((s) => `"${s.substring(0, 100)}"`).join(', ')}
${fingerprintSection}

SCORING CRITERIA:
1. VOICE ALIGNMENT (0-100): Does this sound like the brand? Match against voice samples, patterns, and fingerprint.
2. TONE CHECK (0-100): Is the tone appropriate for the brand AND the target platform?
3. PLATFORM BEST PRACTICES (0-100): Does the content follow the platform's conventions?
   - Length appropriate?
   - Hashtags used correctly?
   - Emoji usage matches platform norms?
   - Content type fits the platform?

ISSUES TO FLAG:
- "info": Minor suggestion, optional improvement
- "warning": Should be addressed before posting
- "critical": Must be fixed — brand-damaging or platform-inappropriate

Return ONLY valid JSON:
{
  "overallScore": <0-100>,
  "voiceAlignment": <0-100>,
  "toneCheck": {
    "score": <0-100>,
    "feedback": "Specific feedback on tone"
  },
  "platformBestPractices": {
    "score": <0-100>,
    "suggestions": ["Specific platform suggestion 1", "Suggestion 2"]
  },
  "issues": [
    {
      "severity": "info|warning|critical",
      "message": "Description of the issue",
      "suggestion": "How to fix it"
    }
  ],
  "suggestedRewrite": "An improved version of the content that addresses all issues while maintaining brand voice (or null if score > 85)"
}`;
}

/**
 * Run a pre-publish brand check on content before posting.
 */
export async function runPrePublishCheck(
  content: string,
  platform: SocialPlatform,
  brandDNA: BrandDNA,
  options?: {
    contentType?: CrossPlatformContentType;
    fingerprint?: VoiceFingerprint | null;
    mediaUrls?: string[];
  }
): Promise<PrePublishCheck | null> {
  try {
    if (!process.env.GOOGLE_GEMINI_API_KEY) {
      console.error('[PrePublish] GOOGLE_GEMINI_API_KEY not configured');
      return null;
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const prompt = buildPrePublishPrompt(
      content,
      platform,
      brandDNA,
      options?.contentType,
      options?.fingerprint
    );

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      platform,
      contentType: options?.contentType ?? 'text',
      overallScore: parsed.overallScore ?? 0,
      voiceAlignment: parsed.voiceAlignment ?? 0,
      toneCheck: parsed.toneCheck ?? { score: 0, feedback: '' },
      platformBestPractices: parsed.platformBestPractices ?? { score: 0, suggestions: [] },
      issues: parsed.issues ?? [],
      suggestedRewrite: parsed.suggestedRewrite ?? undefined,
    };
  } catch (error) {
    console.error('[PrePublish] Analysis error:', error);
    return null;
  }
}

/**
 * Quick pre-publish check — fast heuristic checks without AI.
 * Use for instant feedback while the full AI check loads.
 */
export function quickPrePublishCheck(
  content: string,
  platform: SocialPlatform
): {
  issues: { severity: 'info' | 'warning' | 'critical'; message: string }[];
  lengthOk: boolean;
} {
  const norms = PLATFORM_NORMS[platform];
  const issues: { severity: 'info' | 'warning' | 'critical'; message: string }[] = [];
  const length = content.length;

  // Length check
  const lengthOk = length >= norms.expectedLength.min && length <= norms.expectedLength.max;
  if (length < norms.expectedLength.min) {
    issues.push({
      severity: 'warning',
      message: `Content is too short for ${PLATFORM_LABELS[platform]} (${length} chars, minimum ${norms.expectedLength.min}).`,
    });
  }
  if (length > norms.expectedLength.max) {
    issues.push({
      severity: 'critical',
      message: `Content exceeds ${PLATFORM_LABELS[platform]}'s character limit (${length}/${norms.expectedLength.max}).`,
    });
  }

  // Hashtag check
  const hashtagCount = (content.match(/#\w+/g) || []).length;
  if (norms.hashtagNorms === 'none' && hashtagCount > 0) {
    issues.push({
      severity: 'info',
      message: `Hashtags are not typical on ${PLATFORM_LABELS[platform]}.`,
    });
  }
  if (norms.hashtagNorms === 'heavy' && hashtagCount === 0) {
    issues.push({
      severity: 'info',
      message: `Consider adding hashtags — ${PLATFORM_LABELS[platform]} content benefits from them.`,
    });
  }

  // Emoji check
  const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
  const emojiCount = (content.match(emojiRegex) || []).length;
  if (norms.emojiNorms === 'none' && emojiCount > 2) {
    issues.push({
      severity: 'info',
      message: `Excessive emoji usage for ${PLATFORM_LABELS[platform]}'s professional tone.`,
    });
  }

  return { issues, lengthOk };
}
