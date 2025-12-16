import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { BrandDNA, Platform, PlatformAdaptation } from '@/lib/types';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const PLATFORM_SPECS: Record<Platform, { maxLength: number; style: string; rules: string[] }> = {
  twitter: {
    maxLength: 280,
    style: 'Concise, punchy, high-contrast. Use hooks.',
    rules: ['Max 280 chars', 'Front-load impact', 'Use line breaks strategically', 'Hashtags at end if needed'],
  },
  instagram: {
    maxLength: 2200,
    style: 'Visual storytelling, emotional, aspirational.',
    rules: ['Hook in first line', 'Use emojis sparingly', 'Break into paragraphs', 'CTA at end'],
  },
  linkedin: {
    maxLength: 3000,
    style: 'Professional, insightful, value-driven.',
    rules: ['Lead with insight', 'Use data points', 'Professional tone', 'Thought leadership angle'],
  },
  website: {
    maxLength: 500,
    style: 'Structural minimalism, scannable, clear hierarchy.',
    rules: ['Clear headline', 'Scannable structure', 'Benefit-focused', 'Strong CTA'],
  },
  email: {
    maxLength: 1000,
    style: 'Personal, direct, action-oriented.',
    rules: ['Compelling subject', 'Personal tone', 'Clear single CTA', 'Mobile-friendly length'],
  },
  tiktok: {
    maxLength: 150,
    style: 'Casual, trendy, hook-first.',
    rules: ['Hook in 1 second', 'Casual language', 'Trend-aware', 'Conversational'],
  },
};

export async function POST(request: NextRequest) {
  try {
    const { brandDNA, content, platforms } = await request.json() as {
      brandDNA: BrandDNA;
      content: string;
      platforms: Platform[];
    };

    if (!brandDNA?.name || !content || !platforms?.length) {
      return NextResponse.json({ error: 'Missing brand DNA, content, or platforms' }, { status: 400 });
    }

    const platformSpecs = platforms
      .map(p => `${p.toUpperCase()}:\n- Style: ${PLATFORM_SPECS[p].style}\n- Max Length: ${PLATFORM_SPECS[p].maxLength}\n- Rules: ${PLATFORM_SPECS[p].rules.join(', ')}`)
      .join('\n\n');

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: `You are a Platform Adaptation Engine. Adapt the content for each platform while preserving brand identity.

BRAND DNA:
- Name: ${brandDNA.name}
- Keywords: ${brandDNA.keywords.join(', ') || 'None'}
- Tone: Minimal (${brandDNA.tone.minimal}/100), Playful (${brandDNA.tone.playful}/100), Bold (${brandDNA.tone.bold}/100), Experimental (${brandDNA.tone.experimental}/100)
- Voice samples: ${brandDNA.voiceSamples.join(' | ') || 'None'}

ORIGINAL CONTENT:
"${content}"

PLATFORM SPECIFICATIONS:
${platformSpecs}

Adapt the content for each platform. Maintain brand voice but optimize for each platform's unique requirements.

Return ONLY valid JSON with this structure:
{
  "adaptations": {
    ${platforms.map(p => `"${p}": { "content": "adapted content here", "adjustments": ["adjustment 1", "adjustment 2"] }`).join(',\n    ')}
  }
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
    
    const adaptation: PlatformAdaptation = {
      originalContent: content,
      adaptations: parsed.adaptations,
    };

    return NextResponse.json(adaptation);

  } catch (error: any) {
    console.error('Platform Adaptation API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to adapt content' },
      { status: 500 }
    );
  }
}

