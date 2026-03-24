import { NextRequest, NextResponse } from 'next/server';
import { analyzeArchetypeOnly, XProfileData } from '@/lib/gemini';
import { resolveArchetype } from '@/lib/archetype-engine';
import { normalizeArchetypeName } from '@/lib/archetype-names';
import { getUserProfileAsync } from '@/lib/user-profiles';
import { withRateLimit, rateLimiters } from '@/lib/rate-limit';
import { recordScan } from '@/lib/scan-tracking';
import { ARCHETYPE_DATA, getArchetypeInfo } from '@/lib/archetype-descriptions';

/**
 * Archetype Scan API — Lightweight archetype classification
 *
 * For returning users: returns cached archetype instantly (no AI call).
 * For new users: runs Gemini archetype-only analysis (~2-3 seconds).
 */

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
        followers_count: 0,
        following_count: 0,
        tweet_count: 0,
        listed_count: 0,
      },
      created_at: data.profile.created_at,
      verified: data.profile.verified,
      location: data.profile.location,
      url: data.profile.url,
    };
  } catch (error) {
    console.error('[ArchetypeScan] Profile fetch error:', error);
    return null;
  }
}

async function handlePost(request: NextRequest) {
  try {
    const { username } = (await request.json()) as { username: string };

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    const cleanUsername = username.replace(/^@/, '').trim().toLowerCase();
    const origin = request.nextUrl.origin;

    console.log(`[ArchetypeScan] Scanning @${cleanUsername}`);

    // Check user_profiles DB FIRST — returning users get instant response
    let existingProfile: Awaited<ReturnType<typeof getUserProfileAsync>> = null;
    try {
      existingProfile = await getUserProfileAsync(cleanUsername);
      console.log(`[ArchetypeScan] user_profiles lookup: ${existingProfile ? existingProfile.archetype.primary : 'NOT FOUND'}`);
    } catch (dbErr) {
      console.error(`[ArchetypeScan] user_profiles lookup failed:`, dbErr);
    }

    // If no user_profiles row, check BrandScans for a previous archetype (week 1 users)
    if (!existingProfile) {
      try {
        const { data: prevScan } = await (await import('@/lib/supabase')).default
          .from('BrandScans')
          .select('archetype, score')
          .eq('username', cleanUsername)
          .not('archetype', 'is', null)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (prevScan?.archetype) {
          const prevArchetype = normalizeArchetypeName(prevScan.archetype);
          const info = getArchetypeInfo(prevArchetype);
          if (info) {
            console.log(`[ArchetypeScan] Found previous BrandScan archetype for @${cleanUsername}: ${prevArchetype}`);
            // Create a profile from the previous scan so it's locked in
            const { createUserProfile } = await import('@/lib/user-profiles');
            createUserProfile(cleanUsername, cleanUsername, {
              primary: prevArchetype,
              emoji: info.emoji,
              tagline: info.tagline,
              strengths: info.strengths,
            }, prevScan.score || 50);

            existingProfile = await getUserProfileAsync(cleanUsername);
          }
        }
      } catch {
        // No previous scan found — continue to Gemini
      }
    }

    if (existingProfile) {
      console.log(
        `[ArchetypeScan] Returning cached archetype for @${cleanUsername}: ${existingProfile.archetype.primary}`
      );

      const archetypeName = normalizeArchetypeName(existingProfile.archetype.primary);
      const info = getArchetypeInfo(archetypeName);

      // Record scan (non-blocking)
      recordScan({
        username: cleanUsername,
        score: existingProfile.currentScore,
        archetype: archetypeName,
        enhanced: false,
      }).catch(() => {});

      // ALWAYS use curated descriptions — never Gemini-generated text
      return NextResponse.json({
        profile: {
          name: existingProfile.displayName,
          username: cleanUsername,
          profile_image_url: '',
          followers_count: 0,
          verified: false,
        },
        archetype: {
          primary: archetypeName,
          emoji: info?.emoji || '🐕',
          tagline: info?.tagline || '',
          description: info?.description || '',
          strengths: info?.strengths || [],
          growthTip: existingProfile.archetype.growthTip || '',
        },
        tier: info?.tier || 1,
        tierLabel: info?.tierLabel || 'ENTRY',
        color: info?.color || '#10B981',
        rarity: info?.rarity || 22,
        traits: info?.traits || [],
        evolutionPaths: info?.evolutionPaths || [],
        isReturning: true,
      });
    }

    // New user — fetch profile + tweets, then run Gemini
    console.log(`[ArchetypeScan] New user @${cleanUsername} — fetching profile + tweets`);

    const profile = await fetchProfile(cleanUsername, origin);
    if (!profile) {
      return NextResponse.json({ error: 'Could not fetch profile' }, { status: 404 });
    }

    // Fetch tweets for better classification (non-blocking fallback to profile-only)
    let tweets: string[] | undefined;
    try {
      const tweetsResponse = await fetch(`${origin}/api/x-tweets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanUsername, maxResults: 50 }),
      });
      if (tweetsResponse.ok) {
        const tweetsData = await tweetsResponse.json();
        if (tweetsData.tweets?.length) {
          tweets = tweetsData.tweets.map((t: { text: string }) => t.text);
          console.log(`[ArchetypeScan] Fetched ${tweets?.length} tweets for @${cleanUsername}`);
        }
      }
    } catch {
      console.log(`[ArchetypeScan] Tweet fetch failed for @${cleanUsername} — using profile only`);
    }

    console.log(`[ArchetypeScan] Running Gemini analysis for @${cleanUsername} (${tweets ? 'with tweets' : 'profile only'})`);

    const geminiResult = await analyzeArchetypeOnly(profile, tweets);

    if (!geminiResult) {
      // Fallback: assign ARC (entry-level) if Gemini fails
      const fallbackInfo = ARCHETYPE_DATA['ARC'];
      return NextResponse.json({
        profile: {
          name: profile.name,
          username: profile.username,
          profile_image_url: profile.profile_image_url,
          followers_count: profile.public_metrics.followers_count,
          verified: profile.verified,
        },
        archetype: {
          primary: 'ARC',
          emoji: fallbackInfo.emoji,
          tagline: fallbackInfo.tagline,
          description: fallbackInfo.description,
          strengths: fallbackInfo.strengths,
          growthTip: 'Keep posting consistently — your growth story is just beginning.',
        },
        tier: fallbackInfo.tier,
        tierLabel: fallbackInfo.tierLabel,
        color: fallbackInfo.color,
        rarity: fallbackInfo.rarity,
        traits: fallbackInfo.traits,
        evolutionPaths: fallbackInfo.evolutionPaths,
        isReturning: false,
      });
    }

    // Normalize archetype name and resolve via consistency engine
    const normalizedPrimary = normalizeArchetypeName(geminiResult.primary);
    const archetypeDecision = await resolveArchetype(
      cleanUsername,
      profile.name,
      {
        primary: normalizedPrimary,
        emoji: geminiResult.emoji,
        tagline: geminiResult.tagline,
        description: geminiResult.description,
        strengths: geminiResult.strengths,
        growthTip: geminiResult.growthTip,
      },
      50 // Default score for archetype-only scans
    );

    const finalArchetype = normalizeArchetypeName(archetypeDecision.archetype.primary);
    const info = getArchetypeInfo(finalArchetype);

    // Record scan (non-blocking)
    recordScan({
      username: cleanUsername,
      score: 50,
      archetype: finalArchetype,
      enhanced: false,
    }).catch(() => {});

    console.log(`[ArchetypeScan] @${cleanUsername} classified as ${finalArchetype}`);

    // ALWAYS use curated descriptions from archetype-descriptions.ts
    // Gemini only determines WHICH archetype — never use its generated text
    return NextResponse.json({
      profile: {
        name: profile.name,
        username: profile.username,
        profile_image_url: profile.profile_image_url,
        followers_count: profile.public_metrics.followers_count,
        verified: profile.verified,
      },
      archetype: {
        primary: finalArchetype,
        emoji: info?.emoji || '🐕',
        tagline: info?.tagline || '',
        description: info?.description || '',
        strengths: info?.strengths || [],
        growthTip: archetypeDecision.archetype.growthTip || geminiResult?.growthTip || '',
      },
      tier: info?.tier || 1,
      tierLabel: info?.tierLabel || 'ENTRY',
      color: info?.color || '#10B981',
      rarity: info?.rarity || 22,
      traits: info?.traits || [],
      evolutionPaths: info?.evolutionPaths || [],
      isReturning: false,
    });
  } catch (error) {
    console.error('[ArchetypeScan] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const POST = withRateLimit(handlePost, rateLimiters.standard);
