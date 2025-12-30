import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { buildGeneratePrompt } from '@/prompts/brand-guardian';
import { BrandDNA, ContentType } from '@/lib/types';

// API key authentication for webhooks
function validateApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get('x-api-key');
  const validKey = process.env.BRANDOS_API_KEY;
  
  if (!validKey) {
    console.warn('BRANDOS_API_KEY not set - webhook authentication disabled');
    return true; // Allow if no key is set (dev mode)
  }
  
  return apiKey === validKey;
}

export async function POST(request: NextRequest) {
  try {
    // Validate API key
    if (!validateApiKey(request)) {
      return NextResponse.json(
        { error: 'Invalid or missing API key' },
        { status: 401 }
      );
    }

    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    
    if (!anthropicKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    const anthropic = new Anthropic({ apiKey: anthropicKey });

    const { brandDNA, prompt, contentType = 'general', callbackUrl } = await request.json() as {
      brandDNA: BrandDNA;
      prompt: string;
      contentType?: ContentType;
      callbackUrl?: string;
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

    // If callback URL provided, send result there
    if (callbackUrl) {
      try {
        await fetch(callbackUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'generate',
            brandName: brandDNA.name,
            prompt,
            contentType,
            content: responseText,
            timestamp: new Date().toISOString(),
          }),
        });
      } catch (callbackError) {
        console.error('Callback failed:', callbackError);
      }
    }

    return NextResponse.json({
      success: true,
      content: responseText,
      brandName: brandDNA.name,
      contentType,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error: unknown) {
    console.error('Webhook generate error:', error);
    
    let message = 'Generation failed';
    if (error instanceof Error) {
      if (error.message.includes('credit balance is too low')) {
        message = 'API credits depleted';
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

// OPTIONS for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
    },
  });
}

