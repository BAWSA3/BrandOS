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
    // Voice Fingerprint extraction — PRO AI-cost surface (step 5)
    { path: '/api/voice-fingerprint/extract', method: 'POST' },
    // Content repurposing — PRO AI-cost surface, up to 6 LLM calls (step 6)
    { path: '/api/repurpose', method: 'POST' },
    // Import Hub — cost surfaces: LLM extraction (pdf/images), server-side
    // fetches (url), paid SocialData calls (social) (step 7)
    { path: '/api/import/analyze-pdf', method: 'POST' },
    { path: '/api/import/analyze-images', method: 'POST' },
    { path: '/api/import/analyze-url', method: 'POST' },
    { path: '/api/import/analyze-social', method: 'POST' },
    // Full breakdown by email — email capture after the scan (spam surface)
    { path: '/api/breakdown', method: 'POST' },
    // Dashboard rescan — signed-in AI cost surface
    { path: '/api/dashboard/rescan', method: 'POST' },
    // Dashboard post breakdowns — signed-in AI cost surface
    { path: '/api/dashboard/post-scores', method: 'POST' },
    { path: '/api/dashboard/brainstorm', method: 'POST' },
    // Early-access signup form — email capture (spam surface)
    { path: '/api/early-access', method: 'POST' },
    // public brand page (/@handle) + its compare funnel: scans / model calls
    { path: '/api/public-brand', method: 'POST' },
    { path: '/api/brand-lookup', method: 'POST' },
    { path: '/api/brand-compare', method: 'POST' },
    // Checkout — payment abuse surface
    { path: '/api/stripe/checkout', method: 'POST' },
    // Growth dashboard: adding/refreshing tracked accounts reads paid X data
    { path: '/api/accounts', method: 'POST' },
    { path: '/api/accounts/*/sync', method: 'POST' },
    // AI ideas from a brand's analytics (model cost)
    { path: '/api/ideas/generate', method: 'POST' },
    // "How many bots follow you?" — public, paid X data (~20 requests per check)
    { path: '/api/bot-check', method: 'POST' },
  ],
});
