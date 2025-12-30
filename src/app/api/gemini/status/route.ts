import { NextResponse } from 'next/server';
import { isGeminiConfigured, geminiFlash } from '@/lib/gemini';

export async function GET() {
  try {
    const configured = isGeminiConfigured();

    if (!configured) {
      return NextResponse.json({
        configured: false,
        status: 'not_configured',
        message: 'Gemini API key not found. Add GEMINI_API_KEY to .env.local',
      });
    }

    // Test the API connection with a simple prompt
    try {
      const result = await geminiFlash.generateContent('Say "API working" in 2 words');
      const text = result.response.text();
      
      return NextResponse.json({
        configured: true,
        status: 'connected',
        message: 'Gemini API is connected and working',
        test: text.substring(0, 50),
      });
    } catch (apiError) {
      return NextResponse.json({
        configured: true,
        status: 'error',
        message: apiError instanceof Error ? apiError.message : 'API connection failed',
      });
    }

  } catch (error) {
    return NextResponse.json({
      configured: false,
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}















