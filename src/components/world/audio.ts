'use client';

import type { WorldAudio, WorldAudioTrack } from '@/worlds/types';

const STORAGE_KEY = 'worldAudio.enabled';

export class WorldAudioController {
  private ambient: HTMLAudioElement | null = null;
  private currentTrack: WorldAudioTrack | null = null;
  private unlocked = false;
  private enabledPref: boolean;

  constructor() {
    this.enabledPref = readPref();
  }

  get enabled(): boolean {
    return this.enabledPref;
  }

  get isUnlocked(): boolean {
    return this.unlocked;
  }

  setAudio(audio: WorldAudio | undefined) {
    this.stop();
    const track = audio?.ambient ?? null;
    this.currentTrack = track;
    if (!track) return;
    if (this.enabledPref && this.unlocked) {
      this.play();
    }
  }

  unlock() {
    if (this.unlocked) return;
    this.unlocked = true;
    if (this.enabledPref && this.currentTrack) {
      this.play();
    }
  }

  toggle(): boolean {
    this.enabledPref = !this.enabledPref;
    writePref(this.enabledPref);
    if (this.enabledPref) {
      if (this.unlocked && this.currentTrack) this.play();
    } else {
      this.stop();
    }
    return this.enabledPref;
  }

  private play() {
    if (!this.currentTrack) return;
    if (!this.ambient) {
      this.ambient = new Audio(this.currentTrack.src);
      this.ambient.loop = this.currentTrack.loop;
      this.ambient.preload = 'none';
      this.ambient.volume = 0;
    } else if (this.ambient.src !== resolveUrl(this.currentTrack.src)) {
      this.ambient.src = this.currentTrack.src;
    }
    const targetVolume = Math.max(0, Math.min(1, this.currentTrack.gain));
    const fadeMs = this.currentTrack.fadeInMs;
    void this.ambient.play().catch(() => {
      // Autoplay blocked or load failed. Fail silently — MuteButton will surface state.
    });
    fadeTo(this.ambient, targetVolume, fadeMs);
  }

  private stop() {
    if (!this.ambient) return;
    fadeTo(this.ambient, 0, 200, () => {
      this.ambient?.pause();
    });
  }

  destroy() {
    this.stop();
    this.ambient = null;
    this.currentTrack = null;
  }
}

function readPref(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function writePref(enabled: boolean) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, enabled ? '1' : '0');
  } catch {
    // swallow
  }
}

function resolveUrl(src: string): string {
  if (typeof window === 'undefined') return src;
  return new URL(src, window.location.origin).toString();
}

function fadeTo(
  el: HTMLAudioElement,
  target: number,
  durationMs: number,
  onDone?: () => void,
) {
  const start = el.volume;
  const delta = target - start;
  const steps = Math.max(1, Math.round(durationMs / 40));
  let i = 0;
  const tick = () => {
    i += 1;
    el.volume = Math.max(0, Math.min(1, start + (delta * i) / steps));
    if (i < steps) {
      setTimeout(tick, 40);
    } else {
      onDone?.();
    }
  };
  tick();
}
