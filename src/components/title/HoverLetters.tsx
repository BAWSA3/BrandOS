'use client';

// Text whose letters hop up one after another (a stepped, 8-bit wave with a
// Klein-blue flash) each time `play` changes. Used by the title-screen menu
// and handle. Screen readers get the plain text.

export default function HoverLetters({
  text,
  play,
  className = '',
}: {
  text: string;
  play: number;
  className?: string;
}) {
  return (
    <span className={className} aria-label={text}>
      {Array.from(text).map((ch, i) => (
        <span
          // remount on each play so the animation restarts
          key={`${play}-${i}`}
          aria-hidden
          className={play > 0 ? 'hover-letter' : undefined}
          style={{ display: 'inline-block', animationDelay: `${i * 32}ms`, whiteSpace: 'pre' }}
        >
          {ch}
        </span>
      ))}
    </span>
  );
}
