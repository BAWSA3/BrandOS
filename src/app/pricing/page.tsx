import type { Metadata } from 'next';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { hasPro, trialEndsAt } from '@/lib/billing';
import { foundingNumber, foundingSpotsLeft } from '@/lib/founding';
import { FOUNDING_SPOTS, TRIAL_DAYS } from '@/lib/plans';
import Wordmark from '@/components/Wordmark';
import StartTrialButton from '@/components/billing/StartTrialButton';
import ManageBillingButton from './ManageBillingButton';

// Launch pricing (docs/LAUNCH-PLAN.md): free scan + public page; Pro is the
// Brand Dashboard at $29/mo after a card-required 7-day trial. Founding 100
// keep $29 forever. Annual plans, coupons and Agency/Enterprise are out of
// scope for the launch.

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Pricing · BrandOS',
  description: `Know your reputation score before brands check it. Free scan, or BrandOS Pro at $29/month with a ${TRIAL_DAYS}-day free trial.`,
};

const MONO = "'VCR OSD Mono', 'JetBrains Mono', monospace";
const BIG = "'Inter Tight', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const BLUE = '#0047FF';
const INK = '#0E0E0E';
const MUTED = '#6B6862';

const FREE = [
  'Brand Score scan of your X account',
  'Your public brand page (mybrandos.app/@you)',
  'Compare your brand to anyone',
  'BrandOS in Claude and ChatGPT: 10 reads a week',
];
const PRO = [
  'The Brand Dashboard: your score, phases and what moved them',
  'Every post analyzed, with why it scored that way',
  'Score history and rescans',
  'Your Brand Pass and shareable score card',
  'BrandOS in Claude and ChatGPT: unlimited',
];

const day = (d: Date) =>
  d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ canceled?: string }>;
}) {
  const [user, left, sp] = await Promise.all([
    getCurrentUser().catch(() => null),
    foundingSpotsLeft(),
    searchParams,
  ]);
  const pro = user ? hasPro(user) : false;
  const trialEnd = user ? trialEndsAt(user) : null;
  const founding = user && pro ? await foundingNumber(user.id) : null;

  return (
    <main className="min-h-screen bg-[#F2EFE8] px-4 pb-20 pt-6 md:px-8" style={{ color: INK }}>
      <div className="mx-auto w-full max-w-[1040px]">
        <header className="flex items-center justify-between">
          <Wordmark height={24} />
          <Link
            href={user ? '/dashboard' : '/signup?next=/pricing'}
            className="text-[11px] uppercase tracking-[0.14em] hover:underline"
            style={{ fontFamily: MONO }}
          >
            {user ? 'My dashboard →' : 'Sign in'}
          </Link>
        </header>

        <h1
          className="mt-14 max-w-[820px] text-[44px] leading-[0.95] md:text-[76px]"
          style={{ fontFamily: BIG, fontWeight: 500, letterSpacing: '-0.04em' }}
        >
          Know your reputation score before brands check it.
        </h1>
        <p className="mt-5 max-w-[560px] text-[16px] leading-[1.55]" style={{ color: '#333' }}>
          Scan your brand for free. Go Pro for the full dashboard: what&apos;s working, what&apos;s
          drifting, and what to post next.
        </p>

        {sp.canceled && (
          <p
            className="mt-6 inline-block border px-3 py-2 text-[11px] uppercase tracking-[0.14em]"
            style={{ fontFamily: MONO, borderColor: 'rgba(14,14,14,0.15)', color: MUTED }}
            role="status"
          >
            Checkout canceled. Nothing was charged.
          </p>
        )}

        <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* Free */}
          <section
            className="flex flex-col border bg-[#FAF8F3] p-6 md:p-8"
            style={{ borderColor: 'rgba(14,14,14,0.1)' }}
          >
            <div
              className="text-[11px] uppercase tracking-[0.16em]"
              style={{ fontFamily: MONO, color: MUTED }}
            >
              Free
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span
                className="text-[56px] leading-none"
                style={{ fontFamily: BIG, fontWeight: 500, letterSpacing: '-0.04em' }}
              >
                $0
              </span>
            </div>
            <ul className="mt-6 space-y-2.5 text-[15px] leading-[1.45]">
              {FREE.map((f) => (
                <li key={f} className="flex gap-2">
                  <span style={{ color: MUTED }}>–</span>
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/"
              className="mt-auto block border px-5 py-4 text-center text-[12px] uppercase tracking-[0.16em] hover:bg-white"
              style={{ fontFamily: MONO, borderColor: INK, marginTop: 32 }}
            >
              Scan my brand →
            </Link>
          </section>

          {/* Pro */}
          <section className="flex flex-col p-6 text-white md:p-8" style={{ background: BLUE }}>
            <div
              className="flex items-center justify-between text-[11px] uppercase tracking-[0.16em]"
              style={{ fontFamily: MONO }}
            >
              <span>Pro</span>
              <span className="border border-white/60 px-2 py-[3px]">
                {TRIAL_DAYS}-day free trial
              </span>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span
                className="text-[56px] leading-none"
                style={{ fontFamily: BIG, fontWeight: 500, letterSpacing: '-0.04em' }}
              >
                $29
              </span>
              <span
                className="text-[13px] uppercase tracking-[0.12em] opacity-80"
                style={{ fontFamily: MONO }}
              >
                / month
              </span>
            </div>
            <ul className="mt-6 space-y-2.5 text-[15px] leading-[1.45]">
              {PRO.map((f) => (
                <li key={f} className="flex gap-2">
                  <span className="opacity-70">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-auto pt-8">
              {pro ? (
                <div className="bg-white p-4 text-[#0E0E0E]">
                  <div
                    className="text-[11px] uppercase tracking-[0.14em]"
                    style={{ fontFamily: MONO, color: BLUE }}
                  >
                    {trialEnd ? `Trial · ends ${day(trialEnd)}` : 'You have Pro'}
                    {founding ? ` · Founding #${String(founding).padStart(3, '0')}` : ''}
                  </div>
                  {trialEnd && (
                    <p className="mt-2 text-[13px] leading-[1.5]" style={{ color: '#333' }}>
                      Your card is charged $29 on {day(trialEnd)}. Cancel before then and you pay
                      nothing.
                    </p>
                  )}
                  <ManageBillingButton />
                </div>
              ) : (
                <div className="bg-white p-4">
                  <StartTrialButton signedIn={!!user} next="/pricing" />
                  <p
                    className="mt-3 text-center text-[12px] leading-[1.5]"
                    style={{ color: MUTED }}
                  >
                    Card required · $29/month after {TRIAL_DAYS} days · cancel before day{' '}
                    {TRIAL_DAYS} and pay nothing
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Founding 100 */}
        <section
          className="mt-5 grid grid-cols-1 items-center gap-4 border bg-[#FAF8F3] p-6 md:grid-cols-[auto_1fr] md:gap-10 md:p-8"
          style={{ borderColor: 'rgba(14,14,14,0.1)' }}
        >
          <div className="flex items-baseline gap-2">
            <span
              className="text-[56px] leading-none"
              style={{ fontFamily: BIG, fontWeight: 500, letterSpacing: '-0.04em', color: BLUE }}
            >
              {left}
            </span>
            <span
              className="text-[12px] uppercase tracking-[0.14em]"
              style={{ fontFamily: MONO, color: MUTED }}
            >
              of {FOUNDING_SPOTS} left
            </span>
          </div>
          <div>
            <div
              className="text-[11px] uppercase tracking-[0.16em]"
              style={{ fontFamily: MONO, color: BLUE }}
            >
              Founding 100
            </div>
            <p className="mt-2 text-[15px] leading-[1.55]" style={{ color: '#333' }}>
              The first {FOUNDING_SPOTS} paying members keep $29/month forever, even when prices go
              up, and get a short recorded brand teardown from Bawsa.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
