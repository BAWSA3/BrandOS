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
  BioLinguistics,
  NameAnalysis,
  ProfileImageAnalysis,
  BrandDNA,
  BrandImprovements,
  TweetVoiceAnalysis,
} from '@/lib/gemini';
import { features } from '@/lib/features';
import { extractColorsFromImage, ExtractedColors } from '@/lib/color-extraction';

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
  };
  meta?: {
    enhanced: boolean;
    tier: string;
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

    // Step 2.5: Fetch tweets if Basic tier available
    let tweetVoiceAnalysis: TweetVoiceAnalysis | null = null;

    if (features.tweetAnalysis) {
      try {
        console.log('=== FETCHING TWEETS (Basic tier enabled) ===');
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
          console.log(`Fetched ${tweetsData.tweets?.length || 0} tweets for voice analysis`);

          if (tweetsData.tweets && tweetsData.tweets.length > 0) {
            tweetVoiceAnalysis = await analyzeTweetVoice(
              tweetsData.tweets,
              tweetsData.analysis.stats
            );
          }
        } else {
          console.warn('Tweet fetch failed:', tweetsResponse.status);
        }
      } catch (tweetError) {
        console.warn('Tweet analysis unavailable:', tweetError);
        // Non-fatal - continue without tweet analysis
      }
    }

    // Run image analysis, color extraction, and brand DNA generation in parallel
    const [profileImageAnalysis, extractedColors, brandDNA] = await Promise.all([
      profile.profile_image_url
        ? analyzeProfileImageWithVision(profile.profile_image_url, profileContext)
        : Promise.resolve(null),
      profile.profile_image_url
        ? extractColorsFromImage(profile.profile_image_url)
        : Promise.resolve(null),
      generateBrandDNA(profile),
    ]);

    // Step 3: Generate improvements (needs brand DNA first)
    let improvements: BrandImprovements | null = null;
    if (brandDNA) {
      improvements = await generateBrandImprovements(profile, brandDNA);
    }

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
      },
      meta: {
        enhanced: !!tweetVoiceAnalysis,
        tier: features.xApiTier,
      },
    };

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




