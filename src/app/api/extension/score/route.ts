import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { geminiFlash, xBrandScorePrompt, XProfileData } from '@/lib/gemini';
import { resolveArchetype } from '@/lib/archetype-engine';
import { getUserProfile } from '@/lib/user-profiles';
import { checkRateLimit } from '@/lib/rate-limit';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const ALLOWED_ORIGINS = [
  'chrome-extension://*',  // Chrome extensions
  'https://brandos.app',
  'https://www.brandos.app',
  'http://localhost:3000',
];

function corsHeaders(origin?: string | null) {
  // Check if origin matches (support chrome-extension:// prefix)
  const isAllowed = origin && (
    ALLOWED_ORIGINS.includes(origin) ||
    origin.startsWith('chrome-extension://')
  );
  const corsOrigin = isAllowed ? origin : ALLOWED_ORIGINS[1];

  return {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
}

async function authenticateRequest(request: NextRequest): Promise<{ userId: string; error?: never } | { userId?: never; error: string }> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { error: 'Missing or invalid Authorization header' };
  }

  const token = authHeader.slice(7);
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return { error: 'Invalid or expired token' };
  }

  return { userId: user.id };
}

async function fetchProfile(username: string, origin: string): Promise<XProfileData | null> {
  try {
    const response = await fetch(`${origin}/api/x-profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    if (!data.profile) return null;

    return {
      name: data.profile.name,
      username: data.profile.username,
      description: data.profile.description,
      profile_image_url: data.profile.profile_image_url,
      public_metrics: data.profile.public_metrics || {
        followers_count: 0, following_count: 0, tweet_count: 0, listed_count: 0,
      },
      created_at: data.profile.created_at,
      verified: data.profile.verified,
      location: data.profile.location,
      url: data.profile.url,
    };
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin);

  // Authenticate
  const auth = await authenticateRequest(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: 401, headers });
  }

  // Rate limit: 60 req/min per user
  const { limited, remaining, resetIn } = checkRateLimit(
    `ext:${auth.userId}`,
    { interval: 60_000, maxRequests: 60 }
  );
  if (limited) {
    return NextResponse.json(
      { error: 'Rate limit exceeded', retryAfter: Math.ceil(resetIn / 1000) },
      { status: 429, headers: { ...headers, 'Retry-After': Math.ceil(resetIn / 1000).toString() } }
    );
  }

  // Get username
  const username = request.nextUrl.searchParams.get('username');
  if (!username) {
    return NextResponse.json({ error: 'username query parameter required' }, { status: 400, headers });
  }
  const cleanUsername = username.replace(/^@/, '').trim();

  // Check cached profile first
  const cachedProfile = getUserProfile(cleanUsername);
  if (cachedProfile && (Date.now() - cachedProfile.lastScannedAt) < 24 * 60 * 60 * 1000) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    return NextResponse.json({
      username: cachedProfile.username,
      displayName: cachedProfile.displayName,
      profileImageUrl: null,
      overallScore: cachedProfile.currentScore,
      phases: {
        define: { score: Math.round(cachedProfile.currentScore * 0.92), topInsight: 'Cached score' },
        check: { score: Math.round(cachedProfile.currentScore * 0.88), topInsight: 'Cached score' },
        generate: { score: Math.round(cachedProfile.currentScore * 0.82), topInsight: 'Cached score' },
        scale: { score: Math.round(cachedProfile.currentScore * 0.95), topInsight: 'Cached score' },
      },
      archetype: {
        primary: cachedProfile.archetype.primary,
        emoji: cachedProfile.archetype.emoji,
        tagline: cachedProfile.archetype.tagline,
      },
      personalityCode: cachedProfile.archetype.primary.charAt(0).toUpperCase(),
      influenceTier: 'established',
      contentStyle: { topics: [], patterns: [], pillars: [] },
      cachedAt: new Date(cachedProfile.lastScannedAt).toISOString(),
      scoreUrl: `${appUrl}/score/${cleanUsername}`,
    }, { headers: { ...headers, 'X-RateLimit-Remaining': remaining.toString() } });
  }

  // Fresh score: fetch profile + score with Gemini
  const reqOrigin = request.nextUrl.origin;
  const profile = await fetchProfile(cleanUsername, reqOrigin);
  if (!profile) {
    return NextResponse.json({ error: 'Could not fetch X profile' }, { status: 404, headers });
  }

  let brandScore;
  try {
    const prompt = xBrandScorePrompt(profile);
    const result = await geminiFlash.generateContent(prompt);
    const responseText = result.response.text();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');
    brandScore = JSON.parse(jsonMatch[0]);
  } catch (geminiError) {
    const msg = geminiError instanceof Error ? geminiError.message : '';
    if (msg.includes('429') || msg.includes('quota')) {
      // Return basic score from profile heuristics
      const heuristicScore = Math.min(100, Math.round(
        30 + (profile.description ? 15 : 0) +
        Math.min(20, Math.log10(Math.max(1, profile.public_metrics.followers_count)) * 5) +
        (profile.verified ? 10 : 0) +
        Math.min(15, Math.log10(Math.max(1, profile.public_metrics.tweet_count)) * 4)
      ));
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || reqOrigin;
      return NextResponse.json({
        username: cleanUsername,
        displayName: profile.name,
        profileImageUrl: profile.profile_image_url,
        overallScore: heuristicScore,
        phases: {
          define: { score: heuristicScore, topInsight: 'Quick estimate — full analysis on BrandOS' },
          check: { score: heuristicScore, topInsight: 'Quick estimate' },
          generate: { score: heuristicScore, topInsight: 'Quick estimate' },
          scale: { score: heuristicScore, topInsight: 'Quick estimate' },
        },
        archetype: { primary: 'Unknown', emoji: '❓', tagline: 'Scan on BrandOS for full analysis' },
        personalityCode: '?',
        influenceTier: 'emerging',
        contentStyle: { topics: [], patterns: [], pillars: [] },
        cachedAt: new Date().toISOString(),
        scoreUrl: `${appUrl}/score/${cleanUsername}`,
      }, { headers: { ...headers, 'X-RateLimit-Remaining': remaining.toString() } });
    }
    return NextResponse.json({ error: 'Failed to analyze profile' }, { status: 500, headers });
  }

  // Resolve archetype consistency
  try {
    const decision = await resolveArchetype(
      cleanUsername,
      profile.name || profile.username,
      brandScore.archetype,
      brandScore.overallScore,
      false
    );
    brandScore.archetype = decision.archetype;
  } catch {
    // Continue with Gemini's archetype
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || reqOrigin;
  const definePhase = brandScore.phases?.define;
  const checkPhase = brandScore.phases?.check;
  const generatePhase = brandScore.phases?.generate;
  const scalePhase = brandScore.phases?.scale;

  return NextResponse.json({
    username: cleanUsername,
    displayName: profile.name,
    profileImageUrl: profile.profile_image_url,
    overallScore: brandScore.overallScore,
    phases: {
      define: { score: definePhase?.score || 0, topInsight: definePhase?.insights?.[0] || '' },
      check: { score: checkPhase?.score || 0, topInsight: checkPhase?.insights?.[0] || '' },
      generate: { score: generatePhase?.score || 0, topInsight: generatePhase?.insights?.[0] || '' },
      scale: { score: scalePhase?.score || 0, topInsight: scalePhase?.insights?.[0] || '' },
    },
    archetype: {
      primary: brandScore.archetype?.primary || 'Unknown',
      emoji: brandScore.archetype?.emoji || '❓',
      tagline: brandScore.archetype?.tagline || '',
    },
    personalityCode: (brandScore.archetype?.primary || '?').charAt(0).toUpperCase(),
    influenceTier: brandScore.influenceTier || 'emerging',
    contentStyle: {
      topics: brandScore.topStrengths?.slice(0, 3) || [],
      patterns: brandScore.topImprovements?.slice(0, 2) || [],
      pillars: [],
    },
    cachedAt: new Date().toISOString(),
    scoreUrl: `${appUrl}/score/${cleanUsername}`,
  }, { headers: { ...headers, 'X-RateLimit-Remaining': remaining.toString() } });
}
