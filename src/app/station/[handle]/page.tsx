import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getReservationByHandle } from '@/lib/reservations';
import { getStationClaim } from '@/lib/stations';
import ClaimStation from '@/components/ClaimStation';
import StationBoard from '@/components/StationBoard';
import { getArchetypeInfo } from '@/lib/archetype-descriptions';
import StationLoop from '@/components/StationLoop';
import StationCta from '@/components/StationCta';
import Wordmark from '@/components/Wordmark';
import { formatStationNumber } from '@/lib/station-number';

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
  const title = `@${r.handle} · Station #${formatStationNumber(r.number)} · BrandOS`;
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

  return (
    <main className="min-h-screen bg-[#F2EFE8] px-4 py-10 flex flex-col items-center">
      <header className="mb-6 flex w-full max-w-[480px] justify-start">
        <Wordmark height={24} />
      </header>
      {r ? (
        <>
          <StationLoop archetype={r.archetype} />
          <section
            className="w-full max-w-[480px] rounded-[8px] border border-black/10 bg-white/60 px-5 py-4"
            style={{ fontFamily: MONO }}
          >
            <div className="flex items-center justify-between">
              <span className="rounded-[3px] bg-[#0047FF] px-2 py-1 text-[11px] uppercase tracking-[0.14em] text-white">
                {claim ? 'Claimed' : 'Reserved'}
              </span>
              <span className="text-[18px] text-[#1D1D1F]">#{formatStationNumber(r.number)}</span>
            </div>
            <div className="mt-3 text-[11px] uppercase tracking-[0.15em] text-black/50">
              {claim ? 'Home of' : 'Future home of'} @{r.handle}
            </div>
            {getArchetypeInfo(r.archetype ?? '')?.name && (
              <div className="mt-3 text-[20px] text-[#0047FF]">
                {getArchetypeInfo(r.archetype ?? '')?.name}
              </div>
            )}
            <div className="mt-1 text-[11px] uppercase tracking-[0.15em] text-black/50">
              Opening soon · mybrandos.app
            </div>
          </section>
          {claim ? (
            <div
              className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-[4px] bg-[#0047FF] text-white text-[11px] tracking-[0.15em] uppercase"
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
      <StationCta handle={r?.handle ?? null} claimed={!!claim} />
    </main>
  );
}
