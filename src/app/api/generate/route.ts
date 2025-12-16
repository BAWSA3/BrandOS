import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { buildGeneratePrompt } from '@/prompts/brand-guardian';
import { BrandDNA } from '@/lib/types';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { brandDNA, prompt } = await request.json() as {
      brandDNA: BrandDNA;
      prompt: string;
    };

    if (!brandDNA?.name || !prompt) {
      return NextResponse.json(
        { error: 'Missing brand DNA or prompt' },
        { status: 400 }
      );
    }

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: buildGeneratePrompt(brandDNA, prompt),
        },
      ],
    });

    const responseText = message.content[0].type === 'text' 
      ? message.content[0].text 
      : '';

    return NextResponse.json({ content: responseText });
    
  } catch (error) {
    console.error('Generate API error:', error);
    return NextResponse.json(
      { error: 'Generation failed' },
      { status: 500 }
    );
  }
}


