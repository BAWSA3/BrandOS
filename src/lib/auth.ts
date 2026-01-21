import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import prisma from '@/lib/db';

// Server-side Supabase client for Server Components and API routes
export async function createServerSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  const cookieStore = await cookies();

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
    },
    global: {
      headers: {
        cookie: cookieStore.getAll().map(c => `${c.name}=${c.value}`).join('; '),
      },
    },
  });

  return supabase;
}

// Get current session from Supabase
export async function getSession() {
  const supabase = await createServerSupabaseClient();
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error) {
    console.error('[Auth] Session error:', error);
    return null;
  }

  return session;
}

// Get user from database by supabaseId
export async function getUser() {
  const session = await getSession();

  if (!session?.user?.id) {
    return null;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { supabaseId: session.user.id },
      include: {
        brands: true,
      },
    });

    return user;
  } catch (error) {
    console.error('[Auth] Database error:', error);
    return null;
  }
}

// Create or update user after OAuth
export async function upsertUserFromAuth(
  supabaseId: string,
  xUsername: string,
  xId: string,
  options?: {
    name?: string;
    avatar?: string;
    email?: string;
    inviteCode?: string;
  }
) {
  let isInnerCircle = false;
  let invitedBy: string | undefined;

  // Check and redeem invite code if provided
  if (options?.inviteCode) {
    try {
      const inviteCode = await prisma.inviteCode.findUnique({
        where: { code: options.inviteCode.toUpperCase() },
      });

      if (
        inviteCode &&
        inviteCode.isActive &&
        inviteCode.usedCount < inviteCode.maxUses &&
        (!inviteCode.expiresAt || new Date() <= inviteCode.expiresAt)
      ) {
        // Redeem the code
        const usedBy: string[] = JSON.parse(inviteCode.usedBy);
        if (!usedBy.includes(xUsername)) {
          usedBy.push(xUsername);
          await prisma.inviteCode.update({
            where: { code: options.inviteCode.toUpperCase() },
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
      console.error('[Auth] Invite code redemption error:', error);
    }
  }

  try {
    const user = await prisma.user.upsert({
      where: { supabaseId },
      update: {
        name: options?.name,
        avatar: options?.avatar,
        email: options?.email,
        // Only update Inner Circle status if they're being upgraded
        ...(isInnerCircle ? { isInnerCircle: true, invitedBy } : {}),
      },
      create: {
        supabaseId,
        xUsername,
        xId,
        name: options?.name,
        avatar: options?.avatar,
        email: options?.email,
        isInnerCircle,
        invitedBy,
      },
    });

    return user;
  } catch (error) {
    console.error('[Auth] User upsert error:', error);
    throw error;
  }
}

// Type for session user
export interface SessionUser {
  id: string;
  supabaseId: string;
  xUsername: string;
  xId: string;
  name: string | null;
  avatar: string | null;
  email: string | null;
  isInnerCircle: boolean;
  invitedBy: string | null;
}
