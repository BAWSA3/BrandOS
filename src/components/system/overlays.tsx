'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { FIELD } from '@/lib/field/dither';
import { BONE, HAIRLINE, INK, fieldMetrics, wipeCovered } from '@/lib/field/system';
import { SYSTEM_FONTS } from './primitives';

/**
 * Toasts, the modal and the dither wipe (docs/BRAND-WORLD.md, Direction 03).
 * Toasts slide in from the edge and press into place; they leave on a cut.
 * The modal opens with a press and closes on a cut. Nothing fades.
 */

// ── Toasts ────────────────────────────────────────────────────────────────────
type Toast = { id: number; title: string; body?: string; label?: string };
const ToastCtx = createContext<(t: Omit<Toast, 'id'>) => void>(() => {});

export const useToast = () => useContext(ToastCtx);

export function ToastProvider({
  children,
  duration = 4200,
}: {
  children: ReactNode;
  duration?: number;
}) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const next = useRef(1);
  const push = useCallback(
    (t: Omit<Toast, 'id'>) => {
      const id = next.current++;
      setToasts((all) => [...all.slice(-2), { ...t, id }]);
      setTimeout(() => setToasts((all) => all.filter((x) => x.id !== id)), duration);
    },
    [duration]
  );
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div
        role="status"
        aria-live="polite"
        style={{
          position: 'fixed',
          right: 'max(16px, env(safe-area-inset-right, 0px))',
          bottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          zIndex: 60,
          width: 'min(360px, calc(100vw - 32px))',
          pointerEvents: 'none',
        }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="sys-anim"
            style={{
              background: BONE,
              color: INK,
              border: `1px solid ${HAIRLINE}`,
              padding: '14px 16px',
              animation:
                'sys-slide 260ms cubic-bezier(.16,1,.3,1), sys-press 200ms 220ms cubic-bezier(.16,1,.3,1)',
              pointerEvents: 'auto',
            }}
          >
            {t.label && (
              <div
                style={{
                  fontFamily: SYSTEM_FONTS.vcr,
                  fontSize: 10,
                  letterSpacing: '.16em',
                  textTransform: 'uppercase',
                  color: FIELD,
                  marginBottom: 4,
                }}
              >
                {t.label}
              </div>
            )}
            <div style={{ fontFamily: SYSTEM_FONTS.display, fontWeight: 700, fontSize: 15 }}>
              {t.title}
            </div>
            {t.body && (
              <div
                style={{
                  fontFamily: SYSTEM_FONTS.plex,
                  fontSize: 12.5,
                  marginTop: 4,
                  color: 'rgba(14,14,14,.7)',
                }}
              >
                {t.body}
              </div>
            )}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────
export function Modal({
  open,
  onClose,
  label,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  label?: string;
  title: string;
  children: ReactNode;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const opener = useRef<Element | null>(null);

  useEffect(() => {
    if (!open) return;
    opener.current = document.activeElement;
    const first = panel.current?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    (first ?? panel.current)?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key !== 'Tab' || !panel.current) return;
      const els = [
        ...panel.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        ),
      ];
      if (!els.length) return;
      const [a, z] = [els[0], els[els.length - 1]];
      if (e.shiftKey && document.activeElement === a) {
        e.preventDefault();
        z.focus();
      } else if (!e.shiftKey && document.activeElement === z) {
        e.preventDefault();
        a.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      (opener.current as HTMLElement | null)?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null; // closing is a cut
  return (
    <div
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        background: 'rgba(0, 18, 70, 0.62)', // the field, darkened
        display: 'grid',
        placeItems: 'center',
        padding: 16,
      }}
    >
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="sys-anim"
        style={{
          background: BONE,
          color: INK,
          border: `1px solid ${HAIRLINE}`,
          width: 'min(520px, 100%)',
          maxHeight: 'calc(100vh - 32px)',
          overflow: 'auto',
          padding: 28,
          animation: 'sys-press 220ms cubic-bezier(.16,1,.3,1)',
          outline: 'none',
        }}
      >
        {label && (
          <div
            style={{
              fontFamily: SYSTEM_FONTS.vcr,
              fontSize: 11,
              letterSpacing: '.16em',
              textTransform: 'uppercase',
              color: 'rgba(14,14,14,.62)',
            }}
          >
            {label}
          </div>
        )}
        <h2
          style={{
            fontFamily: SYSTEM_FONTS.display,
            fontWeight: 700,
            fontSize: 30,
            letterSpacing: '-0.03em',
            margin: '8px 0 14px',
          }}
        >
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}

// ── Dither wipe ───────────────────────────────────────────────────────────────
/**
 * A screen change as the field drawing over the page and back, dot by dot:
 *   const wipe = useDitherWipe();
 *   wipe(() => setView('next'));
 * The callback runs while the screen is covered. Reduced motion: it runs at once.
 * Wrap the app (or page) in <DitherWipeProvider> once; it owns the wipe canvas.
 */
type WipeFn = (swap: () => void) => void;
const WipeCtx = createContext<WipeFn>((swap) => swap());
export const useDitherWipe = () => useContext(WipeCtx);

export function DitherWipeProvider({ children, ms = 340 }: { children: ReactNode; ms?: number }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const busy = useRef(false);

  const wipe = useCallback<WipeFn>(
    (swap) => {
      const c = canvas.current;
      if (busy.current) return;
      if (!c || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        swap();
        return;
      }
      busy.current = true;
      const w = window.innerWidth;
      const h = window.innerHeight;
      // coarse cells: the wipe reads as dots, and it's cheap
      const cell = Math.max(12, fieldMetrics(w, h).cell * 3);
      const cols = Math.ceil(w / cell);
      const rows = Math.ceil(h / cell);
      c.width = w;
      c.height = h;
      c.style.display = 'block';
      const g = c.getContext('2d')!;
      const draw = (p: number, reverse: boolean) => {
        g.clearRect(0, 0, w, h);
        g.fillStyle = FIELD;
        for (let y = 0; y < rows; y++)
          for (let x = 0; x < cols; x++) {
            const on = reverse ? !wipeCovered(x, y, cols, p) : wipeCovered(x, y, cols, p);
            if (on) g.fillRect(x * cell, y * cell, cell, cell);
          }
      };
      const run = (reverse: boolean, done: () => void) => {
        const t0 = performance.now();
        const step = (now: number) => {
          const p = Math.min(1, (now - t0) / ms);
          draw(p, reverse);
          if (p < 1) requestAnimationFrame(step);
          else done();
        };
        requestAnimationFrame(step);
      };
      run(false, () => {
        swap();
        run(true, () => {
          c.style.display = 'none';
          busy.current = false;
        });
      });
    },
    [ms]
  );

  return (
    <WipeCtx.Provider value={wipe}>
      {children}
      <canvas
        ref={canvas}
        aria-hidden
        style={{
          position: 'fixed',
          inset: 0,
          width: '100%',
          height: '100%',
          zIndex: 70,
          pointerEvents: 'none',
          display: 'none',
        }}
      />
    </WipeCtx.Provider>
  );
}
