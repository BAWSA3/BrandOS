import { NextRequest, NextResponse } from 'next/server';
import { profileCache } from '@/lib/cache';

// X API v2 User fields we want to fetch
const USER_FIELDS = [
  'id',
  'name',
  'username',
  'description',
  'profile_image_url',
  'public_metrics',
  'created_at',
  'verified',
  'location',
  'url',
  'protected',
].join(',');

export interface XProfile {
  id: string;
  name: string;
  username: string;
  description: string;
  profile_image_url: string;
  public_metrics: {
    followers_count: number;
    following_count: number;
    tweet_count: number;
    listed_count: number;
  };
  created_at: string;
  verified: boolean;
  location?: string;
  url?: string;
  protected: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json() as { username: string };

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    // Clean the username (remove @ if present)
    const cleanUsername = username.replace(/^@/, '').trim();

    if (!cleanUsername) {
      return NextResponse.json(
        { error: 'Invalid username format' },
        { status: 400 }
      );
    }

    // Check cache first
    const cacheKey = `profile:${cleanUsername.toLowerCase()}`;
    const cachedProfile = profileCache.get<XProfile>(cacheKey);

    if (cachedProfile) {
      console.log(`[CACHE HIT] Profile for @${cleanUsername}`);
      return NextResponse.json({ profile: cachedProfile, cached: true });
    }

    console.log(`[CACHE MISS] Fetching profile for @${cleanUsername} from X API`);

    const bearerToken = process.env.X_BEARER_TOKEN;

    if (!bearerToken) {
      console.error('X_BEARER_TOKEN is not configured');
      return NextResponse.json(
        { error: 'X API not configured. Please add X_BEARER_TOKEN to environment variables.' },
        { status: 500 }
      );
    }

    // Call X API v2 to get user by username
    const xApiUrl = `https://api.twitter.com/2/users/by/username/${cleanUsername}?user.fields=${USER_FIELDS}`;

    const response = await fetch(xApiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${bearerToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('X API error:', response.status, errorData);

      if (response.status === 401) {
        return NextResponse.json(
          { error: 'X API authentication failed. Check your Bearer Token.' },
          { status: 401 }
        );
      }

      if (response.status === 404) {
        return NextResponse.json(
          { error: `User @${cleanUsername} not found on X` },
          { status: 404 }
        );
      }

      if (response.status === 429) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again in a few minutes.' },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to fetch X profile' },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (data.errors && data.errors.length > 0) {
      const error = data.errors[0];
      console.error('X API returned error:', error);
      return NextResponse.json(
        { error: error.detail || 'Failed to fetch user data' },
        { status: 400 }
      );
    }

    if (!data.data) {
      return NextResponse.json(
        { error: `User @${cleanUsername} not found` },
        { status: 404 }
      );
    }

    const profile: XProfile = {
      id: data.data.id,
      name: data.data.name || '',
      username: data.data.username,
      description: data.data.description || '',
      profile_image_url: data.data.profile_image_url || '',
      public_metrics: data.data.public_metrics || {
        followers_count: 0,
        following_count: 0,
        tweet_count: 0,
        listed_count: 0,
      },
      created_at: data.data.created_at || '',
      verified: data.data.verified || false,
      location: data.data.location,
      url: data.data.url,
      protected: data.data.protected || false,
    };

    // Log profile data for debugging (check terminal output)
    console.log('=== X PROFILE DATA ===');
    console.log(`Username: @${profile.username}`);
    console.log(`Display Name: ${profile.name}`);
    console.log(`Verified: ${profile.verified}`);
    console.log(`Raw verified value from API: ${data.data.verified}`);
    console.log(`Followers: ${profile.public_metrics.followers_count}`);
    console.log(`Bio: ${profile.description?.substring(0, 100)}...`);
    console.log('======================');

    // Cache the profile for 30 minutes
    profileCache.set(cacheKey, profile);
    console.log(`[CACHE SET] Cached profile for @${cleanUsername}`);

    return NextResponse.json({ profile, cached: false });

  } catch (error) {
    console.error('X Profile API error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}



