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

    const { type, brandName, style, description, purpose, platform, message } = await request.json();

    let prompt: string;

    switch (type) {
      case 'logo':
        prompt = brandPrompts.logo(brandName || 'Brand', style || 'modern minimal', description || 'A professional brand logo');
        break;
      case 'imagery':
        prompt = brandPrompts.brandImagery(brandName || 'Brand', style || 'modern', description || 'Brand imagery');
        break;
      case 'icon':
        prompt = brandPrompts.icon(purpose || 'general purpose', style || 'minimal line art');
        break;
      case 'social':
        prompt = brandPrompts.socialGraphic(brandName || 'Brand', platform || 'Instagram', message || 'Brand announcement');
        break;
      default:
        prompt = description || 'Create a professional brand image';
    }

    // Generate image using Gemini
    const result = await geminiFlash.generateContent([
      {
        text: prompt + '\n\nGenerate this as an image.',
      },
    ]);

    const response = result.response;
    const candidates = response.candidates;

    if (!candidates || candidates.length === 0) {
      return NextResponse.json(
        { error: 'No image generated. Try adjusting your prompt.' },
        { status: 400 }
      );
    }

    // Extract image data from response
    const parts = candidates[0].content?.parts || [];
    
    for (const part of parts) {
      if ('inlineData' in part && part.inlineData) {
        return NextResponse.json({
          success: true,
          image: {
            base64: part.inlineData.data,
            mimeType: part.inlineData.mimeType || 'image/png',
          },
          prompt,
        });
      }
    }

    // If no inline image, check for text response (might indicate an error or limitation)
    const textPart = parts.find(p => 'text' in p);
    if (textPart && 'text' in textPart) {
      return NextResponse.json({
        success: false,
        error: 'Image generation not available for this prompt',
        message: textPart.text,
      }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'No image data in response' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Gemini image generation error:', error);
    
    // Handle specific errors
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
      if (error.message.includes('safety')) {
        return NextResponse.json(
          { error: 'Content blocked by safety filters. Try a different prompt.' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to generate image. Please try again.' },
      { status: 500 }
    );
  }
}















