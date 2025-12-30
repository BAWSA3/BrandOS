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
  BioLinguistics,
  NameAnalysis,
  ProfileImageAnalysis,
  BrandDNA,
  BrandImprovements,
} from '@/lib/gemini';

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
    brandDNA: BrandDNA | null;
    improvements: BrandImprovements | null;
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

    // Run image analysis and brand DNA generation in parallel
    const [profileImageAnalysis, brandDNA] = await Promise.all([
      profile.profile_image_url
        ? analyzeProfileImageWithVision(profile.profile_image_url, profileContext)
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
        brandDNA,
        improvements,
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



