import { NextResponse } from 'next/server';
import { geminiFlash, brandPrompts, isGeminiConfigured } from '@/lib/gemini';

export async function POST(request: Request) {
  try {
    if (!isGeminiConfigured()) {
      return NextResponse.json(
        { error: 'Gemini API key not configured. Add GEMINI_API_KEY to .env.local' },
        { status: 500 }
      );
    }

    const { brandDescription, mood, industry } = await request.json();

    const prompt = brandPrompts.colorPalette(
      brandDescription || 'A modern, innovative brand',
      mood || 'professional and trustworthy',
      industry || 'technology'
    );

    const result = await geminiFlash.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Parse the JSON from the response
    try {
      // Extract JSON from the response (it might be wrapped in markdown code blocks)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const palette = JSON.parse(jsonMatch[0]);
        return NextResponse.json({
          success: true,
          palette,
        });
      }
      
      // If no JSON found, return the raw text
      return NextResponse.json({
        success: false,
        error: 'Could not parse color palette',
        rawResponse: text,
      }, { status: 400 });

    } catch {
      return NextResponse.json({
        success: false,
        error: 'Failed to parse color palette response',
        rawResponse: text,
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Gemini color generation error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'Invalid Gemini API key' },
          { status: 401 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to generate color palette. Please try again.' },
      { status: 500 }
    );
  }
}















