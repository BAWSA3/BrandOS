import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { VoiceFingerprint, summarizeFingerprint } from '@/lib/voice-fingerprint';
import {
  buildFingerprintExtractionPrompt,
  buildFingerprintRefinementPrompt,
} from '@/prompts/voice-fingerprint';

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    const { samples, existingFingerprint } = (await request.json()) as {
      samples: string[];
      existingFingerprint?: VoiceFingerprint;
    };

    if (!samples || samples.length === 0) {
      return NextResponse.json(
        { error: 'At least one writing sample is required' },
        { status: 400 }
      );
    }

    // Filter out empty samples
    const validSamples = samples.filter((s) => s.trim().length > 0);
    if (validSamples.length === 0) {
      return NextResponse.json(
        { error: 'All samples are empty' },
        { status: 400 }
      );
    }

    const anthropic = new Anthropic({ apiKey });

    const prompt = existingFingerprint
      ? buildFingerprintRefinementPrompt(existingFingerprint, validSamples)
      : buildFingerprintExtractionPrompt(validSamples);

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const responseText =
      message.content[0].type === 'text' ? message.content[0].text : '';

    // Parse JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid response format — could not extract JSON');
    }

    const fingerprint: VoiceFingerprint = JSON.parse(jsonMatch[0]);
    const summary = summarizeFingerprint(fingerprint);

    return NextResponse.json({ fingerprint, summary });
  } catch (error: unknown) {
    console.error('Voice fingerprint extraction error:', error);

    let message = 'Fingerprint extraction failed';
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
