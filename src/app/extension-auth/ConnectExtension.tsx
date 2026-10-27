'use client';

import { useEffect, useState } from 'react';

/* eslint-disable @typescript-eslint/no-explicit-any */
declare const chrome: any;

const KLEIN = '#0047FF';
const INK = '#0E0E0E';
const BONE = '#F2EFE8';
const VCR = "'VCR OSD Mono', 'JetBrains Mono', monospace";

type State = 'connecting' | 'done' | 'error';

/**
 * Hands the extension its token. With the published extension's id
 * (NEXT_PUBLIC_EXTENSION_ID) it goes straight to the extension
 * (externally_connectable). Without it (an unpacked build in development) it
 * is posted to this window only, where the extension's connector script on
 * this page picks it up.
 */
export default function ConnectExtension({ extensionId }: { extensionId: string }) {
  const [state, setState] = useState<State>('connecting');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const res = await fetch('/api/extension/token', { method: 'POST' });
        const json = (await res.json().catch(() => ({}))) as {
          token?: string;
          expiresAt?: number;
          handle?: string | null;
          error?: string;
        };
        if (!res.ok || !json.token) throw new Error(json.error || 'Could not connect.');
        const message = {
          type: 'BRANDOS_EXTENSION_TOKEN',
          token: json.token,
          expiresAt: json.expiresAt,
          handle: json.handle ?? null,
        };
        const viaPage = () => window.postMessage(message, window.location.origin);
        if (extensionId && typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
          chrome.runtime.sendMessage(extensionId, message, (reply: any) => {
            if (cancelled) return;
            if (chrome.runtime.lastError || !reply?.ok) viaPage();
            setState('done');
          });
        } else {
          viaPage();
          if (!cancelled) setState('done');
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Could not connect.');
          setState('error');
        }
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [extensionId]);

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: BONE,
        color: INK,
        padding: 16,
        fontFamily: "'Helvetica Custom', 'Helvetica Neue', Helvetica, Arial, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 420,
          width: '100%',
          border: '1px solid rgba(14,14,14,.14)',
          padding: 28,
          background: '#fff',
        }}
      >
        <div
          style={{
            fontFamily: VCR,
            fontSize: 11,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'rgba(14,14,14,.62)',
          }}
        >
          BrandOS for Chrome
        </div>
        {state === 'connecting' && (
          <h1
            style={{ fontSize: 28, lineHeight: 1.1, margin: '14px 0 0', letterSpacing: '-0.02em' }}
          >
            Connecting…
          </h1>
        )}
        {state === 'done' && (
          <>
            <h1
              style={{
                fontSize: 28,
                lineHeight: 1.1,
                margin: '14px 0 10px',
                letterSpacing: '-0.02em',
              }}
            >
              Connected.
            </h1>
            <p style={{ fontSize: 16, lineHeight: 1.5, margin: 0 }}>
              Go back to X and start writing. Your draft is scored against your brand as you type,
              before it goes out.
            </p>
            <p
              style={{
                fontSize: 13,
                lineHeight: 1.5,
                margin: '14px 0 0',
                color: 'rgba(14,14,14,.62)',
              }}
            >
              You can close this tab.
            </p>
          </>
        )}
        {state === 'error' && (
          <>
            <h1
              style={{
                fontSize: 28,
                lineHeight: 1.1,
                margin: '14px 0 10px',
                letterSpacing: '-0.02em',
              }}
            >
              Not connected.
            </h1>
            <p role="alert" style={{ fontSize: 15, margin: '0 0 16px' }}>
              {error}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{
                background: KLEIN,
                color: '#fff',
                border: 0,
                padding: '11px 18px',
                fontFamily: VCR,
                fontSize: 12,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
          </>
        )}
      </div>
    </main>
  );
}
