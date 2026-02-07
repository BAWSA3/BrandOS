import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Figure, TextReveal, GlowEffect, AuraEffect } from "../components";
import { colors } from "../utils/colors";

/**
 * Scene 2: "How to keep going."
 * Duration: 75 frames (0:03 - 0:05.5)
 * Visual: Figure closer, motion blur effect. Internal weight visible. Cyan glow beginning at edges.
 * Animation: Subtle drift, blur pulses
 * Audio: Heartbeat-like pulse
 */
export const Scene2Weight2: React.FC = () => {
  const frame = useCurrentFrame();

  // Subtle drift/breathing motion
  const driftX = interpolate(Math.sin(frame * 0.04), [-1, 1], [-5, 5]);
  const driftY = interpolate(Math.cos(frame * 0.03), [-1, 1], [-3, 3]);

  // Pulse effect - like a heartbeat
  const pulse = interpolate(
    Math.sin(frame * 0.15),
    [-1, 1],
    [0.95, 1.05]
  );

  // Glow beginning to appear at edges
  const glowOpacity = interpolate(frame, [0, 40], [0, 0.3], {
    extrapolateRight: "clamp",
  });

  // Motion blur pulse
  const blurAmount = interpolate(
    Math.sin(frame * 0.1),
    [-1, 1],
    [0, 3]
  );

  return (
    <AbsoluteFill style={{ backgroundColor: colors.dark }}>
      {/* Background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at center, ${colors.darkBlue} 0%, ${colors.dark} 60%)`,
        }}
      />

      {/* Vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: colors.gradients.darkVignette,
          opacity: 0.9,
        }}
      />

      {/* Cyan glow beginning at edges */}
      <GlowEffect
        intensity={glowOpacity}
        size={1.5}
        pulse
        pulseSpeed={0.08}
        y="50%"
      />

      {/* Subtle aura rings starting to form */}
      <div style={{ opacity: glowOpacity * 0.5 }}>
        <AuraEffect opacity={0.2} scale={0.6} rings={2} />
      </div>

      {/* Figure with drift and pulse */}
      <div
        style={{
          transform: `translate(${driftX}px, ${driftY}px) scale(${pulse})`,
          filter: `blur(${blurAmount}px)`,
        }}
      >
        <Figure
          opacity={0.8}
          scale={0.9}
          glowIntensity="subtle"
          variant="standing"
          translateY={30}
        />
      </div>

      {/* Text */}
      <TextReveal
        text="How to keep going."
        startFrame={15}
        style="wordByWord"
        fontSize={52}
        color={colors.white}
        y="75%"
      />
    </AbsoluteFill>
  );
};
