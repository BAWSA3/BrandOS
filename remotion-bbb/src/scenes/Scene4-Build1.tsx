import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Figure, TextReveal, GlowEffect, Particles } from "../components";
import { colors } from "../utils/colors";

/**
 * Scene 4: "So you learn."
 * Duration: 75 frames (0:08 - 0:10.5)
 * Visual: Hands/figure in motion. The work. Abstract shapes assembling.
 * Animation: Motion begins, shapes stack/build
 * Audio: Rhythm starts, subtle percussion
 */
export const Scene4Build1: React.FC = () => {
  const frame = useCurrentFrame();

  // Motion begins - figure starts working
  const motionProgress = interpolate(frame, [0, 75], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Abstract shapes assembling - brick-like rectangles
  const shapeOpacity = interpolate(frame, [20, 50], [0, 0.6], {
    extrapolateRight: "clamp",
  });

  // Energy building
  const glowIntensity = interpolate(frame, [0, 75], [0.3, 0.5], {
    extrapolateRight: "clamp",
  });

  // Shapes data - representing building blocks
  const shapes = [
    { x: 880, y: 600, delay: 25, width: 80, height: 40 },
    { x: 960, y: 600, delay: 35, width: 80, height: 40 },
    { x: 1040, y: 600, delay: 45, width: 80, height: 40 },
    { x: 920, y: 560, delay: 55, width: 80, height: 40 },
    { x: 1000, y: 560, delay: 65, width: 80, height: 40 },
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: colors.dark }}>
      {/* Background with more energy */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at center 40%, rgba(0, 212, 255, 0.12) 0%, ${colors.dark} 60%)`,
        }}
      />

      {/* Central glow */}
      <GlowEffect
        intensity={glowIntensity}
        size={1.5}
        pulse
        pulseSpeed={0.06}
        y="50%"
      />

      {/* Abstract building shapes */}
      {shapes.map((shape, i) => {
        const shapeFrame = frame - shape.delay;
        if (shapeFrame < 0) return null;

        const opacity = interpolate(shapeFrame, [0, 15], [0, shapeOpacity], {
          extrapolateRight: "clamp",
        });
        const scale = interpolate(shapeFrame, [0, 15], [0.5, 1], {
          extrapolateRight: "clamp",
        });
        const y = interpolate(shapeFrame, [0, 15], [shape.y + 50, shape.y], {
          extrapolateRight: "clamp",
        });

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: shape.x,
              top: y,
              width: shape.width,
              height: shape.height,
              backgroundColor: "transparent",
              border: `2px solid ${colors.cyan}`,
              opacity,
              transform: `scale(${scale})`,
              boxShadow: `0 0 15px ${colors.cyan}40, inset 0 0 10px ${colors.cyan}20`,
            }}
          />
        );
      })}

      {/* Particles beginning */}
      <Particles
        count={15}
        intensity={0.3}
        direction="up"
        startFrame={30}
      />

      {/* Figure in working position */}
      <Figure
        opacity={0.9}
        scale={0.85}
        glowIntensity="medium"
        variant="working"
        translateY={20}
      />

      {/* Text */}
      <TextReveal
        text="So you learn."
        startFrame={10}
        style="impact"
        fontSize={56}
        color={colors.white}
        y="78%"
      />
    </AbsoluteFill>
  );
};
