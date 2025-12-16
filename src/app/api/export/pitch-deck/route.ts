import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { BrandDNA, VisualConcept, PitchSlide } from '@/lib/types';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { brandDNA, visualConcepts, includeMetrics } = await request.json() as {
      brandDNA: BrandDNA;
      visualConcepts: VisualConcept[];
      includeMetrics: boolean;
    };

    if (!brandDNA?.name) {
      return NextResponse.json({ error: 'Missing brand DNA' }, { status: 400 });
    }

    // Generate pitch deck content using AI
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: `You are a brand strategist creating a pitch deck. Generate slide content for a brand presentation.

BRAND DATA:
- Name: ${brandDNA.name}
- Colors: Primary ${brandDNA.colors.primary}, Secondary ${brandDNA.colors.secondary}, Accent ${brandDNA.colors.accent}
- Tone: Minimal (${brandDNA.tone.minimal}/100), Playful (${brandDNA.tone.playful}/100), Bold (${brandDNA.tone.bold}/100), Experimental (${brandDNA.tone.experimental}/100)
- Keywords: ${brandDNA.keywords.join(', ') || 'None'}
- Voice samples: ${brandDNA.voiceSamples.slice(0, 3).join(' | ') || 'None'}
- Visual concepts: ${visualConcepts?.map((c: VisualConcept) => c.title).join(', ') || 'None'}

Create a 8-slide pitch deck. Return ONLY valid JSON array:
[
  {
    "slideNumber": 1,
    "type": "title",
    "headline": "Brand name or tagline",
    "subheadline": "Optional subtitle"
  },
  {
    "slideNumber": 2,
    "type": "content",
    "headline": "Slide title",
    "bullets": ["Point 1", "Point 2", "Point 3"]
  },
  {
    "slideNumber": 3,
    "type": "quote",
    "quote": "A powerful brand voice sample or manifesto",
    "attribution": "Source or empty"
  },
  {
    "slideNumber": 4,
    "type": "colors",
    "headline": "Color System"
  },
  {
    "slideNumber": 5,
    "type": "content",
    "headline": "Brand Voice",
    "bullets": ["Voice characteristic 1", "Voice characteristic 2"]
  },
  {
    "slideNumber": 6,
    "type": "content",
    "headline": "Visual Direction",
    "bullets": ["Visual approach 1", "Visual approach 2"]
  },
  {
    "slideNumber": 7,
    "type": "stats",
    "headline": "Brand Metrics",
    "stats": [
      { "value": "100", "label": "Tone Score" },
      { "value": "5", "label": "Keywords" }
    ]
  },
  {
    "slideNumber": 8,
    "type": "closing",
    "headline": "Let's Build Together",
    "subheadline": "Contact or next steps"
  }
]

Use these slide types:
- "title" (slide 1): Brand name + tagline
- "content": Headline + bullet points
- "quote": Powerful statement
- "stats": Key metrics
- "colors": Color palette display
- "closing": Contact/CTA

Make it compelling, on-brand, and professional. Match the brand's tone profile.`
      }]
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    
    if (!jsonMatch) {
      throw new Error('Invalid response format');
    }

    const slides: PitchSlide[] = JSON.parse(jsonMatch[0]);

    return NextResponse.json({ 
      slides,
      brandDNA,
      visualConcepts 
    });

  } catch (error: any) {
    console.error('Pitch deck generation error:', error);
    return NextResponse.json({ error: error.message || 'Generation failed' }, { status: 500 });
  }
}

