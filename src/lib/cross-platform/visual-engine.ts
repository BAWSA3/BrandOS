// =============================================================================
// VISUAL BRAND CONSISTENCY ENGINE
// Uses Gemini Vision to analyze images against a brand's Visual DNA.
// =============================================================================

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { VisualDNA } from './types';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '');

export interface VisualConsistencyResult {
  overallScore: number;
  colorAdherence: {
    score: number;
    matchedColors: string[];
    offBrandColors: string[];
    feedback: string;
  };
  styleCoherence: {
    score: number;
    detectedStyle: string;
    expectedStyle: string;
    feedback: string;
  };
  logoPresence: {
    detected: boolean;
    placementCorrect: boolean | null;
    feedback: string;
  };
  moodAlignment: {
    score: number;
    detectedMood: string[];
    expectedMood: string[];
    feedback: string;
  };
  recommendations: string[];
  analyzedAt: string;
}

export interface CrossPlatformVisualAudit {
  overallScore: number;
  perImage: {
    url: string;
    score: number;
    issues: string[];
  }[];
  consistencyAcrossImages: number;
  recommendations: string[];
}

/**
 * Build the Gemini prompt for visual consistency analysis.
 */
function buildVisualConsistencyPrompt(visualDNA: VisualDNA): string {
  return `You are a brand visual consistency analyst. Analyze this image against the brand's Visual DNA and score how well it adheres to the brand guidelines.

BRAND VISUAL DNA:
- Primary Color: ${visualDNA.colorPalette.primary}
- Secondary Color: ${visualDNA.colorPalette.secondary}
- Accent Color: ${visualDNA.colorPalette.accent}
- Color Tolerance: ${visualDNA.colorPalette.tolerancePercent}%
- Typography Style: ${visualDNA.typography.style}${visualDNA.typography.headingFont ? `, Heading: ${visualDNA.typography.headingFont}` : ''}${visualDNA.typography.bodyFont ? `, Body: ${visualDNA.typography.bodyFont}` : ''}
- Image Style: ${visualDNA.imageStyle}
- Mood Keywords: ${visualDNA.moodKeywords.join(', ')}
- Logo Usage Rules: ${visualDNA.logoUsageRules.join('; ')}
${visualDNA.filterPreset ? `- Filter Preset: ${visualDNA.filterPreset}` : ''}

SCORING CRITERIA:
1. COLOR ADHERENCE (0-100): Do the dominant colors match or harmonize with the brand palette?
2. STYLE COHERENCE (0-100): Does the image style match the expected style (${visualDNA.imageStyle})?
3. LOGO PRESENCE: Is a logo/brand mark visible? If yes, is placement appropriate?
4. MOOD ALIGNMENT (0-100): Does the mood/feeling match the brand's mood keywords?

Return ONLY valid JSON:
{
  "overallScore": <0-100>,
  "colorAdherence": {
    "score": <0-100>,
    "matchedColors": ["#hex1", "#hex2"],
    "offBrandColors": ["#hex1"],
    "feedback": "Brief feedback on color usage"
  },
  "styleCoherence": {
    "score": <0-100>,
    "detectedStyle": "detected image style",
    "expectedStyle": "${visualDNA.imageStyle}",
    "feedback": "Brief feedback on style match"
  },
  "logoPresence": {
    "detected": true|false,
    "placementCorrect": true|false|null,
    "feedback": "Brief feedback on logo usage"
  },
  "moodAlignment": {
    "score": <0-100>,
    "detectedMood": ["mood1", "mood2"],
    "expectedMood": ${JSON.stringify(visualDNA.moodKeywords)},
    "feedback": "Brief feedback on mood alignment"
  },
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"]
}`;
}

/**
 * Analyze a single image against the brand's Visual DNA using Gemini Vision.
 */
export async function analyzeVisualConsistency(
  imageUrl: string,
  visualDNA: VisualDNA
): Promise<VisualConsistencyResult | null> {
  try {
    if (!process.env.GOOGLE_GEMINI_API_KEY) {
      console.error('[Visual] GOOGLE_GEMINI_API_KEY not configured');
      return null;
    }

    // Fetch image and convert to base64
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      console.error('[Visual] Failed to fetch image:', imageUrl);
      return null;
    }

    const arrayBuffer = await imageResponse.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = buildVisualConsistencyPrompt(visualDNA);

    const result = await model.generateContent([
      { inlineData: { mimeType, data: base64 } },
      prompt,
    ]);

    const response = await result.response;
    const text = response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]) as VisualConsistencyResult;
    parsed.analyzedAt = new Date().toISOString();
    return parsed;
  } catch (error) {
    console.error('[Visual] Analysis error:', error);
    return null;
  }
}

/**
 * Run visual consistency across multiple images and compute aggregate scores.
 */
export async function auditVisualConsistency(
  imageUrls: string[],
  visualDNA: VisualDNA
): Promise<CrossPlatformVisualAudit> {
  const results: { url: string; result: VisualConsistencyResult | null }[] = [];

  // Analyze in parallel (max 5 at a time)
  const batches = chunk(imageUrls, 5);
  for (const batch of batches) {
    const batchResults = await Promise.all(
      batch.map(async (url) => ({
        url,
        result: await analyzeVisualConsistency(url, visualDNA),
      }))
    );
    results.push(...batchResults);
  }

  const successful = results.filter((r) => r.result !== null);

  if (successful.length === 0) {
    return {
      overallScore: 0,
      perImage: results.map((r) => ({
        url: r.url,
        score: 0,
        issues: ['Analysis failed for this image'],
      })),
      consistencyAcrossImages: 0,
      recommendations: ['Ensure images are publicly accessible and try again.'],
    };
  }

  const scores = successful.map((r) => r.result!.overallScore);
  const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

  // Cross-image consistency (low variance = consistent)
  const variance =
    scores.reduce((sum, s) => sum + Math.pow(s - avgScore, 2), 0) / scores.length;
  const stdDev = Math.sqrt(variance);
  const consistencyAcrossImages = Math.round(Math.max(0, 100 - stdDev * 2));

  const allRecommendations = successful
    .flatMap((r) => r.result!.recommendations)
    .filter((v, i, a) => a.indexOf(v) === i)
    .slice(0, 5);

  return {
    overallScore: Math.round(avgScore * 0.7 + consistencyAcrossImages * 0.3),
    perImage: results.map((r) => ({
      url: r.url,
      score: r.result?.overallScore ?? 0,
      issues: r.result
        ? [
            ...(r.result.colorAdherence.score < 60 ? [`Color: ${r.result.colorAdherence.feedback}`] : []),
            ...(r.result.styleCoherence.score < 60 ? [`Style: ${r.result.styleCoherence.feedback}`] : []),
            ...(r.result.moodAlignment.score < 60 ? [`Mood: ${r.result.moodAlignment.feedback}`] : []),
          ]
        : ['Analysis failed'],
    })),
    consistencyAcrossImages,
    recommendations: allRecommendations,
  };
}

/**
 * Analyze a brand's visual identity across platforms by comparing
 * profile images, cover photos, and recent post visuals.
 */
export async function crossPlatformVisualAudit(
  platformImages: { platform: string; imageUrls: string[] }[],
  visualDNA: VisualDNA
): Promise<{
  overallScore: number;
  perPlatform: { platform: string; score: number; issues: string[] }[];
  crossPlatformConsistency: number;
  recommendations: string[];
}> {
  const platformResults: { platform: string; audit: CrossPlatformVisualAudit }[] = [];

  for (const { platform, imageUrls } of platformImages) {
    if (imageUrls.length === 0) continue;
    const audit = await auditVisualConsistency(imageUrls, visualDNA);
    platformResults.push({ platform, audit });
  }

  if (platformResults.length === 0) {
    return {
      overallScore: 0,
      perPlatform: [],
      crossPlatformConsistency: 0,
      recommendations: ['Connect platforms and sync visual content to run a visual audit.'],
    };
  }

  const platformScores = platformResults.map((r) => r.audit.overallScore);
  const avgScore = Math.round(
    platformScores.reduce((a, b) => a + b, 0) / platformScores.length
  );

  const variance =
    platformScores.reduce((sum, s) => sum + Math.pow(s - avgScore, 2), 0) /
    platformScores.length;
  const crossPlatformConsistency = Math.round(Math.max(0, 100 - Math.sqrt(variance) * 2));

  return {
    overallScore: Math.round(avgScore * 0.6 + crossPlatformConsistency * 0.4),
    perPlatform: platformResults.map((r) => ({
      platform: r.platform,
      score: r.audit.overallScore,
      issues: r.audit.perImage
        .flatMap((p) => p.issues)
        .filter((v, i, a) => a.indexOf(v) === i)
        .slice(0, 3),
    })),
    crossPlatformConsistency,
    recommendations: platformResults
      .flatMap((r) => r.audit.recommendations)
      .filter((v, i, a) => a.indexOf(v) === i)
      .slice(0, 5),
  };
}

// ── Helpers ─────────────────────────────────────────────────────

function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}
