import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { BrandDNA, TasteProtectionResult } from '@/lib/types';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { brandDNA, content } = await request.json() as {
      brandDNA: BrandDNA;
      content: string;
    };

    if (!brandDNA?.name || !content) {
      return NextResponse.json({ error: 'Missing brand DNA or content' }, { status: 400 });
    }

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content: `You are a Taste Protection System. Your philosophy: RESTRAINT over excess. REMOVAL over addition. REFINEMENT over decoration.

BRAND DNA:
- Name: ${brandDNA.name}
- Keywords: ${brandDNA.keywords.join(', ') || 'None'}
- Tone: Minimal (${brandDNA.tone.minimal}/100), Playful (${brandDNA.tone.playful}/100), Bold (${brandDNA.tone.bold}/100), Experimental (${brandDNA.tone.experimental}/100)

CONTENT TO EVALUATE:
"${content}"

Analyze for over-design and excess. Look for:
- Unnecessary adjectives or modifiers
- Redundant phrases
- Excessive punctuation (!!!, ???, ...)
- Too many buzzwords
- Over-explaining
- Trying too hard
- Feature bloat in copy
- Purple prose

Your job is to protect taste by suggesting what to REMOVE, not what to add.

Return ONLY valid JSON:
{
  "analysis": {
    "isOverDesigned": true/false,
    "excessElements": ["element that should be removed"],
    "unnecessaryAdditions": ["things that are trying too hard"]
  },
  "recommendations": [
    {
      "type": "remove" | "simplify" | "refine",
      "element": "what to change",
      "reason": "why this improves the content"
    }
  ],
  "refinedVersion": "cleaner, more refined version with excess removed"
}`,
        },
      ],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('Invalid response format');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    const result: TasteProtectionResult = {
      originalContent: content,
      analysis: parsed.analysis,
      recommendations: parsed.recommendations,
      refinedVersion: parsed.refinedVersion,
    };

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Taste Protection API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze content' },
      { status: 500 }
    );
  }
}

