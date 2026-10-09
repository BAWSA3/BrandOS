'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import StationStage from '@/components/studio/StationStage';
import HoverLetters from '@/components/title/HoverLetters';
import { getArchetypeInfo } from '@/lib/archetype-descriptions';
import { STUDIO_STEPS, type StageNumber } from '@/lib/studio-stages';
import type { Mode } from '@/components/StationCard';

// The title screen (docs/specs/TITLE-SCREEN-AND-DASHBOARD.md): the user's
// station as the game's cover art, built as far as they've got, with a main
// menu. Keyboard (up/down/enter) and tap. Clicky menu sounds after the first
// interaction. Day/night follows the user's clock unless set in Settings.

const BLUE = '#0047FF';
const MONO = "'VCR OSD Mono', 'JetBrains Mono', monospace";

const SKIN: Record<Mode, { bg: string; ink: string; muted: string; rule: string; panel: string }> =
  {
    day: {
      bg: '#E8E9ED',
      ink: '#0E0E0E',
      muted: '#6B6B70',
      rule: 'rgba(14,14,14,0.14)',
      panel: 'rgba(255,255,255,0.55)',
    },
    night: {
      bg: '#010B10',
      ink: '#E6F1FF',
      muted: '#6A7D94',
      rule: 'rgba(230,241,255,0.12)',
      panel: 'rgba(10,17,24,0.7)',
    },
  };

type DayNight = 'auto' | Mode;

export interface TitleScreenProps {
  handle: string;
  archetype: string;
  stage: StageNumber;
  stationNumber?: number | null;
  lastSaved?: string; // e.g. "2h ago"
  continueHref: string;
  rescanHref: string;
  stationHref: string;
}

/** Tiny synthesized UI sounds (no audio files). Created lazily on first interaction. */
function useMenuSounds(enabled: boolean) {
  const ctxRef = useRef<AudioContext | null>(null);
  return useCallback(
    (kind: 'move' | 'select' | 'back') => {
      if (!enabled || typeof window === 'undefined') return;
      try {
        ctxRef.current ??= new AudioContext();
        const ctx = ctxRef.current;
        const now = ctx.currentTime;
        const blip = (freq: number, at: number, dur: number, vol: number) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(freq, now + at);
          gain.gain.setValueAtTime(vol, now + at);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + at + dur);
          osc.connect(gain).connect(ctx.destination);
          osc.start(now + at);
          osc.stop(now + at + dur);
        };
        if (kind === 'move') blip(1320, 0, 0.035, 0.035);
        if (kind === 'select') {
          blip(880, 0, 0.05, 0.05);
          blip(1760, 0.06, 0.08, 0.04);
        }
        if (kind === 'back') blip(520, 0, 0.06, 0.04);
      } catch {
        // audio unavailable: stay silent
      }
    },
    [enabled]
  );
}

export default function TitleScreen({
  handle,
  archetype,
  stage,
  stationNumber,
  lastSaved,
  continueHref,
  rescanHref,
  stationHref,
}: TitleScreenProps) {
  const router = useRouter();
  const info = getArchetypeInfo(archetype);
  const [dayNight, setDayNight] = useState<DayNight>('auto');
  const [clockMode, setClockMode] = useState<Mode>('day');
  const [sound, setSound] = useState(true);
  const [index, setIndex] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  // Bumps each time an item becomes the selection, replaying its letter wave.
  const [plays, setPlays] = useState<number[]>([1, 0, 0, 0]);
  const [handlePlay, setHandlePlay] = useState(0);
  const select = (i: number) => {
    setIndex(i);
    setPlays((p) => p.map((n, k) => (k === i ? n + 1 : n)));
  };
  const play = useMenuSounds(sound);

  // Day 06:00-18:00 by the user's clock, re-checked every minute.
  useEffect(() => {
    const tick = () => {
      const h = new Date().getHours();
      setClockMode(h >= 6 && h < 18 ? 'day' : 'night');
    };
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, []);
  const mode: Mode = dayNight === 'auto' ? clockMode : dayNight;
  const s = SKIN[mode];

  const items = [
    { label: 'Continue', hint: 'Enter your dashboard', run: () => router.push(continueHref) },
    { label: 'Rescan', hint: 'Run a fresh scan', run: () => router.push(rescanHref) },
    {
      label: 'My station',
      hint: 'Your public station + board',
      run: () => router.push(stationHref),
    },
    { label: 'Settings', hint: 'Sound, day/night, account', run: () => setSettingsOpen(true) },
  ];

  const choose = (i: number) => {
    play('select');
    // Let the confirm sound land before navigating.
    window.setTimeout(() => items[i].run(), 140);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (settingsOpen) {
        if (e.key === 'Escape') {
          play('back');
          setSettingsOpen(false);
        }
        return;
      }
      if (e.key === 'ArrowDown' || e.key === 's') {
        e.preventDefault();
        play('move');
        select((index + 1) % items.length);
      } else if (e.key === 'ArrowUp' || e.key === 'w') {
        e.preventDefault();
        play('move');
        select((index - 1 + items.length) % items.length);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        choose(index);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const built = STUDIO_STEPS.filter((st) => st.stage <= stage).map((st) => st.name);
  const nextStep = STUDIO_STEPS.find((st) => st.stage === stage + 1);

  return (
    <main
      className="title-screen relative min-h-screen overflow-hidden select-none"
      style={{
        background: s.bg,
        color: s.ink,
        transition: 'background 0.6s ease, color 0.6s ease',
      }}
    >
      {/* Night scanlines + vignette */}
      {mode === 'night' && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-10"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, rgba(0,255,136,0.035) 0px, rgba(0,255,136,0.035) 1px, transparent 1px, transparent 4px)',
          }}
        />
      )}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background: `radial-gradient(ellipse at 62% 45%, transparent 45%, ${mode === 'night' ? 'rgba(0,0,0,0.55)' : 'rgba(14,14,14,0.08)'} 100%)`,
        }}
      />

      <div className="relative z-20 mx-auto grid min-h-screen max-w-[1400px] grid-cols-1 items-center gap-6 px-6 py-8 md:grid-cols-[minmax(0,420px)_1fr] md:px-12">
        {/* Station (first on phones) */}
        <div className="order-first flex justify-center md:order-last">
          <div
            className="title-station w-full max-w-[min(300px,38vh)] md:max-w-[min(560px,62vh)]"
            style={{
              // feather the art's own background into the screen
              WebkitMaskImage:
                'radial-gradient(ellipse 72% 70% at 50% 52%, #000 62%, transparent 100%)',
              maskImage: 'radial-gradient(ellipse 72% 70% at 50% 52%, #000 62%, transparent 100%)',
            }}
          >
            <StationStage archetype={archetype} stage={stage} mode={mode} />
          </div>
        </div>

        {/* Logo, save file, menu */}
        <div className="flex flex-col">
          <div className="flex items-center gap-3">
            <div className="grid grid-cols-3 gap-[2px]" aria-hidden>
              {[1, 0, 1, 0, 1, 0, 1, 0, 1].map((on, i) => (
                <span
                  key={i}
                  className="h-[5px] w-[5px]"
                  style={{ background: on ? BLUE : 'transparent' }}
                />
              ))}
            </div>
            <span
              className="text-[11px] uppercase tracking-[0.2em]"
              style={{ fontFamily: MONO, color: s.muted }}
            >
              BrandOS
            </span>
          </div>

          <h1
            onMouseEnter={() => setHandlePlay((n) => n + 1)}
            className="mt-5 leading-[0.9]"
            style={{
              fontFamily: "'PP NeueBit', 'VCR OSD Mono', monospace",
              fontSize: 'clamp(44px, 8vw, 104px)',
              letterSpacing: '-0.01em',
            }}
          >
            <HoverLetters text={`@${handle}`} play={handlePlay} />
          </h1>

          {/* Save file */}
          <div
            className="mt-4 border-y py-3 text-[12px] uppercase tracking-[0.12em]"
            style={{ fontFamily: MONO, color: s.muted, borderColor: s.rule }}
          >
            <div className="flex justify-between gap-4">
              <span>
                {info?.name ?? archetype}
                {stationNumber ? ` · Station #${String(stationNumber).padStart(4, '0')}` : ''}
              </span>
              <span>Stage {stage}/3</span>
            </div>
            <div className="mt-1 flex justify-between gap-4">
              <span style={{ color: s.ink }}>
                {built.length ? `${built.join(' · ')} built` : 'Empty plot'}
              </span>
              {lastSaved && <span>Saved {lastSaved}</span>}
            </div>
          </div>

          {/* Menu */}
          <nav className="mt-6" aria-label="Main menu">
            <ul role="menu">
              {items.map((item, i) => {
                const active = i === index;
                return (
                  <li key={item.label} role="none">
                    <button
                      type="button"
                      role="menuitem"
                      onMouseEnter={() => {
                        if (index !== i) {
                          play('move');
                          select(i);
                        }
                      }}
                      onFocus={() => setIndex(i)}
                      onClick={() => choose(i)}
                      className="group flex w-full items-baseline gap-4 py-[6px] text-left outline-none"
                    >
                      <span
                        className="w-5 text-[18px]"
                        style={{ fontFamily: MONO, color: BLUE, opacity: active ? 1 : 0 }}
                        aria-hidden
                      >
                        ▶
                      </span>
                      <span
                        className="text-[30px] leading-none md:text-[34px]"
                        style={{
                          fontFamily: "'PP NeueBit', 'VCR OSD Mono', monospace",
                          color: active ? (mode === 'night' ? '#FFFFFF' : BLUE) : s.ink,
                          opacity: active ? 1 : 0.55,
                          transform: active ? 'translateX(4px)' : 'none',
                          transition: 'transform 0.15s steps(3), opacity 0.15s steps(3)',
                        }}
                      >
                        <HoverLetters text={item.label} play={plays[i]} />
                      </span>
                      <span
                        className="hidden text-[11px] uppercase tracking-[0.12em] sm:inline"
                        style={{ fontFamily: MONO, color: s.muted, opacity: active ? 1 : 0 }}
                      >
                        {item.hint}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {nextStep && (
            <div className="mt-6 text-[12px]" style={{ fontFamily: MONO, color: s.muted }}>
              NEXT FLOOR · {nextStep.name.toUpperCase()} · {nextStep.verb}
            </div>
          )}

          <div
            className="mt-10 hidden text-[11px] uppercase tracking-[0.14em] md:block"
            style={{ fontFamily: MONO, color: s.muted }}
          >
            ↑↓ select · enter confirm{sound ? '' : ' · sound off'}
          </div>
        </div>
      </div>

      {/* Settings */}
      {settingsOpen && (
        <div
          className="absolute inset-0 z-30 flex items-center justify-center p-6"
          style={{ background: 'rgba(0,0,0,0.45)' }}
        >
          <div
            className="w-full max-w-[380px] border p-6"
            style={{ background: s.bg, borderColor: s.rule, fontFamily: MONO }}
          >
            <div className="text-[12px] uppercase tracking-[0.16em]" style={{ color: s.muted }}>
              Settings
            </div>
            <div className="mt-5 flex items-center justify-between text-[14px] uppercase">
              <span>Sound</span>
              <button type="button" onClick={() => setSound((v) => !v)} style={{ color: BLUE }}>
                {sound ? 'On' : 'Off'}
              </button>
            </div>
            <div className="mt-4 flex items-center justify-between text-[14px] uppercase">
              <span>Day / night</span>
              <span className="flex gap-3">
                {(['auto', 'day', 'night'] as DayNight[]).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setDayNight(v)}
                    style={{ color: dayNight === v ? BLUE : s.muted }}
                  >
                    {v}
                  </button>
                ))}
              </span>
            </div>
            <div className="mt-4 flex items-center justify-between text-[14px] uppercase">
              <span>Account</span>
              <span style={{ color: s.muted }}>@{handle} · X connected</span>
            </div>
            <button
              type="button"
              className="mt-7 text-[13px] uppercase tracking-[0.14em]"
              style={{ color: s.muted }}
              onClick={() => {
                play('back');
                setSettingsOpen(false);
              }}
            >
              ◀ Back (esc)
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
