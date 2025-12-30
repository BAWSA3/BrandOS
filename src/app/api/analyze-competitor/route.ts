import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { buildCompetitorAnalysisPrompt } from '@/prompts/brand-guardian';
import { BrandDNA } from '@/lib/types';

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

    const { brandDNA, competitorName, competitorSamples } = await request.json() as {
      brandDNA: BrandDNA;
      competitorName: string;
      competitorSamples: string[];
    };

    if (!brandDNA?.name || !competitorName || !competitorSamples?.length) {
      return NextResponse.json(
        { error: 'Missing brand DNA, competitor name, or samples' },
        { status: 400 }
      );
    }

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content: buildCompetitorAnalysisPrompt(brandDNA, competitorName, competitorSamples),
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
    
  } catch (error: unknown) {
    console.error('Competitor analysis error:', error);
    
    let message = 'Analysis failed';
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

