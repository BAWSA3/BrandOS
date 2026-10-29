'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'motion/react';
import { AnimateNumber } from 'motion-plus/react';
import { useEffect, useState } from 'react';
import StartTrialButton from '@/components/billing/StartTrialButton';
import { FOUNDING_SPOTS, TRIAL_DAYS } from '@/lib/plans';
import {
  CODE_TRIAL_DAYS,
  INVALID_CODE_MESSAGE,
  typedCodePath,
} from '@/lib/early-access-rules';

const MONO = "var(--dash-mono, 'VCR OSD Mono', monospace)";
const BIG = "var(--dash-big, 'Inter Tight', sans-serif)";
const BLUE = '#0047FF';

/**
 * Free accounts see their real dashboard, blurred, under this card: the
 * locked preview (docs/LAUNCH-PLAN.md). Their own score is the hook.
 *  - `trial` (default): the 7-day card trial is the one action.
 *  - Invite-only trial (Nov 2): `code-needed` (no code yet: enter one, apply,
 *    or go straight to Pro) and `code-ended` (their 30 free days are over:
 *    keep Pro, charged from today; a code's 30 days were the trial).
 */
export type PaywallMode = 'trial' | 'code-needed' | 'code-ended';

export default function Paywall({
  handle,
  score,
  foundingLeft,
  mode = 'trial',
}: {
  handle: string;
  score: number;
  foundingLeft: number;
  mode?: PaywallMode;
}) {
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);
  const applyCode = (e: React.FormEvent) => {
    e.preventDefault();
    const path = typedCodePath(code);
    if (!path) return setCodeError(INVALID_CODE_MESSAGE);
    window.location.assign(path);
  };
  const kicker =
    mode === 'code-needed'
      ? `Invite-only · ${CODE_TRIAL_DAYS} days free with a code`
      : mode === 'code-ended'
        ? `Your ${CODE_TRIAL_DAYS} free days are over`
        : `BrandOS Pro · ${TRIAL_DAYS}-day free trial`;
  const pitch =
    mode === 'code-needed'
      ? 'BrandOS is invite-only right now. A code gets you 30 days of everything, no card: today’s move, the live composer, your Brand view.'
      : mode === 'code-ended'
        ? 'Keep everything you’ve been using: today’s move, the live composer, your Brand view and every post analyzed.'
        : 'Start your free trial to see what’s moving it: score history, every post analyzed, your Brand Pass, and BrandOS inside Claude and ChatGPT.';
  const reduce = useReducedMotion();
  // roll the score up once the card lands (Motion+ AnimateNumber needs a change)
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const t = window.setTimeout(() => setShown(score), reduce ? 0 : 450);
    return () => window.clearTimeout(t);
  }, [score, reduce]);

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center overflow-y-auto p-4 sm:items-center"
      style={{
        backdropFilter: 'blur(9px)',
        WebkitBackdropFilter: 'blur(9px)',
        background: 'rgba(242,239,232,0.55)',
      }}
      role="dialog"
      aria-modal="true"
      aria-label={mode === 'code-needed' ? 'Get into BrandOS' : 'Keep BrandOS Pro'}
    >
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[520px] border bg-[#FAF8F3] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.18)] sm:p-8"
        style={{ borderColor: 'rgba(14,14,14,0.12)', color: '#0E0E0E' }}
      >
        <div
          className="text-[11px] uppercase tracking-[0.16em]"
          style={{ fontFamily: MONO, color: BLUE }}
        >
          {kicker}
        </div>
        <h1
          className="mt-4 text-[34px] leading-[1.02] sm:text-[42px]"
          style={{ fontFamily: BIG, fontWeight: 500, letterSpacing: '-0.035em' }}
        >
          {mode === 'code-ended'
            ? `Keep your dashboard, @${handle}.`
            : `Your dashboard is ready, @${handle}.`}
        </h1>
        <div className="mt-5 flex items-end gap-3">
          <span
            className="text-[64px] leading-[0.85]"
            style={{ fontFamily: BIG, fontWeight: 500, letterSpacing: '-0.05em', color: BLUE }}
          >
            <AnimateNumber>{shown}</AnimateNumber>
          </span>
          <span
            className="pb-1 text-[12px] uppercase tracking-[0.14em]"
            style={{ fontFamily: MONO, color: '#6B6B6B' }}
          >
            Your brand score / 100
          </span>
        </div>
        <p className="mt-5 text-[15px] leading-[1.55]" style={{ color: '#333' }}>
          {pitch}
        </p>
        {mode === 'code-needed' ? (
          <>
            <form onSubmit={applyCode} className="mt-6 flex gap-2">
              <input
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setCodeError(null);
                }}
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                maxLength={24}
                placeholder="AU7K-2QX9"
                aria-label="Early-access code"
                className="min-w-0 flex-1 border bg-white px-3 py-3 text-center text-[15px] tracking-[0.14em] focus:outline-none focus:ring-2 focus:ring-[#0047FF]"
                style={{ borderColor: 'rgba(14,14,14,0.15)' }}
              />
              <button
                type="submit"
                disabled={!code.trim()}
                className="px-5 text-[12px] uppercase tracking-[0.14em] text-white disabled:opacity-50"
                style={{ fontFamily: MONO, background: BLUE }}
              >
                Use code
              </button>
            </form>
            {codeError && (
              <p className="mt-2 text-center text-[13px]" style={{ color: '#6B6B6B' }} role="alert">
                {codeError}
              </p>
            )}
            <p className="mt-3 text-center text-[13px]" style={{ color: '#333' }}>
              No code?{' '}
              <Link href="/access#apply" className="underline hover:text-[#0047FF]">
                Apply for one
              </Link>{' '}
              or ask a member: each one has 3 to give.
            </p>
            <StartTrialButton
              signedIn
              next="/dashboard"
              label="Or go straight to Pro"
              className="mt-5"
            />
            <p className="mt-2 text-center text-[12px] leading-[1.5]" style={{ color: '#6B6B6B' }}>
              $29/month after {TRIAL_DAYS} days · card required · cancel before day {TRIAL_DAYS}{' '}
              and pay nothing
            </p>
          </>
        ) : mode === 'code-ended' ? (
          <>
            <StartTrialButton signedIn next="/dashboard" label="Keep Pro" className="mt-6" />
            <p className="mt-3 text-center text-[12px] leading-[1.5]" style={{ color: '#6B6B6B' }}>
              $29/month from today · cancel any time
            </p>
          </>
        ) : (
          <>
            <StartTrialButton signedIn next="/dashboard" className="mt-6" />
            <p className="mt-3 text-center text-[12px] leading-[1.5]" style={{ color: '#6B6B6B' }}>
              $29/month after {TRIAL_DAYS} days · card required · cancel before day {TRIAL_DAYS} and
              pay nothing
            </p>
          </>
        )}
        {foundingLeft > 0 && (
          <div
            className="mt-5 border-t pt-4 text-[11px] uppercase tracking-[0.12em]"
            style={{ fontFamily: MONO, borderColor: 'rgba(14,14,14,0.1)', color: '#0E0E0E' }}
          >
            <span style={{ color: BLUE }}>
              {foundingLeft} of {FOUNDING_SPOTS}
            </span>{' '}
            founding spots left · keep $29/mo forever
          </div>
        )}
        <div
          className="mt-4 flex flex-wrap justify-between gap-2 text-[11px] uppercase tracking-[0.12em]"
          style={{ fontFamily: MONO, color: '#6B6B6B' }}
        >
          <Link href={`/@${handle}`} className="hover:underline">
            Your public page ↗
          </Link>
          <Link href="/pricing" className="hover:underline">
            What&apos;s included ↗
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
