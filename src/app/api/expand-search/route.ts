import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { BrandDNA } from '@/lib/types';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { prompt, brandDNA } = await request.json() as {
      prompt: string;
      brandDNA: BrandDNA;
    };

    if (!prompt || !brandDNA?.name) {
      return NextResponse.json({ error: 'Missing prompt or brand DNA' }, { status: 400 });
    }

    const toneDescriptors = [
      brandDNA.tone.minimal > 70 ? 'minimal' : '',
      brandDNA.tone.bold > 70 ? 'bold' : '',
      brandDNA.tone.playful > 70 ? 'playful' : '',
      brandDNA.tone.experimental > 70 ? 'experimental' : '',
    ].filter(Boolean).join(', ') || 'balanced';

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 200,
      messages: [
        {
          role: 'user',
          content: `You are a creative director helping search for visual inspiration on Pinterest.

Brand context:
- Name: ${brandDNA.name}
- Keywords: ${brandDNA.keywords.join(', ') || 'none specified'}
- Tone: ${toneDescriptors}

User's request: "${prompt}"

Generate 3 Pinterest search queries that would find images matching this request AND the brand's aesthetic. Make them specific and visual.

Return ONLY a JSON array of strings, no explanation:
["query 1", "query 2", "query 3"]`,
        },
      ],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    
    if (!jsonMatch) {
      throw new Error('Invalid response format');
    }
    
    const queries = JSON.parse(jsonMatch[0]);

    return NextResponse.json({ queries });

  } catch (error: any) {
    console.error('Expand search error:', error);
    return NextResponse.json({ error: error.message || 'Failed to expand search' }, { status: 500 });
  }
}

