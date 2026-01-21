// BrandOS Design Tokens
export const COLORS = {
  primary: "#0047FF",
  background: "#0a0a0a",
  backgroundLight: "#121212",
  accentGlow: "rgba(0, 71, 255, 0.4)",
  accentGlowBright: "rgba(0, 71, 255, 0.6)",
  text: "#ffffff",
  textMuted: "#a0a0a0",
  glass: "rgba(255, 255, 255, 0.05)",
  glassBorder: "rgba(255, 255, 255, 0.1)",
} as const;

export const FONTS = {
  heading: "Helvetica Neue, Helvetica, Arial, sans-serif",
  mono: "'VCR OSD Mono', 'Courier New', monospace",
} as const;

// Video Settings
export const VIDEO_CONFIG = {
  fps: 30,
  width: 1080,
  height: 1080,
  durationInFrames: 810, // 27 seconds
} as const;

// Scene timing (in frames)
export const SCENE_TIMING = {
  hook: { start: 0, end: 90 },        // 0-3s
  problem: { start: 90, end: 210 },   // 3-7s
  logo: { start: 210, end: 300 },     // 7-10s
  input: { start: 300, end: 420 },    // 10-14s
  processing: { start: 420, end: 480 }, // 14-16s
  scoreReveal: { start: 480, end: 630 }, // 16-21s
  cta: { start: 630, end: 810 },      // 21-27s
} as const;

// Animation presets
export const SPRING_CONFIG = {
  smooth: { damping: 200 },
  bouncy: { damping: 100, mass: 0.8 },
  snappy: { damping: 300, stiffness: 200 },
} as const;
