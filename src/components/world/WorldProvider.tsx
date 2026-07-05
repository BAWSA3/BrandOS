'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useReducedMotion } from 'motion/react';
import type { WorldManifest, WorldMotionPreset } from '@/worlds/types';
import { WorldAudioController } from './audio';
import { ZERO_MOTION_PRESET } from './variants';

interface AudioState {
  enabled: boolean;
  unlocked: boolean;
  toggle: () => boolean;
  unlock: () => void;
}

interface WorldContextValue {
  world: WorldManifest;
  t: (key: string, fallback?: string) => string;
  audio: AudioState;
  motion: WorldMotionPreset;
  reducedMotion: boolean;
}

const WorldContext = createContext<WorldContextValue | null>(null);

const PALETTE_VAR_MAP: Record<keyof WorldManifest['palette'], string> = {
  background: '--background',
  foreground: '--foreground',
  surface: '--surface',
  surfaceHover: '--surface-hover',
  surfaceTertiary: '--surface-tertiary',
  border: '--border',
  borderHover: '--border-hover',
  separator: '--separator',
  textPrimary: '--text-primary',
  textSecondary: '--text-secondary',
  textTertiary: '--text-tertiary',
  textQuaternary: '--text-quaternary',
  accent: '--accent',
  accentHover: '--accent-hover',
  success: '--success',
  warning: '--warning',
  danger: '--danger',
};

interface WorldProviderProps {
  world: WorldManifest;
  children: ReactNode;
  /** When true, skip audio + gesture unlock (used for read-only artifact rendering). */
  staticMode?: boolean;
}

export function WorldProvider({ world, children, staticMode = false }: WorldProviderProps) {
  const reducedMotion = useReducedMotion() ?? false;
  const controllerRef = useRef<WorldAudioController | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [audioUnlocked, setAudioUnlocked] = useState(false);

  // Inject palette + typography into root CSS vars
  useEffect(() => {
    const root = document.documentElement;
    const previousWorld = root.getAttribute('data-world');
    const resets: Array<[string, string | null]> = [];

    for (const key in PALETTE_VAR_MAP) {
      const varName = PALETTE_VAR_MAP[key as keyof typeof PALETTE_VAR_MAP];
      resets.push([varName, root.style.getPropertyValue(varName) || null]);
      root.style.setProperty(
        varName,
        world.palette[key as keyof typeof PALETTE_VAR_MAP],
      );
    }

    resets.push(['--font-sans', root.style.getPropertyValue('--font-sans') || null]);
    resets.push(['--font-mono', root.style.getPropertyValue('--font-mono') || null]);
    root.style.setProperty('--font-sans', world.typography.fontSans);
    root.style.setProperty('--font-mono', world.typography.fontMono);

    root.setAttribute('data-world', world.id);

    return () => {
      for (const [varName, value] of resets) {
        if (value) root.style.setProperty(varName, value);
        else root.style.removeProperty(varName);
      }
      if (previousWorld) root.setAttribute('data-world', previousWorld);
      else root.removeAttribute('data-world');
    };
  }, [world]);

  // Audio controller lifecycle
  useEffect(() => {
    if (staticMode || reducedMotion) return;
    const controller = new WorldAudioController();
    controllerRef.current = controller;
    setAudioEnabled(controller.enabled);
    setAudioUnlocked(controller.isUnlocked);
    controller.setAudio(world.audio);

    const unlockOnGesture = () => {
      controller.unlock();
      setAudioUnlocked(true);
      window.removeEventListener('pointerdown', unlockOnGesture);
      window.removeEventListener('keydown', unlockOnGesture);
    };
    window.addEventListener('pointerdown', unlockOnGesture, { once: true });
    window.addEventListener('keydown', unlockOnGesture, { once: true });

    return () => {
      window.removeEventListener('pointerdown', unlockOnGesture);
      window.removeEventListener('keydown', unlockOnGesture);
      controller.destroy();
      controllerRef.current = null;
    };
  }, [world, staticMode, reducedMotion]);

  const value = useMemo<WorldContextValue>(() => {
    const t = (key: string, fallback?: string) => {
      const value = resolveMicrocopyKey(world, key);
      return value ?? fallback ?? key;
    };

    const audio: AudioState = {
      enabled: audioEnabled,
      unlocked: audioUnlocked,
      toggle: () => {
        const controller = controllerRef.current;
        if (!controller) return false;
        const next = controller.toggle();
        setAudioEnabled(next);
        return next;
      },
      unlock: () => {
        controllerRef.current?.unlock();
        setAudioUnlocked(true);
      },
    };

    return {
      world,
      t,
      audio,
      motion: reducedMotion ? ZERO_MOTION_PRESET : world.motion,
      reducedMotion,
    };
  }, [world, audioEnabled, audioUnlocked, reducedMotion]);

  return <WorldContext.Provider value={value}>{children}</WorldContext.Provider>;
}

export function useWorld(): WorldContextValue {
  const ctx = useContext(WorldContext);
  if (!ctx) {
    throw new Error('useWorld must be used inside a <WorldProvider>');
  }
  return ctx;
}

export function useOptionalWorld(): WorldContextValue | null {
  return useContext(WorldContext);
}

function resolveMicrocopyKey(world: WorldManifest, key: string): string | undefined {
  const parts = key.split('.');
  let current: unknown = world.microcopy;
  for (const part of parts) {
    if (typeof current !== 'object' || current === null) return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === 'string' ? current : undefined;
}
