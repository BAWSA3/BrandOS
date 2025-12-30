import { NextResponse } from 'next/server';
import { geminiFlash, isGeminiConfigured, visualEnginePrompts } from '@/lib/gemini';
import { MotionBrief } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  try {
    if (!isGeminiConfigured()) {
      return NextResponse.json(
        { error: 'Gemini API key not configured. Add GEMINI_API_KEY to .env.local' },
        { status: 500 }
      );
    }

    const { brandName, tone, keywords } = await request.json() as {
      brandName: string;
      tone: { minimal: number; playful: number; bold: number; experimental: number };
      keywords: string[];
    };

    if (!brandName || !tone) {
      return NextResponse.json(
        { error: 'Missing required fields: brandName or tone' },
        { status: 400 }
      );
    }

    const prompt = visualEnginePrompts.motionBrief(brandName, tone, keywords || []);
    const result = await geminiFlash.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Parse the JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { success: false, error: 'Could not parse motion brief', rawResponse: text },
        { status: 400 }
      );
    }

    const parsed = JSON.parse(jsonMatch[0]);

    const motionBrief: MotionBrief = {
      id: uuidv4(),
      brandName,
      philosophy: parsed.philosophy,
      principles: parsed.principles,
      timingGuidelines: parsed.timingGuidelines,
      easingPreferences: parsed.easingPreferences,
      doRules: parsed.doRules,
      dontRules: parsed.dontRules,
      codeSnippets: parsed.codeSnippets,
      createdAt: new Date(),
    };

    return NextResponse.json({
      success: true,
      motionBrief,
    });

  } catch (error) {
    console.error('Gemini motion brief generation error:', error);

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
      { error: 'Failed to generate motion brief. Please try again.' },
      { status: 500 }
    );
  }
}













