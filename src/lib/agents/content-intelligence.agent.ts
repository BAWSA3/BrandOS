// ===== CONTENT INTELLIGENCE AGENT =====
// Generates viral-pattern-matched content ideas in the user's voice

import Anthropic from '@anthropic-ai/sdk';
import prisma from '@/lib/db';

interface IntelligentContentIdea {
  hook: string;
  fullContent: string;
  tone: string;
  viralPatternApplied: string;
  gapAddressed: string;
  confidenceScore: number;
}

/**
 * Generate intelligence-driven content ideas for a brand
 */
export async function generateIntelligentContent(brandId: string): Promise<{
  ideasGenerated: number;
  draftsCreated: number;
}> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { ideasGenerated: 0, draftsCreated: 0 };

  // Get latest gap analysis
  const gapAnalysis = await prisma.gapAnalysis.findFirst({
    where: { brandId },
    orderBy: { computedAt: 'desc' },
  });

  // Get top viral benchmarks
  const benchmarks = await prisma.viralBenchmark.findMany({
    where: { brandId },
    orderBy: { viralScore: 'desc' },
    take: 10,
  });

  // Get brand data
  const brand = await prisma.brand.findUnique({
    where: { id: brandId },
    select: {
      name: true,
      tone: true,
      keywords: true,
      doPatterns: true,
      dontPatterns: true,
      voiceSamples: true,
      voiceFingerprint: true,
    },
  });

  if (!brand) return { ideasGenerated: 0, draftsCreated: 0 };

  // Build gap-specific instructions
  const gapInstructions: string[] = [];
  if (gapAnalysis) {
    const gaps: string[] = JSON.parse(gapAnalysis.gaps);
    const actionItems: string[] = JSON.parse(gapAnalysis.actionItems);

    if (gapAnalysis.hookStrength < 50) {
      gapInstructions.push('PRIORITY: Hooks are weak. Every idea MUST start with a scroll-stopping first line.');
    }
    if (gapAnalysis.formatMatch < 50) {
      gapInstructions.push('PRIORITY: Content format doesn\'t match what goes viral. Vary between threads, lists, stories, and hot takes.');
    }
    if (gapAnalysis.toneAlignment < 50) {
      gapInstructions.push('PRIORITY: Tone needs adjustment. Study the viral benchmarks\' tone and adapt (don\'t copy).');
    }
    if (gapAnalysis.ctaEffectiveness < 50) {
      gapInstructions.push('PRIORITY: CTAs are weak. Include clear, natural calls to action that drive replies or saves.');
    }

    if (gaps.length > 0) gapInstructions.push(`KEY GAPS: ${gaps.join('; ')}`);
    if (actionItems.length > 0) gapInstructions.push(`ACTION ITEMS: ${actionItems.slice(0, 3).join('; ')}`);
  }

  // Build viral patterns context
  const viralPatternsText = benchmarks.length > 0
    ? benchmarks.map(b => {
        const p = JSON.parse(b.patterns);
        return `- "${b.content.substring(0, 100)}..." (score: ${b.viralScore}) → hook: ${p.hookType}, format: ${p.format}, tone: ${p.tone}`;
      }).join('\n')
    : 'No viral benchmarks available yet. Generate general best-practice content.';

  // Parse voice samples
  let voiceSamples: string[] = [];
  try { voiceSamples = JSON.parse(brand.voiceSamples); } catch { /* ignore */ }

  let keywords: string[] = [];
  try { keywords = JSON.parse(brand.keywords); } catch { /* ignore */ }

  let doPatterns: string[] = [];
  try { doPatterns = JSON.parse(brand.doPatterns); } catch { /* ignore */ }

  let dontPatterns: string[] = [];
  try { dontPatterns = JSON.parse(brand.dontPatterns); } catch { /* ignore */ }

  try {
    const anthropic = new Anthropic({ apiKey });

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      messages: [{
        role: 'user',
        content: `You are a content strategist generating viral-pattern-matched content ideas for a personal brand on X/Twitter.

BRAND: ${brand.name}
BRAND TONE: ${brand.tone}
BRAND KEYWORDS: ${keywords.join(', ')}
DO: ${doPatterns.join('; ')}
DON'T: ${dontPatterns.join('; ')}
${voiceSamples.length > 0 ? `VOICE SAMPLES:\n${voiceSamples.slice(0, 3).join('\n')}` : ''}
${brand.voiceFingerprint ? `VOICE FINGERPRINT: ${brand.voiceFingerprint}` : ''}

VIRAL PATTERNS FROM THEIR NICHE:
${viralPatternsText}

${gapInstructions.length > 0 ? `GAP-SPECIFIC INSTRUCTIONS:\n${gapInstructions.join('\n')}` : ''}

Generate 7 content ideas. Each idea must:
1. Apply a specific viral pattern (hook type, format, tone) from the benchmarks
2. Sound like THIS creator, not a copy of the viral post
3. Address at least one identified gap (if gaps exist)
4. Be ready to post with minimal editing

CRITICAL RULES:
- If any phrase sounds like "ChatGPT wrote this", rewrite it
- No generic motivation quotes
- No "here's the thing" or "let me tell you" or other AI-sounding openers
- Match the creator's actual voice from their samples and fingerprint
- Be specific, not vague

Return ONLY valid JSON:
{
  "ideas": [
    {
      "hook": "The first line / scroll-stopper",
      "fullContent": "The complete post content, ready to copy-paste",
      "tone": "hot-take" | "educational" | "casual" | "behind-the-scenes" | "launch" | "thread-starter",
      "viralPatternApplied": "Brief description of which viral pattern was used",
      "gapAddressed": "Which gap this addresses (or 'general' if no specific gap)",
      "confidenceScore": 70-95
    }
  ]
}`,
      }],
    });

    const responseText = response.content[0].type === 'text' ? response.content[0].text : '';
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { ideasGenerated: 0, draftsCreated: 0 };

    const parsed = JSON.parse(jsonMatch[0]);
    const ideas: IntelligentContentIdea[] = parsed.ideas || [];

    // Store as ContentDraft records
    let draftsCreated = 0;
    for (const idea of ideas) {
      await prisma.contentDraft.create({
        data: {
          content: idea.fullContent,
          contentType: idea.tone === 'thread-starter' ? 'thread' : 'tweet',
          tone: idea.tone,
          status: 'idea',
          sourceType: 'intelligence-feed',
          authenticity: idea.confidenceScore,
          brandId,
        },
      });
      draftsCreated++;
    }

    return { ideasGenerated: ideas.length, draftsCreated };
  } catch (error) {
    console.error('[content-intelligence] Error:', error);
    return { ideasGenerated: 0, draftsCreated: 0 };
  }
}
