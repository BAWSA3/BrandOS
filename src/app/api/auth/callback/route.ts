import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/app';

  if (!code) {
    console.error('[Auth Callback] No code provided');
    return NextResponse.redirect(new URL('/?error=no_code', request.url));
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[Auth Callback] Missing Supabase environment variables');
    return NextResponse.redirect(new URL('/?error=config_error', request.url));
  }

  try {
    const cookieStore = await cookies();

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    });

    // Exchange code for session
    const { data: { session }, error: authError } = await supabase.auth.exchangeCodeForSession(code);

    if (authError || !session) {
      console.error('[Auth Callback] Exchange error:', authError);
      return NextResponse.redirect(new URL('/?error=auth_failed', request.url));
    }

    // Extract X (Twitter) user data from the session
    const xUsername = session.user.user_metadata?.user_name ||
                     session.user.user_metadata?.preferred_username ||
                     session.user.user_metadata?.screen_name;
    const xId = session.user.user_metadata?.provider_id ||
               session.user.user_metadata?.sub ||
               session.user.id;
    const name = session.user.user_metadata?.full_name ||
                session.user.user_metadata?.name;
    const avatar = session.user.user_metadata?.avatar_url ||
                  session.user.user_metadata?.picture;
    const email = session.user.email;

    if (!xUsername) {
      console.error('[Auth Callback] No X username found in user metadata');
      return NextResponse.redirect(new URL('/?error=no_username', request.url));
    }

    // Get invite code from cookie (set before OAuth redirect)
    const pendingInviteCode = cookieStore.get('pendingInviteCode')?.value;

    // Check and redeem invite code
    let isInnerCircle = false;
    let invitedBy: string | undefined;

    if (pendingInviteCode) {
      try {
        const inviteCode = await prisma.inviteCode.findUnique({
          where: { code: pendingInviteCode.toUpperCase() },
        });

        if (
          inviteCode &&
          inviteCode.isActive &&
          inviteCode.usedCount < inviteCode.maxUses &&
          (!inviteCode.expiresAt || new Date() <= inviteCode.expiresAt)
        ) {
          const usedBy: string[] = JSON.parse(inviteCode.usedBy);
          if (!usedBy.includes(xUsername)) {
            usedBy.push(xUsername);
            await prisma.inviteCode.update({
              where: { code: pendingInviteCode.toUpperCase() },
              data: {
                usedCount: inviteCode.usedCount + 1,
                usedBy: JSON.stringify(usedBy),
                isActive: inviteCode.usedCount + 1 < inviteCode.maxUses,
              },
            });
            isInnerCircle = true;
            invitedBy = inviteCode.createdBy;
          }
        }
      } catch (error) {
        console.error('[Auth Callback] Invite code error:', error);
      }
    }

    // Create or update user in database
    const user = await prisma.user.upsert({
      where: { supabaseId: session.user.id },
      update: {
        name,
        avatar,
        email,
        ...(isInnerCircle ? { isInnerCircle: true, invitedBy } : {}),
      },
      create: {
        supabaseId: session.user.id,
        xUsername,
        xId,
        name,
        avatar,
        email,
        isInnerCircle,
        invitedBy,
      },
    });

    console.log('[Auth Callback] User upserted:', user.id, user.xUsername);

    // Set auth cookies for the session
    const response = NextResponse.redirect(new URL(next, request.url));

    // Clear the pending invite code cookie
    response.cookies.delete('pendingInviteCode');

    // Set session cookies
    response.cookies.set('sb-access-token', session.access_token, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });

    response.cookies.set('sb-refresh-token', session.refresh_token, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (error) {
    console.error('[Auth Callback] Error:', error);
    return NextResponse.redirect(new URL('/?error=callback_failed', request.url));
  }
}
