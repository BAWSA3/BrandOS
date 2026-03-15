/**
 * BrandOS Color System
 * Dark, premium, glassmorphic aesthetic with Klein Blue as primary
 */

export const colors = {
  // Core
  dark: "#0a0a0a",
  black: "#000000",
  white: "#F2F0EF",

  // Primary - International Klein Blue
  primary: "#0047FF",
  kleinBlue: "#002FA7",
  deepBlue: "#001847",

  // Accents
  gold: "#FFD700",
  cyan: "#00D4FF",
  green: "#10B981",

  // Archetype-specific colors
  archetypes: {
    "ARC": { primary: "#10B981", glow: "rgba(16, 185, 129, 0.6)" },
    "ENTROPY": { primary: "#F59E0B", glow: "rgba(245, 158, 11, 0.6)" },
    "NULL": { primary: "#8B5CF6", glow: "rgba(139, 92, 246, 0.6)" },
    "FREQ": { primary: "#EC4899", glow: "rgba(236, 72, 153, 0.6)" },
    "RELAY": { primary: "#06B6D4", glow: "rgba(6, 182, 212, 0.6)" },
    "BUILD.EXE": { primary: "#EF4444", glow: "rgba(239, 68, 68, 0.6)" },
    "SIGNAL_SAGE": { primary: "#3B82F6", glow: "rgba(59, 130, 246, 0.6)" },
    "FORESIGHT": { primary: "#9D4EDD", glow: "rgba(157, 78, 221, 0.6)" },
  },

  // Glass effects
  glass: {
    bg: "rgba(255, 255, 255, 0.05)",
    border: "rgba(255, 255, 255, 0.1)",
  },

  // Gradients
  gradients: {
    primary: "linear-gradient(135deg, #0047FF 0%, #002FA7 100%)",
    gold: "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)",
    vignette: "radial-gradient(ellipse at center, transparent 0%, rgba(0, 0, 0, 0.8) 100%)",
  },
} as const;

export const getArchetypeColor = (name: string) => {
  return colors.archetypes[name as keyof typeof colors.archetypes] || { primary: colors.primary, glow: "rgba(0, 71, 255, 0.6)" };
};
