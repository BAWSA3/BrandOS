import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { buildCheckPrompt } from '@/prompts/brand-guardian';
import { BrandDNA } from '@/lib/types';
import { VoiceFingerprint, AuthenticityScore } from '@/lib/voice-fingerprint';
import { buildAuthenticityCheckPrompt } from '@/prompts/voice-fingerprint';

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

    const { brandDNA, content, voiceFingerprint } = await request.json() as {
      brandDNA: BrandDNA;
      content: string;
      voiceFingerprint?: VoiceFingerprint;
    };

    if (!brandDNA?.name || !content) {
      return NextResponse.json(
        { error: 'Missing brand DNA or content' },
        { status: 400 }
      );
    }

    // Brand alignment check
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

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid response format');
    }

    const result = JSON.parse(jsonMatch[0]);

    // Optional: authenticity check if fingerprint provided
    let authenticityScore: AuthenticityScore | null = null;
    if (voiceFingerprint?.metadata) {
      try {
        const authMessage = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 3000,
          messages: [
            {
              role: 'user',
              content: buildAuthenticityCheckPrompt(voiceFingerprint, content),
            },
          ],
        });

        const authText =
          authMessage.content[0].type === 'text'
            ? authMessage.content[0].text
            : '';
        const authJson = authText.match(/\{[\s\S]*\}/);
        if (authJson) {
          authenticityScore = JSON.parse(authJson[0]);
        }
      } catch (e) {
        console.error('Authenticity check failed (non-blocking):', e);
      }
    }

    return NextResponse.json({ ...result, authenticityScore });
    
  } catch (error: unknown) {
    console.error('Check API error:', error);
    
    // Extract error message
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


