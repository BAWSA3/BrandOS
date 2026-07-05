// ============================================================================
// supabase-admin — service-role Supabase client
//
// IMPORTANT: This client BYPASSES Row Level Security. Use only from trusted
// server-side code that performs its own authorization checks.
//
// Allowed import paths (enforced by ESLint no-restricted-imports rule in
// eslint.config.mjs):
//
//   - src/app/api/cron/**          — scheduled jobs (no user session)
//   - src/app/api/stripe/webhook/** — Stripe webhook handlers (no user session)
//   - src/app/api/admin/**          — admin-only routes (role-gated separately)
//
// Banned everywhere else, especially:
//   - React components (server or client)
//   - User-facing API handlers without explicit role checks
//   - Anything that reads request data and forwards it to a query
//
// If you need to bypass RLS from a new route, add that route's path to the
// ESLint rule allowlist AND include a comment at the top of your file
// explaining why service-role access is required and what authorization
// the route enforces in its place.
//
// Reference: docs/PHASE-1-SCHEMA.md (Impl-4)
// ============================================================================

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let cachedClient: SupabaseClient | null = null;

/**
 * Returns a Supabase client authenticated with the service role key.
 * Bypasses RLS. Use only from cron, webhook, and admin routes.
 *
 * The client is cached at module level — a fresh instance per cold start,
 * reused across requests within the same Function instance (Fluid Compute).
 */
export function createAdminClient(): SupabaseClient {
  if (cachedClient) return cachedClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SECRET_KEY;

  if (!url) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set');
  }
  if (!serviceRoleKey) {
    throw new Error(
      'SUPABASE_SECRET_KEY is not set. This is required for admin/cron/webhook contexts.',
    );
  }

  cachedClient = createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });

  return cachedClient;
}
