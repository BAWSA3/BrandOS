import { FIELD_FONTS } from './fieldFonts';

/**
 * The record's metadata, running across the field in IBM Plex Mono:
 *   DOC — 02 // THE INDEX №(0001) ENTRY No. 0042 CLASS 03 / BUILD.EXE …
 * A slow marquee (60s a loop), still for people who prefer reduced motion.
 * Decorative: the same facts must be readable elsewhere on the page.
 */
export default function MetaStrip({
  items,
  seconds = 60,
  className,
}: {
  items: string[];
  seconds?: number;
  className?: string;
}) {
  const line = items.join('   ');
  return (
    <div
      aria-hidden
      className={className}
      style={{
        background: 'var(--field)',
        color: '#fff',
        overflow: 'hidden',
        borderTop: '1px solid rgba(255,255,255,.35)',
        fontFamily: FIELD_FONTS.plex,
        fontSize: 13,
        letterSpacing: '0.04em',
      }}
    >
      <style>{`
        @keyframes metastrip-run { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @media (prefers-reduced-motion: reduce) { .metastrip-run { animation: none !important; } }
      `}</style>
      <div
        className="metastrip-run"
        style={{
          display: 'inline-flex',
          gap: 48,
          whiteSpace: 'nowrap',
          padding: '9px 0',
          animation: `metastrip-run ${seconds}s linear infinite`,
        }}
      >
        <span>{line}</span>
        <span>{line}</span>
      </div>
    </div>
  );
}
