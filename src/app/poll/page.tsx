'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

// Landing page for the launch email's one-click "would you pay?" buttons. The
// vote is POSTed from here on load (not recorded by the link itself), so email
// security scanners that prefetch links don't cast votes.

const MONO = "'VCR OSD Mono', 'JetBrains Mono', monospace";
const LABELS: Record<string, string> = {
  standard: 'Standard · $10/mo',
  premium: 'Premium · $20/mo',
  founding: 'Founding Member · $249 once',
  'not-yet': 'Not yet',
};

function Vote() {
  const params = useSearchParams();
  const t = params.get('t') ?? '';
  const c = params.get('c') ?? '';
  const [state, setState] = useState<'saving' | 'done' | 'error'>('saving');
  const [error, setError] = useState('');
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    fetch('/api/poll/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ t, c }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Could not record your vote');
        setState('done');
      })
      .catch((e: Error) => {
        setError(e.message);
        setState('error');
      });
  }, [t, c]);

  return (
    <div className="w-full max-w-[480px] text-center" style={{ fontFamily: MONO }}>
      {state === 'saving' && (
        <div className="text-[12px] tracking-wider text-[#6E6E73]">recording your vote...</div>
      )}
      {state === 'done' && (
        <>
          <span className="inline-block px-2 py-1 rounded-[2px] bg-[#0A84FF] text-white text-[11px] tracking-[0.15em] uppercase">
            Vote recorded
          </span>
          <h1 className="mt-5 text-[20px] leading-snug tracking-wider text-[#1D1D1F] uppercase">
            {LABELS[c] ?? 'Thanks'}
          </h1>
          <p className="mt-3 text-[12px] leading-relaxed tracking-wide text-[#6E6E73]">
            Thanks. This tells me what to build first. Changed your mind? Click a different option
            in the email.
          </p>
          <Link
            href="/"
            className="mt-8 block w-full px-4 py-3.5 rounded-[6px] bg-[#0A84FF] hover:bg-[#0070E0] text-white text-[12px] tracking-[0.15em] uppercase transition-colors"
          >
            Scan & reserve your brand station →
          </Link>
        </>
      )}
      {state === 'error' && (
        <>
          <div className="text-[13px] tracking-wider text-[#FF3B30]">{error}</div>
          <Link href="/" className="mt-6 inline-block text-[12px] tracking-wider text-[#0A84FF]">
            Go to BrandOS →
          </Link>
        </>
      )}
    </div>
  );
}

export default function PollPage() {
  return (
    <main className="min-h-screen bg-[#F2F0EF] px-4 py-16 flex items-center justify-center">
      <Suspense>
        <Vote />
      </Suspense>
    </main>
  );
}
