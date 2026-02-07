import React from "react";
import { interpolate, useCurrentFrame, spring, useVideoConfig } from "remotion";
import { Archetype } from "../utils/archetypes";
import { getArchetypeColor } from "../utils/colors";
import { easeOutQuart, easeOutBack, cinematicEase } from "../utils/easing";

interface ArchetypeCardProps {
  archetype: Archetype;
  startFrame?: number;
}

/**
 * Cinematic archetype reveal card
 * - Emoji scales in with spring
 * - Name types on with impact
 * - Tagline fades in
 * - Tier badge slides in
 */
export const ArchetypeCard: React.FC<ArchetypeCardProps> = ({
  archetype,
  startFrame = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const relativeFrame = frame - startFrame;

  if (relativeFrame < 0) return null;

  const { primary, glow } = getArchetypeColor(archetype.name);

  // === EMOJI ANIMATION ===
  const emojiScale = spring({
    frame: relativeFrame,
    fps,
    config: {
      damping: 12,
      stiffness: 150,
      mass: 0.8,
    },
  });

  const emojiOpacity = interpolate(
    relativeFrame,
    [0, 6],
    [0, 1],
    { extrapolateRight: "clamp" }
  );

  // === NAME ANIMATION ===
  const nameProgress = interpolate(
    relativeFrame,
    [6, 18],
    [0, 1],
    { extrapolateRight: "clamp", easing: cinematicEase }
  );

  const nameScale = interpolate(
    relativeFrame,
    [6, 14, 20],
    [1.2, 0.98, 1],
    { extrapolateRight: "clamp", easing: easeOutBack }
  );

  // === TAGLINE ANIMATION ===
  const taglineOpacity = interpolate(
    relativeFrame,
    [14, 22],
    [0, 1],
    { extrapolateRight: "clamp" }
  );

  const taglineY = interpolate(
    relativeFrame,
    [14, 22],
    [15, 0],
    { extrapolateRight: "clamp", easing: easeOutQuart }
  );

  // === TIER BADGE ===
  const tierOpacity = interpolate(
    relativeFrame,
    [10, 16],
    [0, 1],
    { extrapolateRight: "clamp" }
  );

  const tierX = interpolate(
    relativeFrame,
    [10, 16],
    [-20, 0],
    { extrapolateRight: "clamp", easing: easeOutQuart }
  );

  // === GLOW PULSE ===
  const glowIntensity = interpolate(
    relativeFrame,
    [0, 10, 25],
    [0, 40, 25],
    { extrapolateRight: "clamp" }
  );

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Tier Badge - top */}
      <div
        style={{
          position: "absolute",
          top: "18%",
          opacity: tierOpacity,
          transform: `translateX(${tierX}px)`,
        }}
      >
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 14,
            fontWeight: 600,
            letterSpacing: "0.2em",
            color: "rgba(255, 255, 255, 0.5)",
            textTransform: "uppercase",
          }}
        >
          TIER {archetype.tier}
        </span>
      </div>

      {/* Emoji */}
      <div
        style={{
          fontSize: 140,
          transform: `scale(${emojiScale})`,
          opacity: emojiOpacity,
          filter: `drop-shadow(0 0 ${glowIntensity}px ${glow})`,
          marginBottom: 24,
        }}
      >
        {archetype.emoji}
      </div>

      {/* Name */}
      <div
        style={{
          opacity: nameProgress,
          transform: `scale(${nameScale})`,
        }}
      >
        <h1
          style={{
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 64,
            fontWeight: 800,
            color: primary,
            margin: 0,
            letterSpacing: "-0.02em",
            textShadow: `0 0 ${glowIntensity}px ${glow}`,
            textTransform: "uppercase",
          }}
        >
          {archetype.name}
        </h1>
      </div>

      {/* Tagline */}
      <p
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 24,
          fontWeight: 500,
          color: "rgba(255, 255, 255, 0.7)",
          margin: 0,
          marginTop: 16,
          opacity: taglineOpacity,
          transform: `translateY(${taglineY}px)`,
          letterSpacing: "0.02em",
        }}
      >
        {archetype.tagline}
      </p>

      {/* Rarity indicator */}
      <div
        style={{
          position: "absolute",
          bottom: "18%",
          opacity: taglineOpacity,
        }}
      >
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 12,
            fontWeight: 500,
            color: "rgba(255, 255, 255, 0.4)",
            letterSpacing: "0.15em",
          }}
        >
          TOP {archetype.rarity}% OF CREATORS
        </span>
      </div>
    </div>
  );
};
