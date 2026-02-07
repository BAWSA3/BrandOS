import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Figure, TextReveal, GlowEffect, AuraEffect } from "../components";
import { colors } from "../utils/colors";

/**
 * Scene 3: "When it's just you."
 * Duration: 75 frames (0:05.5 - 0:08)
 * Visual: Figure looking forward/up. Resolve forming. Light strengthening.
 * Animation: Camera push in, light intensifies
 * Audio: Building tension
 */
export const Scene3Weight3: React.FC = () => {
  const frame = useCurrentFrame();

  // Camera push in effect - scale increases
  const cameraScale = interpolate(frame, [0, 75], [1, 1.15], {
    extrapolateRight: "clamp",
  });

  // Light intensifying
  const lightIntensity = interpolate(frame, [0, 60], [0.2, 0.5], {
    extrapolateRight: "clamp",
  });

  // Figure becomes more defined
  const figureOpacity = interpolate(frame, [0, 30], [0.8, 1], {
    extrapolateRight: "clamp",
  });

  // Resolve building - slight upward movement
  const figureY = interpolate(frame, [0, 75], [30, 10], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: colors.dark }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `scale(${cameraScale})`,
          transformOrigin: "center 45%",
        }}
      >
        {/* Background with growing light */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(ellipse at center 40%, rgba(0, 212, 255, ${lightIntensity * 0.15}) 0%, ${colors.dark} 50%)`,
          }}
        />

        {/* Vignette - less intense as light grows */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: colors.gradients.darkVignette,
            opacity: interpolate(frame, [0, 75], [0.9, 0.7]),
          }}
        />

        {/* Strengthening glow */}
        <GlowEffect
          intensity={lightIntensity}
          size={1.8}
          pulse
          pulseSpeed={0.05}
          y="45%"
        />

        {/* Aura becoming more visible */}
        <div style={{ opacity: lightIntensity }}>
          <AuraEffect opacity={0.3} scale={0.7} rings={3} />
        </div>

        {/* Figure with resolve */}
        <Figure
          opacity={figureOpacity}
          scale={0.95}
          glowIntensity="medium"
          variant="standing"
          translateY={figureY}
        />
      </div>

      {/* Text */}
      <TextReveal
        text="When it's just you."
        startFrame={10}
        style="wordByWord"
        fontSize={52}
        color={colors.white}
        y="75%"
      />
    </AbsoluteFill>
  );
};
