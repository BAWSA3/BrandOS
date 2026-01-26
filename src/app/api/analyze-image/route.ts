import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { BrandDNA } from '@/lib/types';
import { checkRateLimit, getClientIdentifier, rateLimiters } from '@/lib/rate-limit';

// Security: Validate URL to prevent SSRF attacks
function isUrlSafe(urlString: string): boolean {
  try {
    const url = new URL(urlString);

    // Must be HTTPS (or HTTP for localhost in dev)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      return false;
    }

    // Block private/internal IPs and metadata endpoints
    const hostname = url.hostname.toLowerCase();
    const blockedPatterns = [
      /^127\./,                          // Localhost IPv4
      /^10\./,                           // Private Class A
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,  // Private Class B
      /^192\.168\./,                     // Private Class C
      /^169\.254\./,                     // Link-local / AWS metadata
      /^0\./,                            // Current network
      /^localhost$/i,
      /^.*\.local$/i,
      /^.*\.internal$/i,
      /^\[::1\]$/,                       // IPv6 localhost
      /^\[fc00:/i,                       // IPv6 private
      /^\[fe80:/i,                       // IPv6 link-local
    ];

    for (const pattern of blockedPatterns) {
      if (pattern.test(hostname)) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 10 requests per 10 seconds (burst protection for expensive AI calls)
    const clientId = getClientIdentifier(request);
    const { limited, resetIn } = checkRateLimit(clientId + ':analyze-image', rateLimiters.burst);

    if (limited) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: { 'Retry-After': Math.ceil(resetIn / 1000).toString() },
        }
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

    const { imageUrl, imageBase64, brandDNA, action } = await request.json() as {
      imageUrl?: string;
      imageBase64?: string;
      brandDNA: BrandDNA;
      action: 'analyze' | 'generate-concept';
    };

    if (!imageUrl && !imageBase64) {
      return NextResponse.json({ error: 'Missing image URL or base64 data' }, { status: 400 });
    }

    let base64: string;
    let mediaType: string;

    if (imageBase64) {
      // Extract base64 and media type from data URL
      const match = imageBase64.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        mediaType = match[1];
        base64 = match[2];
      } else {
        base64 = imageBase64;
        mediaType = 'image/jpeg';
      }
    } else {
      // Validate URL to prevent SSRF attacks
      if (!isUrlSafe(imageUrl!)) {
        return NextResponse.json({ error: 'Invalid image URL' }, { status: 400 });
      }

      // Fetch image and convert to base64
      const imageResponse = await fetch(imageUrl!);
      if (!imageResponse.ok) {
        return NextResponse.json({ error: 'Failed to fetch image' }, { status: 400 });
      }
      const arrayBuffer = await imageResponse.arrayBuffer();
      base64 = Buffer.from(arrayBuffer).toString('base64');
      mediaType = imageResponse.headers.get('content-type') || 'image/jpeg';
    }

    if (action === 'analyze') {
      // Pure image analysis
      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                  data: base64,
                },
              },
              {
                type: 'text',
                text: `Analyze this image for brand/design purposes. Return ONLY valid JSON:
{
  "dominantColors": ["#hex1", "#hex2", "#hex3", "#hex4", "#hex5"],
  "mood": ["mood1", "mood2", "mood3"],
  "style": ["style descriptor 1", "style descriptor 2"],
  "composition": "brief description of layout/composition",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
}`,
              },
            ],
          },
        ],
      });

      const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Invalid response');
      
      return NextResponse.json(JSON.parse(jsonMatch[0]));

    } else {
      // Generate visual concept blending Pinterest + Brand DNA
      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                  data: base64,
                },
              },
              {
                type: 'text',
                text: `You are a creative director. Analyze this Pinterest inspiration image and create a visual concept that blends its aesthetic with the brand guidelines below.

BRAND DNA:
- Brand Name: ${brandDNA.name}
- Brand Colors: Primary ${brandDNA.colors.primary}, Secondary ${brandDNA.colors.secondary}, Accent ${brandDNA.colors.accent}
- Tone: Formality (${brandDNA.tone.minimal}/100), Energy (${brandDNA.tone.playful}/100), Confidence (${brandDNA.tone.bold}/100), Style (${brandDNA.tone.experimental}/100)
- Keywords: ${brandDNA.keywords.join(', ')}
- Voice: ${brandDNA.voiceSamples.slice(0, 3).join(' | ')}

Create a visual concept that:
1. Takes inspiration from this image's mood and aesthetic
2. Adapts it to fit the brand identity
3. Provides actionable creative direction

Return ONLY valid JSON:
{
  "title": "Creative concept title (2-4 words)",
  "description": "2-3 sentence concept description",
  "colorPalette": ["#hex1", "#hex2", "#hex3", "#hex4"],
  "moodKeywords": ["mood1", "mood2", "mood3", "mood4"],
  "designDirection": "Specific direction for designers (lighting, texture, typography, imagery style)",
  "typography": "Font style recommendations",
  "imagery": "Photo/illustration direction",
  "doNotUse": ["thing to avoid 1", "thing to avoid 2"]
}`,
              },
            ],
          },
        ],
      });

      const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Invalid response');
      
      return NextResponse.json(JSON.parse(jsonMatch[0]));
    }

  } catch (error: unknown) {
    console.error('Image analysis error:', error);
    
    let message = 'Analysis failed';
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

