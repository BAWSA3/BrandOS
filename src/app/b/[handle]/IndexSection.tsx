'use client';

import Link from 'next/link';
import { DASH_FONTS } from '@/components/dashboard/dashFonts';
import { formatNumber } from '@/lib/index-rules';
import type { MemberProfile } from '@/lib/creator-index';

// The Creator Index on a public /@handle page: the member strip (number,
// niches, their line for brands), and for members who stand out (a paid card)
// their score history and best posts. The owner of a page who isn't a member
// gets "Join the Index". Rendered only while the Index is open.

const MONO = DASH_FONTS.mono;
const BIG = DASH_FONTS.big;
const BLUE = '#0047FF';
const C = {
  panel: 'var(--p-panel)',
  ink: 'var(--p-ink)',
  muted: 'var(--p-muted)',
  rule: 'var(--p-rule)',
  track: 'var(--p-track)',
};

function Micro({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <div
      className="text-[10px] uppercase tracking-[0.14em]"
      style={{ fontFamily: MONO, color: color ?? C.muted }}
    >
      {children}
    </div>
  );
}

/** Score history as a hairline sparkline (Pro members). */
function History({ points }: { points: { at: string; score: number }[] }) {
  if (points.length < 2) {
    return (
      <p className="mt-3 text-[14px]" style={{ color: C.muted }}>
        History starts with the next brand read.
      </p>
    );
  }
  const W = 600;
  const H = 90;
  const xs = points.map((_, i) => (i / (points.length - 1)) * W);
  const lo = Math.min(...points.map((p) => p.score)) - 5;
  const hi = Math.max(...points.map((p) => p.score)) + 5;
  const ys = points.map((p) => H - ((p.score - lo) / Math.max(1, hi - lo)) * H);
  const d = xs.map((x, i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(' ');
  const first = points[0];
  const last = points[points.length - 1];
  return (
    <div className="mt-4">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-[90px] w-full"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path d={d} fill="none" stroke={BLUE} strokeWidth={2} vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="mt-2 flex justify-between">
        <Micro>
          {new Date(first.at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ·{' '}
          {first.score}
        </Micro>
        <Micro color={BLUE}>
          {new Date(last.at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ·{' '}
          {last.score}
        </Micro>
      </div>
    </div>
  );
}

export default function IndexSection({
  handle,
  member,
  ownerCanJoin,
}: {
  handle: string;
  member: MemberProfile | null;
  ownerCanJoin: boolean;
}) {
  if (!member && !ownerCanJoin) return null;
  if (!member) {
    return (
      <section
        className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-[12px] border p-5 md:p-7"
        style={{ background: C.panel, borderColor: C.rule, color: C.ink }}
      >
        <div>
          <Micro color={BLUE}>The BrandOS Creator Index</Micro>
          <p className="mt-2 text-[16px]">
            This is your page. List it where brands browse, and get your number.
          </p>
        </div>
        <Link
          href="/index/join"
          className="px-5 py-3 text-[11px] uppercase tracking-[0.14em] text-white"
          style={{ fontFamily: MONO, background: BLUE }}
        >
          Join the Index →
        </Link>
      </section>
    );
  }
  return (
    <section
      className="mt-8 rounded-[12px] border p-5 md:p-8"
      style={{ background: C.panel, borderColor: member.featured ? BLUE : C.rule, color: C.ink }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href={`/index?m=${handle}`}>
          <Micro color={BLUE}>BrandOS Creator Index · {formatNumber(member.number)}</Micro>
        </Link>
        <div className="flex items-center gap-3">
          {member.verified && <Micro color={BLUE}>✓ BrandOS Verified</Micro>}
          {member.featured && <Micro color={BLUE}>Featured member</Micro>}
        </div>
      </div>
      {member.blurb && (
        <p
          className="mt-4 text-[20px] leading-snug md:text-[24px]"
          style={{ fontFamily: BIG, fontWeight: 500, letterSpacing: '-0.02em' }}
        >
          {member.blurb}
        </p>
      )}
      {member.niches.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {member.niches.map((n) => (
            <span
              key={n}
              className="border px-2 py-1 text-[10px] uppercase tracking-[0.12em]"
              style={{ fontFamily: MONO, borderColor: C.rule, color: C.muted }}
            >
              {n}
            </span>
          ))}
        </div>
      )}
      {member.history && (
        <div className="mt-8">
          <Micro>Brand score over time</Micro>
          <History points={member.history} />
        </div>
      )}
      {member.best && member.best.length > 0 && (
        <div className="mt-8">
          <Micro>Best recent posts · BrandOS fit</Micro>
          <ul className="mt-3 space-y-3">
            {member.best.map((p) => (
              <li key={p.tweetId} className="grid grid-cols-[44px_1fr] gap-3">
                <span
                  className="text-[22px] leading-none"
                  style={{ fontFamily: BIG, fontWeight: 500, color: BLUE }}
                >
                  {p.fit}
                </span>
                <a
                  href={`https://x.com/${handle}/status/${p.tweetId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[14px] leading-relaxed hover:underline"
                >
                  {p.excerpt}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
