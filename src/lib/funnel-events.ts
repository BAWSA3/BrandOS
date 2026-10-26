/**
 * Server-side PostHog capture for the gated funnel:
 *   signup_completed → x_connected → scan_completed → checkout_started → purchase_completed
 * and the launch funnel (docs/LAUNCH-PLAYBOOK.md):
 *   signup_completed → index_join_started → index_joined → checkout_started → trial_started (card added)
 *
 * Why server-side: every funnel step's source of truth is a DB write in an API
 * route (see MINIMUM-LAUNCH-BAR.md Week 4). Client-side capture would undercount
 * (ad blockers, redirects mid-OAuth) and can't see webhook-driven conversions.
 *
 * Distinct ID convention: the Supabase user id — the client provider identifies
 * with the same id (PostHogProvider), so server + client events join into one
 * person. Anonymous checkouts (audit flow, no account) use `anon:<handle>`.
 */

import { PostHog } from 'posthog-node';

let client: PostHog | null = null;

function getClient(): PostHog | null {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return null;
  if (!client) {
    client = new PostHog(key, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
      // Serverless: no long-lived process to flush a batch later
      flushAt: 1,
      flushInterval: 0,
    });
  }
  return client;
}

export type FunnelEvent =
  | 'signup_completed'
  | 'x_connected'
  | 'scan_completed'
  | 'checkout_started'
  | 'purchase_completed'
  | 'trial_started'
  | 'trial_converted'
  | 'subscription_canceled'
  // Creator Index (migration 044). checkout_started = a Pro/founding checkout
  // began; trial_started = a card was added (founding cards trial until Dec 3).
  | 'index_join_started'
  | 'index_joined'
  | 'index_left';

/**
 * Fire a funnel event. Awaits delivery (captureImmediate) so the event isn't
 * lost when the lambda freezes after the response — but never throws and never
 * blocks the product path on analytics failure.
 */
export async function captureFunnelEvent(
  distinctId: string,
  event: FunnelEvent,
  properties: Record<string, string | number | boolean | null | undefined> = {}
): Promise<void> {
  const ph = getClient();
  if (!ph) return;
  try {
    await ph.captureImmediate({ distinctId, event, properties });
  } catch (error) {
    console.error(`[funnel-events] ${event} capture failed:`, error);
  }
}
