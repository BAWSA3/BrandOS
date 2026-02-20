import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import prisma from '@/lib/db';

const MAX_BATCH = 10; // Score up to 10 tweets per request

export async function POST(request: NextRequest) {
  try {
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

    const { brandId } = await request.json();
    if (!brandId) {
      return NextResponse.json({ error: 'brandId is required' }, { status: 400 });
    }

    // Verify ownership
    const brand = await prisma.brand.findFirst({
      where: { id: brandId, userId: dbUser.id },
    });
    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'AI scoring not configured' }, { status: 500 });
    }

    // Fetch unscored tweets (alignmentScore is null)
    const unscoredTweets = await prisma.brandTweet.findMany({
      where: { brandId, alignmentScore: null },
      orderBy: { postedAt: 'desc' },
      take: MAX_BATCH,
      select: { id: true, text: true },
    });

    if (unscoredTweets.length === 0) {
      return NextResponse.json({ scored: 0, message: 'All tweets already scored' });
    }

    // Build brand context for the prompt
    const tone = JSON.parse(brand.tone);
    const keywords = JSON.parse(brand.keywords);
    const doPatterns = JSON.parse(brand.doPatterns);
    const dontPatterns = JSON.parse(brand.dontPatterns);
    const voiceSamples = JSON.parse(brand.voiceSamples);

    const brandContext = [
      `Brand: ${brand.name}`,
      `Tone: minimal=${tone.minimal}, playful=${tone.playful}, bold=${tone.bold}, experimental=${tone.experimental}`,
      keywords.length > 0 ? `Keywords: ${keywords.join(', ')}` : null,
      doPatterns.length > 0 ? `Do patterns: ${doPatterns.join('; ')}` : null,
      dontPatterns.length > 0 ? `Don't patterns: ${dontPatterns.join('; ')}` : null,
      voiceSamples.length > 0 ? `Voice samples:\n${voiceSamples.map((s: string, i: number) => `  ${i + 1}. "${s}"`).join('\n')}` : null,
    ].filter(Boolean).join('\n');

    // Build the batch scoring prompt
    const tweetList = unscoredTweets
      .map((t, i) => `[${i}] "${t.text}"`)
      .join('\n\n');

    const prompt = `You are a brand alignment scorer. Given a brand's DNA and a list of tweets, score each tweet 0-100 on how well it aligns with the brand voice.

Scoring criteria:
- 90-100: Perfect brand voice match — tone, vocabulary, and patterns are spot-on
- 70-89: Strong alignment — mostly on-brand with minor deviations
- 50-69: Moderate — recognizable but inconsistent with some brand elements
- 30-49: Weak — noticeably off-brand in tone or content
- 0-29: Misaligned — contradicts brand voice or uses don't-patterns

BRAND DNA:
${brandContext}

TWEETS TO SCORE:
${tweetList}

Respond with ONLY a JSON array of objects, one per tweet, in order:
[{"index": 0, "score": 85}, {"index": 1, "score": 62}, ...]

No explanation, just the JSON array.`;

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

    // Parse scores from response
    let scores: Array<{ index: number; score: number }>;
    try {
      // Extract JSON array — handle potential markdown wrapping
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error('No JSON array found');
      scores = JSON.parse(jsonMatch[0]);
    } catch {
      console.error('[x-feed/score] Failed to parse AI response:', responseText);
      return NextResponse.json({ error: 'Failed to parse alignment scores' }, { status: 500 });
    }

    // Update each tweet with its score
    let scored = 0;
    for (const { index, score } of scores) {
      if (index < 0 || index >= unscoredTweets.length) continue;
      const clampedScore = Math.max(0, Math.min(100, Math.round(score)));
      await prisma.brandTweet.update({
        where: { id: unscoredTweets[index].id },
        data: { alignmentScore: clampedScore },
      });
      scored++;
    }

    return NextResponse.json({
      scored,
      remaining: await prisma.brandTweet.count({
        where: { brandId, alignmentScore: null },
      }),
    });
  } catch (error) {
    console.error('[x-feed/score] error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
