import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { VoiceFingerprint, AuthenticityScore } from '@/lib/voice-fingerprint';
import { buildAuthenticityCheckPrompt } from '@/prompts/voice-fingerprint';

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    const { content, fingerprint } = (await request.json()) as {
      content: string;
      fingerprint: VoiceFingerprint;
    };

    if (!content?.trim()) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    if (!fingerprint?.metadata) {
      return NextResponse.json(
        { error: 'Voice fingerprint is required' },
        { status: 400 }
      );
    }

    const anthropic = new Anthropic({ apiKey });

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      messages: [
        {
          role: 'user',
          content: buildAuthenticityCheckPrompt(fingerprint, content),
        },
      ],
    });

    const responseText =
      message.content[0].type === 'text' ? message.content[0].text : '';

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid response format');
    }

    const score: AuthenticityScore = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ score });
  } catch (error: unknown) {
    console.error('Authenticity check error:', error);

    let message = 'Authenticity check failed';
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
