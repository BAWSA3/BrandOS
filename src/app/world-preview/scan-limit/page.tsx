'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Button, FieldText, Input, Panel, SystemStyles } from '@/components/system';
import { ScanCounter, ScanLimitNotice } from '@/components/ScanLimitNotice';
import { quotaView, type ScanAllowance } from '@/lib/scan-quota-rules';

// The daily scan limit on the homepage scan form (src/lib/scan-quota.ts), every
// state side by side, or one with ?state=out|out-hit|free-3|free-1|free-hit|paid.
// Sample data only.

const NOW = new Date('2026-10-29T18:00:00Z');
const OUT: ScanAllowance = { unlimited: false, signedIn: false, limit: 1 };
const FREE: ScanAllowance = { unlimited: false, signedIn: true, limit: 3 };

const STATES = {
  out: { label: 'signed out, unused', q: quotaView(OUT, 0, NOW), hit: false },
  'out-hit': { label: 'signed out, used', q: quotaView(OUT, 1, NOW), hit: true },
  'free-3': { label: 'free, 3 left', q: quotaView(FREE, 0, NOW), hit: false },
  'free-1': { label: 'free, 1 left', q: quotaView(FREE, 2, NOW), hit: false },
  'free-hit': { label: 'free / trial, used', q: quotaView(FREE, 3, NOW), hit: true },
  paid: { label: 'paid', q: quotaView({ unlimited: true }, 0, NOW), hit: false },
} as const;
type Key = keyof typeof STATES;

function Form({ k }: { k: Key }) {
  const s = STATES[k];
  return (
    <Panel
      label="Read your brand"
      meta="any public X account"
      style={{ maxWidth: 460 }}
      padding={22}
    >
      <form style={{ display: 'grid', gap: 12 }} onSubmit={(e) => e.preventDefault()}>
        <Input placeholder="@yourhandle" aria-label="Your X handle" defaultValue="@jbawsa" />
        <Button type="submit" style={{ width: '100%' }}>
          Read my brand →
        </Button>
        {s.hit && !s.q.unlimited ? (
          <ScanLimitNotice quota={s.q} now={NOW} />
        ) : (
          <ScanCounter quota={s.q} />
        )}
      </form>
    </Panel>
  );
}

function Harness() {
  const state = useSearchParams().get('state') as Key | null;
  const keys = state && state in STATES ? [state] : (Object.keys(STATES) as Key[]);
  return (
    <main style={{ minHeight: '100vh', background: '#0047FF', padding: 'clamp(16px, 4vw, 40px)' }}>
      <SystemStyles />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 380px), 1fr))',
          gap: 28,
          alignItems: 'start',
        }}
      >
        {keys.map((k) => (
          <section key={k} style={{ display: 'grid', gap: 10 }}>
            <FieldText size="label" as="div">
              {STATES[k].label}
            </FieldText>
            <Form k={k} />
          </section>
        ))}
      </div>
    </main>
  );
}

export default function ScanLimitPreview() {
  return (
    <Suspense>
      <Harness />
    </Suspense>
  );
}
