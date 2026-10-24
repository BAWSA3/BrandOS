import type { MetadataRoute } from 'next';

// Crawl policy. Marketing pages and the tier-list index stay indexable; the
// per-creator pages don't. /tier-list links to every creator's page, and each
// of those renders from the DB — crawlers fanning out across them was a big
// share of the Supabase egress that got the project restricted (2026-09).
// Share links keep working for people; this only steers crawlers.
//
// Link-preview bots are different: they fetch one page when someone shares
// it, never fan out, and they obey robots.txt (Twitterbot does), so blocking
// them means /@handle, /scan and /card links unfurl with no card. They get the
// share pages and the OG images; everything else stays off-limits to them too.
const PREVIEW_BOTS = [
  'Twitterbot',
  'facebookexternalhit',
  'LinkedInBot',
  'Slackbot',
  'Slackbot-LinkExpanding',
  'Discordbot',
  'TelegramBot',
  'WhatsApp',
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: PREVIEW_BOTS,
        allow: ['/', '/api/og'],
        disallow: [
          '/api/',
          '/shared/',
          '/audit/',
          '/dashboard',
          '/admin',
          '/migrate-account',
          '/extension-auth',
          '/unsubscribe',
          '/test-',
          '/world-preview',
        ],
      },
      {
        userAgent: '*',
        // OG images only render when a page that links them is fetched
        allow: ['/', '/api/og'],
        disallow: [
          // APIs — also stops rendering crawlers from calling them as subresources
          '/api/',
          // Per-creator pages (one per scanned username)
          '/tier-list/',
          '/score/',
          '/scan/',
          '/card/',
          '/archetype/',
          // Private or tokenized
          '/shared/',
          '/audit/',
          '/dashboard',
          '/admin',
          '/migrate-account',
          '/extension-auth',
          '/unsubscribe',
          // Internal previews
          '/test-',
          '/world-preview',
        ],
      },
    ],
  };
}
