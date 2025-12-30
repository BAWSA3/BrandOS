import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { buildGeneratePrompt } from '@/prompts/brand-guardian';
import { BrandDNA, ContentType } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      console.error('ANTHROPIC_API_KEY is not set. Value:', apiKey);
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    const anthropic = new Anthropic({ apiKey });

    const { brandDNA, prompt, contentType = 'general' } = await request.json() as {
      brandDNA: BrandDNA;
      prompt: string;
      contentType?: ContentType;
    };

    if (!brandDNA?.name || !prompt) {
      return NextResponse.json(
        { error: 'Missing brand DNA or prompt' },
        { status: 400 }
      );
    }

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content: buildGeneratePrompt(brandDNA, prompt, contentType),
        },
      ],
    });

    const responseText = message.content[0].type === 'text' 
      ? message.content[0].text 
      : '';

    return NextResponse.json({ content: responseText });
    
  } catch (error: unknown) {
    console.error('Generate API error:', error);
    
    // Extract error message
    let message = 'Generation failed';
    if (error instanceof Error) {
      if (error.message.includes('credit balance is too low')) {
        message = 'API credits depleted. Please add credits at console.anthropic.com';
      } else {
        message = error.message;
      }
    }
    
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}


