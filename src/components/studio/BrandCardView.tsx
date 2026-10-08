'use client';

import type { BrandCard } from '@/lib/brand-cards';
import { CARD_FONTS } from '@/components/studio/brandCardFonts';

// One brand card: a tiny brand sample (palette, type pairing, headline, layout,
// tone) at 4:5. Sizes use container units so it scales with its slot.

export default function BrandCardView({ card }: { card: BrandCard }) {
  const [bg, ink, accent, support = accent] = card.palette;
  const display = CARD_FONTS[card.display].family;
  const body = CARD_FONTS[card.body].family;
  const isSerifDisplay = ['serif', 'didone', 'instrument'].includes(card.display);
  // Poster headlines are huge: shrink so the longest word still fits the card width.
  const longestWord = Math.max(...card.headline.split(/\s+/).map((w) => w.length));
  const posterSize = Math.min(17, 86 / (longestWord * (card.display === "syne" ? 0.9 : 0.7)));

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ aspectRatio: '4 / 5', background: bg, color: ink, containerType: 'inline-size' }}
    >
      {card.layout === 'terminal' && (
        <div className="absolute inset-0 flex flex-col p-[7cqw]" style={{ fontFamily: body }}>
          <div style={{ fontSize: '3.6cqw', color: accent }}>$ ./ship --prod</div>
          <div className="mt-[2cqw]" style={{ fontSize: '3.6cqw', opacity: 0.6 }}>✓ build passed · 2.1s</div>
          <div className="mt-auto font-bold leading-[1.05]" style={{ fontFamily: display, fontSize: '11cqw' }}>
            {card.headline}
          </div>
          <div className="mt-[3cqw]" style={{ fontSize: '3.6cqw', color: accent }}>{card.sub}</div>
        </div>
      )}
      {card.layout === 'poster' && (
        <div className="absolute inset-0 flex flex-col p-[6cqw]">
          <div className="h-[3cqw] w-[18cqw]" style={{ background: accent }} />
          <div
            className="mt-auto leading-[0.88]"
            style={{ fontFamily: display, fontSize: `${posterSize}cqw`, fontWeight: 800, letterSpacing: '-0.03em' }}
          >
            {card.headline}
          </div>
          <div className="mt-[4cqw] flex items-center justify-between" style={{ fontFamily: body, fontSize: '4cqw' }}>
            <span>{card.sub}</span>
            <span className="h-[5cqw] w-[5cqw] rounded-full" style={{ background: accent }} />
          </div>
        </div>
      )}
      {card.layout === 'editorial' && (
        <div className="absolute inset-0 flex flex-col p-[7cqw]">
          <div className="flex justify-between border-b pb-[2cqw]" style={{ borderColor: support, fontFamily: body, fontSize: '3.2cqw' }}>
            <span style={{ color: accent }}>{card.tone}</span>
            <span style={{ opacity: 0.6 }}>No. 07</span>
          </div>
          <div
            className="mt-[8cqw] leading-[1.02]"
            style={{ fontFamily: display, fontSize: isSerifDisplay ? '13cqw' : '11cqw', fontStyle: card.display === 'instrument' ? 'italic' : undefined }}
          >
            {card.headline}
          </div>
          <div className="mt-auto" style={{ fontFamily: body, fontSize: '3.8cqw', opacity: 0.7 }}>{card.sub}</div>
        </div>
      )}
      {card.layout === 'grid' && (
        <div className="absolute inset-0 grid grid-rows-[1fr_auto] p-[6cqw]">
          <div className="grid grid-cols-3 gap-[2cqw]">
            {[accent, support, ink, support, accent, support].map((c, i) => (
              <div key={i} style={{ background: c, opacity: i === 2 ? 0.9 : 1 }} />
            ))}
          </div>
          <div className="pt-[5cqw]">
            <div className="font-bold leading-[1]" style={{ fontFamily: display, fontSize: '10cqw', letterSpacing: '-0.02em' }}>
              {card.headline}
            </div>
            <div className="mt-[2.5cqw]" style={{ fontFamily: body, fontSize: '3.6cqw', opacity: 0.7 }}>{card.sub}</div>
          </div>
        </div>
      )}
      {card.layout === 'minimal' && (
        <div className="absolute inset-0 flex flex-col items-start justify-center p-[9cqw]">
          <div style={{ fontFamily: body, fontSize: '3.4cqw', color: accent }}>{card.sub}</div>
          <div className="mt-[3cqw] leading-[1.05]" style={{ fontFamily: display, fontSize: '10cqw', fontWeight: 500, letterSpacing: '-0.02em' }}>
            {card.headline}
          </div>
          <div className="mt-[6cqw] h-[0.6cqw] w-[14cqw]" style={{ background: ink }} />
        </div>
      )}
    </div>
  );
}
