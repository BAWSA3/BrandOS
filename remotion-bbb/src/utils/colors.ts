export const colors = {
  // Primary
  dark: "#0a0a0f",
  darkBlue: "#0d1117",

  // Accent - Cyan glow
  cyan: "#00d4ff",
  cyanLight: "#7fefff",
  cyanDark: "#0099cc",

  // Secondary - Warm hints
  warmAccent: "#ff6b35",
  warmSubtle: "#2a1f1a",

  // Typography
  white: "#ffffff",
  whiteSubtle: "#e0e0e0",

  // Gradients
  gradients: {
    cyanGlow: "radial-gradient(ellipse at center, rgba(0, 212, 255, 0.4) 0%, rgba(0, 212, 255, 0) 70%)",
    darkVignette: "radial-gradient(ellipse at center, transparent 0%, #0a0a0f 100%)",
    cyanToTransparent: "linear-gradient(180deg, rgba(0, 212, 255, 0.3) 0%, transparent 100%)",
  },
} as const;

export const glowStyles = {
  subtle: `0 0 20px rgba(0, 212, 255, 0.3), 0 0 40px rgba(0, 212, 255, 0.2)`,
  medium: `0 0 30px rgba(0, 212, 255, 0.5), 0 0 60px rgba(0, 212, 255, 0.3), 0 0 90px rgba(0, 212, 255, 0.1)`,
  strong: `0 0 40px rgba(0, 212, 255, 0.6), 0 0 80px rgba(0, 212, 255, 0.4), 0 0 120px rgba(0, 212, 255, 0.2)`,
  intense: `0 0 60px rgba(0, 212, 255, 0.8), 0 0 120px rgba(0, 212, 255, 0.5), 0 0 180px rgba(0, 212, 255, 0.3)`,
} as const;
