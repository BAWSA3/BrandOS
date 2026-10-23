'use client';

import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type ReactNode,
} from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  AnimateText,
  Cursor,
  ScrambleText,
  Ticker,
  Typewriter,
  useMagneticPull,
} from 'motion-plus/react';
import { Button, SYSTEM_FONTS, useDitherWipe } from '@/components/system';
import { fieldMetrics } from '@/lib/field/system';

/**
 * The landing scroll's interaction layer (Direction 03, docs/BRAND-WORLD.md).
 * Motion+ pieces, each pointed at one thing:
 *   Cursor           the reading head: a white square that snaps to what it can read
 *   ScrambleText     labels and codes decoding (the machine's handwriting)
 *   AnimateText      the hero headline arriving word by word, clipped (never faded)
 *   Typewriter       example handles typed into the empty scan box
 *   useMagneticPull  the one action (Read my brand) pulls the cursor in
 *   Ticker           the live record strip and the Index entries
 * House rules: no fades, no blur, no glows; reduced motion = final state, no
 * cursor, no marquee; touch = no custom cursor, no magnetism.
 */

export const KLEIN = '#0047FF';
export const BONE = '#F2EFE8';
export const INK = '#0E0E0E';
export const CORAL = '#FF4B2B';

/** A mouse (or trackpad): hover exists and the pointer is precise. */
export function useFinePointer() {
  const [fine, setFine] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    const set = () => setFine(mq.matches);
    set();
    mq.addEventListener('change', set);
    return () => mq.removeEventListener('change', set);
  }, []);
  return fine;
}

/** Desktop motion: a fine pointer and motion welcome. */
export function useRichMotion() {
  const fine = useFinePointer();
  const reduce = useReducedMotion();
  return fine && !reduce;
}

/** True once the element has been `threshold` on screen (or at once for reduced motion). */
export function useArrived<T extends Element>(threshold = 0.25) {
  const ref = useRef<T>(null);
  const reduce = useReducedMotion();
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [seen, threshold]);
  return { ref, arrived: seen || !!reduce, reduce: !!reduce };
}

/** Mounts children only once the element is near the viewport (heavy pieces). */
export function NearViewport({
  children,
  minHeight,
  margin = '400px',
}: {
  children: ReactNode;
  minHeight: number | string;
  margin?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || near) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setNear(true), {
      rootMargin: margin,
    });
    io.observe(el);
    return () => io.disconnect();
  }, [near, margin]);
  return (
    <div ref={ref} style={{ minHeight: near ? undefined : minHeight }}>
      {near ? children : null}
    </div>
  );
}

// ── The cursor ────────────────────────────────────────────────────────────────

/**
 * The reading head. A small hollow square that follows the pointer and snaps
 * (magnetic) onto buttons and links as a frame. White on the field, Klein on
 * bone. Desktop with motion only; everyone else keeps the system cursor.
 */
export function LandingCursor() {
  const rich = useRichMotion();
  if (!rich) return null;
  return (
    <>
      {/* One cursor that never disappears (Motion+ hides the system cursor
          everywhere). It changes ink with the surface: white on the field, Klein
          on bone. It's a hollow frame in every state, including over buttons. */}
      <style>{`.lc-cursor, .lc-cursor[data-motion-cursor] { background-color: transparent !important; }
        .lc-calm .lc-cursor { border-color: ${KLEIN} !important; box-shadow: 0 0 0 1px ${BONE} !important; }`}</style>
      <CursorMount />
      <Cursor
        className="lc-cursor"
        magnetic={{ morph: true, padding: 6, snap: 0.8 }}
        style={{
          // A hollow frame, never a filled box: on a button it hugs the edge and
          // the label stays readable.
          background: 'transparent',
          border: '2px solid #fff',
          boxShadow: `0 0 0 1px ${KLEIN}`,
          borderRadius: 0,
          mixBlendMode: 'normal',
          zIndex: 2147483000,
        }}
      />
    </>
  );
}

/** True when the element sits on an opaque surface (a bone panel, card, form). */
const surfaceCache = new WeakMap<Element, boolean>();
export function onSurface(target: EventTarget | null): boolean {
  let el = target instanceof Element ? target : null;
  const start = el;
  if (start && surfaceCache.has(start)) return surfaceCache.get(start)!;
  let hit = false;
  while (el && el !== document.body) {
    // Full-width wrappers are the page behind the field, never a panel.
    if (el.getBoundingClientRect().width >= document.documentElement.clientWidth - 8) break;
    const bg = getComputedStyle(el).backgroundColor;
    const m = bg.match(/rgba?\(([^)]+)\)/);
    if (m) {
      const [r, g, b, a = '1'] = m[1].split(',').map((s) => s.trim());
      // Opaque and not the Klein field itself → a surface.
      if (
        Number(a) > 0.5 &&
        !(Number(r) < 20 && Number(g) > 50 && Number(g) < 90 && Number(b) > 230)
      ) {
        hit = true;
        break;
      }
    }
    el = el.parentElement;
  }
  if (start) surfaceCache.set(start, hit);
  return hit;
}

function CursorMount() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('lc-cursor-on');
    let raf = 0;
    const move = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => root.classList.toggle('lc-calm', onSurface(e.target)));
    };
    document.addEventListener('pointermove', move, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('pointermove', move);
      root.classList.remove('lc-cursor-on', 'lc-calm');
    };
  }, []);
  return null;
}

// ── Scramble + magnetic ───────────────────────────────────────────────────────

/** Text that decodes once on arrival, and again on hover/focus of its parent. */
export function Decode({
  children,
  on = true,
  hover = false,
  duration = 0.5,
  style,
  className,
}: {
  children: string;
  on?: boolean;
  /** Re-run when hovered/focused (use inside a button or link). */
  hover?: boolean;
  duration?: number;
  style?: CSSProperties;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const [run, setRun] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!hover || reduce) return;
    const host = ref.current?.closest('button, a, [data-decode]');
    if (!host) return;
    const go = () => setRun((n) => n + 1);
    host.addEventListener('pointerenter', go);
    host.addEventListener('focus', go);
    return () => {
      host.removeEventListener('pointerenter', go);
      host.removeEventListener('focus', go);
    };
  }, [hover, reduce]);
  if (reduce || !on) {
    return (
      <span ref={ref} style={style} className={className}>
        {children}
      </span>
    );
  }
  return (
    <span ref={ref} aria-label={children} style={style} className={className}>
      <ScrambleText
        key={run}
        aria-hidden
        duration={duration}
        interval={0.04}
        chars="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/·#"
      >
        {children}
      </ScrambleText>
    </span>
  );
}

/** Pulls the cursor toward it (and moves a little toward the cursor). Desktop only. */
export function Magnetic({ children, pull = 0.18 }: { children: ReactNode; pull?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const rich = useRichMotion();
  const { x, y } = useMagneticPull(ref, rich ? pull : 0);
  return (
    <motion.div ref={ref} style={{ x, y, display: 'block' }}>
      {children}
    </motion.div>
  );
}

/** The one action: a magnetic, decoding "Read my brand →" button. */
export const ReadButton = forwardRef<
  HTMLButtonElement,
  { busy?: boolean; label: string; busyLabel: string; style?: CSSProperties }
>(function ReadButton({ busy, label, busyLabel, style }, ref) {
  return (
    <Magnetic>
      <Button
        ref={ref}
        type="submit"
        disabled={busy}
        style={{ width: '100%', padding: '14px 18px', fontSize: 14, ...style }}
      >
        {busy ? busyLabel : <Decode hover>{label}</Decode>}
      </Button>
    </Magnetic>
  );
});

// ── The hero ──────────────────────────────────────────────────────────────────

/**
 * The hero headline: Motion+ AnimateText splits each line into words, and each
 * word rises into place inside a clip (a type reveal, not a fade). The motion
 * is CSS, so it plays from the server HTML before JavaScript arrives: the
 * headline is never blank while the page loads. Reduced motion: no animation.
 */
export function HeadlineReveal({ lines, style }: { lines: string[]; style?: CSSProperties }) {
  return (
    <span style={style} className="lc-headline">
      <style>{`
        @keyframes lc-rise { from { transform: translateY(115%); } to { transform: translateY(0); } }
        .lc-headline .lc-line { display: block; overflow: hidden; padding: 0.04em 0.06em 0.12em; margin: -0.04em -0.06em -0.12em; }
        .lc-headline .split-word { animation: lc-rise 760ms cubic-bezier(.16,1,.3,1) both; }
        .lc-headline .lc-line:nth-child(1) .split-word:nth-child(1) { animation-delay: 120ms; }
        .lc-headline .lc-line:nth-child(1) .split-word:nth-child(2) { animation-delay: 190ms; }
        .lc-headline .lc-line:nth-child(2) .split-word:nth-child(1) { animation-delay: 280ms; }
        .lc-headline .lc-line:nth-child(2) .split-word:nth-child(2) { animation-delay: 350ms; }
        .lc-headline .lc-line:nth-child(2) .split-word:nth-child(3) { animation-delay: 420ms; }
        .lc-headline .lc-line:nth-child(2) .split-word:nth-child(4) { animation-delay: 490ms; }
        @media (prefers-reduced-motion: reduce) { .lc-headline .split-word { animation: none; } }
      `}</style>
      {lines.map((l) => (
        <span key={l} className="lc-line">
          <AnimateText type="word">{l}</AnimateText>
        </span>
      ))}
    </span>
  );
}

/**
 * Example handles typed into the empty scan box (Motion+ Typewriter), so the
 * box says what it wants. Hidden once the visitor focuses or types; the input
 * keeps its own label for screen readers.
 */
export function TypedPlaceholder({
  handles,
  hidden,
}: {
  handles: readonly string[];
  hidden: boolean;
}) {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);
  const text = handles[i];
  useEffect(() => {
    if (reduce || hidden) return;
    const id = window.setInterval(() => setI((n) => (n + 1) % handles.length), 2600);
    return () => window.clearInterval(id);
  }, [reduce, hidden, handles.length]);
  if (hidden) return null;
  return (
    <span
      aria-hidden
      style={{
        position: 'absolute',
        left: 15,
        top: '50%',
        transform: 'translateY(-50%)',
        pointerEvents: 'none',
        fontFamily: SYSTEM_FONTS.plex,
        fontSize: 16,
        color: 'rgba(14,14,14,.45)',
        whiteSpace: 'nowrap',
      }}
    >
      {reduce ? (
        handles[0]
      ) : (
        <Typewriter
          speed="normal"
          replace="type"
          backspace="all"
          cursorStyle={{ background: KLEIN, width: 2 }}
        >
          {text}
        </Typewriter>
      )}
    </span>
  );
}

/**
 * The reading head on the field: the grid cell under the pointer gets a white
 * frame and its coordinates, as if the machine were reading that square. A
 * DOM overlay (no field redraw); hero only, desktop with motion only.
 */
export function CellReader({ host }: { host: React.RefObject<HTMLElement | null> }) {
  const rich = useRichMotion();
  const box = useRef<HTMLDivElement>(null);
  const tag = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = host.current;
    const b = box.current;
    if (!rich || !el || !b) return;
    let raf = 0;
    let last = '';
    const move = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        // Bare field only: never over a panel, a form or a button.
        const t = e.target instanceof Element ? e.target : null;
        if (onSurface(t) || t?.closest('a, button, input, textarea, select, [role="button"]')) {
          b.style.display = 'none';
          last = '';
          return;
        }
        const m = fieldMetrics(window.innerWidth, window.innerHeight);
        const c = Math.floor(e.clientX / m.grid);
        const r = Math.floor(e.clientY / m.grid);
        const key = `${c},${r}`;
        b.style.display = 'block';
        if (key === last) return;
        last = key;
        // fixed to the viewport: the field's grid is drawn in viewport space
        b.style.width = `${m.grid + 1}px`;
        b.style.height = `${m.grid + 1}px`;
        b.style.transform = `translate(${Math.round(c * m.grid)}px, ${Math.round(r * m.grid)}px)`;
        if (tag.current)
          tag.current.textContent = `C${String(c + 1).padStart(2, '0')} · R${String(r + 1).padStart(2, '0')}`;
      });
    };
    const leave = () => {
      b.style.display = 'none';
      last = '';
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerleave', leave);
    };
  }, [rich, host]);
  if (!rich) return null;
  return (
    <div
      ref={box}
      aria-hidden
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        display: 'none',
        border: '1px solid #fff',
        boxShadow: `inset 0 0 0 1px ${KLEIN}`,
        pointerEvents: 'none',
        zIndex: 5,
        transition: 'transform 90ms steps(2, end)',
      }}
    >
      <span
        ref={tag}
        style={{
          position: 'absolute',
          left: -1,
          top: -1,
          transform: 'translateY(-100%)',
          background: '#fff',
          color: KLEIN,
          fontFamily: SYSTEM_FONTS.plex,
          fontSize: 11,
          letterSpacing: '0.06em',
          padding: '3px 6px',
          whiteSpace: 'nowrap',
        }}
      />
    </div>
  );
}

// ── The live record strip ─────────────────────────────────────────────────────

/**
 * The record running along the bottom of the hero (Motion+ Ticker): live
 * numbers between the house lines. Slows to a crawl on hover; still for
 * reduced motion. Decorative: every fact is also on the page.
 */
export function LiveStrip({ items }: { items: string[] }) {
  const reduce = useReducedMotion();
  const nodes = items.map((t, i) => (
    <span
      key={`${t}-${i}`}
      style={{
        fontFamily: SYSTEM_FONTS.plex,
        fontSize: 13,
        letterSpacing: '0.04em',
        color: '#fff',
        whiteSpace: 'nowrap',
        padding: '0 22px',
      }}
    >
      {t}
    </span>
  ));
  return (
    <div
      aria-hidden
      style={{
        background: KLEIN,
        borderTop: '1px solid rgba(255,255,255,.35)',
        padding: '9px 0',
        overflow: 'hidden',
      }}
    >
      {reduce ? (
        <div style={{ display: 'flex', overflow: 'hidden' }}>{nodes}</div>
      ) : (
        <Ticker items={nodes} velocity={34} hoverFactor={0.15} gap={0} />
      )}
    </div>
  );
}

// ── The chapter rail ──────────────────────────────────────────────────────────

/**
 * A fixed index of the chapters on the right edge (desktop). The active chapter
 * is marked by a white square that slides to it (layout animation, no fade);
 * each entry is a real link to its anchor.
 */
export function ChapterRail({ chapters }: { chapters: { id: string; label: string }[] }) {
  const [active, setActive] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const els = chapters
      .map((c) => document.getElementById(c.id))
      .filter((e): e is HTMLElement => !!e);
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: '-45% 0px -50% 0px' }
    );
    els.forEach((e) => io.observe(e));
    const first = els[0];
    const show = () =>
      setVisible(!!first && first.getBoundingClientRect().top < window.innerHeight * 0.6);
    show();
    window.addEventListener('scroll', show, { passive: true });
    return () => {
      io.disconnect();
      window.removeEventListener('scroll', show);
    };
  }, [chapters]);
  return (
    <nav
      aria-label="Chapters"
      className="lc-rail"
      style={{
        position: 'fixed',
        right: 'clamp(12px, 2vw, 28px)',
        top: '50%',
        transform: `translateY(-50%) translateX(${visible ? 0 : 'calc(100% + 40px)'})`,
        transition: 'transform 420ms cubic-bezier(.16,1,.3,1)',
        zIndex: 40,
        display: 'grid',
        gap: 4,
      }}
    >
      <style>{`
        .lc-rail .lc-rail-label { display: none; }
        /* Only where it fits beside the 1180px content column; never over a panel. */
        @media (max-width: 1299px) { .lc-rail { display: none !important; } }
        .lc-rail:hover .lc-rail-label, .lc-rail:focus-within .lc-rail-label { display: inline; }
      `}</style>
      {chapters.map((c) => {
        const on = active === c.id;
        const [n, ...rest] = c.label.split(' / ');
        return (
          <a
            key={c.id}
            href={`#${c.id}`}
            aria-current={on ? 'true' : undefined}
            aria-label={c.label}
            className="sys-focus-field"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById(c.id)?.scrollIntoView({ behavior: 'smooth' });
              history.replaceState(null, '', `#${c.id}`);
            }}
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              justifyContent: 'flex-end',
              padding: '6px 10px',
              background: KLEIN,
              color: '#fff',
              textDecoration: 'none',
              fontFamily: SYSTEM_FONTS.plex,
              fontSize: 11,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            <span className="lc-rail-label">{rest.join(' / ')}</span>
            <span style={{ width: 22, textAlign: 'right' }}>{n}</span>
            <span
              aria-hidden
              style={{
                position: 'relative',
                width: 8,
                height: 8,
                border: '1px solid #fff',
              }}
            >
              {on && (
                <motion.span
                  layoutId="lc-rail-mark"
                  transition={{ type: 'spring', stiffness: 520, damping: 42 }}
                  style={{ position: 'absolute', inset: 1, background: '#fff' }}
                />
              )}
            </span>
          </a>
        );
      })}
    </nav>
  );
}

// ── The dither wipe into the scan ─────────────────────────────────────────────

/**
 * Wraps the closing scan form: a valid handle sends the field dot by dot over
 * the page, the page jumps back to the top while covered, and the scan starts.
 * The hero's own submit still does the work (same handler, BotID, analytics).
 */
export function WipeIntoScan({ children }: { children: ReactNode }) {
  const wipe = useDitherWipe();
  const pass = useRef(false);
  const onSubmitCapture = (e: FormEvent<HTMLDivElement>) => {
    if (pass.current) {
      pass.current = false;
      return;
    }
    const form = e.target as HTMLFormElement;
    const input = form.querySelector('input');
    if (!input || !/^@?[A-Za-z0-9_]{1,15}$/.test(input.value.trim())) return; // let the form show its error
    e.preventDefault();
    e.stopPropagation();
    wipe(() => {
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
      pass.current = true;
      form.requestSubmit();
    });
  };
  return <div onSubmitCapture={onSubmitCapture}>{children}</div>;
}
