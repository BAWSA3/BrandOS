// ===== BRAND ADVISOR CHAT API ROUTE =====
// POST /api/brand-advisor/chat - Conversational brand advisor with DNA context

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { GeneratedBrandDNA } from '@/app/api/x-brand-dna/generate/route';
import { buildAdvisorSystemPrompt } from '@/prompts/brand-advisor';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  brandDNA: GeneratedBrandDNA;
  message: string;
  history?: ChatMessage[];
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { brandDNA, message, history = [] } = body as ChatRequest;

    // Validate brand DNA
    if (!brandDNA || !brandDNA.archetype || !brandDNA.voiceProfile) {
      return NextResponse.json(
        { error: 'Brand DNA is required' },
        { status: 400 }
      );
    }

    // Validate message
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    const anthropic = new Anthropic({ apiKey });

    // Build the system prompt with brand DNA context
    const systemPrompt = buildAdvisorSystemPrompt(brandDNA);

    // Format conversation history for Claude
    const messages: { role: 'user' | 'assistant'; content: string }[] = [
      // Include recent history (last 10 messages)
      ...history.slice(-10).map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      // Add current user message
      {
        role: 'user' as const,
        content: message,
      },
    ];

    // Call Claude with brand DNA as system context
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      system: systemPrompt,
      messages,
    });

    const responseContent = response.content[0].type === 'text'
      ? response.content[0].text
      : 'I apologize, but I had trouble processing that request.';

    return NextResponse.json({
      content: responseContent,
      processingTime: Date.now() - startTime,
    });

  } catch (error) {
    console.error('Brand Advisor chat error:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Chat failed',
        processingTime: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}

// GET - Info about the endpoint
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/brand-advisor/chat',
    description: 'Conversational brand advisor with DNA-aware context',
    body: {
      brandDNA: 'GeneratedBrandDNA object (required)',
      message: 'string (required) - User message',
      history: 'ChatMessage[] (optional) - Previous messages for context',
    },
    response: {
      content: 'string - Advisor response',
      processingTime: 'number - Processing time in ms',
    },
  });
}
