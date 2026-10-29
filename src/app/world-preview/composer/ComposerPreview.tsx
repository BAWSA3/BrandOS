'use client';

import { useEffect, useMemo, useState } from 'react';
import LiveComposerView from '@/components/live-composer/LiveComposerView';
import {
  demoStateAt,
  filmLength,
  SAMPLE_SCRIPT,
  SAMPLE_TEXT,
  scriptedState,
  settledAt,
  THIN_SCRIPT,
  type DemoScript,
} from '@/components/live-composer/demo';
import type { LiveState } from '@/components/live-composer/types';
import { useDemoComposer } from '@/components/live-composer/useLiveComposer';

const { L1, L2, L3, HONEST } = SAMPLE_TEXT;

// still frames of the sample film (?state=), so each cell of the state matrix renders on its own
function still(state: string): { script: DemoScript; t: number | 'typing'; error?: string } {
  switch (state) {
    case 'empty':
      return { script: SAMPLE_SCRIPT, t: 0 };
    case 'voice':
      return { script: SAMPLE_SCRIPT, t: settledAt(SAMPLE_SCRIPT, 'Excited to announce') };
    case 'typing':
      return { script: SAMPLE_SCRIPT, t: 'typing' };
    case 'hook':
      return { script: SAMPLE_SCRIPT, t: settledAt(SAMPLE_SCRIPT, L1) };
    case 'marked':
      return { script: SAMPLE_SCRIPT, t: settledAt(SAMPLE_SCRIPT, L1 + L2 + HONEST) };
    case 'thin':
      return { script: THIN_SCRIPT, t: settledAt(THIN_SCRIPT, L1 + L2 + L3) };
    case 'error':
      return {
        script: SAMPLE_SCRIPT,
        t: settledAt(SAMPLE_SCRIPT, L1),
        error: 'Live marks paused. Keep writing.',
      };
    default:
      return { script: SAMPLE_SCRIPT, t: settledAt(SAMPLE_SCRIPT, L1 + L2 + L3) };
  }
}

function Still({ state }: { state: string }) {
  const s = useMemo<LiveState>(() => {
    const f = still(state);
    if (f.t === 'typing') {
      // mid-sentence, keys still going
      const t = settledAt(SAMPLE_SCRIPT, L1) + 2600;
      return demoStateAt(SAMPLE_SCRIPT, t);
    }
    return { ...demoStateAt(f.script, f.t), error: f.error ?? null };
  }, [state]);
  return <Frame state={s} caret={state !== 'empty'} smm={state === 'smm'} instant />;
}

// ?state=live: type for real; marks from the sample profile, reads from the script
function Live() {
  const [text, setText] = useState('');
  const [typing, setTyping] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setTyping(false), 1200);
    return () => clearTimeout(t);
  }, [text]);
  const s = scriptedState(SAMPLE_SCRIPT, text, typing);
  return (
    <LiveComposerView
      state={s}
      onChange={(v) => {
        setTyping(true);
        setText(v);
      }}
      placeholder="Try: Excited to announce… or paste the sample draft."
    />
  );
}

const LOOP_MS = filmLength(SAMPLE_SCRIPT);

function Demo() {
  const s = useDemoComposer(SAMPLE_SCRIPT, { loop: true });
  // fade out at the end of each loop and back in, so the restart never cuts
  return (
    <div style={{ animation: `lc-loop ${LOOP_MS}ms linear infinite` }}>
      <style>{`@keyframes lc-loop{0%{opacity:0}1.5%{opacity:1}98%{opacity:1}100%{opacity:0}}@media (prefers-reduced-motion: reduce){[style*="lc-loop"]{animation:none!important}}`}</style>
      <Frame state={s} caret />
    </div>
  );
}

function Frame({
  state,
  caret,
  smm,
  instant,
}: {
  state: LiveState;
  caret?: boolean;
  smm?: boolean;
  instant?: boolean;
}) {
  return (
    <LiveComposerView
      state={state}
      caret={caret}
      instant={instant}
      header={
        <span
          className="text-[11px] uppercase tracking-[0.08em]"
          style={{ fontFamily: "'VCR OSD Mono', var(--font-jetbrains), monospace", color: '#6E6A62' }}
        >
          Writing room / {smm ? '@northwind (client) ▾' : '@bawsaxbt'}
        </span>
      }
      footer={
        <div className="flex items-center justify-between text-[12px]" style={{ color: '#6E6A62' }}>
          <span>{[...state.text].length} / 280</span>
          <span
            className="rounded-full px-4 py-2 text-[14px]"
            style={{
              background: '#141414',
              color: '#F2EFE8',
              opacity: state.text.trim() ? 1 : 0.4,
            }}
          >
            Open in X →
          </span>
        </div>
      }
    />
  );
}

export default function ComposerPreview({
  demo,
  state,
  chrome,
}: {
  demo: boolean;
  state: string;
  chrome: boolean;
}) {
  return (
    <main
      className="min-h-screen px-4 pb-24 pt-8 md:px-10 md:pt-14"
      style={{ background: '#F2EFE8', color: '#141414' }}
    >
      <div className="mx-auto max-w-[1080px]">
        {chrome && (
          <nav
            className="mb-8 flex flex-wrap items-center gap-2 text-[12px]"
            style={{ fontFamily: 'ui-monospace, monospace' }}
          >
            <a href={demo ? '?state=final' : '?demo=1'} className="underline">
              {demo ? 'stills' : 'play demo'}
            </a>
          </nav>
        )}
        <h1
          className="mb-6 text-[26px] leading-[1.12] md:mb-10 md:text-[38px]"
          style={{
            fontFamily: "'Inter Tight', 'Helvetica Neue', Helvetica, sans-serif",
            fontWeight: 500,
            letterSpacing: '-0.03em',
          }}
        >
          One idea. Write it the way you’d post it.
        </h1>
        {demo ? <Demo /> : state === 'live' ? <Live /> : <Still state={state} />}
      </div>
    </main>
  );
}
