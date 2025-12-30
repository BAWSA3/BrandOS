import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { BrandDNA, DesignIntentBlock } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { brandDNA, directive } = await request.json() as {
      brandDNA: BrandDNA;
      directive: string;
    };

    if (!brandDNA?.name || !directive) {
      return NextResponse.json({ error: 'Missing brand DNA or directive' }, { status: 400 });
    }

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `You are a brand design system architect. Convert the following natural language brand directive into a structured Design Intent Block.

BRAND CONTEXT:
- Name: ${brandDNA.name}
- Primary Color: ${brandDNA.colors.primary}
- Secondary Color: ${brandDNA.colors.secondary}
- Accent Color: ${brandDNA.colors.accent}
- Keywords: ${brandDNA.keywords.join(', ') || 'None'}
- Tone: Minimal (${brandDNA.tone.minimal}/100), Playful (${brandDNA.tone.playful}/100), Bold (${brandDNA.tone.bold}/100), Experimental (${brandDNA.tone.experimental}/100)

DIRECTIVE TO CONVERT:
"${directive}"

Return ONLY valid JSON with this exact structure:
{
  "intentType": "visual_style" | "typography" | "layout" | "motion" | "color" | "tone",
  "colors": ["color names or hex codes mentioned or implied"],
  "effects": ["visual effects like gradients, shadows, blur, etc."],
  "emotionalSignals": ["emotions this should evoke"],
  "rules": ["specific, enforceable design rules derived from this directive"]
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
    
    const intentBlock: DesignIntentBlock = {
      id: uuidv4(),
      input: directive,
      intentType: parsed.intentType,
      colors: parsed.colors,
      effects: parsed.effects,
      emotionalSignals: parsed.emotionalSignals,
      rules: parsed.rules,
      createdAt: new Date(),
    };

    return NextResponse.json(intentBlock);

  } catch (error: any) {
    console.error('Design Intent API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process directive' },
      { status: 500 }
    );
  }
}

