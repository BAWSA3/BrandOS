import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Figure, TextReveal, GlowEffect, Particles, ParticleBurst, LightTrail } from "../components";
import { colors } from "../utils/colors";

/**
 * Scene 5: "One day."
 * Duration: 60 frames (0:10.5 - 0:12.5)
 * Visual: Progress visible. Brick shape forms. Light trails.
 * Animation: Impact on text, shape solidifies
 * Audio: Impact sound
 */
export const Scene5Build2: React.FC = () => {
  const frame = useCurrentFrame();

  // Impact moment at the start
  const impactScale = interpolate(frame, [0, 5, 15], [1.05, 0.98, 1], {
    extrapolateRight: "clamp",
  });

  // Brick shape solidifying
  const brickOpacity = interpolate(frame, [10, 30], [0.3, 0.8], {
    extrapolateRight: "clamp",
  });

  const brickScale = interpolate(frame, [10, 25], [0.8, 1], {
    extrapolateRight: "clamp",
  });

  // Light trails progress
  const trailProgress = interpolate(frame, [15, 45], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.dark,
        transform: `scale(${impactScale})`,
      }}
    >
      {/* Background with increased energy */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at center 45%, rgba(0, 212, 255, 0.15) 0%, ${colors.dark} 55%)`,
        }}
      />

      {/* Glow */}
      <GlowEffect
        intensity={0.5}
        size={1.8}
        pulse
        pulseSpeed={0.08}
        y="48%"
      />

      {/* Light trails */}
      <LightTrail
        startX={400}
        startY={400}
        endX={960}
        endY={500}
        progress={trailProgress}
        width={2}
      />
      <LightTrail
        startX={1520}
        startY={400}
        endX={960}
        endY={500}
        progress={trailProgress}
        width={2}
      />

      {/* Solidifying brick shape - central */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "55%",
          transform: `translate(-50%, -50%) scale(${brickScale})`,
          opacity: brickOpacity,
        }}
      >
        <div
          style={{
            width: "120px",
            height: "60px",
            backgroundColor: "transparent",
            border: `3px solid ${colors.cyan}`,
            boxShadow: `0 0 20px ${colors.cyan}60, 0 0 40px ${colors.cyan}30, inset 0 0 15px ${colors.cyan}30`,
          }}
        />
      </div>

      {/* Particle burst on impact */}
      <ParticleBurst
        x={960}
        y={540}
        startFrame={0}
        count={15}
        duration={25}
      />

      {/* More particles */}
      <Particles
        count={20}
        intensity={0.4}
        direction="up"
        startFrame={10}
      />

      {/* Figure */}
      <Figure
        opacity={0.85}
        scale={0.8}
        glowIntensity="medium"
        variant="working"
        translateY={30}
      />

      {/* Text with impact style */}
      <TextReveal
        text="One day."
        startFrame={5}
        style="impact"
        fontSize={60}
        color={colors.white}
        y="80%"
      />
    </AbsoluteFill>
  );
};
