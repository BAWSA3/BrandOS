import { NextResponse } from 'next/server';
import { geminiFlash, brandPrompts, isGeminiConfigured } from '@/lib/gemini';

export async function POST(request: Request) {
  try {
    if (!isGeminiConfigured()) {
      return NextResponse.json(
        { error: 'Gemini API key not configured. Add GEMINI_API_KEY to .env.local' },
        { status: 500 }
      );
    }

    const { type, brandName, industry, values, tone, audience, customPrompt } = await request.json();

    let prompt: string;

    switch (type) {
      case 'tagline':
        prompt = brandPrompts.tagline(
          brandName || 'Brand',
          industry || 'technology',
          values || ['innovation', 'quality', 'trust']
        );
        break;
      case 'voice':
        prompt = brandPrompts.brandVoice(
          brandName || 'Brand',
          tone || 'professional yet approachable',
          audience || 'modern professionals'
        );
        break;
      case 'custom':
        prompt = customPrompt || 'Generate brand content';
        break;
      default:
        prompt = customPrompt || 'Generate professional brand copy';
    }

    const result = await geminiFlash.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    return NextResponse.json({
      success: true,
      content: text,
      type,
    });

  } catch (error) {
    console.error('Gemini text generation error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'Invalid Gemini API key' },
          { status: 401 }
        );
      }
      if (error.message.includes('quota')) {
        return NextResponse.json(
          { error: 'API quota exceeded. Please try again later.' },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to generate content. Please try again.' },
      { status: 500 }
    );
  }
}








