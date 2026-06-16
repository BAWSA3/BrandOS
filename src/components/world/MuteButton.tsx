'use client';

import { useWorld } from './WorldProvider';

export default function MuteButton() {
  const { world, audio, reducedMotion } = useWorld();

  if (!world.audio?.ambient) return null;
  if (reducedMotion) return null;

  const label = audio.enabled
    ? 'Mute ambient audio'
    : audio.unlocked
      ? 'Unmute ambient audio'
      : 'Enable ambient audio';

  return (
    <button
      type="button"
      aria-label={label}
      onClick={() => audio.toggle()}
      className="fixed bottom-4 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full border backdrop-blur-sm transition-opacity hover:opacity-100"
      style={{
        borderColor: 'var(--border)',
        backgroundColor: 'var(--surface)',
        color: 'var(--text-secondary)',
        opacity: 0.7,
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M11 5L6 9H2v6h4l5 4V5z" strokeLinecap="round" strokeLinejoin="round" />
        {audio.enabled ? (
          <>
            <path d="M15.54 8.46a5 5 0 010 7.07" strokeLinecap="round" />
            <path d="M19.07 4.93a10 10 0 010 14.14" strokeLinecap="round" />
          </>
        ) : (
          <path d="M23 9l-6 6m0-6l6 6" strokeLinecap="round" />
        )}
      </svg>
    </button>
  );
}
