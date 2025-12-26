import { NextResponse } from 'next/server';
import { geminiFlash, isGeminiConfigured, visualEnginePrompts } from '@/lib/gemini';
import { UIStyle, UIComponentType } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  try {
    if (!isGeminiConfigured()) {
      return NextResponse.json(
        { error: 'Gemini API key not configured. Add GEMINI_API_KEY to .env.local' },
        { status: 500 }
      );
    }

    const { brandName, colors, tone, componentType } = await request.json() as {
      brandName: string;
      colors: { primary: string; secondary: string; accent: string };
      tone: { minimal: number; playful: number; bold: number; experimental: number };
      componentType: UIComponentType;
    };

    if (!brandName || !colors || !tone || !componentType) {
      return NextResponse.json(
        { error: 'Missing required fields: brandName, colors, tone, or componentType' },
        { status: 400 }
      );
    }

    const prompt = visualEnginePrompts.uiStyle(brandName, colors, tone, componentType);
    const result = await geminiFlash.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Parse the JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { success: false, error: 'Could not parse UI style', rawResponse: text },
        { status: 400 }
      );
    }

    const parsed = JSON.parse(jsonMatch[0]);

    const uiStyle: UIStyle = {
      id: uuidv4(),
      componentType,
      name: parsed.name,
      description: parsed.description,
      baseStyles: parsed.baseStyles,
      colors: parsed.colors,
      states: parsed.states,
      cssVariables: parsed.cssVariables,
      tailwindClasses: parsed.tailwindClasses,
      brandAlignment: parsed.brandAlignment,
      createdAt: new Date(),
    };

    return NextResponse.json({
      success: true,
      style: uiStyle,
    });

  } catch (error) {
    console.error('Gemini UI style generation error:', error);

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
      { error: 'Failed to generate UI style. Please try again.' },
      { status: 500 }
    );
  }
}





