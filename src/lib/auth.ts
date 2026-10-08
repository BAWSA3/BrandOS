import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import prisma from '@/lib/db';

function supabaseEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }
  return { supabaseUrl, supabaseAnonKey };
}

// Server-side Supabase client for Server Components and API routes. Reads the
// @supabase/ssr auth cookies the OAuth callback writes, so auth.getUser() works.
export async function createServerSupabaseClient() {
  const { supabaseUrl, supabaseAnonKey } = supabaseEnv();
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component, where cookies are read-only.
        }
      },
    },
  });
}

// The signed-in Supabase user, verified with Supabase Auth (not just decoded).
// Tries the @supabase/ssr session first, then the legacy sb-access-token cookie
// that /api/auth/callback also sets. Callers only rely on `session.user.id`.
export async function getSession() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase.auth.getUser();
    if (data.user) return { user: data.user };

    const accessToken = (await cookies()).get('sb-access-token')?.value;
    if (accessToken) {
      const { supabaseUrl, supabaseAnonKey } = supabaseEnv();
      const legacy = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
      const { data: legacyData } = await legacy.auth.getUser(accessToken);
      if (legacyData.user) return { user: legacyData.user };
    }
  } catch (error) {
    console.error('[Auth] Session error:', error);
  }
  return null;
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

// ===== Phase 1: workspace-aware auth helpers =====

export async function getCurrentUser() {
  const session = await getSession();
  if (!session?.user?.id) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { supabaseId: session.user.id },
      include: {
        workspaceMemberships: {
          include: {
            workspace: true,
          },
        },
        ownedWorkspaces: true,
        platformConnections: {
          where: { status: 'active' },
        },
      },
    });

    return user;
  } catch (error) {
    console.error('[Auth] getCurrentUser error:', error);
    return null;
  }
}

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

export async function getCurrentWorkspace(user: CurrentUser, workspaceId?: string) {
  if (workspaceId) {
    const membership = user.workspaceMemberships.find((m) => m.workspaceId === workspaceId);
    if (!membership) return null;
    return membership.workspace;
  }

  const personal = user.ownedWorkspaces.find((w) => w.type === 'personal');
  return personal ?? null;
}

export async function getActiveXAccount(workspaceId: string, xUsername: string) {
  try {
    const connection = await prisma.platformConnection.findFirst({
      where: {
        workspaceId,
        platform: 'x',
        platformUsername: { equals: xUsername, mode: 'insensitive' },
        status: 'active',
      },
    });

    return connection;
  } catch (error) {
    console.error('[Auth] getActiveXAccount error:', error);
    return null;
  }
}

export async function ensurePersonalWorkspace(userId: string, displayName?: string) {
  const existing = await prisma.workspace.findFirst({
    where: { ownerUserId: userId, type: 'personal' },
  });

  if (existing) return existing;

  const workspace = await prisma.workspace.create({
    data: {
      name: displayName ? `${displayName}'s Workspace` : 'Personal Workspace',
      type: 'personal',
      ownerUserId: userId,
      plan: 'FREE',
      seatCount: 1,
      members: {
        create: {
          userId,
          role: 'owner',
        },
      },
    },
  });

  return workspace;
}
