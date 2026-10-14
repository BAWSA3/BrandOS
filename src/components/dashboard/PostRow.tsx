'use client';

import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import type { RecentPost } from '@/components/dashboard/BentoDashboard';

// One row of "Recent posts analyzed". Collapsed: excerpt, when, likes vs
// usual, fit bar + score. Click (or Enter) to drop down the breakdown: a
// verdict, why it scored that way, voice / format / hook, what fit, what
// drifted, and what to try next time. Suggests, never rewrites.

const MONO = "var(--dash-mono, 'VCR OSD Mono', monospace)";
const BIG = "var(--dash-big, 'Inter Tight', sans-serif)";
const BLUE = '#0047FF';

function verdict(fit: number) {
  return fit >= 80 ? 'On-brand' : fit >= 60 ? 'Close' : 'Off-brand';
}

function Micro({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <span
      className="text-[10px] uppercase tracking-[0.14em]"
      style={{ fontFamily: MONO, color: color ?? 'var(--d-muted)' }}
    >
      {children}
    </span>
  );
}

export default function PostRow({
  post,
  top,
  open,
  onToggle,
  bar,
  figure,
  studioHref,
}: {
  post: RecentPost;
  top: boolean;
  open: boolean;
  onToggle: () => void;
  /** The fit bar (FitBar) from the bento, so the refill-on-hover still works. */
  bar: React.ReactNode;
  /** The rolling fit number. */
  figure: React.ReactNode;
  /** "Build on this" link for Next-time suggestion #i (the studio brainstorm). */
  studioHref?: (i: number) => string;
}) {
  const reduce = useReducedMotion();
  const b = post.breakdown;
  const panelId = `post-${post.id}`;

  return (
    <li className="border-t" style={{ borderColor: 'var(--d-rule)' }}>
      <button
        type="button"
        onClick={b ? onToggle : undefined}
        aria-expanded={b ? open : undefined}
        aria-controls={b ? panelId : undefined}
        disabled={!b}
        className="group grid w-full grid-cols-[1fr_auto] items-center gap-4 py-3 text-left"
      >
        <div className="min-w-0">
          <div className="truncate text-[14px]">{post.excerpt}</div>
          <div className="mt-1 flex flex-wrap items-center gap-x-2">
            <Micro>
              {post.when} · {post.likes} likes · {post.multiple} usual
            </Micro>
            {b && <Micro color={BLUE}>{open ? 'Hide breakdown ▴' : 'Why this score ▾'}</Micro>}
          </div>
          <div className="mt-2 h-[3px] w-full" style={{ background: 'var(--d-track)' }}>
            {bar}
          </div>
        </div>
        <span
          className="w-[64px] text-right text-[30px] leading-none"
          style={{ fontFamily: BIG, fontWeight: 500, color: top ? BLUE : 'var(--d-ink)' }}
        >
          {figure}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && b && (
          <motion.div
            id={panelId}
            key="panel"
            initial={reduce ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={reduce ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-4 pb-5 pt-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="px-2 py-[3px] text-[10px] uppercase tracking-[0.14em] text-white"
                  style={{ fontFamily: MONO, background: post.fit >= 80 ? BLUE : 'var(--d-ink)' }}
                >
                  {verdict(post.fit)} · {post.fit}
                </span>
                {[b.voice && `Voice: ${b.voice}`, b.format && `Format: ${b.format}`]
                  .filter(Boolean)
                  .map((t) => (
                    <span
                      key={t as string}
                      className="border px-2 py-[2px] text-[12px]"
                      style={{ borderColor: 'var(--d-rule)', color: 'var(--d-muted)' }}
                    >
                      {t}
                    </span>
                  ))}
              </div>

              <p className="text-[14px] leading-relaxed">{b.why}</p>
              {b.hook && (
                <p className="text-[13px] leading-relaxed" style={{ color: 'var(--d-muted)' }}>
                  <Micro>Hook</Micro> <span className="ml-1">{b.hook}</span>
                </p>
              )}

              {(b.fits.length > 0 || b.misses.length > 0) && (
                <div className="space-y-4">
                  {b.fits.length > 0 && (
                    <div>
                      <Micro>What fit</Micro>
                      <ul className="mt-2 space-y-1.5">
                        {b.fits.map((t, i) => (
                          <li key={i} className="flex gap-2 text-[13px] leading-relaxed">
                            <span aria-hidden style={{ color: BLUE }}>
                              ✓
                            </span>
                            <span>{t}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {b.misses.length > 0 && (
                    <div>
                      <Micro>What drifted</Micro>
                      <ul className="mt-2 space-y-1.5">
                        {b.misses.map((t, i) => (
                          <li key={i} className="flex gap-2 text-[13px] leading-relaxed">
                            <span aria-hidden style={{ color: 'var(--d-muted)' }}>
                              ~
                            </span>
                            <span>{t}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {b.sharpen.length > 0 && (
                <div className="border-l-2 pl-3" style={{ borderColor: BLUE }}>
                  <Micro color={BLUE}>Next time</Micro>
                  <ul className="mt-2 space-y-1.5">
                    {b.sharpen.map((t, i) => (
                      <li key={i} className="flex gap-2 text-[13px] leading-relaxed">
                        <span aria-hidden style={{ color: BLUE, fontFamily: MONO, fontSize: 11 }}>
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <span className="flex-1">
                          {t}
                          {studioHref && (
                            <Link
                              href={studioHref(i)}
                              className="ml-2 whitespace-nowrap text-[10px] uppercase tracking-[0.14em] hover:underline"
                              style={{ fontFamily: MONO, color: BLUE }}
                            >
                              Build on this →
                            </Link>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {post.url && (
                <a
                  href={post.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block hover:underline"
                >
                  <Micro color="var(--d-ink)">View post on X ↗</Micro>
                </a>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}
