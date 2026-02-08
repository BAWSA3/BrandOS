import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { BrandDNA } from '@/lib/types';
import { buildBrandContext } from '@/prompts/brand-guardian';

interface GenerateWorkflowRequest {
  topic: string;
  tone: string;
  context?: string;
  brandDNA: BrandDNA;
  refinementNote?: string;
}

function buildWorkflowPrompt(req: GenerateWorkflowRequest): string {
  return `You are a brand-guardian content creator for X (Twitter). Generate content that perfectly matches the brand voice.

${buildBrandContext(req.brandDNA)}

CONTENT TYPE: TWITTER/X POST
- Keep each variation under 280 characters
- Be punchy, direct, and shareable
- Can include 1-2 relevant hashtags if appropriate
- Match the brand's tone and voice exactly

TOPIC: ${req.topic}
TONE/CONTEXT: ${req.tone}${req.context ? ` — ${req.context}` : ''}
${req.refinementNote ? `\nREFINEMENT NOTE: ${req.refinementNote}` : ''}

Generate exactly 3 distinct variations. Each should take a different angle or approach while staying on-brand and under 280 characters.

For each variation, also provide:
- A brand alignment score (0-100) based on how well it matches the brand DNA
- Any relevant hashtags used

Return ONLY valid JSON in this exact format:
{
  "variations": [
    {
      "content": "The tweet text here",
      "characterCount": 42,
      "brandAlignmentScore": 85,
      "hashtags": ["#example"]
    },
    {
      "content": "Second variation here",
      "characterCount": 38,
      "brandAlignmentScore": 90,
      "hashtags": []
    },
    {
      "content": "Third variation here",
      "characterCount": 55,
      "brandAlignmentScore": 78,
      "hashtags": ["#tag"]
    }
  ]
}`;
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    const anthropic = new Anthropic({ apiKey });

    const body = (await request.json()) as GenerateWorkflowRequest;

    if (!body.brandDNA?.name || !body.topic) {
      return NextResponse.json(
        { error: 'Missing brand DNA or topic' },
        { status: 400 }
      );
    }

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content: buildWorkflowPrompt(body),
        },
      ],
    });

    const responseText =
      message.content[0].type === 'text' ? message.content[0].text : '';

    // Parse the JSON response
    try {
      // Extract JSON from potential markdown code blocks
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate and fix character counts
      const variations = parsed.variations.map(
        (v: { content: string; characterCount?: number; brandAlignmentScore?: number; hashtags?: string[] }) => ({
          content: v.content,
          characterCount: v.content.length,
          brandAlignmentScore: v.brandAlignmentScore || 75,
          hashtags: v.hashtags || [],
        })
      );

      return NextResponse.json({ variations });
    } catch {
      // Fallback: split text response into variations
      const lines = responseText.split('\n').filter((l) => l.trim().length > 0);
      const variations = lines.slice(0, 3).map((line) => ({
        content: line.replace(/^\d+[\.\)]\s*/, '').replace(/^["']|["']$/g, ''),
        characterCount: line.length,
        brandAlignmentScore: 75,
        hashtags: [] as string[],
      }));

      return NextResponse.json({ variations });
    }
  } catch (error: unknown) {
    console.error('Generate Workflow API error:', error);

    let message = 'Generation failed';
    if (error instanceof Error) {
      if (error.message.includes('credit balance is too low')) {
        message =
          'API credits depleted. Please add credits at console.anthropic.com';
      } else {
        message = error.message;
      }
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
