// ===== GAP ANALYSIS AGENT =====
// Compares user's performance against viral benchmarks across 6 dimensions

import Anthropic from '@anthropic-ai/sdk';
import prisma from '@/lib/db';

interface GapAnalysisResult {
  overallGapScore: number;
  hookStrength: number;
  formatMatch: number;
  toneAlignment: number;
  ctaEffectiveness: number;
  engagementVelocity: number;
  postingConsistency: number;
  strengths: string[];
  gaps: string[];
  actionItems: string[];
  rawAnalysis: string;
}

/**
 * Run gap analysis for a specific brand
 */
export async function runGapAnalysis(brandId: string): Promise<GapAnalysisResult | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('[gap-analysis] No API key');
    return null;
  }

  // Get user's latest 7-day performance snapshot
  const snapshot = await prisma.performanceSnapshot.findFirst({
    where: { brandId, windowDays: 7 },
    orderBy: { computedAt: 'desc' },
  });

  // Get user's last 20 tweets
  const recentTweets = await prisma.brandTweet.findMany({
    where: { brandId },
    orderBy: { postedAt: 'desc' },
    take: 20,
  });

  // Get brand's niches
  const niches = await prisma.contentNiche.findMany({
    where: { brandId, isActive: true },
    select: { name: true },
  });
  const nicheNames = niches.map(n => n.name);

  // Get top 20 viral benchmarks from user's niches
  const benchmarks = await prisma.viralBenchmark.findMany({
    where: {
      brandId,
      ...(nicheNames.length > 0 ? { niche: { in: nicheNames } } : {}),
    },
    orderBy: { viralScore: 'desc' },
    take: 20,
  });

  // Get brand's voice fingerprint
  const brand = await prisma.brand.findUnique({
    where: { id: brandId },
    select: { name: true, voiceFingerprint: true, tone: true, keywords: true },
  });

  if (!brand) return null;

  // Build the prompt
  const userTweetsText = recentTweets.length > 0
    ? recentTweets.map((t, i) => {
        const m = JSON.parse(t.metrics);
        return `[${i + 1}] ${t.text}\n    engagement: ${m.likes || 0}L / ${m.retweets || 0}RT / ${m.replies || 0}R / ${m.impressions || 0} imp`;
      }).join('\n\n')
    : 'No recent tweets available.';

  const benchmarkText = benchmarks.length > 0
    ? benchmarks.map((b, i) => {
        const p = JSON.parse(b.patterns);
        return `[${i + 1}] (score: ${b.viralScore}) ${b.content}\n    patterns: hook=${p.hookType}, format=${p.format}, tone=${p.tone}, cta=${p.cta}`;
      }).join('\n\n')
    : 'No viral benchmarks available yet.';

  const snapshotText = snapshot
    ? `7-Day Performance:
- Posts: ${snapshot.totalPosts}
- Avg engagement rate: ${snapshot.avgEngagementRate}%
- Total impressions: ${snapshot.totalImpressions}
- Best hour: ${snapshot.bestPostingHour ?? 'unknown'}
- Best day: ${snapshot.bestPostingDay ?? 'unknown'}
- Avg post length: ${snapshot.avgPostLength ?? 'unknown'}`
    : 'No performance snapshot available yet.';

  try {
    const anthropic = new Anthropic({ apiKey });

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: `You are a brand growth analyst. Compare this creator's content performance against viral benchmarks in their niche.

CREATOR: ${brand.name}
${brand.voiceFingerprint ? `VOICE FINGERPRINT: ${brand.voiceFingerprint}` : ''}
BRAND TONE: ${brand.tone}
BRAND KEYWORDS: ${brand.keywords}

${snapshotText}

USER'S RECENT TWEETS:
${userTweetsText}

VIRAL BENCHMARKS IN THEIR NICHE:
${benchmarkText}

Score the creator on these 6 dimensions (0-100 each):

1. **Hook Strength** — How compelling are their opening lines compared to viral hooks?
2. **Format Match** — Are they using content formats that go viral in their niche?
3. **Tone Alignment** — Does their voice match what resonates in the niche while staying authentic?
4. **CTA Effectiveness** — How well do they drive engagement compared to viral CTAs?
5. **Engagement Velocity** — How does their engagement rate compare to niche benchmarks?
6. **Posting Consistency** — How does their frequency/timing compare to top performers?

Return ONLY valid JSON:
{
  "hookStrength": 0-100,
  "formatMatch": 0-100,
  "toneAlignment": 0-100,
  "ctaEffectiveness": 0-100,
  "engagementVelocity": 0-100,
  "postingConsistency": 0-100,
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "gaps": ["gap 1", "gap 2", "gap 3"],
  "actionItems": [
    "Most important action to take",
    "Second priority action",
    "Third priority action",
    "Fourth priority action",
    "Fifth priority action"
  ],
  "analysis": "2-3 sentence overall assessment"
}`,
      }],
    });

    const responseText = response.content[0].type === 'text' ? response.content[0].text : '';
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[gap-analysis] Failed to parse response');
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0]);

    const result: GapAnalysisResult = {
      hookStrength: clamp(parsed.hookStrength || 50),
      formatMatch: clamp(parsed.formatMatch || 50),
      toneAlignment: clamp(parsed.toneAlignment || 50),
      ctaEffectiveness: clamp(parsed.ctaEffectiveness || 50),
      engagementVelocity: clamp(parsed.engagementVelocity || 50),
      postingConsistency: clamp(parsed.postingConsistency || 50),
      overallGapScore: 0,
      strengths: parsed.strengths || [],
      gaps: parsed.gaps || [],
      actionItems: parsed.actionItems || [],
      rawAnalysis: parsed.analysis || '',
    };

    result.overallGapScore = Math.round(
      (result.hookStrength + result.formatMatch + result.toneAlignment +
        result.ctaEffectiveness + result.engagementVelocity + result.postingConsistency) / 6
    );

    // Store in DB
    await prisma.gapAnalysis.create({
      data: {
        brandId,
        overallGapScore: result.overallGapScore,
        hookStrength: result.hookStrength,
        formatMatch: result.formatMatch,
        toneAlignment: result.toneAlignment,
        ctaEffectiveness: result.ctaEffectiveness,
        engagementVelocity: result.engagementVelocity,
        postingConsistency: result.postingConsistency,
        strengths: JSON.stringify(result.strengths),
        gaps: JSON.stringify(result.gaps),
        actionItems: JSON.stringify(result.actionItems),
        rawAnalysis: result.rawAnalysis,
      },
    });

    return result;
  } catch (error) {
    console.error('[gap-analysis] Error:', error);
    return null;
  }
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}
