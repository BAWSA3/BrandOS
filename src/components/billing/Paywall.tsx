'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'motion/react';
import { AnimateNumber } from 'motion-plus/react';
import { useEffect, useState } from 'react';
import StartTrialButton from '@/components/billing/StartTrialButton';
import { FOUNDING_SPOTS, TRIAL_DAYS } from '@/lib/plans';

const MONO = "var(--dash-mono, 'VCR OSD Mono', monospace)";
const BIG = "var(--dash-big, 'Inter Tight', sans-serif)";
const BLUE = '#0047FF';

/**
 * Free accounts see their real dashboard, blurred, under this card: the
 * locked preview (docs/LAUNCH-PLAN.md). Their own score is the hook; the
 * trial is the one action.
 */
export default function Paywall({
  handle,
  score,
  foundingLeft,
}: {
  handle: string;
  score: number;
  foundingLeft: number;
}) {
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
      aria-label="Start your BrandOS Pro trial"
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
          BrandOS Pro · {TRIAL_DAYS}-day free trial
        </div>
        <h1
          className="mt-4 text-[34px] leading-[1.02] sm:text-[42px]"
          style={{ fontFamily: BIG, fontWeight: 500, letterSpacing: '-0.035em' }}
        >
          Your dashboard is ready, @{handle}.
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
          Start your free trial to see what&apos;s moving it: score history, every post analyzed,
          your Brand Pass, and BrandOS inside Claude and ChatGPT.
        </p>
        <StartTrialButton signedIn next="/dashboard" className="mt-6" />
        <p className="mt-3 text-center text-[12px] leading-[1.5]" style={{ color: '#6B6B6B' }}>
          $29/month after {TRIAL_DAYS} days · card required · cancel before day {TRIAL_DAYS} and pay
          nothing
        </p>
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
