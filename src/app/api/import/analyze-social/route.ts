import { NextRequest, NextResponse } from 'next/server';
import { getWorkspaceContext } from '@/lib/workspace-auth';
import { botGuard } from '@/lib/botid-guard';
import { readJsonBody } from '@/lib/api-body';
import { fetchProfile, fetchUserTweets, isSocialDataConfigured } from '@/lib/socialdata';
import { analyzeToneHeuristic, extractKeywordsFromText } from '@/lib/import-extraction';

// Import Hub — social profile analysis (consolidation step 7). The legacy
// route was an unauthenticated mock returning canned per-platform data. Now
// real for X/Twitter via SocialData (the app's existing provider); Instagram
// and LinkedIn have no data source yet and are rejected honestly instead of
// returning fake analysis. Hardening: workspace auth + BotID (each request
// costs paid SocialData calls) + body clamp + strict handle validation.

const MAX_BODY_BYTES = 10_000;
const MAX_TWEETS = 20;
const HANDLE_PATTERN = /^[A-Za-z0-9_]{1,15}$/;

export async function POST(request: NextRequest) {
  try {
    const [ctx, botBlock] = await Promise.all([
      getWorkspaceContext({ ensure: false }),
      botGuard(request),
    ]);
    if (!ctx) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (botBlock) return botBlock;

    const read = await readJsonBody(request, MAX_BODY_BYTES);
    if (!read.ok) return read.response;
    const platform = typeof read.body.platform === 'string' ? read.body.platform : '';
    const handle = typeof read.body.handle === 'string' ? read.body.handle : '';

    if (!platform || !handle) {
      return NextResponse.json({ error: 'Platform and handle are required' }, { status: 400 });
    }
    if (platform !== 'twitter') {
      return NextResponse.json(
        { error: 'Only X/Twitter import is supported right now — Instagram and LinkedIn are coming soon.' },
        { status: 400 }
      );
    }
    if (!isSocialDataConfigured()) {
      return NextResponse.json(
        { error: 'Social import is temporarily unavailable' },
        { status: 503 }
      );
    }

    const cleanHandle = handle
      .replace(/^@/, '')
      .replace(/^https?:\/\/(www\.)?(twitter|x)\.com\//, '')
      .replace(/[/?].*$/, '')
      .trim();
    if (!HANDLE_PATTERN.test(cleanHandle)) {
      return NextResponse.json({ error: 'Invalid X handle' }, { status: 400 });
    }

    const profileResult = await fetchProfile(cleanHandle);
    if (!profileResult.profile) {
      return NextResponse.json(
        { error: profileResult.error || `@${cleanHandle} not found on X` },
        { status: profileResult.status === 404 ? 404 : 502 }
      );
    }
    const profile = profileResult.profile;
    if (profile.protected) {
      return NextResponse.json(
        { error: `@${cleanHandle} is a protected account — posts can't be analyzed` },
        { status: 400 }
      );
    }

    const { tweets } = await fetchUserTweets(profile.id, MAX_TWEETS);

    // Voice samples: the account's highest-engagement recent posts.
    const voiceSamples = [...tweets]
      .sort((a, b) => b.public_metrics.like_count - a.public_metrics.like_count)
      .slice(0, 4)
      .map((t) => t.text.slice(0, 280));

    const hashtags = tweets
      .flatMap((t) => t.entities?.hashtags?.map((h) => h.tag.toLowerCase()) ?? [])
      .filter((tag) => tag.length > 2);
    const keywords = [
      ...new Set([
        ...hashtags,
        ...extractKeywordsFromText([profile.description, ...tweets.map((t) => t.text)].join(' ')),
      ]),
    ].slice(0, 8);

    const tone = analyzeToneHeuristic(
      [profile.description, ...tweets.map((t) => t.text)].join(' ')
    );

    return NextResponse.json({
      overallConfidence: tweets.length > 0 ? 80 : 55,
      name: profile.name || cleanHandle,
      tone,
      keywords,
      voiceSamples,
      profileImage: profile.profile_image_url || null,
    });
  } catch (error) {
    console.error('[import/analyze-social] error:', error);
    return NextResponse.json({ error: 'Failed to analyze social profile' }, { status: 500 });
  }
}
