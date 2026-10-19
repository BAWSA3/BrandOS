import { createClient } from '@supabase/supabase-js';
import prisma from '@/lib/db';
import type { McpAccount } from '@/lib/mcp/usage';

/**
 * MCP sign-in: "Sign in with BrandOS". Supabase Auth is the OAuth 2.1
 * authorization server (dynamic client registration + PKCE; consent page at
 * /oauth/consent), so Claude / ChatGPT / Cursor get a Supabase access token for
 * the user. Here we verify that token and resolve the BrandOS account.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';

/** The authorization server's issuer (what clients discover from /.well-known). */
export const AUTH_ISSUER = `${SUPABASE_URL}/auth/v1`;

export interface McpAuthExtra extends Record<string, unknown> {
  /** null: signed in, but no BrandOS account behind it yet */
  account: McpAccount | null;
}

export interface McpAuthInfo {
  token: string;
  clientId: string;
  scopes: string[];
  expiresAt?: number;
  extra: McpAuthExtra;
}

const verifier = () =>
  createClient(SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '', {
    auth: { persistSession: false, autoRefreshToken: false },
  });

function claims(token: string): { exp?: number; client_id?: string } {
  try {
    const part = token.split('.')[1];
    return JSON.parse(Buffer.from(part, 'base64url').toString('utf8'));
  } catch {
    return {};
  }
}

/** undefined -> 401 + OAuth challenge (the client starts sign-in). */
export async function verifyMcpToken(
  _req: Request,
  bearer?: string
): Promise<McpAuthInfo | undefined> {
  if (!bearer || bearer.length > 4096) return undefined;
  // Supabase checks signature, expiry and that the session is still live
  const { data, error } = await verifier().auth.getUser(bearer);
  if (error || !data.user) return undefined;
  const user = await prisma.user
    .findUnique({
      where: { supabaseId: data.user.id },
      select: {
        id: true,
        createdAt: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        currentPeriodEnd: true,
        role: true,
      },
    })
    .catch(() => null);
  const c = claims(bearer);
  return {
    token: bearer,
    clientId: c.client_id ?? 'unknown',
    scopes: [],
    expiresAt: c.exp,
    extra: {
      account: user
        ? {
            id: user.id,
            createdAt: user.createdAt,
            subscriptionTier: String(user.subscriptionTier),
            subscriptionStatus: String(user.subscriptionStatus),
            currentPeriodEnd: user.currentPeriodEnd,
            role: String(user.role),
          }
        : null,
    },
  };
}
