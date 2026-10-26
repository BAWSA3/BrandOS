'use client';

import { useEffect, useId, useRef } from 'react';
import { motion, useReducedMotion } from 'motion/react';

/**
 * The idea board's post composer, laid out like X's compose box so an idea is
 * written the way it will be read: avatar, name and handle, a borderless page
 * that grows, a toolbar, and X's character ring. It saves to the board only;
 * nothing here posts to X (the toolbar icons are decorative).
 *
 * Colours follow X (white surface, #0F1419 / #536471 text) with Klein standing
 * in for X blue (BrandOS has one blue).
 */

export const X = {
  font: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  ink: '#0F1419',
  muted: '#536471',
  rule: '#EFF3F4',
  blue: '#0047FF',
  warn: '#FFD400',
  over: '#F4212E',
};

export const LIMIT = 280;

/** Characters as X counts them (code points; emoji count once). */
export const xLength = (text: string) => [...text].length;

export function Avatar({
  name,
  handle,
  avatarUrl,
  size = 40,
}: {
  name?: string | null;
  handle: string;
  avatarUrl?: string | null;
  size?: number;
}) {
  if (avatarUrl)
    return (
      // eslint-disable-next-line @next/next/no-img-element -- pbs.twimg.com avatar, small and already sized
      <img
        src={avatarUrl}
        alt=""
        width={size}
        height={size}
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  return (
    <span
      aria-hidden
      className="flex shrink-0 items-center justify-center rounded-full text-white"
      style={{
        width: size,
        height: size,
        background: X.blue,
        fontFamily: X.font,
        fontWeight: 700,
        fontSize: size * 0.42,
      }}
    >
      {(name || handle || '?').replace(/^@/, '')[0]?.toUpperCase()}
    </span>
  );
}

/** X's character ring: fills to 280, amber in the last 20, red and negative past it. */
export function CharRing({ length }: { length: number }) {
  const reduce = useReducedMotion();
  const left = LIMIT - length;
  const near = left <= 20;
  const size = near ? 30 : 20;
  const r = (size - 4) / 2;
  const c = 2 * Math.PI * r;
  const progress = Math.min(1, length / LIMIT);
  const color = left < 0 ? X.over : near ? X.warn : X.blue;
  // past -10, X drops the ring and keeps only the number
  const ring = left > -10;
  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: 30, height: 30 }}
      aria-hidden
    >
      {ring && (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={X.rule} strokeWidth={2} />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeDasharray={c}
            initial={false}
            animate={{ strokeDashoffset: c * (1 - progress), stroke: color }}
            transition={reduce ? { duration: 0 } : { duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          />
        </svg>
      )}
      {near && (
        <span
          className="absolute text-[13px] tabular-nums"
          style={{ fontFamily: X.font, color: left < 0 ? X.over : X.muted }}
        >
          {left}
        </span>
      )}
    </div>
  );
}

// X's compose toolbar, drawn as plain outlines (decorative)
const ICONS: { label: string; d: string }[] = [
  {
    label: 'Media',
    d: 'M3 5.5A2.5 2.5 0 0 1 5.5 3h13A2.5 2.5 0 0 1 21 5.5v13a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 18.5v-13ZM8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM5 18l4.5-5.5 3 3.5 2.5-3 4 5',
  },
  {
    label: 'GIF',
    d: 'M3 5.5A2.5 2.5 0 0 1 5.5 3h13A2.5 2.5 0 0 1 21 5.5v13a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 18.5v-13ZM10 10H8a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h2v-2h-1M12.5 10v4M15.5 14v-4h2.5M15.5 12h2',
  },
  { label: 'Poll', d: 'M5 6h14M5 12h9M5 18h11M3 6h.01M3 12h.01M3 18h.01' },
  {
    label: 'Emoji',
    d: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM8.5 14.5s1.2 2 3.5 2 3.5-2 3.5-2M9 9.5h.01M15 9.5h.01',
  },
  {
    label: 'Schedule',
    d: 'M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7ZM4 10h16M8 3v4M16 3v4M12 13v3l2 1',
  },
  {
    label: 'Location',
    d: 'M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21ZM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
  },
];

export default function XComposer({
  value,
  onChange,
  onSubmit,
  handle,
  name,
  avatarUrl,
  placeholder,
  submitLabel = 'Save idea',
  onCancel,
  autoFocus = false,
  toolbar = true,
  textareaRef,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  handle: string;
  name?: string | null;
  avatarUrl?: string | null;
  placeholder?: string;
  submitLabel?: string;
  onCancel?: () => void;
  autoFocus?: boolean;
  /** The decorative icon row; off where the composer is narrow (a card on the board). */
  toolbar?: boolean;
  textareaRef?: React.RefObject<HTMLTextAreaElement | null>;
}) {
  const ownRef = useRef<HTMLTextAreaElement>(null);
  const ref = textareaRef ?? ownRef;
  const id = useId();
  const length = xLength(value);
  const left = LIMIT - length;
  const empty = !value.trim();

  // the page grows with the idea, like X's composer; re-measured when the
  // column's width settles (at mount it can be measured before layout)
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => {
      el.style.height = 'auto';
      el.style.height = `${Math.max(52, el.scrollHeight)}px`;
    };
    fit();
    let width = el.clientWidth;
    const ro = new ResizeObserver(() => {
      if (el.clientWidth === width) return;
      width = el.clientWidth;
      fit();
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [value, ref]);

  useEffect(() => {
    if (!autoFocus) return;
    const el = ref.current;
    if (!el) return;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
  }, [autoFocus, ref]);

  return (
    <form
      className="flex gap-3"
      style={{ fontFamily: X.font, color: X.ink }}
      onSubmit={(e) => {
        e.preventDefault();
        if (!empty) onSubmit();
      }}
    >
      <Avatar name={name} handle={handle} avatarUrl={avatarUrl} />
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-baseline gap-1 text-[15px] leading-5">
          <span className="truncate font-bold">{name || handle}</span>
          <span className="truncate" style={{ color: X.muted }}>
            @{handle}
          </span>
        </div>
        <label htmlFor={id} className="sr-only">
          Write an idea as a post
        </label>
        <textarea
          id={id}
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              if (!empty) onSubmit();
            }
            if (e.key === 'Escape' && onCancel) onCancel();
          }}
          rows={2}
          placeholder={placeholder}
          aria-describedby={`${id}-count`}
          className="mt-1 block w-full resize-none overflow-hidden bg-transparent outline-none placeholder:text-[#536471]"
          style={{
            // site-wide form styles give textareas a grey box; this is X's borderless page
            border: 'none',
            borderRadius: 0,
            boxShadow: 'none',
            padding: '8px 0',
            width: '100%',
            maxWidth: 'none',
            background: 'transparent',
            fontFamily: X.font,
            fontSize: 20,
            lineHeight: '24px',
            color: X.ink,
          }}
        />
        <span id={`${id}-count`} className="sr-only" aria-live="polite">
          {left <= 20
            ? left < 0
              ? `${-left} characters over the 280 limit`
              : `${left} characters left`
            : ''}
        </span>
        <div className="mt-2 border-t" style={{ borderColor: X.rule }} />
        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="-ml-2 flex min-w-0 items-center overflow-hidden" aria-hidden>
            {(toolbar ? ICONS : []).map((ic) => (
              <span
                key={ic.label}
                title={ic.label}
                className="flex h-[34px] w-[34px] items-center justify-center rounded-full opacity-60"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={X.blue}
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d={ic.d} />
                </svg>
              </span>
            ))}
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {length > 0 && <CharRing length={length} />}
            {length > 0 && <span className="h-[30px] w-px" style={{ background: X.rule }} />}
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="rounded-full border px-4 text-[15px] font-bold leading-[34px] transition-colors hover:bg-[#F7F9F9]"
                style={{ borderColor: '#CFD9DE', color: X.ink }}
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={empty}
              className="rounded-full px-4 text-[15px] font-bold leading-9 text-white transition-opacity disabled:opacity-50"
              style={{ background: X.blue }}
            >
              {submitLabel}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
