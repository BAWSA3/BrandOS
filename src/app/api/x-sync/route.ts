import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import prisma from '@/lib/db';

const SYNC_COOLDOWN_MS = 15 * 60 * 1000; // 15 minutes

export async function POST(request: NextRequest) {
  try {
    // Auth: same pattern as the rest of the codebase
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

    // Get user from DB — xId is stored reliably here (not ephemeral like provider_token)
    const user = await prisma.user.findUnique({ where: { supabaseId: authUser.id } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.xId) {
      return NextResponse.json({ error: 'X user ID not found. Re-authenticate with X.' }, { status: 400 });
    }

    const { brandId } = await request.json();
    if (!brandId) {
      return NextResponse.json({ error: 'brandId is required' }, { status: 400 });
    }

    // Verify user owns this brand
    const brand = await prisma.brand.findFirst({
      where: { id: brandId, userId: user.id },
    });
    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    // Rate limit: check most recent sync
    const mostRecent = await prisma.brandTweet.findFirst({
      where: { brandId },
      orderBy: { syncedAt: 'desc' },
      select: { syncedAt: true },
    });

    if (mostRecent && Date.now() - mostRecent.syncedAt.getTime() < SYNC_COOLDOWN_MS) {
      const waitSec = Math.ceil((SYNC_COOLDOWN_MS - (Date.now() - mostRecent.syncedAt.getTime())) / 1000);
      return NextResponse.json({
        error: `Rate limited. Try again in ${waitSec}s`,
        nextSyncAt: new Date(mostRecent.syncedAt.getTime() + SYNC_COOLDOWN_MS).toISOString(),
      }, { status: 429 });
    }

    // Use app bearer token (provider_token is ephemeral and unreliable after initial OAuth)
    const token = process.env.X_BEARER_TOKEN;
    if (!token) {
      return NextResponse.json({ error: 'X API not configured' }, { status: 500 });
    }

    const tweetFields = 'id,text,created_at,public_metrics,entities';
    const url = `https://api.x.com/2/users/${user.xId}/tweets?max_results=20&exclude=replies,retweets&tweet.fields=${tweetFields}`;

    const xResponse = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!xResponse.ok) {
      if (xResponse.status === 403) {
        return NextResponse.json({
          error: 'X API access insufficient. Basic tier or higher required.',
        }, { status: 403 });
      }
      const errorText = await xResponse.text();
      console.error('[x-sync] X API error:', xResponse.status, errorText);
      return NextResponse.json({ error: 'Failed to fetch from X API' }, { status: 502 });
    }

    const data = await xResponse.json();
    const tweets = data.data || [];

    // Upsert tweets into BrandTweet
    const syncedAt = new Date();
    let newTweets = 0;

    for (const tweet of tweets) {
      const metrics = tweet.public_metrics || {
        like_count: 0, retweet_count: 0, reply_count: 0, quote_count: 0, impression_count: 0,
      };

      const likes = metrics.like_count || 0;
      const retweets = metrics.retweet_count || 0;
      const replies = metrics.reply_count || 0;
      const impressions = metrics.impression_count || 1;
      const engagementRate = ((likes + retweets + replies) / impressions) * 100;

      const metricsJson = JSON.stringify({
        likes,
        retweets,
        replies,
        impressions: metrics.impression_count || 0,
        quotes: metrics.quote_count || 0,
      });

      const entitiesJson = tweet.entities
        ? JSON.stringify({
            hashtags: tweet.entities.hashtags?.map((h: { tag: string }) => h.tag) || [],
            mentions: tweet.entities.mentions?.map((m: { username: string }) => m.username) || [],
            urls: tweet.entities.urls?.map((u: { expanded_url: string }) => u.expanded_url) || [],
          })
        : null;

      const result = await prisma.brandTweet.upsert({
        where: { tweetId: tweet.id },
        update: {
          metrics: metricsJson,
          entities: entitiesJson,
          engagementRate,
          syncedAt,
        },
        create: {
          tweetId: tweet.id,
          text: tweet.text,
          postedAt: new Date(tweet.created_at),
          metrics: metricsJson,
          entities: entitiesJson,
          engagementRate,
          brandId,
          syncedAt,
        },
      });

      // If createdAt matches syncedAt (new record), count it
      if (result.createdAt.getTime() >= syncedAt.getTime() - 1000) {
        newTweets++;
      }
    }

    return NextResponse.json({
      synced: tweets.length,
      total: await prisma.brandTweet.count({ where: { brandId } }),
      newTweets,
      syncedAt: syncedAt.toISOString(),
    });
  } catch (error) {
    console.error('[x-sync] error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
