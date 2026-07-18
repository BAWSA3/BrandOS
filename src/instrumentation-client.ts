// Client-side BotID init (Next.js ≥15.3 convention — loaded on every page).
// Declares which routes get bot-classification signals attached to their
// fetches. Server-side enforcement lives in src/lib/botid-guard.ts — the two
// lists must stay in sync or legit traffic gets blocked.
//
// NOTE: Sentry's client init stays in sentry.client.config.ts (its own
// loader) — this file is BotID-only.
import { initBotId } from 'botid/client/core';

initBotId({
  protect: [
    // Scan creation — the AI-cost surface (Launch Bar Week 3)
    { path: '/api/x-brand-score', method: 'POST' },
    { path: '/api/x-brand-score-enhanced', method: 'POST' },
    { path: '/api/audit/run', method: 'POST' },
    // Content Check — dashboard AI-cost surface (consolidation step 4)
    { path: '/api/check', method: 'POST' },
    // Homepage Brand Advisor chat — anonymous AI-cost surface
    { path: '/api/brand-advisor/chat', method: 'POST' },
    // Checkout — payment abuse surface
    { path: '/api/stripe/checkout', method: 'POST' },
  ],
});
