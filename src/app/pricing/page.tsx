import { proPrice, renewalTerms } from '@/lib/billing-terms';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { freeAccessEndsAt, isOpenAccess, isSubscribed, trialEndsAt } from '@/lib/billing';
import { CODE_TRIAL, CODE_TRIAL_DAYS } from '@/lib/early-access-rules';
import { foundingNumber, foundingSpotsLeft } from '@/lib/founding';
import { earlyAccessFor } from '@/lib/early-access';
import { FOUNDING_SPOTS, OPEN_ACCESS_UNTIL, TRIAL_DAYS } from '@/lib/plans';
import Wordmark from '@/components/Wordmark';
import StartTrialButton from '@/components/billing/StartTrialButton';
import ManageBillingButton from './ManageBillingButton';
import { FieldScreen } from '@/components/system';
import { fieldSystemOn } from '@/lib/field/switch-server';

// Launch pricing (docs/LAUNCH-PLAN.md, offer decided 2026-10-22): full access
// free for everyone until Dec 3; Founding 100 add a card before then to keep
// $29/mo for life (first charge Dec 3); Pro is $39/mo after. Once the window
// closes this page falls back to the card-required 7-day trial. Annual plans,
// coupons and Agency/Enterprise are out of scope for the launch.

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Pricing · BrandOS',
  description: CODE_TRIAL
    ? 'Know your reputation score before brands check it. BrandOS is invite-only: a code is 30 days free, no card; the first 100 keep $29/month for life.'
    : 'Know your reputation score before brands check it. BrandOS Studio is free for everyone until Dec 3; the first 100 keep $29/month for life.',
};

const MONO = "'VCR OSD Mono', var(--font-jetbrains), monospace";
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
  searchParams: Promise<{ canceled?: string; field?: string }>;
}) {
  const [user, left, sp] = await Promise.all([
    getCurrentUser().catch(() => null),
    foundingSpotsLeft(),
    searchParams,
  ]);
  // "has Pro" here means paid / card on file: open access makes hasPro() true for all
  const pro = user ? isSubscribed(user) : false;
  const open = isOpenAccess();
  // free access still running for this person: the launch window, or (invite-only
  // trial) their own 30 days from a code; a card locks the price until it ends
  const freeEnd = user && !pro ? freeAccessEndsAt(user) : open ? OPEN_ACCESS_UNTIL : null;
  const until = day(freeEnd ?? OPEN_ACCESS_UNTIL);
  // invite-only: their code's 30 days are over (no second trial; pay from today)
  const codeEnded = CODE_TRIAL && !!user?.freeUntil && !freeEnd && !pro;
  const trialEnd = user ? trialEndsAt(user) : null;
  const founding = user && pro ? await foundingNumber(user.id) : null;
  // early-access code holders keep the Founding price after the 100 seats are gone
  const priceLocked = left > 0 || (!!user && !!(await earlyAccessFor(user.id))?.perkFoundingPrice);
  // Direction 03 (src/lib/field/switch.ts): the page on the field, reading on bone panels
  const field = await fieldSystemOn(sp, user);
  const intro = field
    ? {
        background: '#F2EFE8',
        border: '1px solid rgba(14,14,14,0.1)',
        padding: 'clamp(20px, 3vw, 32px)',
      }
    : undefined;

  const page = (
    <main
      className={`min-h-screen px-4 pb-20 pt-6 md:px-8 ${field ? '' : 'bg-[#F2EFE8]'}`}
      style={{ color: INK }}
    >
      <div className="mx-auto w-full max-w-[1040px]">
        <div style={intro}>
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
            {open
              ? `Full access is free for everyone until ${until}: the full dashboard, what's working, what's drifting, and what to post next. The first ${FOUNDING_SPOTS} to add a card keep $29/month for life.`
              : CODE_TRIAL
                ? `Your read is free for anyone. BrandOS itself is invite-only: a code is ${CODE_TRIAL_DAYS} days of the full dashboard, no card. The first ${FOUNDING_SPOTS} to add a card keep $29/month for life.`
                : "Scan your brand for free. Go Pro for the full dashboard: what's working, what's drifting, and what to post next."}
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
        </div>

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
          <section
            className="flex flex-col p-6 text-white md:p-8"
            style={{
              background: BLUE,
              // On the field the Klein plan needs an edge, or it melts into the blue
              ...(field ? { outline: '1px solid rgba(255,255,255,0.9)', outlineOffset: -1 } : {}),
            }}
          >
            <div
              className="flex items-center justify-between text-[11px] uppercase tracking-[0.16em]"
              style={{ fontFamily: MONO }}
            >
              <span>Pro</span>
              <span className="border border-white/60 px-2 py-[3px]">
                {freeEnd
                  ? `Free until ${until}`
                  : CODE_TRIAL
                    ? `${CODE_TRIAL_DAYS} days free with a code`
                    : `${TRIAL_DAYS}-day free trial`}
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
            {(open || CODE_TRIAL) && (
              <p
                className="mt-2 text-[11px] uppercase tracking-[0.14em] opacity-80"
                style={{ fontFamily: MONO }}
              >
                {priceLocked ? `for life, founding 100 · $39/month after` : '$39/month'}
              </p>
            )}
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
                    {trialEnd
                      ? founding
                        ? `First charge ${day(trialEnd)}`
                        : `Trial · ends ${day(trialEnd)}`
                      : 'You have Pro'}
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
                  {CODE_TRIAL && !user ? (
                    // invite-only trial: signed-out visitors get a code first
                    <Link
                      href="/access?next=/pricing"
                      className="block w-full px-4 py-3.5 text-center text-[12px] uppercase tracking-[0.14em] text-white"
                      style={{ fontFamily: MONO, background: BLUE }}
                    >
                      Get a code →
                    </Link>
                  ) : (
                    <StartTrialButton
                      signal={field}
                      signedIn={!!user}
                      next="/pricing"
                      label={
                        freeEnd
                          ? priceLocked
                            ? 'Lock in $29 for life'
                            : `Keep Pro after ${until}`
                          : codeEnded
                            ? 'Get Pro'
                            : undefined
                      }
                    />
                  )}
                  <p
                    className="mt-3 text-center text-[12px] leading-[1.5]"
                    style={{ color: MUTED }}
                  >
                    {CODE_TRIAL && !user
                      ? `Invite-only · a code is ${CODE_TRIAL_DAYS} days of everything, no card`
                      : renewalTerms(
                          proPrice(priceLocked),
                          freeEnd
                            ? { kind: 'on', date: until }
                            : codeEnded
                              ? { kind: 'today' }
                              : { kind: 'after-trial', days: TRIAL_DAYS }
                        )}
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
              {freeEnd
                ? `Add a card before ${until} and keep $29/month for life (your first charge is ${until}), plus a short recorded brand teardown from Bawsa. After the first ${FOUNDING_SPOTS}, Pro is $39/month.`
                : `The first ${FOUNDING_SPOTS} paying members keep $29/month forever, even when prices go up, and get a short recorded brand teardown from Bawsa.`}
            </p>
          </div>
        </section>
      </div>
    </main>
  );
  return field ? <FieldScreen signalCell="none">{page}</FieldScreen> : page;
}
