import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { headers } from 'next/headers';
import { getReservationByHandle } from '@/lib/reservations';
import { getStationClaim } from '@/lib/stations';
import ClaimStation from '@/components/ClaimStation';
import StationBoard from '@/components/StationBoard';
import { getArchetypeInfo } from '@/lib/archetype-descriptions';
import ReservedSignCard, { formatStationNumber } from '@/components/ReservedSignCard';

// Public page for a reserved station: the flex link people share on X. The
// share image (opengraph-image.tsx) is what the X preview shows; tapping
// through lands here, where the CTA is "reserve your own". A reservation is
// unverified (typed email + handle); once the owner proves the X account via
// Sign in with X the station shows as claimed (Phase 0 of the board/reviews spec).
export const revalidate = 300;

type Props = { params: Promise<{ handle: string }> };

const MONO = "'VCR OSD Mono', 'JetBrains Mono', monospace";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const r = await getReservationByHandle(handle);
  if (!r) {
    return { title: 'Reserve your brand station · BrandOS', robots: { index: false } };
  }
  const name = getArchetypeInfo(r.archetype ?? '')?.name;
  const title = `@${r.handle} reserved Station #${formatStationNumber(r.number)} · BrandOS`;
  const description = `${name ? `${name} station. ` : ''}BrandOS Studio is opening soon. Reserve your own brand station.`;
  return {
    title,
    description,
    openGraph: { title, description, type: 'website' },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function StationPage({ params }: Props) {
  const { handle } = await params;
  const [r, claim] = await Promise.all([getReservationByHandle(handle), getStationClaim(handle)]);
  const h = await headers();
  const origin = `${h.get('x-forwarded-proto') ?? 'https'}://${h.get('host') ?? 'mybrandos.app'}`;

  return (
    <main className="min-h-screen bg-[#F2F0EF] px-4 py-10 flex flex-col items-center">
      {r ? (
        <>
          <div
            className="mb-4 text-center text-[11px] tracking-[0.15em] text-black/50 uppercase"
            style={{ fontFamily: MONO }}
          >
            {`// @${r.handle}'s plot is reserved`}
          </div>
          <ReservedSignCard
            handle={r.handle}
            number={r.number}
            archetype={r.archetype}
            shareUrl={`${origin}/station/${r.handle}`}
            controls="none"
          />
          {claim ? (
            <div
              className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-[4px] bg-[#0A84FF] text-white text-[11px] tracking-[0.15em] uppercase"
              style={{ fontFamily: MONO }}
            >
              ✓ Claimed by @{r.handle}
            </div>
          ) : (
            <Suspense>
              <ClaimStation handle={r.handle} />
            </Suspense>
          )}
          <Suspense>
            <StationBoard handle={r.handle} />
          </Suspense>
        </>
      ) : (
        <div
          className="max-w-[480px] text-center text-[13px] tracking-wider text-[#1D1D1F]"
          style={{ fontFamily: MONO }}
        >
          No station reserved for @{handle.replace(/^@/, '')} yet.
        </div>
      )}
      <Link
        href="/"
        className="mt-6 w-full max-w-[480px] text-center px-4 py-3.5 rounded-[6px] bg-[#0A84FF] hover:bg-[#0070E0] text-white text-[12px] tracking-[0.15em] uppercase transition-colors"
        style={{ fontFamily: MONO }}
      >
        Reserve your brand station →
      </Link>
    </main>
  );
}
