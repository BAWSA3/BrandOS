'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'motion/react';
import { AnimateNumber } from 'motion-plus/react';
import Wordmark from '@/components/Wordmark';
import { Button, Input, SYSTEM_FONTS, SystemStyles } from '@/components/system/primitives';
import { BONE, HAIRLINE, INK } from '@/lib/field/system';
import {
  APPLY_NOTE_MAX,
  CODE_TRIAL_DAYS,
  INVALID_CODE_MESSAGE,
  MEMBER_INVITES,
  typedCodePath,
} from '@/lib/early-access-rules';

const BLUE = '#0047FF';
const MUTED = 'rgba(14,14,14,.62)';
const label = {
  fontFamily: SYSTEM_FONTS.vcr,
  fontSize: 11,
  letterSpacing: '0.16em',
  textTransform: 'uppercase' as const,
};

export type ApplyState = 'idle' | 'busy' | 'sent' | 'error';

/**
 * The invite-only step (/access): one Klein tile counting up to the 30 free
 * days (the screen's one moment), then two ways in: a code, or an
 * application. Bone finish, system type, press-and-cut motion.
 * `preview` pins a state for /world-preview/access.
 */
export default function AccessGate({
  next,
  signedIn,
  preview,
}: {
  next: string;
  signedIn: boolean;
  preview?: { apply?: ApplyState; codeError?: boolean; applyError?: string };
}) {
  const reduce = useReducedMotion();
  const [days, setDays] = useState(reduce || preview ? CODE_TRIAL_DAYS : 0);
  useEffect(() => {
    if (reduce || preview) return;
    const t = window.setTimeout(() => setDays(CODE_TRIAL_DAYS), 350);
    return () => window.clearTimeout(t);
  }, [reduce, preview]);

  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState<string | null>(
    preview?.codeError ? INVALID_CODE_MESSAGE : null
  );
  function applyCode(e: React.FormEvent) {
    e.preventDefault();
    const path = typedCodePath(code);
    if (!path) return setCodeError(INVALID_CODE_MESSAGE);
    window.location.assign(path);
  }

  const [handle, setHandle] = useState('');
  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');
  const [apply, setApply] = useState<ApplyState>(preview?.apply ?? 'idle');
  const [applyError, setApplyError] = useState<string | null>(preview?.applyError ?? null);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setApply('busy');
    setApplyError(null);
    const res = await fetch('/api/access/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ handle, email, note }),
    }).catch(() => null);
    if (res?.ok) return setApply('sent');
    const body = (await res?.json().catch(() => null)) as { error?: string } | null;
    setApplyError(body?.error ?? 'Couldn’t send that. Try again.');
    setApply('error');
  }

  const box = {
    background: '#FAF8F3',
    border: `1px solid ${HAIRLINE}`,
    padding: 22,
  };

  return (
    <main style={{ minHeight: '100vh', background: BONE, color: INK }}>
      <SystemStyles />
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '40px 16px 64px' }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Wordmark height={26} />
        </div>

        <div style={{ ...label, color: BLUE, textAlign: 'center', marginTop: 40 }}>
          Invite-only · {CODE_TRIAL_DAYS} days free with a code
        </div>
        <h1
          style={{
            fontFamily: SYSTEM_FONTS.display,
            fontWeight: 500,
            fontSize: 'clamp(34px, 8vw, 46px)',
            lineHeight: 1.02,
            letterSpacing: '-0.03em',
            textAlign: 'center',
            margin: '14px 0 0',
          }}
        >
          You’ve seen your read. Now get a code.
        </h1>
        <p
          style={{
            fontSize: 16,
            lineHeight: 1.55,
            color: '#333',
            textAlign: 'center',
            margin: '14px auto 0',
            maxWidth: 440,
          }}
        >
          A code is {CODE_TRIAL_DAYS} days of everything, no card: today’s move, the live composer,
          your Brand view.
        </p>

        {/* the one moment: the free days count up on the Klein tile */}
        <motion.div
          initial={reduce || preview ? false : { scale: 1.06 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
          style={{
            margin: '28px auto 0',
            width: 200,
            background: BLUE,
            color: '#fff',
            padding: '16px 18px 14px',
            display: 'grid',
            gap: 2,
          }}
          aria-label={`${CODE_TRIAL_DAYS} days free`}
        >
          <span
            style={{
              fontFamily: SYSTEM_FONTS.display,
              fontWeight: 500,
              fontSize: 56,
              lineHeight: 0.9,
              letterSpacing: '-0.04em',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            <AnimateNumber transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}>
              {days}
            </AnimateNumber>
          </span>
          <span style={{ ...label, fontSize: 10, opacity: 0.85 }}>days free · no card</span>
        </motion.div>

        <section aria-labelledby="have-code" style={{ ...box, marginTop: 32 }}>
          <h2 id="have-code" style={{ ...label, color: MUTED, margin: '0 0 12px' }}>
            Have a code?
          </h2>
          <form onSubmit={applyCode} style={{ display: 'flex', gap: 8 }}>
            <Input
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setCodeError(null);
              }}
              placeholder="AU7K-2QX9"
              aria-label="Early-access code"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              maxLength={24}
              invalid={!!codeError}
              style={{ fontFamily: SYSTEM_FONTS.plex, letterSpacing: '0.12em', minWidth: 0 }}
            />
            <Button type="submit" disabled={!code.trim()} style={{ whiteSpace: 'nowrap' }}>
              Use code
            </Button>
          </form>
          {codeError && (
            <p role="alert" style={{ margin: '10px 0 0', fontSize: 13 }}>
              {codeError}
            </p>
          )}
          <p style={{ margin: '12px 0 0', fontSize: 13, color: MUTED }}>
            {signedIn
              ? 'It goes straight onto your account.'
              : 'Next you sign in with X. The code goes onto your account.'}
          </p>
        </section>

        <section id="apply" aria-labelledby="apply-h" style={{ ...box, marginTop: 14 }}>
          <h2 id="apply-h" style={{ ...label, color: MUTED, margin: '0 0 12px' }}>
            No code? Apply
          </h2>
          {apply === 'sent' ? (
            <div
              className="sys-anim"
              style={{ animation: 'sys-press 420ms cubic-bezier(.16,1,.3,1) both' }}
            >
              <p style={{ margin: 0, fontSize: 16, lineHeight: 1.5 }}>You’re on the list.</p>
              <p style={{ margin: '6px 0 0', fontSize: 14, lineHeight: 1.5, color: MUTED }}>
                Bawsa reads every application and sends codes in batches, by email.
              </p>
            </div>
          ) : (
            <form onSubmit={submit} style={{ display: 'grid', gap: 10 }}>
              <Input
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="@yourhandle"
                aria-label="Your X handle"
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                maxLength={64}
                required
              />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                aria-label="Email"
                autoComplete="email"
                maxLength={254}
                required
              />
              <Input
                value={note}
                onChange={(e) => setNote(e.target.value.slice(0, APPLY_NOTE_MAX))}
                placeholder="What you post about"
                aria-label="One line about what you post (optional)"
                maxLength={APPLY_NOTE_MAX}
              />
              {applyError && (
                <p role="alert" style={{ margin: 0, fontSize: 13 }}>
                  {applyError}
                </p>
              )}
              <Button
                type="submit"
                variant="secondary"
                disabled={apply === 'busy' || !handle.trim() || !email.trim()}
              >
                {apply === 'busy' ? 'Sending…' : 'Apply for a code'}
              </Button>
            </form>
          )}
        </section>

        <p style={{ margin: '22px 0 0', fontSize: 13, color: MUTED, textAlign: 'center' }}>
          Every member has {MEMBER_INVITES} invites. Know one? Ask them.
        </p>
        {!signedIn && (
          <p style={{ margin: '10px 0 0', textAlign: 'center' }}>
            <Link
              href={`/signup?next=${encodeURIComponent(next)}`}
              className="sys-focus"
              style={{ ...label, color: INK }}
            >
              Already a member? Sign in →
            </Link>
          </p>
        )}
      </div>
    </main>
  );
}
