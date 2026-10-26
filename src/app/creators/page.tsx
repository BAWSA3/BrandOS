import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { formatNumber, indexEnabled, indexOpenFor, parseFilters } from '@/lib/index-rules';
import { cardFor, getEntry, indexAggregates, listIndex, ownReservation } from '@/lib/creator-index';
import prisma from '@/lib/db';
import IndexBook from './IndexBook';
import { fieldSystemOn } from '@/lib/field/switch-server';

// The BrandOS Creator Index, served at mybrandos.app/index (middleware
// rewrite; the pages live in /creators, /index is the public address).
// A public book of creators who chose to be listed, each with a real BrandOS
// brand read. Featured (paid) members first, then newest. Closed until
// INDEX_ENABLED is "true"; admins can preview it. ?m=handle is a member's
// share link: it unfurls as their Index card and pins them to the top.
export const dynamic = 'force-dynamic';

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const APP = process.env.NEXT_PUBLIC_APP_URL || 'https://mybrandos.app';
const member = (sp: Record<string, string | string[] | undefined>) => {
  const m = typeof sp.m === 'string' ? sp.m.replace(/^@/, '') : '';
  return /^[A-Za-z0-9_]{1,15}$/.test(m) ? m : null;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  if (!indexEnabled()) return { title: 'BrandOS', robots: { index: false, follow: false } };
  const m = member(await searchParams);
  const entry = m
    ? await prisma.indexEntry
        .findUnique({ where: { handle: m.toLowerCase() }, select: { number: true, listed: true } })
        .catch(() => null)
    : null;
  const title =
    m && entry?.listed
      ? `@${m} is ${formatNumber(entry.number)} in the BrandOS Creator Index`
      : 'The BrandOS Creator Index';
  const description =
    'Creators with a real brand read behind them. Brands browse free. Creators: join and get your number.';
  const image = `${APP}/api/og/index${m && entry?.listed ? `?h=${m.toLowerCase()}` : ''}`;
  const url = `${APP}/index${m ? `?m=${m}` : ''}`;
  return {
    title,
    description,
    openGraph: { title, description, images: [image], url },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
  };
}

export default async function CreatorIndexPage({ searchParams }: Props) {
  const user = await getCurrentUser().catch(() => null);
  if (!indexOpenFor(user)) notFound();
  const sp = await searchParams;
  const filters = parseFilters(sp);
  const m = member(sp);
  const [page, entry, pinned, aggregates] = await Promise.all([
    listIndex(filters),
    user ? getEntry(user.id) : null,
    m ? cardFor(m) : null,
    indexAggregates(),
  ]);
  const reserved = user && !entry ? await ownReservation(user) : null;
  const field = await fieldSystemOn(sp, user);
  return (
    <IndexBook
      page={page}
      filters={filters}
      pinned={pinned}
      viewer={
        user
          ? {
              signedIn: true,
              member: entry
                ? { number: entry.number, listed: entry.listed, handle: entry.displayHandle }
                : null,
              reserved,
            }
          : { signedIn: false, member: null }
      }
      aggregates={aggregates}
      preview={!indexEnabled()}
      field={field}
    />
  );
}
