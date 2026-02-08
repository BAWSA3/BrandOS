import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { BrandDNA } from '@/lib/types';
import { buildBrandContext } from '@/prompts/brand-guardian';

interface IdeasRequest {
  brandDNA: BrandDNA;
  recentTopics?: string[];
  topPerformingTypes?: string[];
}

export interface ContentIdea {
  id: string;
  hook: string;
  tone: string;
  reason: string;
  category: 'trending' | 'best-performing' | 'brand-aligned' | 'timely';
  prefillTopic: string;
  prefillTone: string;
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    const { brandDNA, recentTopics, topPerformingTypes } = (await request.json()) as IdeasRequest;

    if (!brandDNA?.name) {
      return NextResponse.json({ error: 'Brand DNA required' }, { status: 400 });
    }

    const anthropic = new Anthropic({ apiKey });

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1200,
      messages: [{
        role: 'user',
        content: `You are a content strategist for X/Twitter. Generate content ideas that match this brand's voice and will perform well.

${buildBrandContext(brandDNA)}

${recentTopics?.length ? `TOPICS THEY'VE RECENTLY POSTED ABOUT:\n${recentTopics.join(', ')}\n\nGenerate ideas on DIFFERENT topics to keep content fresh.` : ''}

${topPerformingTypes?.length ? `THEIR BEST PERFORMING CONTENT TYPES:\n${topPerformingTypes.join(', ')}\n\nLean into these formats.` : ''}

Generate exactly 6 content ideas. Each should be a specific, actionable post concept — not vague categories. The "hook" should be an actual draft opening line or angle.

For the "tone" field, use exactly one of: launch, hot-take, educational, casual, behind-the-scenes, announcement, engagement-bait, thread-starter

Return ONLY valid JSON:
{
  "ideas": [
    {
      "id": "1",
      "hook": "Draft opening line or specific angle for the post",
      "tone": "one of the tone options above",
      "reason": "Why this will perform well (1 sentence)",
      "category": "trending|best-performing|brand-aligned|timely",
      "prefillTopic": "Full topic description to pre-fill in the workflow",
      "prefillTone": "matching tone value"
    }
  ]
}`,
      }],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found');
      const parsed = JSON.parse(jsonMatch[0]);
      return NextResponse.json({ ideas: parsed.ideas });
    } catch {
      return NextResponse.json({ ideas: [] });
    }
  } catch (error) {
    console.error('Dashboard ideas error:', error);
    return NextResponse.json({ error: 'Failed to generate ideas' }, { status: 500 });
  }
}
