'use client';

import { useEffect, useMemo, useState } from 'react';
import LiveComposerView from '@/components/live-composer/LiveComposerView';
import {
  demoStateAt,
  SAMPLE_SCRIPT,
  SAMPLE_TEXT,
  scriptedState,
  settledAt,
  THIN_SCRIPT,
  type DemoScript,
} from '@/components/live-composer/demo';
import type { LiveState, Variant } from '@/components/live-composer/types';
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

function Still({ state, variant }: { state: string; variant: Variant }) {
  const s = useMemo<LiveState>(() => {
    const f = still(state);
    if (f.t === 'typing') {
      // mid-sentence, keys still going: what variant c hides and b shows faintly
      const t = settledAt(SAMPLE_SCRIPT, L1) + 2600;
      return demoStateAt(SAMPLE_SCRIPT, t);
    }
    return { ...demoStateAt(f.script, f.t), error: f.error ?? null };
  }, [state]);
  return (
    <Frame state={s} variant={variant} caret={state !== 'empty'} smm={state === 'smm'} instant />
  );
}

// ?state=live: type for real; marks from the sample profile, reads from the script
function Live({ variant }: { variant: Variant }) {
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
      variant={variant}
      onChange={(v) => {
        setTyping(true);
        setText(v);
      }}
      placeholder="Try: Excited to announce… or paste the sample draft."
    />
  );
}

function Demo({ variant }: { variant: Variant }) {
  const s = useDemoComposer(SAMPLE_SCRIPT, { loop: true });
  return <Frame state={s} variant={variant} caret />;
}

function Frame({
  state,
  variant,
  caret,
  smm,
  instant,
}: {
  state: LiveState;
  variant: Variant;
  caret?: boolean;
  smm?: boolean;
  instant?: boolean;
}) {
  return (
    <LiveComposerView
      state={state}
      variant={variant}
      caret={caret}
      instant={instant}
      header={
        <span
          className="text-[11px] uppercase tracking-[0.08em]"
          style={{ fontFamily: "'VCR OSD Mono', 'JetBrains Mono', monospace", color: '#6E6A62' }}
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
  variant,
  demo,
  state,
  chrome,
}: {
  variant: Variant;
  demo: boolean;
  state: string;
  chrome: boolean;
}) {
  const q = (v: string) => `?v=${v}${demo ? '&demo=1' : `&state=${state}`}`;
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
            {(['a', 'b', 'c'] as const).map((v) => (
              <a
                key={v}
                href={q(v)}
                className="rounded-full px-3 py-1.5"
                style={{
                  background: v === variant ? '#0047FF' : 'transparent',
                  color: v === variant ? '#fff' : '#141414',
                  boxShadow: 'inset 0 0 0 1px rgba(20,20,20,.15)',
                }}
              >
                {v === 'a' ? 'A · milestones' : v === 'b' ? 'B · ambient' : 'C · one moment'}
              </a>
            ))}
            <a
              href={demo ? `?v=${variant}&state=final` : `?v=${variant}&demo=1`}
              className="ml-2 underline"
            >
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
        {demo ? (
          <Demo variant={variant} />
        ) : state === 'live' ? (
          <Live variant={variant} />
        ) : (
          <Still state={state} variant={variant} />
        )}
      </div>
    </main>
  );
}
