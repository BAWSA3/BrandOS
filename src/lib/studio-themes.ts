// Studio room themes (public/worlds/studio). Everyone starts in the base
// studio; each theme unlocks at an XP level (src/lib/xp.ts). Themes restyle the
// finished room, so they show once the studio is complete (stage 3); before
// that the base studio's build stages show (base-0..3).

export type StudioThemeId =
  | 'base'
  | 'signal-orange'
  | 'deep-navy'
  | 'ultraviolet'
  | 'blueprint-lab'
  | 'japan'
  | 'terminal-night';

export type StudioTheme = { id: StudioThemeId; name: string; unlockLevel: number };

export const STUDIO_THEMES: StudioTheme[] = [
  { id: 'base', name: 'Base studio', unlockLevel: 1 },
  { id: 'signal-orange', name: 'Signal Orange', unlockLevel: 3 },
  { id: 'deep-navy', name: 'Deep Navy', unlockLevel: 5 },
  { id: 'ultraviolet', name: 'Ultraviolet', unlockLevel: 8 },
  { id: 'blueprint-lab', name: 'Blueprint Lab', unlockLevel: 10 },
  { id: 'japan', name: 'Japan', unlockLevel: 12 },
  { id: 'terminal-night', name: 'Terminal Night', unlockLevel: 15 },
];

export const isUnlocked = (t: StudioTheme, level: number) => level >= t.unlockLevel;

/** The next theme still locked at this level (for "next unlock" hints). */
export const nextUnlock = (level: number) => STUDIO_THEMES.find((t) => t.unlockLevel > level);

/** Image for the studio at a build stage, in a theme (themes only apply when complete). */
export function studioArt(stage: number, theme: StudioThemeId): string {
  if (stage >= 3 && theme !== 'base') return `/worlds/studio/${theme}.webp`;
  return `/worlds/studio/base-${Math.max(0, Math.min(3, stage))}.webp`;
}

const STORAGE_KEY = 'bos-studio-theme';

/** The saved theme, if it's still unlocked at this level; else the base studio. */
export function savedTheme(level: number): StudioThemeId {
  try {
    const id = window.localStorage.getItem(STORAGE_KEY);
    const t = STUDIO_THEMES.find((x) => x.id === id);
    if (t && isUnlocked(t, level)) return t.id;
  } catch {
    // storage unavailable
  }
  return 'base';
}

export function saveTheme(id: StudioThemeId) {
  try {
    window.localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // storage unavailable: lasts for this page only
  }
}
