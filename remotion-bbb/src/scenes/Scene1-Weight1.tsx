import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Figure, TextReveal, GlowEffect } from "../components";
import { colors } from "../utils/colors";
import { scenes } from "../utils/timing";

/**
 * Scene 1: "Nobody taught you this."
 * Duration: 90 frames (0:00 - 0:03)
 * Visual: Dark frame fades in. Abstract figure silhouette. Still. Deep blue-black void.
 * Animation: Slow fade in, figure appears from darkness, text types on
 * Audio: Low rumble, silence
 */
export const Scene1Weight1: React.FC = () => {
  const frame = useCurrentFrame();

  // Slow fade in from complete darkness
  const sceneOpacity = interpolate(frame, [0, 45], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Figure fades in slightly delayed
  const figureOpacity = interpolate(frame, [20, 60], [0, 0.7], {
    extrapolateRight: "clamp",
  });

  // Very subtle vignette pulse
  const vignetteIntensity = interpolate(
    Math.sin(frame * 0.02),
    [-1, 1],
    [0.8, 1]
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.dark,
        opacity: sceneOpacity,
      }}
    >
      {/* Deep void background with subtle gradient */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at center, ${colors.darkBlue} 0%, ${colors.dark} 70%)`,
        }}
      />

      {/* Vignette overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: colors.gradients.darkVignette,
          opacity: vignetteIntensity,
        }}
      />

      {/* Very subtle ambient glow - barely visible */}
      <GlowEffect
        intensity={0.1}
        size={2}
        pulse
        pulseSpeed={0.015}
        y="55%"
      />

      {/* Figure emerging from darkness */}
      <Figure
        opacity={figureOpacity}
        scale={0.8}
        glowIntensity="none"
        variant="standing"
        translateY={50}
      />

      {/* Text reveal */}
      <TextReveal
        text="Nobody taught you this."
        startFrame={30}
        style="typewriter"
        fontSize={52}
        color={colors.white}
        y="75%"
      />
    </AbsoluteFill>
  );
};
