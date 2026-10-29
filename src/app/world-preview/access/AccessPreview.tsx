'use client';

import type { CSSProperties } from 'react';
import AccessGate from '@/components/access/AccessGate';
import InvitePasses, { type InviteData } from '@/components/access/InvitePasses';
import Paywall from '@/components/billing/Paywall';
import { V_TOKENS } from '@/components/dashboard-v2/tokens';
import type { Colorway } from '@/lib/colorways';

const link = (code: string) => `https://mybrandos.app/i/${code.slice(0, 4)}-${code.slice(4)}`;
const INVITES: Record<string, InviteData> = {
  'invites-new': { cap: 3, left: 3, invites: [] },
  'invites-mixed': {
    cap: 3,
    left: 1,
    invites: [
      {
        code: 'AU7K2QX9',
        link: link('AU7K2QX9'),
        usedBy: 'aunnieonchain',
        usedAt: '2026-11-03T10:00:00Z',
      },
      { code: 'HQUP4WY8', link: link('HQUP4WY8'), usedBy: null, usedAt: null },
    ],
  },
  'invites-used': {
    cap: 3,
    left: 0,
    invites: [
      {
        code: 'AU7K2QX9',
        link: link('AU7K2QX9'),
        usedBy: 'aunnieonchain',
        usedAt: '2026-11-03T10:00:00Z',
      },
      {
        code: 'HQUP4WY8',
        link: link('HQUP4WY8'),
        usedBy: 'q_bree_',
        usedAt: '2026-11-04T10:00:00Z',
      },
      {
        code: 'K4L4ZXQM',
        link: link('K4L4ZXQM'),
        usedBy: 'musaakoke',
        usedAt: '2026-11-05T10:00:00Z',
      },
    ],
  },
};

export default function AccessPreview({ state, finish }: { state: string; finish: Colorway }) {
  if (state.startsWith('invites')) {
    return (
      <main
        style={
          {
            ...V_TOKENS[finish],
            minHeight: '100vh',
            background: 'var(--v-canvas, var(--v-bg))',
            color: 'var(--v-ink)',
          } as CSSProperties
        }
      >
        <div className="mx-auto w-full max-w-[880px] px-4 py-12 md:px-10">
          <InvitePasses preview={INVITES[state] ?? INVITES['invites-new']} />
        </div>
      </main>
    );
  }
  if (state.startsWith('paywall')) {
    return (
      <main style={{ minHeight: '100vh', background: '#F2EFE8' }}>
        <Paywall
          handle="jbawsa"
          score={74}
          foundingLeft={63}
          mode={
            state === 'paywall-ended'
              ? 'code-ended'
              : state === 'paywall-trial'
                ? 'trial'
                : 'code-needed'
          }
        />
      </main>
    );
  }
  return (
    <AccessGate
      next="/dashboard"
      signedIn={state === 'gate-in'}
      preview={{
        apply: state === 'applied' ? 'sent' : state === 'apply-error' ? 'error' : 'idle',
        codeError: state === 'code-error',
        applyError:
          state === 'apply-error' ? 'Applications open soon. Try again in a bit.' : undefined,
      }}
    />
  );
}
