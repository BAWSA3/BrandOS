import type { MetadataRoute } from 'next';

// Crawl policy. Marketing pages and the tier-list index stay indexable; the
// per-creator pages don't. /tier-list links to every creator's page, and each
// of those renders from the DB — crawlers fanning out across them was a big
// share of the Supabase egress that got the project restricted (2026-09).
// Share links keep working for people; this only steers crawlers.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
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
        '/poll',
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
  };
}
