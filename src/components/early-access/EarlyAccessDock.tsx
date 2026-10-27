'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, SYSTEM_FONTS, SystemStyles } from '@/components/system/primitives';
import { BONE, HAIRLINE, INK } from '@/lib/field/system';
import { FIELD } from '@/lib/field/dither';
import { FEEDBACK_MAX, INVALID_CODE_MESSAGE, normalizeCode } from '@/lib/early-access-rules';

/**
 * Bottom-right on the dashboard. Early-access testers see the "Early access"
 * tag and a line to Bawsa; everyone else gets a quiet "Have a code?". The
 * result of an invite link (?invite=ok|invalid) opens it once. Motion follows
 * the system: press and cut, nothing fades.
 */
export default function EarlyAccessDock({
  tester,
  invite,
}: {
  tester: boolean;
  invite: 'ok' | 'invalid' | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(invite !== null);
  const [notice, setNotice] = useState<'ok' | 'invalid' | null>(invite);

  // the invite result is said once: drop ?invite from the address
  useEffect(() => {
    if (!invite) return;
    const url = new URL(window.location.href);
    url.searchParams.delete('invite');
    window.history.replaceState(null, '', url.pathname + url.search);
  }, [invite]);

  const label = {
    fontFamily: SYSTEM_FONTS.vcr,
    fontSize: 11,
    letterSpacing: '0.16em',
    textTransform: 'uppercase' as const,
  };

  return (
    <div
      style={{
        position: 'fixed',
        right: 16,
        bottom: 16,
        zIndex: 60,
        width: open ? 'min(360px, calc(100vw - 32px))' : 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 8,
      }}
    >
      <SystemStyles />
      {open && (
        <section
          aria-label={tester ? 'Early access' : 'Redeem an early-access code'}
          style={{
            width: '100%',
            background: BONE,
            color: INK,
            border: `1px solid ${HAIRLINE}`,
            boxShadow: '0 1px 0 rgba(14,14,14,0.08)',
            padding: 18,
          }}
        >
          <header
            style={{
              ...label,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingBottom: 10,
              marginBottom: 14,
              borderBottom: `1px solid ${HAIRLINE}`,
              color: 'rgba(14,14,14,.62)',
            }}
          >
            <span>{tester ? 'Early access' : 'Have a code?'}</span>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setNotice(null);
              }}
              aria-label="Close"
              className="sys-focus"
              style={{ ...label, background: 'none', border: 0, cursor: 'pointer', color: INK }}
            >
              ×
            </button>
          </header>

          {notice === 'ok' && (
            <p style={{ margin: '0 0 14px', fontSize: 14, lineHeight: 1.5 }}>
              Early access is on: the Creator Index before it opens, the Founding price kept at
              $29/month, and a direct line to Bawsa.
            </p>
          )}
          {notice === 'invalid' && (
            <p role="alert" style={{ margin: '0 0 14px', fontSize: 14, lineHeight: 1.5 }}>
              {INVALID_CODE_MESSAGE}
            </p>
          )}

          {tester ? <FeedbackForm /> : <RedeemForm onRedeemed={() => router.refresh()} />}
        </section>
      )}

      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="sys-press sys-focus"
          style={{
            ...label,
            cursor: 'pointer',
            padding: '9px 12px',
            border: `1px solid ${tester ? FIELD : HAIRLINE}`,
            background: tester ? FIELD : BONE,
            color: tester ? '#fff' : INK,
          }}
        >
          {tester ? 'Early access · Send feedback' : 'Have a code?'}
        </button>
      )}
    </div>
  );
}

function RedeemForm({ onRedeemed }: { onRedeemed: () => void }) {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!normalizeCode(code)) {
      setError(INVALID_CODE_MESSAGE);
      return;
    }
    setBusy(true);
    const res = await fetch('/api/early-access/redeem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    }).catch(() => null);
    setBusy(false);
    if (!res?.ok) {
      const body = (await res?.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error ?? 'Something went wrong. Try again.');
      return;
    }
    setDone(true);
    onRedeemed();
  }

  if (done) {
    return (
      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>
        Early access is on: the Creator Index before it opens, the Founding price kept at $29/month,
        and a direct line to Bawsa.
      </p>
    );
  }

  return (
    <form onSubmit={submit} style={{ display: 'grid', gap: 10 }}>
      <label htmlFor="ea-code" style={{ fontSize: 14, lineHeight: 1.5 }}>
        Enter the code Bawsa sent you.
      </label>
      <Input
        id="ea-code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="AU7K-2QX9"
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        maxLength={24}
        invalid={!!error}
        style={{ fontFamily: SYSTEM_FONTS.plex, letterSpacing: '0.12em' }}
      />
      {error && (
        <p role="alert" style={{ margin: 0, fontSize: 13, color: INK }}>
          {error}
        </p>
      )}
      <Button type="submit" disabled={busy || !code.trim()}>
        {busy ? 'Checking…' : 'Redeem'}
      </Button>
    </form>
  );
}

function FeedbackForm() {
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const area = useRef<HTMLTextAreaElement>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const res = await fetch('/api/early-access/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, page: window.location.pathname }),
    }).catch(() => null);
    setBusy(false);
    if (!res?.ok) {
      const body = (await res?.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error ?? 'Couldn’t send that. Try again.');
      return;
    }
    setSent(true);
    setMessage('');
  }

  if (sent) {
    return (
      <div style={{ display: 'grid', gap: 10 }}>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>Sent. Bawsa reads every note.</p>
        <Button
          variant="secondary"
          onClick={() => {
            setSent(false);
            window.setTimeout(() => area.current?.focus(), 0);
          }}
        >
          Write another
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} style={{ display: 'grid', gap: 10 }}>
      <label htmlFor="ea-feedback" style={{ fontSize: 14, lineHeight: 1.5 }}>
        Send feedback to Bawsa. What felt right, what felt off, what’s missing.
      </label>
      <textarea
        id="ea-feedback"
        ref={area}
        value={message}
        onChange={(e) => setMessage(e.target.value.slice(0, FEEDBACK_MAX))}
        rows={4}
        className="sys-input sys-focus"
        style={{
          width: '100%',
          resize: 'vertical',
          background: '#fff',
          color: INK,
          border: '1px solid rgba(14,14,14,.28)',
          borderRadius: 0,
          padding: '10px 12px',
          fontFamily: SYSTEM_FONTS.display,
          fontSize: 15,
          lineHeight: 1.5,
        }}
      />
      <div
        aria-live="polite"
        style={{
          fontFamily: SYSTEM_FONTS.plex,
          fontSize: 11,
          color: 'rgba(14,14,14,.55)',
          textAlign: 'right',
        }}
      >
        {message.length}/{FEEDBACK_MAX}
      </div>
      {error && (
        <p role="alert" style={{ margin: 0, fontSize: 13 }}>
          {error}
        </p>
      )}
      <Button type="submit" disabled={busy || !message.trim()}>
        {busy ? 'Sending…' : 'Send to Bawsa'}
      </Button>
    </form>
  );
}
