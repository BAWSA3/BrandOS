import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { BrandDNA, TasteTranslation } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { brandDNA, feedback } = await request.json() as {
      brandDNA: BrandDNA;
      feedback: string;
    };

    if (!brandDNA?.name || !feedback) {
      return NextResponse.json({ error: 'Missing brand DNA or feedback' }, { status: 400 });
    }

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `You are a Taste Translation Engine. Your job is to convert subjective, taste-based feedback into concrete, actionable design rules.

BRAND CONTEXT:
- Name: ${brandDNA.name}
- Colors: Primary ${brandDNA.colors.primary}, Secondary ${brandDNA.colors.secondary}, Accent ${brandDNA.colors.accent}
- Keywords: ${brandDNA.keywords.join(', ') || 'None'}
- Current Tone: Minimal (${brandDNA.tone.minimal}/100), Playful (${brandDNA.tone.playful}/100), Bold (${brandDNA.tone.bold}/100), Experimental (${brandDNA.tone.experimental}/100)

SUBJECTIVE FEEDBACK TO TRANSLATE:
"${feedback}"

Common taste feedback patterns:
- "Doesn't feel premium" → Reduce saturation, increase whitespace, refine typography
- "Too corporate" → Add warmth, use more organic shapes, soften edges
- "Not modern enough" → Simplify, use bolder typography, increase contrast
- "Feels cheap" → Increase quality of imagery, refine color palette, add subtle details
- "Too busy" → Remove elements, increase spacing, simplify hierarchy

Return ONLY valid JSON with this exact structure:
{
  "interpretation": "What this feedback actually means in design terms",
  "category": "premium" | "modern" | "playful" | "minimal" | "bold" | "elegant" | "other",
  "actionableRules": [
    "Specific, concrete rule 1 (e.g., 'Reduce saturation by 20%')",
    "Specific, concrete rule 2 (e.g., 'Increase line spacing to 1.6')",
    "Specific, concrete rule 3",
    "..."
  ]
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
    
    const translation: TasteTranslation = {
      id: uuidv4(),
      feedback,
      interpretation: parsed.interpretation,
      actionableRules: parsed.actionableRules,
      category: parsed.category,
    };

    return NextResponse.json(translation);

  } catch (error: any) {
    console.error('Taste Translation API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to translate feedback' },
      { status: 500 }
    );
  }
}

