import type { Metadata } from 'next';
import IndexBook from '@/app/creators/IndexBook';
import IndexTile from '@/components/growth/IndexTile';
import JoinForm from '@/app/creators/join/JoinForm';
import { parseFilters } from '@/lib/index-rules';
import type { IndexCard } from '@/lib/creator-index';

// Layout preview for the Creator Index (/index) and its dashboard tile, with
// sample members (not real accounts). /world-preview/* is hidden on
// mybrandos.app (middleware). ?tile=1 shows the dashboard tile states;
// ?joined=1 shows the entry-confirmed screen (the Press).

export const metadata: Metadata = { title: 'Creator Index preview · BrandOS' };

const card = (
  number: number,
  handle: string,
  score: number,
  archetype: string,
  niches: string[],
  blurb: string,
  featured = false,
  avatar: string | null = null,
  joinedAt = '2026-10-23T12:00:00Z'
): IndexCard => ({
  handle,
  number,
  name: null,
  avatar,
  score,
  archetype,
  niches,
  blurb,
  featured,
  joinedAt,
});

const FEATURED = [
  card(
    1,
    'sample_founder',
    81,
    'BUILD.EXE',
    ['Founder', 'Infra & dev'],
    'Shipping a wallet in public. Weekly build logs, no hype.',
    true,
    // a solid-colour picture (used to render as a flat grey square)
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect width='40' height='40' fill='%230047FF'/%3E%3C/svg%3E"
  ),
  card(
    7,
    'sample_research',
    77,
    'SOURCE',
    ['Research', 'DeFi'],
    'Long-form breakdowns of DeFi protocols before they trend.',
    true
  ),
];
const REST = [
  card(
    42,
    'sample_trader',
    68,
    'FORESIGHT',
    ['Trading'],
    'Daily market reads for 20k traders. Charts, not calls.',
    false,
    // a stale X URL: falls back to the initial
    'https://pbs.twimg.com/profile_images/0/brandos-preview-missing_normal.jpg'
  ),
  card(
    41,
    'sample_artist',
    72,
    'NULL',
    ['NFTs & art', 'Culture & memes'],
    'Generative art and the people behind it.'
  ),
  card(
    40,
    'sample_teacher',
    64,
    'SIGNAL_SAGE', // a legacy name: still reads as Class 01 SOURCE
    ['Education', 'AI'],
    'Explaining crypto + AI to people who just got here.'
  ),
  card(
    39,
    'sample_community',
    59,
    'RELAY',
    ['Community'],
    'I run the Tuesday spaces 4k builders show up for.'
  ),
  card(
    38,
    'sample_memes',
    55,
    'FREQ',
    ['Memecoins', 'Culture & memes'],
    'Memes first, alpha second.'
  ),
  card(
    37,
    'sample_gamer',
    61,
    'ENTROPY',
    ['Gaming'],
    'Onchain games, honestly reviewed.',
    false,
    null,
    '2026-10-22T09:00:00Z'
  ),
];

export default async function IndexPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ tile?: string; joined?: string; field?: string }>;
}) {
  const sp = await searchParams;
  // ?field=1: the Direction 03 versions (on the field)
  const field = sp.field === '1';
  if (sp.joined === '1') {
    return (
      <JoinForm
        field={field}
        handle="sample_founder"
        read={{ score: 81, archetype: 'BUILD.EXE', fresh: true }}
        entry={null}
        preview={{ number: 1, joinedAt: '2026-10-23T12:00:00Z', archetype: 'BUILD.EXE' }}
      />
    );
  }
  if (sp.tile === '1') {
    return (
      <main className="min-h-screen space-y-6 p-6 md:p-10" style={{ background: '#F2EFE8' }}>
        <div className="grid gap-4 md:grid-cols-12">
          <IndexTile data={{ member: null, views: null, standsOut: false }} />
          <IndexTile
            data={{
              member: { number: 42, listed: true, handle: 'sample_trader' },
              views: { people: 3, teams: null },
              standsOut: false,
            }}
          />
          <IndexTile
            data={{
              member: { number: 7, listed: true, handle: 'sample_research' },
              views: {
                people: 12,
                teams: [
                  { name: 'Sample Labs', views: 4 },
                  { name: 'Sample Agency', views: 2 },
                ],
              },
              standsOut: true,
            }}
          />
        </div>
      </main>
    );
  }
  return (
    <IndexBook
      field={field}
      page={{
        members: 42,
        matching: 42,
        featured: FEATURED,
        cards: REST,
        page: 1,
        pages: 2,
        archetypes: ['BUILD.EXE', 'FORESIGHT', 'SOURCE', 'NULL', 'RELAY', 'FREQ', 'ENTROPY'],
      }}
      filters={parseFilters({})}
      pinned={null}
      viewer={
        field
          ? { signedIn: true, member: { number: 7, listed: true, handle: 'sample_research' } }
          : { signedIn: true, member: null }
      }
      aggregates={{ reserved: 1004, scanned: '4,700+' }}
      preview
    />
  );
}
