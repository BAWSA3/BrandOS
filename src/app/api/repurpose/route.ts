import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import prisma from '@/lib/db';
import { buildBrandContext } from '@/prompts/brand-guardian';
import { BrandDNA } from '@/lib/types';
import { summarizeFingerprint, VoiceFingerprint } from '@/lib/voice-fingerprint';

const formatInstructions: Record<string, string> = {
  thread: 'Create a 3-5 tweet thread that expands on this idea. Each tweet should be under 280 characters. Format: number each tweet like "1/ ...", "2/ ...", etc.',
  poll: 'Create a Twitter poll. Format as: QUESTION: [the question]\\nOPTION 1: [option]\\nOPTION 2: [option]\\nOPTION 3: [option]\\nOPTION 4: [option]',
  'hot-take': 'Rewrite this as a provocative hot take. Be bold, contrarian, and attention-grabbing. Keep under 280 characters.',
  educational: 'Rewrite this as an educational post with structure: Hook (attention-grabbing first line) → Concept (the core idea) → Example (concrete illustration) → Takeaway (actionable conclusion).',
  'counter-argument': 'Argue the opposite side of this take. Be thoughtful and nuanced. Present a compelling counter-perspective.',
  story: 'Rewrite this as a short narrative/story format. Use personal or hypothetical storytelling to convey the same core message.',
};

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    // Auth
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
    }

    const cookieStore = await cookies();
    const accessToken = cookieStore.get('sb-access-token')?.value;
    if (!accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !authUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({ where: { supabaseId: authUser.id } });
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { brandId, sourceContent, formats } = await request.json() as {
      brandId: string;
      sourceContent: string;
      formats: string[];
    };

    if (!brandId || !sourceContent || !formats?.length) {
      return NextResponse.json({ error: 'brandId, sourceContent, and formats are required' }, { status: 400 });
    }

    // Verify brand ownership
    const brand = await prisma.brand.findFirst({
      where: { id: brandId, userId: dbUser.id },
    });
    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    // Build brand DNA for prompt
    const brandDNA: BrandDNA = {
      id: brand.id,
      name: brand.name,
      colors: JSON.parse(brand.colors),
      tone: JSON.parse(brand.tone),
      keywords: JSON.parse(brand.keywords),
      doPatterns: JSON.parse(brand.doPatterns),
      dontPatterns: JSON.parse(brand.dontPatterns),
      voiceSamples: JSON.parse(brand.voiceSamples),
      createdAt: brand.createdAt,
      updatedAt: brand.updatedAt,
    };

    // Get voice fingerprint if available
    let fingerprintSummary;
    if (brand.voiceFingerprint) {
      try {
        const fp = JSON.parse(brand.voiceFingerprint) as VoiceFingerprint;
        fingerprintSummary = summarizeFingerprint(fp);
      } catch {
        // Ignore fingerprint parse errors
      }
    }

    const brandContext = buildBrandContext(brandDNA, fingerprintSummary);

    // Build format-specific prompts
    const validFormats = formats.filter(f => formatInstructions[f]);

    const anthropic = new Anthropic({ apiKey });

    const formatPrompts = validFormats.map(format => ({
      format,
      prompt: `You are a content repurposing assistant. Your job is to transform source content into different formats while maintaining the brand voice.

${brandContext}

SOURCE CONTENT:
"${sourceContent}"

TASK: ${formatInstructions[format]}

Return ONLY the repurposed content, no explanations or meta-commentary.`,
    }));

    // Generate all derivatives in parallel
    const results = await Promise.all(
      formatPrompts.map(async ({ format, prompt }) => {
        try {
          const message = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1000,
            messages: [{ role: 'user', content: prompt }],
          });

          const content = message.content[0].type === 'text' ? message.content[0].text : '';
          return { format, content };
        } catch (err) {
          console.error(`[repurpose] Failed to generate ${format}:`, err);
          return { format, content: `[Failed to generate ${format}]` };
        }
      })
    );

    return NextResponse.json({ derivatives: results });
  } catch (error) {
    console.error('[repurpose] error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
