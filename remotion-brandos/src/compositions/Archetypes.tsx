import React from "react";
import { AbsoluteFill, Sequence, interpolate, useCurrentFrame } from "remotion";
import { GlowOrb, ImpactText, ArchetypeCard, BrandLogo } from "../components";
import { colors, getArchetypeColor } from "../utils/colors";
import { timing, getArchetypeTiming } from "../utils/timing";
import { archetypes } from "../utils/archetypes";

/**
 * 8 Archetypes - 15 Second Cinematic Promo
 *
 * Structure:
 * - 0:00-1.5s: Opening impact "8 ARCHETYPES"
 * - 1.5s-12s: Rapid showcase of all 8 archetypes
 * - 12s-15s: BrandOS logo reveal
 */
export const Archetypes: React.FC = () => {
  const frame = useCurrentFrame();

  // Dynamic background glow based on current archetype
  const getCurrentArchetypeIndex = () => {
    if (frame < timing.archetypes.start) return -1;
    if (frame >= timing.logo.start) return -1;
    return Math.floor((frame - timing.archetypes.start) / timing.archetypes.perArchetype);
  };

  const currentIndex = getCurrentArchetypeIndex();
  const currentArchetype = currentIndex >= 0 && currentIndex < 8 ? archetypes[currentIndex] : null;
  const currentColor = currentArchetype ? getArchetypeColor(currentArchetype.name) : null;

  // Vignette intensity
  const vignetteOpacity = interpolate(
    frame,
    [0, 30],
    [1, 0.7],
    { extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill style={{ backgroundColor: colors.dark }}>
      {/* === AMBIENT BACKGROUND === */}

      {/* Base gradient */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at 50% 50%, ${colors.deepBlue} 0%, ${colors.dark} 70%)`,
          opacity: 0.5,
        }}
      />

      {/* Animated glow orbs */}
      <GlowOrb
        color={currentColor?.primary || colors.primary}
        size={600}
        x="30%"
        y="40%"
        opacity={0.3}
        blur={120}
      />
      <GlowOrb
        color={currentColor?.primary || colors.kleinBlue}
        size={500}
        x="70%"
        y="60%"
        opacity={0.25}
        pulseSpeed={0.025}
        blur={100}
      />

      {/* Vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: colors.gradients.vignette,
          opacity: vignetteOpacity,
          pointerEvents: "none",
        }}
      />

      {/* === SCENE 1: OPENING IMPACT === */}
      <Sequence from={timing.opening.start} durationInFrames={timing.opening.duration}>
        <AbsoluteFill>
          {/* "8" number - big impact */}
          <ImpactText
            text="8"
            startFrame={0}
            fontSize={200}
            color={colors.gold}
            glowColor={colors.gold}
            y="42%"
            fontWeight={900}
          />

          {/* "ARCHETYPES" text */}
          <ImpactText
            text="ARCHETYPES"
            startFrame={8}
            fontSize={48}
            color="rgba(255, 255, 255, 0.9)"
            glowColor={colors.primary}
            y="58%"
            letterSpacing="0.3em"
            fontWeight={600}
          />
        </AbsoluteFill>
      </Sequence>

      {/* === SCENE 2: ARCHETYPE SHOWCASE === */}
      {archetypes.map((archetype, index) => {
        const archetypeTiming = getArchetypeTiming(index);
        return (
          <Sequence
            key={archetype.name}
            from={archetypeTiming.start}
            durationInFrames={archetypeTiming.duration}
          >
            <ArchetypeCard archetype={archetype} startFrame={0} />
          </Sequence>
        );
      })}

      {/* === SCENE 3: LOGO REVEAL === */}
      <Sequence from={timing.logo.start} durationInFrames={timing.logo.duration}>
        <BrandLogo startFrame={0} showTagline={true} />
      </Sequence>

      {/* === SUBTLE NOISE OVERLAY === */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.03,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
