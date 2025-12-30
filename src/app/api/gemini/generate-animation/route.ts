import { NextResponse } from 'next/server';
import { geminiFlash, isGeminiConfigured, visualEnginePrompts } from '@/lib/gemini';
import { AnimationConcept, AnimationContext } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  try {
    if (!isGeminiConfigured()) {
      return NextResponse.json(
        { error: 'Gemini API key not configured. Add GEMINI_API_KEY to .env.local' },
        { status: 500 }
      );
    }

    const { brandName, tone, context, description } = await request.json() as {
      brandName: string;
      tone: { minimal: number; playful: number; bold: number; experimental: number };
      context: AnimationContext;
      description?: string;
    };

    if (!brandName || !tone || !context) {
      return NextResponse.json(
        { error: 'Missing required fields: brandName, tone, or context' },
        { status: 400 }
      );
    }

    const prompt = visualEnginePrompts.animation(brandName, tone, context, description);
    const result = await geminiFlash.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Parse the JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { success: false, error: 'Could not parse animation concept', rawResponse: text },
        { status: 400 }
      );
    }

    const parsed = JSON.parse(jsonMatch[0]);

    const animationConcept: AnimationConcept = {
      id: uuidv4(),
      context,
      name: parsed.name,
      description: parsed.description,
      timing: parsed.timing,
      keyframes: parsed.keyframes,
      cssCode: parsed.cssCode,
      framerMotionCode: parsed.framerMotionCode,
      brandAlignment: parsed.brandAlignment,
      createdAt: new Date(),
    };

    return NextResponse.json({
      success: true,
      animation: animationConcept,
    });

  } catch (error) {
    console.error('Gemini animation generation error:', error);

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
      { error: 'Failed to generate animation concept. Please try again.' },
      { status: 500 }
    );
  }
}













