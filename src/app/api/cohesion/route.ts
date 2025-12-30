import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { BrandDNA, CohesionAnalysis } from '@/lib/types';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { brandDNA, assets } = await request.json() as {
      brandDNA: BrandDNA;
      assets: { type: string; content: string }[];
    };

    if (!brandDNA?.name || !assets?.length) {
      return NextResponse.json({ error: 'Missing brand DNA or assets' }, { status: 400 });
    }

    const assetsList = assets.map((a, i) => `Asset ${i + 1} (${a.type}): "${a.content}"`).join('\n');

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content: `You are a Brand Cohesion Analyzer. Analyze the following brand assets as a SYSTEM, not individual pieces. Look for patterns, inconsistencies, and gaps.

BRAND DNA:
- Name: ${brandDNA.name}
- Colors: Primary ${brandDNA.colors.primary}, Secondary ${brandDNA.colors.secondary}, Accent ${brandDNA.colors.accent}
- Keywords: ${brandDNA.keywords.join(', ') || 'None'}
- Tone: Minimal (${brandDNA.tone.minimal}/100), Playful (${brandDNA.tone.playful}/100), Bold (${brandDNA.tone.bold}/100), Experimental (${brandDNA.tone.experimental}/100)
- DO patterns: ${brandDNA.doPatterns.join('; ') || 'None'}
- DON'T patterns: ${brandDNA.dontPatterns.join('; ') || 'None'}

ASSETS TO ANALYZE AS A SYSTEM:
${assetsList}

Analyze for:
1. REPETITION ISSUES: Overused phrases, concepts, or patterns that make the brand feel stale
2. TONE DRIFT: Inconsistencies in voice/tone across assets
3. MISSING ANCHORS: Visual or verbal elements that should be present but aren't

Return ONLY valid JSON:
{
  "overallScore": 0-100,
  "repetitionIssues": ["issue 1", "issue 2"],
  "toneDrift": {
    "detected": true/false,
    "details": "explanation of tone inconsistencies",
    "severity": "low" | "medium" | "high"
  },
  "missingAnchors": ["missing element 1", "missing element 2"],
  "recommendations": ["actionable recommendation 1", "actionable recommendation 2"]
}`,
        },
      ],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('Invalid response format');
    }

    const analysis: CohesionAnalysis = JSON.parse(jsonMatch[0]);
    return NextResponse.json(analysis);

  } catch (error: any) {
    console.error('Cohesion Analysis API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze cohesion' },
      { status: 500 }
    );
  }
}

