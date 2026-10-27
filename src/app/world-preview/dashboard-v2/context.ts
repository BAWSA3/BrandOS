'use client';

import { createContext, useContext } from 'react';
import type { Colorway } from '@/lib/colorways';
import type { Persona, Screen } from './sample';

export type Ctx = {
  screen: Screen;
  go: (s: Screen) => void;
  persona: Persona | null;
  setPersona: (p: Persona) => void;
  finish: Colorway;
  setFinish: (c: Colorway) => void;
  brand: string;
  setBrand: (h: string) => void;
  openCommand: () => void;
  /** Quiet confirmation with optional undo (no confirm dialogs anywhere). */
  toast: (msg: string, undo?: () => void) => void;
  /** XP earned this session, for the done moment. */
  earned: number;
  earn: (xp: number) => void;
};

export const V2 = createContext<Ctx | null>(null);

export function useV2(): Ctx {
  const c = useContext(V2);
  if (!c) throw new Error('useV2 outside DashboardV2');
  return c;
}
