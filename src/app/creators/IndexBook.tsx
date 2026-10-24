'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { AnimateNumber } from 'motion-plus/react';
import { DASH_FONTS } from '@/components/dashboard/dashFonts';
import { formatNumber, NICHES, type IndexFilters } from '@/lib/index-rules';
import { classify, classLabel, recordDate } from '@/lib/classifications';
import type { IndexCard, IndexPage } from '@/lib/creator-index';
import { FieldScreen } from '@/components/system';

// The Creator Index page: an editorial "book" (hairline frame, micro labels,
// big grotesk) of members' entries, in the institution's voice
// (docs/BRAND-WORLD.md: entry, classification, "/" not "·" in VCR text). One headline motion: the member count rolls
// up in Klein (Motion+ AnimateNumber); everything else stays still.

const MONO = DASH_FONTS.mono;
const SIGNAL = '#FF4B2B';
const BIG = DASH_FONTS.big;
const C = {
  bg: '#F2EFE8',
  panel: '#FAF8F3',
  ink: '#0E0E0E',
  muted: '#6B6862',
  rule: 'rgba(14,14,14,0.12)',
  blue: '#0047FF',
};

function Micro({ children, color = C.muted }: { children: React.ReactNode; color?: string }) {
  return (
    <div className="text-[10px] uppercase tracking-[0.18em]" style={{ fontFamily: MONO, color }}>
      {children}
    </div>
  );
}

/** A section label set on the field: white on a Klein backing, so the dots never cut through it. */
function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-block px-2 py-1 text-[10px] uppercase tracking-[0.18em]"
      style={{ fontFamily: MONO, background: C.blue, color: '#fff' }}
    >
      {children}
    </span>
  );
}

/** A section label: on the field it gets a Klein backing; otherwise the usual micro label. */
function SectionLabel({
  field,
  blue = false,
  children,
}: {
  field: boolean;
  blue?: boolean;
  children: React.ReactNode;
}) {
  return field ? (
    <FieldLabel>{children}</FieldLabel>
  ) : (
    <Micro color={blue ? C.blue : C.muted}>{children}</Micro>
  );
}

export function Card({
  c,
  pinned = false,
  own = false,
  sample = false,
}: {
  c: IndexCard;
  pinned?: boolean;
  /** On the field: the viewer's own entry, the one coral item on the page. */
  own?: boolean;
  /** Illustrative entry (the landing page before the Index opens): labelled, not a link. */
  sample?: boolean;
}) {
  const accent = c.featured || pinned;
  const Frame = sample ? SampleFrame : Link;
  return (
    <Frame
      href={`/@${c.handle}`}
      className="group flex flex-col border p-4 transition-colors md:p-5"
      style={{
        background: C.panel,
        borderColor: own ? SIGNAL : accent ? C.blue : C.rule,
        boxShadow: own ? `inset 0 0 0 1px ${SIGNAL}` : undefined,
        color: C.ink,
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <Micro color={accent ? C.blue : C.muted}>{formatNumber(c.number)}</Micro>
        {own ? (
          <span
            className="px-1.5 py-0.5 text-[10px] uppercase tracking-[0.18em]"
            style={{ fontFamily: MONO, background: SIGNAL, color: C.ink }}
          >
            Your entry
          </span>
        ) : sample ? (
          <Micro>Sample entry</Micro>
        ) : (
          c.featured && <Micro color={C.blue}>Featured</Micro>
        )}
      </div>
      <div className="mt-4 flex items-center gap-3">
        <Avatar src={c.avatar} handle={c.handle} />
        <div className="min-w-0">
          <div
            className="truncate text-[17px] leading-tight"
            style={{ fontFamily: BIG, fontWeight: 500 }}
          >
            @{c.handle}
          </div>
          <div className="mt-1 truncate">
            <Micro color={classify(c.archetype) ? C.blue : C.muted}>
              {classLabel(c.archetype, '/')}
            </Micro>
          </div>
        </div>
        {c.score !== null && (
          <div
            className="ml-auto text-[34px] leading-none"
            style={{ fontFamily: BIG, fontWeight: 500, letterSpacing: '-0.03em', color: C.blue }}
          >
            {c.score}
          </div>
        )}
      </div>
      {c.blurb && <p className="mt-4 text-[14px] leading-snug">{c.blurb}</p>}
      {c.niches.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {c.niches.map((n) => (
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
      {c.joinedAt && (
        <div className="mt-auto pt-4">
          <div className="border-t pt-3" style={{ borderColor: C.rule }}>
            <Micro>Entered {recordDate(c.joinedAt)}</Micro>
          </div>
        </div>
      )}
    </Frame>
  );
}

/** A sample card is not a link (there is no page to open). */
function SampleFrame({
  className,
  style,
  children,
}: {
  href: string;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  return (
    <div className={className} style={style}>
      {children}
    </div>
  );
}

/**
 * The member's X picture in full colour: in a directory, recognising someone
 * is the point (a grayscale filter turned solid-colour pictures into flat grey
 * squares). Falls back to their initial in Klein on Bone when there's no
 * picture or the saved URL has gone stale (X URLs 404 once a picture changes).
 */
function Avatar({ src, handle }: { src: string | null; handle: string }) {
  const [failed, setFailed] = useState(false);
  const img = useRef<HTMLImageElement>(null);
  // an image that failed before hydration never fires onError: check on mount
  useEffect(() => {
    const el = img.current;
    if (el && el.complete && el.naturalWidth === 0) setFailed(true);
  }, []);
  if (src && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- X avatars (pbs.twimg.com)
      <img
        ref={img}
        src={src.replace('_normal', '_200x200')}
        alt=""
        width={44}
        height={44}
        onError={() => setFailed(true)}
        className="h-11 w-11 shrink-0 object-cover"
        style={{ boxShadow: `inset 0 0 0 1px ${C.rule}` }}
      />
    );
  }
  return (
    <div
      aria-hidden
      className="flex h-11 w-11 shrink-0 items-center justify-center text-[20px] leading-none"
      style={{
        background: C.bg,
        border: `1px solid ${C.blue}`,
        fontFamily: BIG,
        fontWeight: 500,
        color: C.blue,
      }}
    >
      {handle[0]?.toUpperCase()}
    </div>
  );
}

function qs(f: IndexFilters, page: number) {
  const p = new URLSearchParams();
  if (f.niche) p.set('niche', f.niche);
  if (f.archetype) p.set('archetype', f.archetype);
  if (f.min > 0) p.set('min', String(f.min));
  if (f.max < 100) p.set('max', String(f.max));
  if (page > 1) p.set('page', String(page));
  const s = p.toString();
  return s ? `/index?${s}` : '/index';
}

export default function IndexBook({
  page,
  filters,
  pinned,
  viewer,
  preview,
  aggregates = null,
  field = false,
}: {
  page: IndexPage;
  filters: IndexFilters;
  pinned: IndexCard | null;
  viewer: {
    signedIn: boolean;
    member: { number: number; listed: boolean; handle: string } | null;
    /** The viewer's OWN reserved number (never anyone else's), until claimed. */
    reserved?: number | null;
  };
  /** Unclaimed reserved numbers and creators ever scanned (aggregates only). */
  aggregates?: { reserved: number; scanned: string | null } | null;
  /** Not public yet: admins and the private-beta allowlist only. */
  preview: boolean;
  /** Direction 03: the Index on the field (src/lib/field/switch.ts). */
  field?: boolean;
}) {
  const reduce = useReducedMotion();
  // AnimateNumber only rolls on a change after mount: start at 0
  const [count, setCount] = useState(0);
  useEffect(() => {
    const t = window.setTimeout(() => setCount(page.members), reduce ? 0 : 200);
    return () => window.clearTimeout(t);
  }, [page.members, reduce]);

  const filtered = !!(filters.niche || filters.archetype || filters.min > 0 || filters.max < 100);
  const joinHref = viewer.signedIn ? '/index/join' : '/signup?next=/index/join';
  const none = page.featured.length === 0 && page.cards.length === 0;

  const ownHandle = viewer.member?.listed ? viewer.member.handle.toLowerCase() : null;
  const isOwn = (c: IndexCard) => field && !!ownHandle && c.handle.toLowerCase() === ownHandle;
  // On the field, the header + filters and the footer sit on bone panels; cards sit on the field.
  const panel = field
    ? { background: C.bg, border: `1px solid ${C.rule}`, padding: '20px 20px 4px' }
    : undefined;

  const book = (
    <main
      className="min-h-screen"
      style={{ background: field ? 'transparent' : C.bg, color: C.ink }}
    >
      <div className="mx-auto max-w-[1200px] px-4 pb-20 pt-6 md:px-10 md:pt-10">
        <div style={panel}>
          {/* the frame: hairline + micro labels */}
          <div
            className="flex items-center justify-between border-b pb-3"
            style={{ borderColor: C.rule }}
          >
            <Link href="/">
              <Micro color={C.ink}>BrandOS</Micro>
            </Link>
            <div className="hidden sm:block">
              <Micro>The Creator Index</Micro>
            </div>
            <Micro>{preview ? 'Private beta' : 'Brands browse free'}</Micro>
          </div>

          <header className="grid gap-8 pt-10 md:grid-cols-[1fr_auto] md:items-end md:pt-16">
            <div>
              <h1
                className="text-[44px] leading-[0.92] md:text-[88px]"
                style={{ fontFamily: BIG, fontWeight: 500, letterSpacing: '-0.045em' }}
              >
                The BrandOS
                <br />
                Creator Index
              </h1>
              <p
                className="mt-5 max-w-[520px] text-[15px] leading-relaxed md:text-[17px]"
                style={{ color: C.muted }}
              >
                The record of creator reputation. Every entry is a BrandOS reading of real posts,
                not a follower count. Every member chose to be listed. Brands browse free.
              </p>
            </div>
            <div className="md:text-right">
              {/* overflow-hidden: rolling digits mustn't slide in from past the page edge on phones */}
              <div
                className="overflow-hidden text-[64px] leading-none md:text-[96px]"
                style={{
                  fontFamily: BIG,
                  fontWeight: 500,
                  letterSpacing: '-0.04em',
                  color: C.blue,
                }}
              >
                <AnimateNumber>{count}</AnimateNumber>
              </div>
              <Micro>{page.members === 1 ? 'Member' : 'Members'}</Micro>
              {aggregates && (aggregates.reserved > 0 || aggregates.scanned) ? (
                <div className="mt-2">
                  <Micro>
                    {[
                      aggregates.reserved > 0
                        ? `${aggregates.reserved.toLocaleString('en-US')} numbers reserved`
                        : null,
                      aggregates.scanned ? `${aggregates.scanned} creators scanned` : null,
                    ]
                      .filter(Boolean)
                      .join(' / ')}
                  </Micro>
                </div>
              ) : null}
              <div className="mt-5">
                {viewer.member ? (
                  <Link
                    href="/index/join"
                    className="inline-block border px-5 py-3 text-[12px] uppercase tracking-[0.14em]"
                    style={{ fontFamily: MONO, borderColor: C.blue, color: C.blue }}
                  >
                    {viewer.member.listed
                      ? `Entry ${formatNumber(viewer.member.number)} / Edit`
                      : `Entry ${formatNumber(viewer.member.number)} / Hidden / List again`}
                  </Link>
                ) : (
                  <Link
                    href={joinHref}
                    className="inline-block px-6 py-3.5 text-[12px] uppercase tracking-[0.14em] text-white"
                    style={{ fontFamily: MONO, background: C.blue }}
                  >
                    {viewer.reserved != null
                      ? `Claim ${formatNumber(viewer.reserved)} →`
                      : 'Join the Index →'}
                  </Link>
                )}
              </div>
            </div>
          </header>

          {/* filters: a plain GET form (works without JS) */}
          <form
            method="get"
            action="/index"
            className="mt-12 flex flex-wrap items-end gap-3 border-y py-4"
            style={{ borderColor: C.rule }}
          >
            <label className="flex flex-col gap-1.5">
              <Micro>Niche</Micro>
              <select
                name="niche"
                defaultValue={filters.niche ?? ''}
                className="border px-2 py-2 text-[13px]"
                style={{ borderColor: C.rule, background: C.panel, color: C.ink }}
              >
                <option value="">All</option>
                {NICHES.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <Micro>Classification</Micro>
              <select
                name="archetype"
                defaultValue={filters.archetype ?? ''}
                className="border px-2 py-2 text-[13px]"
                style={{ borderColor: C.rule, background: C.panel, color: C.ink }}
              >
                <option value="">All</option>
                {[...page.archetypes]
                  .sort((a, b) => (classify(a)?.number ?? 99) - (classify(b)?.number ?? 99))
                  .map((a) => (
                    <option key={a} value={a}>
                      {classLabel(a)}
                    </option>
                  ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <Micro>Score from</Micro>
              <input
                name="min"
                type="number"
                min={0}
                max={100}
                defaultValue={filters.min || ''}
                placeholder="0"
                className="w-20 border px-2 py-2 text-[13px]"
                style={{ borderColor: C.rule, background: C.panel, color: C.ink }}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <Micro>to</Micro>
              <input
                name="max"
                type="number"
                min={0}
                max={100}
                defaultValue={filters.max < 100 ? filters.max : ''}
                placeholder="100"
                className="w-20 border px-2 py-2 text-[13px]"
                style={{ borderColor: C.rule, background: C.panel, color: C.ink }}
              />
            </label>
            <button
              type="submit"
              className="border px-4 py-2 text-[11px] uppercase tracking-[0.14em]"
              style={{ fontFamily: MONO, borderColor: C.ink }}
            >
              Filter
            </button>
            {filtered && (
              <Link
                href="/index"
                className="px-2 py-2 text-[11px] uppercase tracking-[0.14em]"
                style={{ fontFamily: MONO, color: C.muted }}
              >
                Clear
              </Link>
            )}
            <div className="ml-auto">
              <Micro>
                {filtered
                  ? `${page.matching} matching`
                  : `${page.members} ${page.members === 1 ? 'entry' : 'entries'}`}
              </Micro>
            </div>
          </form>
        </div>

        {pinned && (
          <section className="mt-10">
            <SectionLabel field={field} blue>
              Shared with you
            </SectionLabel>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Card c={pinned} pinned own={isOwn(pinned)} />
            </div>
          </section>
        )}

        {page.featured.length > 0 && (
          <section className="mt-10">
            <SectionLabel field={field} blue>
              Featured / Founding Members
            </SectionLabel>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {page.featured.map((c) => (
                <Card key={c.number} c={c} own={isOwn(c)} />
              ))}
            </div>
          </section>
        )}

        {page.cards.length > 0 && (
          <section className="mt-10">
            <SectionLabel field={field}>
              {page.featured.length > 0 ? 'All entries / newest first' : 'Entries / newest first'}
            </SectionLabel>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {page.cards.map((c) => (
                <Card key={c.number} c={c} own={isOwn(c)} />
              ))}
            </div>
          </section>
        )}

        {none && (
          <section
            className="mt-16 border p-8 text-center md:p-12"
            style={{ borderColor: C.rule, background: C.panel }}
          >
            <div
              className="text-[28px] leading-tight md:text-[40px]"
              style={{ fontFamily: BIG, fontWeight: 500, letterSpacing: '-0.03em' }}
            >
              {filtered ? 'No one matches that yet.' : 'The first pages are still blank.'}
            </div>
            <p className="mx-auto mt-3 max-w-[420px] text-[15px]" style={{ color: C.muted }}>
              {filtered
                ? 'Try a wider score range or another niche.'
                : 'Early entries hold the low numbers. Join the Index to claim yours.'}
            </p>
            {!viewer.member && (
              <Link
                href={joinHref}
                className="mt-6 inline-block px-6 py-3.5 text-[12px] uppercase tracking-[0.14em] text-white"
                style={{ fontFamily: MONO, background: C.blue }}
              >
                Join the Index →
              </Link>
            )}
          </section>
        )}

        <div style={field ? { ...panel, marginTop: 40, padding: '4px 20px 16px' } : undefined}>
          {page.pages > 1 && (
            <nav
              className="mt-10 flex items-center justify-between border-t pt-4"
              style={{ borderColor: C.rule }}
            >
              {page.page > 1 ? (
                <Link
                  href={qs(filters, page.page - 1)}
                  style={{ fontFamily: MONO }}
                  className="text-[11px] uppercase tracking-[0.14em]"
                >
                  ← Newer
                </Link>
              ) : (
                <span />
              )}
              <Micro>
                Page {page.page} of {page.pages}
              </Micro>
              {page.page < page.pages ? (
                <Link
                  href={qs(filters, page.page + 1)}
                  style={{ fontFamily: MONO }}
                  className="text-[11px] uppercase tracking-[0.14em]"
                >
                  Older →
                </Link>
              ) : (
                <span />
              )}
            </nav>
          )}

          <footer
            className="mt-16 flex flex-wrap items-center justify-between gap-3 border-t pt-4"
            style={{ borderColor: C.rule }}
          >
            <Micro>Every member chose to be listed / leave any time</Micro>
            <Micro>One reading method for every entry / public X posts</Micro>
            <Micro>Founding Members see which brand teams viewed their entry</Micro>
          </footer>
        </div>
      </div>
    </main>
  );
  return field ? <FieldScreen signalCell="none">{book}</FieldScreen> : book;
}
