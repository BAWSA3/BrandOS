import { NextResponse } from 'next/server';
import { geminiFlash, isGeminiConfigured, visualEnginePrompts } from '@/lib/gemini';
import { Pattern, PatternType } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  try {
    if (!isGeminiConfigured()) {
      return NextResponse.json(
        { error: 'Gemini API key not configured. Add GEMINI_API_KEY to .env.local' },
        { status: 500 }
      );
    }

    const { brandName, colors, patternType, density } = await request.json() as {
      brandName: string;
      colors: { primary: string; secondary: string; accent: string };
      patternType: PatternType;
      density?: string;
    };

    if (!brandName || !colors || !patternType) {
      return NextResponse.json(
        { error: 'Missing required fields: brandName, colors, or patternType' },
        { status: 400 }
      );
    }

    const prompt = visualEnginePrompts.pattern(brandName, colors, patternType, density);
    const result = await geminiFlash.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Parse the JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { success: false, error: 'Could not parse pattern', rawResponse: text },
        { status: 400 }
      );
    }

    const parsed = JSON.parse(jsonMatch[0]);

    const pattern: Pattern = {
      id: uuidv4(),
      patternType,
      name: parsed.name,
      description: parsed.description,
      cssCode: parsed.cssCode,
      svgCode: parsed.svgCode,
      colors: parsed.colors,
      opacity: parsed.opacity,
      scale: parsed.scale,
      brandAlignment: parsed.brandAlignment,
      createdAt: new Date(),
    };

    return NextResponse.json({
      success: true,
      pattern,
    });

  } catch (error) {
    console.error('Gemini pattern generation error:', error);

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
      { error: 'Failed to generate pattern. Please try again.' },
      { status: 500 }
    );
  }
}













