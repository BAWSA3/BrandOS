// =============================================================================
// X BRAND IDENTITY API - Deep brand analysis endpoint
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import {
  XProfileData,
  analyzeBioLinguistics,
  analyzeNameHandle,
  analyzeProfileImageWithVision,
  generateBrandDNA,
  generateBrandImprovements,
  analyzeTweetVoice,
  analyzeAccountAuthenticity,
  analyzeActivityLevel,
  BioLinguistics,
  NameAnalysis,
  ProfileImageAnalysis,
  BrandDNA,
  BrandImprovements,
  TweetVoiceAnalysis,
  AuthenticityAnalysis,
  ActivityAnalysis,
} from '@/lib/gemini';
import { features } from '@/lib/features';
import { extractColorsFromImage, ExtractedColors } from '@/lib/color-extraction';

// Minimum tweets required for content-primary analysis
const MINIMUM_TWEETS_FOR_CONTENT_ANALYSIS = 10;

// Analysis modes for content-primary approach
export type AnalysisMode = 'content-primary' | 'limited-tweets' | 'profile-only';

export interface BrandIdentityResponse {
  success: boolean;
  profile: {
    name: string;
    username: string;
    profileImageUrl: string;
    bio: string;
    followers: number;
    following: number;
    verified: boolean;
  };
  analysis: {
    bioLinguistics: BioLinguistics;
    nameAnalysis: NameAnalysis;
    profileImage: ProfileImageAnalysis | null;
    extractedColors: ExtractedColors | null;
    brandDNA: BrandDNA | null;
    improvements: BrandImprovements | null;
    tweetVoice: TweetVoiceAnalysis | null;
    authenticity: AuthenticityAnalysis | null;
    activity: ActivityAnalysis | null;
  };
  meta?: {
    enhanced: boolean;
    tier: string;
    analysisMode: AnalysisMode;
    tweetCount: number;
  };
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { profile }: { profile: XProfileData } = await request.json();

    if (!profile || !profile.username) {
      return NextResponse.json(
        { success: false, error: 'Profile data is required' },
        { status: 400 }
      );
    }

    // Step 1: Instant algorithmic analysis (no API calls)
    const bioLinguistics = analyzeBioLinguistics(
      profile.description || '',
      profile.name
    );
    const nameAnalysis = analyzeNameHandle(profile.name, profile.username);

    // Step 2: Profile image vision analysis (parallel with brand DNA)
    const profileContext = {
      name: profile.name,
      username: profile.username,
      bio: profile.description || '',
      followers: profile.public_metrics.followers_count,
    };

    // Step 2.5: Fetch tweets - CONTENT-PRIMARY approach
    // Tweets are the primary signal for brand DNA analysis
    let tweetVoiceAnalysis: TweetVoiceAnalysis | null = null;
    let tweetCount = 0;
    let analysisMode: AnalysisMode = 'profile-only';

    if (features.tweetAnalysis) {
      try {
        console.log('=== FETCHING TWEETS (CONTENT-PRIMARY MODE) ===');
        const origin = request.nextUrl.origin;
        const tweetsResponse = await fetch(`${origin}/api/x-tweets`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: profile.username,
            maxResults: 100,
          }),
        });

        if (tweetsResponse.ok) {
          const tweetsData = await tweetsResponse.json();
          tweetCount = tweetsData.tweets?.length || 0;
          console.log(`=== TWEETS RECEIVED: ${tweetCount} tweets ===`);

          if (tweetCount >= MINIMUM_TWEETS_FOR_CONTENT_ANALYSIS) {
            // Enough tweets for content-primary analysis
            analysisMode = 'content-primary';
            console.log('=== CONTENT-PRIMARY MODE: Sufficient tweets for reliable analysis ===');
            tweetVoiceAnalysis = await analyzeTweetVoice(
              tweetsData.tweets,
              tweetsData.analysis.stats
            );
            console.log('=== TWEET VOICE ANALYSIS RESULT ===');
            console.log('Content Themes:', tweetVoiceAnalysis?.contentThemes?.length || 0);
            console.log('Themes:', tweetVoiceAnalysis?.contentThemes?.map(t => t.pillar).join(', ') || 'None');
          } else if (tweetCount > 0) {
            // Some tweets, but not enough for full content analysis
            analysisMode = 'limited-tweets';
            console.log(`=== LIMITED TWEETS MODE: Only ${tweetCount} tweets (need ${MINIMUM_TWEETS_FOR_CONTENT_ANALYSIS} for content-primary) ===`);
            // Still analyze what we have
            tweetVoiceAnalysis = await analyzeTweetVoice(
              tweetsData.tweets,
              tweetsData.analysis.stats
            );
          } else {
            console.log('=== NO TWEETS RETURNED - PROFILE-ONLY MODE ===');
          }
        } else {
          const errorBody = await tweetsResponse.text();
          console.error('=== TWEET FETCH FAILED - FALLING BACK TO PROFILE-ONLY ===');
          console.error('Status:', tweetsResponse.status);
          console.error('Body:', errorBody);
        }
      } catch (tweetError) {
        console.warn('Tweet analysis unavailable, using profile-only mode:', tweetError);
        // Non-fatal - continue with profile-only analysis
      }
    } else {
      console.log('=== TWEET ANALYSIS DISABLED - PROFILE-ONLY MODE ===');
    }

    // Run image analysis, color extraction, and brand DNA generation in parallel
    // CONTENT-PRIMARY: Pass tweet voice to brand DNA generation
    const [profileImageAnalysis, extractedColors, brandDNA] = await Promise.all([
      profile.profile_image_url
        ? analyzeProfileImageWithVision(profile.profile_image_url, profileContext)
        : Promise.resolve(null),
      profile.profile_image_url
        ? extractColorsFromImage(profile.profile_image_url)
        : Promise.resolve(null),
      generateBrandDNA(profile, undefined, tweetVoiceAnalysis),
    ]);

    // Step 3: Generate improvements (needs brand DNA first)
    let improvements: BrandImprovements | null = null;
    if (brandDNA) {
      improvements = await generateBrandImprovements(profile, brandDNA);
    }

    // Step 4: Analyze account authenticity and activity
    // Note: Engagement rate analysis requires raw tweet stats which we don't have here
    // The bot detection will use other signals (follower ratio, account age)
    const authenticityAnalysis = analyzeAccountAuthenticity(profile);
    const activityAnalysis = analyzeActivityLevel(profile);

    console.log('=== ACCOUNT ANALYSIS ===');
    console.log(`Authenticity: ${authenticityAnalysis.tierLabel} (score: ${authenticityAnalysis.score})`);
    console.log(`Activity: ${activityAnalysis.levelLabel} (${activityAnalysis.detail})`);
    console.log('========================');

    const response: BrandIdentityResponse = {
      success: true,
      profile: {
        name: profile.name,
        username: profile.username,
        profileImageUrl: profile.profile_image_url || '',
        bio: profile.description || '',
        followers: profile.public_metrics.followers_count,
        following: profile.public_metrics.following_count,
        verified: profile.verified || false,
      },
      analysis: {
        bioLinguistics,
        nameAnalysis,
        profileImage: profileImageAnalysis,
        extractedColors,
        brandDNA,
        improvements,
        tweetVoice: tweetVoiceAnalysis,
        authenticity: authenticityAnalysis,
        activity: activityAnalysis,
      },
      meta: {
        enhanced: !!tweetVoiceAnalysis,
        tier: features.xApiTier,
        analysisMode,
        tweetCount,
      },
    };

    console.log(`=== ANALYSIS MODE: ${analysisMode} (${tweetCount} tweets) ===`);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Brand Identity API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}




