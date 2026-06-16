import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import prisma from '@/lib/db';
import { ensurePersonalWorkspace } from '@/lib/auth';
import { encryptOauthToken, getCurrentKeyId } from '@/lib/crypto';
import { logSecurityEvent } from '@/lib/audit-log';

const EARLY_ACCESS_MODE = process.env.NEXT_PUBLIC_EARLY_ACCESS_MODE === 'true';

type AuthProvider = 'twitter' | 'google' | 'apple' | 'email';

function detectProvider(session: { user: { app_metadata?: { provider?: string } } }): AuthProvider {
  const provider = session.user.app_metadata?.provider;
  if (provider === 'twitter') return 'twitter';
  if (provider === 'google') return 'google';
  if (provider === 'apple') return 'apple';
  return 'email';
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/dashboard';

  if (!code) {
    return NextResponse.redirect(new URL('/?error=no_code', request.url));
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
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

    const {
      data: { session },
      error: authError,
    } = await supabase.auth.exchangeCodeForSession(code);

    if (authError || !session) {
      console.error('[Auth Callback] Exchange error:', authError);
      return NextResponse.redirect(new URL('/?error=auth_failed', request.url));
    }

    const provider = detectProvider(session);
    const email = session.user.email;
    const name = session.user.user_metadata?.full_name || session.user.user_metadata?.name;
    const avatar = session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture;

    // Extract X-specific data (only present for twitter provider)
    const xUsername = provider === 'twitter'
      ? (session.user.user_metadata?.user_name ||
         session.user.user_metadata?.preferred_username ||
         session.user.user_metadata?.screen_name)
      : null;
    const xId = provider === 'twitter'
      ? (session.user.user_metadata?.provider_id || session.user.user_metadata?.sub)
      : null;

    // Invite code redemption
    const pendingInviteCode = cookieStore.get('pendingInviteCode')?.value;
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
          const identifier = xUsername || email || session.user.id;
          const usedBy: string[] = JSON.parse(inviteCode.usedBy);
          if (!usedBy.includes(identifier)) {
            usedBy.push(identifier);
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

    if (EARLY_ACCESS_MODE && !isInnerCircle) {
      isInnerCircle = true;
      invitedBy = 'EARLY_ACCESS';
    }

    // Determine migration status for new vs existing users
    const existingUser = await prisma.user.findUnique({
      where: { supabaseId: session.user.id },
    });

    const migrationStatus = existingUser
      ? existingUser.accountMigrationStatus
      : 'completed'; // new users start as completed (no legacy migration needed)

    // Upsert user — xUsername/xId are nullable for non-X-first signups
    const user = await prisma.user.upsert({
      where: { supabaseId: session.user.id },
      update: {
        name,
        avatar,
        email,
        ...(xUsername && !existingUser?.xUsername ? { xUsername } : {}),
        ...(xId && !existingUser?.xId ? { xId } : {}),
        ...(isInnerCircle ? { isInnerCircle: true, invitedBy } : {}),
      },
      create: {
        supabaseId: session.user.id,
        xUsername: xUsername ?? undefined,
        xId: xId ?? undefined,
        name,
        avatar,
        email,
        isInnerCircle,
        invitedBy,
        accountMigrationStatus: migrationStatus,
      },
    });

    // Ensure personal workspace
    const workspace = await ensurePersonalWorkspace(user.id, name || xUsername || email?.split('@')[0]);

    // Auto-connect X account if this is an X OAuth login
    if (provider === 'twitter' && xUsername && xId) {
      const providerToken = session.provider_token;
      const providerRefreshToken = session.provider_refresh_token;

      try {
        const existing = await prisma.platformConnection.findFirst({
          where: { userId: user.id, platform: 'x', platformUserId: xId },
        });

        if (!existing && providerToken) {
          const encrypted = await encryptOauthToken(providerToken);
          const encryptedRefresh = providerRefreshToken
            ? await encryptOauthToken(providerRefreshToken)
            : null;

          await prisma.platformConnection.create({
            data: {
              userId: user.id,
              platform: 'x',
              platformUserId: xId,
              platformUsername: xUsername,
              accessToken: '**encrypted**',
              scopes: JSON.stringify(['tweet.read', 'users.read']),
              profileData: JSON.stringify({ name, avatar }),
              workspaceId: workspace.id,
              status: 'active',
              keyId: getCurrentKeyId(),
              accessTokenCiphertext: encrypted.ciphertext,
              refreshTokenCiphertext: encryptedRefresh?.ciphertext ?? null,
              lastVerifiedAt: new Date(),
            },
          });
        } else if (existing) {
          await prisma.platformConnection.update({
            where: { id: existing.id },
            data: {
              platformUsername: xUsername,
              lastVerifiedAt: new Date(),
              status: 'active',
            },
          });
        }
      } catch (pcError) {
        console.error('[Auth Callback] PlatformConnection error:', pcError);
      }
    }

    await logSecurityEvent({
      category: 'auth',
      eventType: 'login_success',
      userId: user.id,
      workspaceId: workspace.id,
      metadata: { method: provider },
    });

    // Determine redirect: legacy users go to migration page
    let redirectTo = next;
    if (existingUser?.accountMigrationStatus === 'legacy' && provider === 'twitter') {
      redirectTo = '/migrate-account';
    }

    const response = NextResponse.redirect(new URL(redirectTo, request.url));

    response.cookies.delete('pendingInviteCode');

    response.cookies.set('sb-access-token', session.access_token, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    });

    response.cookies.set('sb-refresh-token', session.refresh_token, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (error) {
    console.error('[Auth Callback] Error:', error);
    return NextResponse.redirect(new URL('/?error=callback_failed', request.url));
  }
}
