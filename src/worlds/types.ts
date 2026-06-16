export type WorldId = string;
export type WorldTier = 'free' | 'premium';

export interface WorldPalette {
  background: string;
  foreground: string;
  surface: string;
  surfaceHover: string;
  surfaceTertiary: string;
  border: string;
  borderHover: string;
  separator: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textQuaternary: string;
  accent: string;
  accentHover: string;
  success: string;
  warning: string;
  danger: string;
}

export interface WorldTypography {
  fontSans: string;
  fontMono: string;
  fontDisplay?: string;
  baseSize?: string;
  letterSpacing?: string;
}

export interface WorldSceneProps {
  intensity?: number;
  className?: string;
}

// Note: the dynamic-import factory for the scene component lives in the
// client-only registry at src/components/world/scenes.ts (keyed by world id).
// The manifest only carries serializable data so it can cross the RSC boundary.
export interface WorldBackground {
  staticFallback: string;
}

export interface WorldMotionPreset {
  fadeIn: { duration: number; ease: string };
  slideIn: { duration: number; ease: string; distance: number };
  hover: { scale: number; duration: number };
  reducedMotion: 'disable' | 'simplify';
}

export interface WorldAudioTrack {
  src: string;
  loop: boolean;
  gain: number;
  fadeInMs: number;
}

export interface WorldAudio {
  ambient?: WorldAudioTrack;
  sfx?: Partial<Record<'click' | 'hover' | 'scanStart' | 'scanDone', WorldAudioTrack>>;
}

export interface WorldMicrocopy {
  dashboardTitle: string;
  scanCta: string;
  scanningLabel: string;
  scanCompleteToast: string;
  emptyConnections: string;
  connectCta: string;
  upgradeCta: string;
  shareableCardTitle: string;
  shareableCardSubtitle: string;
  phaseLabels: {
    define: string;
    check: string;
    generate: string;
    scale: string;
  };
  [key: string]: string | Record<string, string>;
}

export type DashboardModuleId =
  | 'connections'
  | 'scan'
  | 'shareable'
  | 'upgrade'
  | 'history'
  | 'watchlist';

export interface WorldModulePreset {
  modules: DashboardModuleId[];
  layout: 'stacked' | 'grid-2' | 'grid-3';
}

export interface WorldOgConfig {
  background: string;
  accent: string;
  textColor: string;
  mutedColor: string;
  fontFamily: 'monospace' | 'sans-serif' | 'serif';
  frameGlyphs?: { corner: string; divider: string };
}

export interface WorldManifest {
  id: WorldId;
  name: string;
  tier: WorldTier;
  description: string;
  tagline: string;
  preview: {
    thumb: string;
    hero: string;
  };
  palette: WorldPalette;
  typography: WorldTypography;
  background: WorldBackground;
  motion: WorldMotionPreset;
  audio?: WorldAudio;
  microcopy: WorldMicrocopy;
  modules: WorldModulePreset;
  og: WorldOgConfig;
}
