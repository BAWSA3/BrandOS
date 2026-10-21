import prisma from '@/lib/db';

// Email list helpers. Server-only, via Prisma (service connection). They used
// the Supabase anon key, which needed an "anyone can read EmailSignup" RLS
// policy to work, so the whole list was readable with the public key.
// Migration 031 removes anon access; everything here goes through the server.

export interface EmailSignup {
  id: string;
  email: string;
  source: string;
  createdAt: string;
  xUsername?: string;
}

const SELECT = { id: true, email: true, source: true, createdAt: true, xUsername: true } as const;

type Row = { id: string; email: string; source: string; createdAt: Date; xUsername: string | null };
const toSignup = (r: Row): EmailSignup => ({
  id: r.id,
  email: r.email,
  source: r.source,
  createdAt: r.createdAt.toISOString(),
  ...(r.xUsername ? { xUsername: r.xUsername } : {}),
});

const ACTIVE = { OR: [{ unsubscribed: null }, { unsubscribed: false }] };

export async function addEmailSignup(
  email: string,
  source: string = 'landing',
  xUsername?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const normalizedEmail = email.toLowerCase().trim();
    const existing = await prisma.emailSignup.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, xUsername: true },
    });

    if (existing) {
      // Fill in the X handle if we have it now and didn't before
      if (xUsername && !existing.xUsername) {
        await prisma.emailSignup.update({
          where: { id: existing.id },
          data: { xUsername: xUsername.toLowerCase() },
        });
      }
      return { success: false, error: 'Email already registered' };
    }

    await prisma.emailSignup.create({
      data: {
        email: normalizedEmail,
        source,
        ...(xUsername ? { xUsername: xUsername.toLowerCase() } : {}),
      },
    });
    return { success: true };
  } catch (error) {
    // a concurrent duplicate signup is still "already registered"
    if ((error as { code?: string }).code === 'P2002') {
      return { success: false, error: 'Email already registered' };
    }
    console.error('[Newsletter] Error adding signup:', error);
    return { success: false, error: 'Failed to save signup' };
  }
}

export async function getSignupCount(): Promise<number> {
  try {
    return await prisma.emailSignup.count();
  } catch (error) {
    console.error('[Newsletter] Error getting signup count:', error);
    return 0;
  }
}

export async function getAllSignups(): Promise<EmailSignup[]> {
  try {
    const rows = await prisma.emailSignup.findMany({
      select: SELECT,
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toSignup);
  } catch (error) {
    console.error('[Newsletter] Error getting all signups:', error);
    return [];
  }
}

export async function getSignupsBySource(source: string): Promise<EmailSignup[]> {
  try {
    const rows = await prisma.emailSignup.findMany({
      where: { source },
      select: SELECT,
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toSignup);
  } catch (error) {
    console.error('[Newsletter] Error getting signups by source:', error);
    return [];
  }
}

/**
 * Get all active (non-unsubscribed) subscribers
 */
export async function getActiveSubscribers(): Promise<EmailSignup[]> {
  try {
    const rows = await prisma.emailSignup.findMany({
      where: ACTIVE,
      select: SELECT,
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toSignup);
  } catch (error) {
    console.error('[Newsletter] Error getting active subscribers:', error);
    return [];
  }
}

/**
 * Get active subscriber count
 */
export async function getActiveSubscriberCount(): Promise<number> {
  try {
    return await prisma.emailSignup.count({ where: ACTIVE });
  } catch {
    return 0;
  }
}

/**
 * Unsubscribe an address. Returns whether a matching signup existed.
 * (Was an anon-key UPDATE with no UPDATE policy: it changed 0 rows, so
 * unsubscribe links silently did nothing.)
 */
export async function unsubscribeEmail(email: string): Promise<boolean> {
  const normalized = email.toLowerCase().trim();
  const { count } = await prisma.emailSignup.updateMany({
    where: { email: normalized },
    data: { unsubscribed: true, unsubscribedAt: new Date() },
  });
  if (count > 0) return true;
  // Not on the list (e.g. an account email unsubscribing from the weekly
  // lookup digest): remember the opt-out so no BrandOS email goes to it.
  await prisma.emailSignup
    .create({
      data: {
        email: normalized,
        source: 'unsubscribe',
        unsubscribed: true,
        unsubscribedAt: new Date(),
      },
    })
    .catch(() => {});
  return true;
}
