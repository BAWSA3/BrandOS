import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { BrandDNA, ToneContext, ContextAdaptedContent, ContextToneRules } from '@/lib/types';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const CONTEXT_SPECS: Record<ToneContext, { description: string; adjustments: string }> = {
  launch: {
    description: 'Product or feature launch announcement',
    adjustments: 'High energy, confident, exciting but not overhyped. Focus on impact and value.',
  },
  tease: {
    description: 'Building anticipation for something coming',
    adjustments: 'Mysterious, intriguing, create curiosity. Less information, more emotion.',
  },
  apology: {
    description: 'Addressing a mistake or issue',
    adjustments: 'Humble, sincere, accountable. No corporate speak. Direct and human.',
  },
  crisis: {
    description: 'Responding to a serious issue or emergency',
    adjustments: 'Calm, factual, empathetic. Clear action steps. No marketing language.',
  },
  celebration: {
    description: 'Celebrating a milestone or achievement',
    adjustments: 'Grateful, inclusive, forward-looking. Credit the community. Authentic joy.',
  },
  update: {
    description: 'Regular product or company update',
    adjustments: 'Clear, concise, value-focused. What changed and why it matters.',
  },
  educational: {
    description: 'Teaching or explaining something',
    adjustments: 'Helpful, patient, clear. No condescension. Practical and actionable.',
  },
};

export async function POST(request: NextRequest) {
  try {
    const { brandDNA, content, context, action } = await request.json() as {
      brandDNA: BrandDNA;
      content?: string;
      context: ToneContext;
      action: 'adapt' | 'get-rules';
    };

    if (!brandDNA?.name || !context) {
      return NextResponse.json({ error: 'Missing brand DNA or context' }, { status: 400 });
    }

    // If just getting rules for a context
    if (action === 'get-rules') {
      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: `Generate context-specific tone rules for the "${context}" context for this brand.

BRAND DNA:
- Name: ${brandDNA.name}
- Keywords: ${brandDNA.keywords.join(', ') || 'None'}
- Base Tone: Minimal (${brandDNA.tone.minimal}/100), Playful (${brandDNA.tone.playful}/100), Bold (${brandDNA.tone.bold}/100), Experimental (${brandDNA.tone.experimental}/100)

CONTEXT: ${context}
Description: ${CONTEXT_SPECS[context].description}
General Adjustments: ${CONTEXT_SPECS[context].adjustments}

Return ONLY valid JSON:
{
  "context": "${context}",
  "description": "what this context means for ${brandDNA.name}",
  "toneAdjustments": {
    "formality": -100 to +100 adjustment from base,
    "energy": -100 to +100,
    "confidence": -100 to +100,
    "urgency": -100 to +100
  },
  "doRules": ["what to do in this context"],
  "dontRules": ["what to avoid in this context"],
  "examplePhrases": ["example phrase 1", "example phrase 2"]
}`,
          },
        ],
      });

      const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) throw new Error('Invalid response format');
      
      const rules: ContextToneRules = JSON.parse(jsonMatch[0]);
      return NextResponse.json(rules);
    }

    // Adapt content for context
    if (!content) {
      return NextResponse.json({ error: 'Missing content to adapt' }, { status: 400 });
    }

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: `Adapt this content for the "${context}" context while maintaining brand identity.

BRAND DNA:
- Name: ${brandDNA.name}
- Keywords: ${brandDNA.keywords.join(', ') || 'None'}
- Base Tone: Minimal (${brandDNA.tone.minimal}/100), Playful (${brandDNA.tone.playful}/100), Bold (${brandDNA.tone.bold}/100), Experimental (${brandDNA.tone.experimental}/100)
- Voice samples: ${brandDNA.voiceSamples.join(' | ') || 'None'}

CONTEXT: ${context}
Description: ${CONTEXT_SPECS[context].description}
Adjustments needed: ${CONTEXT_SPECS[context].adjustments}

ORIGINAL CONTENT:
"${content}"

Adapt the tone for this specific context while keeping the brand voice recognizable.

Return ONLY valid JSON:
{
  "adaptedContent": "the adapted content",
  "adjustmentsApplied": ["what you changed and why"]
}`,
        },
      ],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) throw new Error('Invalid response format');
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    const result: ContextAdaptedContent = {
      originalContent: content,
      context,
      adaptedContent: parsed.adaptedContent,
      adjustmentsApplied: parsed.adjustmentsApplied,
    };

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Context Tone API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process context tone' },
      { status: 500 }
    );
  }
}

