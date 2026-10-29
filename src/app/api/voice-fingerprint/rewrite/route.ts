import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { getWorkspaceContext } from '@/lib/workspace-auth';
import { VoiceFingerprint, AuthenticityFlag, AuthenticityScore } from '@/lib/voice-fingerprint';
import {
  buildAuthenticityRewritePrompt,
  buildAuthenticityCheckPrompt,
} from '@/prompts/voice-fingerprint';
import { replyText } from '@/lib/model-text';

export async function POST(request: NextRequest) {
  try {
    const ctx = await getWorkspaceContext({ ensure: false });
    if (!ctx) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Fingerprint features are PRO — enforce server-side.
    if (!ctx.workspace || ctx.workspace.plan === 'FREE') {
      return NextResponse.json(
        {
          error: 'Voice Fingerprint requires a PRO plan',
          code: 'PLAN_REQUIRED',
          upgradeUrl: '/pricing',
        },
        { status: 403 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    const { content, fingerprint, flags } = (await request.json()) as {
      content: string;
      fingerprint: VoiceFingerprint;
      flags: AuthenticityFlag[];
    };

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    if (!fingerprint?.metadata) {
      return NextResponse.json({ error: 'Voice fingerprint is required' }, { status: 400 });
    }

    if (!flags || flags.length === 0) {
      return NextResponse.json(
        { error: 'At least one flag is required for rewrite' },
        { status: 400 }
      );
    }

    const anthropic = new Anthropic({ apiKey });

    // Step 1: Rewrite the content
    const rewriteMessage = await anthropic.messages.create({
      model: 'claude-sonnet-5',
      thinking: { type: 'disabled' },
      max_tokens: 3000,
      messages: [
        {
          role: 'user',
          content: buildAuthenticityRewritePrompt(fingerprint, content, flags),
        },
      ],
    });

    const rewriteText = replyText(rewriteMessage);

    const rewriteJson = rewriteText.match(/\{[\s\S]*\}/);
    if (!rewriteJson) {
      throw new Error('Invalid rewrite response format');
    }

    const { rewrittenContent, changesApplied } = JSON.parse(rewriteJson[0]);

    // Step 2: Re-score the rewritten content
    const scoreMessage = await anthropic.messages.create({
      model: 'claude-sonnet-5',
      thinking: { type: 'disabled' },
      max_tokens: 3000,
      messages: [
        {
          role: 'user',
          content: buildAuthenticityCheckPrompt(fingerprint, rewrittenContent),
        },
      ],
    });

    const scoreText = replyText(scoreMessage);

    const scoreJson = scoreText.match(/\{[\s\S]*\}/);
    let newScore: AuthenticityScore | null = null;
    if (scoreJson) {
      newScore = JSON.parse(scoreJson[0]);
    }

    return NextResponse.json({
      rewrittenContent,
      changesApplied,
      newScore,
    });
  } catch (error: unknown) {
    console.error('Authenticity rewrite error:', error);

    let message = 'Rewrite failed';
    if (error instanceof Error) {
      if (error.message.includes('credit balance is too low')) {
        message = 'API credits depleted. Please add credits at console.anthropic.com';
      } else {
        message = error.message;
      }
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
