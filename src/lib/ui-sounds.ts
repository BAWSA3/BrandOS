'use client';

// BrandOS UI sound effects (files in public/sounds, trimmed from the originals):
//   hover       a single short beep: hovering a button in the main menu / dashboard
//   alert       a notification: the brand score changed
//   levelUp     the station evolved (a floor was built) / the brand grew
//   transition  the main menu -> dashboard transition
// Web Audio for low latency and overlapping plays. Browsers block audio until
// a click/tap/keypress, so the context (re)unlocks on gestures; sounds requested
// while it can't run are skipped. One shared on/off setting (localStorage).

export type UISound = 'hover' | 'alert' | 'levelUp' | 'transition';

const SOURCES: Record<UISound, { src: string; volume: number }> = {
  hover: { src: '/sounds/ui-hover.mp3', volume: 0.26 },
  alert: { src: '/sounds/score-alert.mp3', volume: 0.6 },
  levelUp: { src: '/sounds/level-up.mp3', volume: 0.7 },
  transition: { src: '/sounds/transition.mp3', volume: 0.55 },
};

const STORAGE_KEY = 'bos-sound';
const EVENT = 'bos-sound-change';

let ctx: AudioContext | null = null;
const buffers = new Map<UISound, AudioBuffer>();
let loading: Promise<void> | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    try {
      ctx = new AudioContext();
    } catch {
      return null;
    }
  }
  return ctx;
}

function load(): Promise<void> {
  if (loading) return loading;
  const c = getCtx();
  if (!c) return Promise.resolve();
  loading = Promise.all(
    (Object.keys(SOURCES) as UISound[]).map(async (name) => {
      try {
        const res = await fetch(SOURCES[name].src);
        buffers.set(name, await c.decodeAudioData(await res.arrayBuffer()));
      } catch {
        // a missing sound just stays silent
      }
    })
  ).then(() => undefined);
  return loading;
}

let primed = false;

/** Preload, and (re)unlock audio on user gestures (call from top-level components). */
export function primeSounds() {
  if (typeof window === 'undefined') return;
  void load();
  if (primed) return;
  primed = true;
  // Not once-only: browsers can suspend the context again later (sleep, output
  // device change, background tab, Safari "interrupted"), and a gesture is the
  // reliable moment to wake it.
  const unlock = () => {
    const c = getCtx();
    if (c && c.state !== 'running') void c.resume().catch(() => {});
  };
  window.addEventListener('pointerdown', unlock, true);
  window.addEventListener('keydown', unlock, true);
}

export function isSoundOn(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== 'off';
  } catch {
    return true;
  }
}

export function setSoundOn(on: boolean) {
  try {
    window.localStorage.setItem(STORAGE_KEY, on ? 'on' : 'off');
  } catch {
    // storage unavailable: setting lasts for this page only
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: on }));
}

/** Subscribe to the shared on/off setting. Returns an unsubscribe. */
export function onSoundSetting(fn: (on: boolean) => void): () => void {
  const handler = (e: Event) => fn((e as CustomEvent<boolean>).detail);
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}

/** Play a sound now (no-op if muted, not yet unlocked, or not loaded). */
export function playSound(name: UISound) {
  if (typeof window === 'undefined' || !isSoundOn()) return;
  const c = getCtx();
  if (!c) return;
  const buf = buffers.get(name);
  if (!buf) {
    void load();
    return;
  }
  const start = () => {
    const src = c.createBufferSource();
    const gain = c.createGain();
    gain.gain.value = SOURCES[name].volume;
    src.buffer = buf;
    src.connect(gain).connect(c.destination);
    src.start();
  };
  if (c.state === 'running') return start();
  // suspended (no gesture yet, or the browser paused audio since): try to wake
  // it; this succeeds once the page has had a gesture, else stays silent
  c.resume()
    .then(() => {
      if (c.state === 'running') start();
    })
    .catch(() => {});
}
