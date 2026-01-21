import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: 'Configuration error' }, { status: 500 });
    }

    const cookieStore = await cookies();
    const accessToken = cookieStore.get('sb-access-token')?.value;
    const refreshToken = cookieStore.get('sb-refresh-token')?.value;

    if (!accessToken) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Set the session using the tokens from cookies
    const { data: { user: supabaseUser }, error } = await supabase.auth.getUser(accessToken);

    if (error || !supabaseUser) {
      // Try to refresh the session
      if (refreshToken) {
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession({
          refresh_token: refreshToken,
        });

        if (refreshError || !refreshData.session || !refreshData.user) {
          return NextResponse.json({ user: null }, { status: 401 });
        }

        // Update cookies with new tokens
        const response = NextResponse.json({ user: null });
        response.cookies.set('sb-access-token', refreshData.session.access_token, {
          path: '/',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7,
        });
        response.cookies.set('sb-refresh-token', refreshData.session.refresh_token, {
          path: '/',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 30,
        });

        // Continue with the refreshed user
        const refreshedUser = refreshData.user;
        const user = await prisma.user.findUnique({
          where: { supabaseId: refreshedUser.id },
        });

        if (!user) {
          return NextResponse.json({ user: null }, { status: 404 });
        }

        return NextResponse.json({
          user: {
            id: user.id,
            supabaseId: user.supabaseId,
            xUsername: user.xUsername,
            xId: user.xId,
            name: user.name,
            avatar: user.avatar,
            email: user.email,
            isInnerCircle: user.isInnerCircle,
            invitedBy: user.invitedBy,
          },
        });
      }

      return NextResponse.json({ user: null }, { status: 401 });
    }

    // Fetch user from our database
    const user = await prisma.user.findUnique({
      where: { supabaseId: supabaseUser.id },
    });

    if (!user) {
      return NextResponse.json({ user: null }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        supabaseId: user.supabaseId,
        xUsername: user.xUsername,
        xId: user.xId,
        name: user.name,
        avatar: user.avatar,
        email: user.email,
        isInnerCircle: user.isInnerCircle,
        invitedBy: user.invitedBy,
      },
    });
  } catch (error) {
    console.error('[Auth User] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
