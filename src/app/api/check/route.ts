import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { buildCheckPrompt } from '@/prompts/brand-guardian';
import { BrandDNA } from '@/lib/types';

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
      return NextResponse.json(
        { error: 'Missing brand DNA or content' },
        { status: 400 }
      );
    }

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: buildCheckPrompt(brandDNA, content),
        },
      ],
    });

    const responseText = message.content[0].type === 'text' 
      ? message.content[0].text 
      : '';
    
    // Parse JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid response format');
    }
    
    const result = JSON.parse(jsonMatch[0]);
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Check API error:', error);
    return NextResponse.json(
      { error: 'Analysis failed' },
      { status: 500 }
    );
  }
}


