import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Figure, TextReveal, GlowEffect, AuraEffect } from "../components";
import { colors } from "../utils/colors";

/**
 * Scene 11: "Until it's built."
 * Duration: 60 frames (0:23 - 0:25)
 * Visual: Figure standing in full cyan glow. Present. Arrived. Not triumphant pose - just there.
 * Animation: Hold, subtle glow pulse
 * Audio: Peak then cut to silence
 */
export const Scene11Arrival: React.FC = () => {
  const frame = useCurrentFrame();

  // Initial intensity peak, then settle
  const initialFlash = interpolate(frame, [0, 10], [1.2, 1], {
    extrapolateRight: "clamp",
  });

  // Subtle glow pulse - slow and steady
  const glowPulse = interpolate(
    Math.sin(frame * 0.08),
    [-1, 1],
    [0.85, 1]
  );

  // Everything is calm now
  const calmOpacity = interpolate(frame, [0, 20], [0.9, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: colors.dark }}>
      {/* Background with full glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at center 45%, rgba(0, 212, 255, 0.25) 0%, ${colors.dark} 55%)`,
          opacity: initialFlash,
        }}
      />

      {/* Vignette - lighter to let figure breathe */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: colors.gradients.darkVignette,
          opacity: 0.5,
        }}
      />

      {/* Full cyan glow - the arrival */}
      <GlowEffect
        intensity={0.6 * glowPulse}
        size={2.5}
        y="45%"
      />

      {/* Aura rings - stable, present */}
      <div style={{ opacity: calmOpacity * 0.6 }}>
        <AuraEffect opacity={0.3} scale={0.9} rings={4} />
      </div>

      {/* Figure - arrived, present, standing tall but not posing */}
      <Figure
        opacity={calmOpacity}
        scale={1}
        glowIntensity="intense"
        variant="arrived"
        translateY={0}
      />

      {/* Text - final statement before brand */}
      <TextReveal
        text="Until it's built."
        startFrame={10}
        style="fade"
        fontSize={56}
        color={colors.white}
        y="78%"
      />
    </AbsoluteFill>
  );
};
