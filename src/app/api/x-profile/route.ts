import { NextRequest, NextResponse } from 'next/server';
import { profileCache, notFoundCache } from '@/lib/cache';
import { checkRateLimit, getClientIdentifier, rateLimiters } from '@/lib/rate-limit';
import prisma from '@/lib/db';

// X API v2 User fields we want to fetch
const USER_FIELDS = [
  'id',
  'name',
  'username',
  'description',
  'profile_image_url',
  'public_metrics',
  'created_at',
  'location',
  'url',
  'protected',
].join(',');

// How long before we re-fetch a profile (7 days in ms)
const DB_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

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

// ---------------------------------------------------------------------------
// Provider: X API v2 (Official — 100 lookups/day on Basic tier)
// ---------------------------------------------------------------------------
async function fetchFromXApi(username: string): Promise<{ profile?: XProfile; status: number; error?: string }> {
  const bearerToken = process.env.X_BEARER_TOKEN;
  if (!bearerToken) {
    return { status: 500, error: 'X_BEARER_TOKEN not configured' };
  }

  const url = `https://api.twitter.com/2/users/by/username/${username}?user.fields=${USER_FIELDS}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${bearerToken}` },
  });

  const remaining = response.headers.get('x-rate-limit-remaining');
  const reset = response.headers.get('x-rate-limit-reset');
  console.log(`[X API] @${username} -> ${response.status}, remaining: ${remaining}, reset: ${reset ? new Date(Number(reset) * 1000).toISOString() : 'N/A'}`);

  if (response.status === 429) {
    return { status: 429, error: 'X API rate limited' };
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    console.error(`[X API ERROR] ${response.status} @${username}:`, JSON.stringify(err));
    return { status: response.status, error: `X API error (${response.status})` };
  }

  const data = await response.json();

  if (data.errors?.length > 0) {
    const detail = data.errors[0].detail || 'User not found';
    return { status: 404, error: detail };
  }

  if (!data.data) {
    return { status: 404, error: `User @${username} not found on X` };
  }

  return {
    status: 200,
    profile: {
      id: data.data.id,
      name: data.data.name || '',
      username: data.data.username,
      description: data.data.description || '',
      profile_image_url: data.data.profile_image_url || '',
      public_metrics: data.data.public_metrics || {
        followers_count: 0, following_count: 0, tweet_count: 0, listed_count: 0,
      },
      created_at: data.data.created_at || '',
      verified: data.data.verified || false,
      location: data.data.location,
      url: data.data.url,
      protected: data.data.protected || false,
    },
  };
}

// ---------------------------------------------------------------------------
// Provider: SocialData.tools (Fallback — ~$0.0002/request, no daily cap)
// ---------------------------------------------------------------------------
async function fetchFromSocialData(username: string): Promise<{ profile?: XProfile; status: number; error?: string }> {
  const apiKey = process.env.SOCIALDATA_API_KEY;
  if (!apiKey) {
    return { status: 500, error: 'SOCIALDATA_API_KEY not configured' };
  }

  const url = `https://api.socialdata.tools/twitter/user/${username}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json',
    },
  });

  console.log(`[SOCIALDATA] @${username} -> ${response.status}`);

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    console.error(`[SOCIALDATA ERROR] ${response.status} @${username}:`, JSON.stringify(err));

    if (response.status === 404 || response.status === 400) {
      return { status: 404, error: `User @${username} not found on X` };
    }
    return { status: response.status, error: `SocialData error (${response.status})` };
  }

  const data = await response.json();

  if (!data || !data.id_str) {
    return { status: 404, error: `User @${username} not found on X` };
  }

  // Map SocialData response fields → our XProfile format
  return {
    status: 200,
    profile: {
      id: data.id_str,
      name: data.name || '',
      username: data.screen_name || username,
      description: data.description || '',
      profile_image_url: (data.profile_image_url_https || '').replace('_normal', '_400x400'),
      public_metrics: {
        followers_count: data.followers_count || 0,
        following_count: data.friends_count || 0,
        tweet_count: data.statuses_count || 0,
        listed_count: data.listed_count || 0,
      },
      created_at: data.created_at || '',
      verified: data.verified || false,
      location: data.location || undefined,
      url: data.url || undefined,
      protected: data.protected || false,
    },
  };
}

// ---------------------------------------------------------------------------
// Persist profile to DB cache (fire-and-forget)
// ---------------------------------------------------------------------------
function persistToDbCache(usernameLower: string, profile: XProfile) {
  prisma.xProfileCache.upsert({
    where: { username: usernameLower },
    update: {
      profileData: JSON.stringify(profile),
      followersCount: profile.public_metrics.followers_count,
      tweetCount: profile.public_metrics.tweet_count,
      fetchedAt: new Date(),
    },
    create: {
      username: usernameLower,
      profileData: JSON.stringify(profile),
      followersCount: profile.public_metrics.followers_count,
      tweetCount: profile.public_metrics.tweet_count,
    },
  }).catch((err) => console.error('[DB CACHE WRITE ERROR]', err));
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 30 requests per minute per IP
    const clientId = getClientIdentifier(request);
    const { limited, resetIn } = checkRateLimit(clientId + ':x-profile', rateLimiters.standard);

    if (limited) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: { 'Retry-After': Math.ceil(resetIn / 1000).toString() } },
      );
    }

    const { username } = (await request.json()) as { username: string };
    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    const cleanUsername = username.replace(/^@/, '').trim();
    if (!cleanUsername) {
      return NextResponse.json({ error: 'Invalid username format' }, { status: 400 });
    }

    const usernameLower = cleanUsername.toLowerCase();
    const cacheKey = `profile:${usernameLower}`;
    const notFoundKey = `notfound:${usernameLower}`;

    // ── 1. In-memory cache (fastest) ──────────────────────────────────────
    const cachedNotFound = notFoundCache.get<string>(notFoundKey);
    if (cachedNotFound) {
      return NextResponse.json({ error: cachedNotFound }, { status: 404 });
    }

    const memoryCached = profileCache.get<XProfile>(cacheKey);
    if (memoryCached) {
      return NextResponse.json({ profile: memoryCached, cached: true });
    }

    // ── 2. Persistent DB cache (survives deploys) ─────────────────────────
    try {
      const dbCached = await prisma.xProfileCache.findUnique({
        where: { username: usernameLower },
      });

      if (dbCached) {
        const age = Date.now() - dbCached.fetchedAt.getTime();
        if (age < DB_CACHE_TTL_MS) {
          const profile = JSON.parse(dbCached.profileData) as XProfile;
          profileCache.set(cacheKey, profile);
          console.log(`[DB CACHE HIT] @${cleanUsername} (age: ${Math.round(age / 3600000)}h)`);
          return NextResponse.json({ profile, cached: true });
        }
        console.log(`[DB CACHE STALE] @${cleanUsername} (age: ${Math.round(age / 86400000)}d)`);
      }
    } catch (dbError) {
      console.error('[DB CACHE ERROR]', dbError);
    }

    // ── 3. Fetch from providers: X API first, SocialData fallback ─────────
    console.log(`[FETCH] @${cleanUsername} — trying X API first`);
    let result = await fetchFromXApi(cleanUsername);

    // If X API fails (rate limited, 403, 500, etc.), try SocialData
    if (!result.profile && result.status !== 404) {
      console.log(`[FETCH] X API failed (${result.status}), falling back to SocialData`);
      const fallback = await fetchFromSocialData(cleanUsername);

      if (fallback.profile) {
        result = fallback;
      } else if (fallback.status === 404) {
        // Both providers say not found — it's genuinely not found
        result = fallback;
      }
      // If SocialData also fails with a non-404, keep the original X API error
    }

    // ── 4. Handle result ──────────────────────────────────────────────────
    if (!result.profile) {
      if (result.status === 404) {
        const msg = `User @${cleanUsername} not found on X`;
        notFoundCache.set(notFoundKey, msg);
        return NextResponse.json({ error: msg }, { status: 404 });
      }
      return NextResponse.json(
        { error: 'We\'re experiencing high demand right now. Please try again in a few minutes.' },
        { status: 503 },
      );
    }

    const profile = result.profile;
    console.log(`[SUCCESS] @${profile.username} — ${profile.public_metrics.followers_count} followers, ${profile.public_metrics.tweet_count} tweets`);

    // ── 5. Cache everywhere ───────────────────────────────────────────────
    profileCache.set(cacheKey, profile);
    persistToDbCache(usernameLower, profile);

    return NextResponse.json({ profile, cached: false });
  } catch (error) {
    console.error('X Profile API error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
