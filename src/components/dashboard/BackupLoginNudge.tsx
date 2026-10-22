'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const MONO = "var(--dash-mono, 'VCR OSD Mono', monospace)";
const KEY = 'brandos:backup-login-dismissed';

/**
 * Old X-only accounts: a dismissible nudge to add a backup login (replaces the
 * hard /migrate-account wall, decided 2026-10-22).
 */
export default function BackupLoginNudge() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => {
      try {
        setShow(!localStorage.getItem(KEY));
      } catch {
        setShow(true);
      }
    }, 0);
    return () => window.clearTimeout(t);
  }, []);
  if (!show) return null;
  const dismiss = () => {
    try {
      localStorage.setItem(KEY, String(Date.now()));
    } catch {
      // storage blocked: hidden for this visit
    }
    setShow(false);
  };
  return (
    <div
      className="fixed bottom-4 left-1/2 z-[70] flex w-[min(560px,calc(100vw-2rem))] -translate-x-1/2 items-center gap-3 border bg-[#FAF8F3] px-4 py-3 text-[13px] text-[#0E0E0E] shadow-[0_12px_32px_rgba(0,0,0,0.14)]"
      style={{ borderColor: 'rgba(14,14,14,0.12)' }}
      role="status"
    >
      <span className="flex-1">
        Add a backup login so you never get locked out of your account.
      </span>
      <Link
        href="/migrate-account"
        className="shrink-0 text-[10px] uppercase tracking-[0.14em] text-[#0047FF] hover:underline"
        style={{ fontFamily: MONO }}
      >
        Add one →
      </Link>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="shrink-0 px-1 text-[16px] leading-none text-[#6B6862] hover:text-[#0E0E0E]"
      >
        ×
      </button>
    </div>
  );
}
