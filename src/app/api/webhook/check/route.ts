import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { buildCheckPrompt } from '@/prompts/brand-guardian';
import { BrandDNA } from '@/lib/types';

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

    const { brandDNA, content, callbackUrl } = await request.json() as {
      brandDNA: BrandDNA;
      content: string;
      callbackUrl?: string;
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

    // If callback URL provided, send result there
    if (callbackUrl) {
      try {
        await fetch(callbackUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'check',
            brandName: brandDNA.name,
            input: content,
            result,
            timestamp: new Date().toISOString(),
          }),
        });
      } catch (callbackError) {
        console.error('Callback failed:', callbackError);
      }
    }

    return NextResponse.json({
      success: true,
      result,
      brandName: brandDNA.name,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error: unknown) {
    console.error('Webhook check error:', error);
    
    let message = 'Analysis failed';
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
  // Use configured allowed origins, or fall back to restrictive default in production
  const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS?.split(',') || [];
  const isDev = process.env.NODE_ENV === 'development';

  // In development, allow all origins. In production, require explicit config.
  const corsOrigin = isDev ? '*' : (allowedOrigins[0] || 'https://brandos.app');

  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': corsOrigin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
    },
  });
}

