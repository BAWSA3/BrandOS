'use client';

import { useEffect, useState } from 'react';
import ScoreCardShare from '@/components/dashboard/ScoreCardShare';
import { getArchetypeInfo } from '@/lib/archetype-descriptions';
import type { ScoreCardData } from '@/lib/score-card';

const MONO = "'VCR OSD Mono', var(--font-jetbrains), monospace";
const APP = 'https://mybrandos.app';

/**
 * The free scan's shareable asset: the dashboard's square score card (Klein by
 * default, 4 skins), sized to the screen, with Copy image, Post to X (links
 * their public /@handle page, which starts the "your brand was looked up"
 * loop) and a link to that page.
 */
export default function RevealScoreCard({
  handle,
  avatarUrl,
  score,
  archetype,
  phases,
}: {
  handle: string;
  avatarUrl: string | null;
  score: number;
  archetype: string;
  phases: { define: number; check: number; generate: number; scale: number };
}) {
  // card width: the screen minus gutters, at most 460px
  const [width, setWidth] = useState(360);
  useEffect(() => {
    const fit = () => setWidth(Math.max(280, Math.min(460, window.innerWidth - 48)));
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  const info = getArchetypeInfo(archetype);
  const d: ScoreCardData = {
    handle,
    avatarUrl,
    score,
    delta: null,
    history: [],
    phases: [
      { key: 'Define', value: phases.define },
      { key: 'Check', value: phases.check },
      { key: 'Generate', value: phases.generate },
      { key: 'Scale', value: phases.scale },
    ],
    archetype: archetype ? { name: info?.name ?? archetype, tagline: info?.tagline } : null,
  };

  const page = `${APP}/@${handle}`;
  const post = () => {
    const text = `my brand score: ${score}/100${archetype ? ` · ${info?.name ?? archetype}` : ''}\n\nhere's how brands see me 👇\n${page}\n\nscan yours → ${APP}`;
    window.open(
      `https://x.com/intent/post?text=${encodeURIComponent(text)}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  return (
    <div className="capture-hide flex w-full flex-col items-center">
      <ScoreCardShare
        d={d}
        layout="stack"
        roll
        preview={width}
        actions={
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={post}
              className="border border-[#0E0E0E] px-4 py-2.5 text-[11px] uppercase tracking-[0.14em] text-[#0E0E0E] hover:bg-white"
              style={{ fontFamily: MONO }}
            >
              Post to X ↗
            </button>
            <a
              href={`/@${handle}`}
              className="border border-[#0E0E0E] px-4 py-2.5 text-[11px] uppercase tracking-[0.14em] text-[#0E0E0E] hover:bg-white"
              style={{ fontFamily: MONO }}
            >
              Your public page →
            </a>
          </div>
        }
      />
    </div>
  );
}
