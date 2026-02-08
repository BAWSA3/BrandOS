import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

/**
 * Post content to X (Twitter) via the X API v2.
 * 
 * Requirements:
 * - User must be authenticated via Supabase with X OAuth
 * - X OAuth scopes must include tweet.write (this may require 
 *   re-authorization if originally set up with read-only scopes)
 * - The Supabase provider token is used to authenticate with X API
 */
export async function POST(request: NextRequest) {
  try {
    const { content, mediaIds } = (await request.json()) as {
      content: string;
      mediaIds?: string[];
    };

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    if (content.length > 280) {
      return NextResponse.json(
        { error: 'Content exceeds 280 character limit' },
        { status: 400 }
      );
    }

    // Get the authenticated user's session to access the X provider token
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Server component cookie setting may fail silently
            }
          },
        },
      }
    );

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated. Please sign in with X.' },
        { status: 401 }
      );
    }

    // Get the X provider token from the session
    const providerToken = session.provider_token;

    if (!providerToken) {
      return NextResponse.json(
        {
          error:
            'X access token not available. Please re-authenticate with X to grant posting permissions.',
        },
        { status: 403 }
      );
    }

    // Post to X API v2
    const tweetBody: Record<string, unknown> = {
      text: content,
    };

    if (mediaIds && mediaIds.length > 0) {
      tweetBody.media = { media_ids: mediaIds };
    }

    const xResponse = await fetch('https://api.x.com/2/tweets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${providerToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tweetBody),
    });

    if (!xResponse.ok) {
      const errorData = await xResponse.json().catch(() => ({}));
      console.error('X API error:', xResponse.status, errorData);

      if (xResponse.status === 401 || xResponse.status === 403) {
        return NextResponse.json(
          {
            error:
              'X access token expired or insufficient permissions. Please re-authenticate with X.',
          },
          { status: 403 }
        );
      }

      return NextResponse.json(
        {
          error:
            (errorData as { detail?: string }).detail ||
            `X API error: ${xResponse.status}`,
        },
        { status: xResponse.status }
      );
    }

    const tweetData = (await xResponse.json()) as {
      data: { id: string };
    };
    const tweetId = tweetData.data.id;

    // Get the username from session metadata for the tweet URL
    const username =
      session.user.user_metadata?.user_name ||
      session.user.user_metadata?.preferred_username ||
      'user';

    const tweetUrl = `https://x.com/${username}/status/${tweetId}`;

    return NextResponse.json({
      success: true,
      tweetId,
      tweetUrl,
    });
  } catch (error: unknown) {
    console.error('Post to X API error:', error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to post to X',
      },
      { status: 500 }
    );
  }
}
