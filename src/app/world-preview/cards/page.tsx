'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import BrandCardView from '@/components/studio/BrandCardView';
import { BRAND_CARDS, deckFor } from '@/lib/brand-cards';
import { CARD_FONTS } from '@/components/studio/brandCardFonts';

// Review page for the Taste Profile brand cards (Foundation step):
//   /world-preview/cards                 the whole deck
//   /world-preview/cards?archetype=RELAY the ~15-card deck that archetype would get, in order
// Tap a card to try keep/skip. For review only.

const MONO = "'VCR OSD Mono', 'JetBrains Mono', monospace";

function Deck() {
  const archetype = useSearchParams().get('archetype');
  const cards = archetype ? deckFor(archetype) : BRAND_CARDS;
  const [kept, setKept] = useState<Record<string, boolean>>({});

  return (
    <main className="min-h-screen px-5 py-8 md:px-10" style={{ background: '#E7E7E4', color: '#0E0E0E' }}>
      <div className="mx-auto max-w-[1320px]">
        <div className="text-[11px] uppercase tracking-[0.14em]" style={{ fontFamily: MONO, color: '#6B6B6B' }}>
          BrandOS / Taste Profile / Brand cards {archetype ? `· deck for ${archetype.toUpperCase()}` : `· all ${cards.length}`}
        </div>
        <h1 className="mt-3 text-[40px] font-extrabold leading-none tracking-[-0.04em] md:text-[64px]">Keep what feels like you.</h1>
        <p className="mt-3 max-w-[560px] text-[15px] text-[#6B6B6B]">
          Each card is a tiny brand: palette, typefaces, headline, layout and tone. Kept cards become your palette, type
          pairing and mood. Tap a card to cycle keep / skip.
        </p>
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {cards.map((c) => {
            const state = kept[c.id];
            return (
              <button
                key={c.id}
                type="button"
                onClick={() =>
                  setKept((k) => ({ ...k, [c.id]: state === undefined ? true : state ? false : (undefined as unknown as boolean) }))
                }
                className="text-left"
                style={{ outline: state === true ? '3px solid #0047FF' : 'none', opacity: state === false ? 0.35 : 1 }}
              >
                <BrandCardView card={c} />
                <div className="mt-2 flex justify-between gap-3 text-[11px] uppercase tracking-[0.1em]" style={{ fontFamily: MONO, color: '#6B6B6B' }}>
                  <span>{c.tone}</span>
                  <span>
                    {CARD_FONTS[c.display].label}
                    {c.body !== c.display ? ` + ${CARD_FONTS[c.body].label}` : ''}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </main>
  );
}

export default function CardsPreviewPage() {
  return (
    <Suspense>
      <Deck />
    </Suspense>
  );
}
