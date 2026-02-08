import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export interface DashboardPost {
  id: string;
  text: string;
  created_at: string;
  public_metrics: {
    retweet_count: number;
    reply_count: number;
    like_count: number;
    quote_count: number;
    impression_count: number;
  };
  entities?: {
    hashtags?: { tag: string }[];
    mentions?: { username: string }[];
    urls?: { expanded_url: string }[];
  };
}

// Simple in-memory cache (5 minute TTL)
let postsCache: { data: DashboardPost[]; timestamp: number; userId: string } | null = null;
const CACHE_TTL = 5 * 60 * 1000;

export async function GET(_request: NextRequest) {
  try {
    // Get session for provider token
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch { /* Server component */ }
          },
        },
      }
    );

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const xUserId = session.user.user_metadata?.provider_id;
    const providerToken = session.provider_token;

    // Check cache
    if (postsCache && postsCache.userId === xUserId && Date.now() - postsCache.timestamp < CACHE_TTL) {
      return NextResponse.json({ posts: postsCache.data });
    }

    // Try provider token first, fall back to bearer
    const token = providerToken || process.env.X_BEARER_TOKEN;
    const isBearer = !providerToken;

    if (!token) {
      return NextResponse.json({ error: 'No X API token available' }, { status: 500 });
    }

    if (!xUserId) {
      return NextResponse.json({ error: 'X user ID not found' }, { status: 400 });
    }

    const tweetFields = 'id,text,created_at,public_metrics,entities';
    const url = `https://api.x.com/2/users/${xUserId}/tweets?max_results=20&exclude=replies,retweets&tweet.fields=${tweetFields}`;

    const xResponse = await fetch(url, {
      headers: {
        Authorization: isBearer ? `Bearer ${token}` : `Bearer ${token}`,
      },
    });

    if (!xResponse.ok) {
      // If 403, X API tier insufficient
      if (xResponse.status === 403) {
        return NextResponse.json({
          posts: [],
          notice: 'X API Basic tier required for tweet fetching. Showing placeholder data.',
        });
      }
      const errorText = await xResponse.text();
      console.error('X API error:', xResponse.status, errorText);
      return NextResponse.json({ posts: [], error: 'Failed to fetch posts from X' });
    }

    const data = await xResponse.json();
    const posts: DashboardPost[] = (data.data || []).map((tweet: Record<string, unknown>) => ({
      id: tweet.id,
      text: tweet.text,
      created_at: tweet.created_at,
      public_metrics: tweet.public_metrics || {
        retweet_count: 0, reply_count: 0, like_count: 0, quote_count: 0, impression_count: 0,
      },
      entities: tweet.entities || {},
    }));

    // Update cache
    postsCache = { data: posts, timestamp: Date.now(), userId: xUserId };

    return NextResponse.json({ posts });
  } catch (error) {
    console.error('Dashboard posts error:', error);
    return NextResponse.json({ posts: [], error: 'Internal error' }, { status: 500 });
  }
}
