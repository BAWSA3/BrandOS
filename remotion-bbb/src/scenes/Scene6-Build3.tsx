import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Figure, TextReveal, GlowEffect, Particles, ParticleBurst } from "../components";
import { colors } from "../utils/colors";

/**
 * Scene 6: "One brick."
 * Duration: 60 frames (0:12.5 - 0:14.5)
 * Visual: Energy building. Cyan swirls. Momentum.
 * Animation: Faster motion, particle burst
 * Audio: Building percussion
 */
export const Scene6Build3: React.FC = () => {
  const frame = useCurrentFrame();

  // Energy building - everything is more intense
  const energyLevel = interpolate(frame, [0, 60], [0.5, 0.9], {
    extrapolateRight: "clamp",
  });

  // Swirl rotation
  const swirlRotation = frame * 2;

  // Multiple bricks stacking
  const bricks = [
    { x: 880, y: 520, delay: 0 },
    { x: 960, y: 520, delay: 8 },
    { x: 1040, y: 520, delay: 16 },
    { x: 920, y: 470, delay: 24 },
    { x: 1000, y: 470, delay: 32 },
    { x: 960, y: 420, delay: 40 },
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: colors.dark }}>
      {/* Background with high energy */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at center 40%, rgba(0, 212, 255, 0.2) 0%, ${colors.dark} 50%)`,
        }}
      />

      {/* Swirling energy effect */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: `translate(-50%, -50%) rotate(${swirlRotation}deg)`,
          width: "600px",
          height: "600px",
          background: `conic-gradient(from 0deg, transparent, ${colors.cyan}30, transparent, ${colors.cyan}20, transparent)`,
          borderRadius: "50%",
          filter: "blur(30px)",
          opacity: energyLevel * 0.5,
        }}
      />

      {/* Central glow - intense */}
      <GlowEffect
        intensity={energyLevel * 0.8}
        size={2}
        pulse
        pulseSpeed={0.1}
        y="45%"
      />

      {/* Stacking bricks */}
      {bricks.map((brick, i) => {
        const brickFrame = frame - brick.delay;
        if (brickFrame < 0) return null;

        const opacity = interpolate(brickFrame, [0, 10], [0, 0.7], {
          extrapolateRight: "clamp",
        });
        const y = interpolate(brickFrame, [0, 10], [brick.y + 40, brick.y], {
          extrapolateRight: "clamp",
        });

        return (
          <React.Fragment key={i}>
            <div
              style={{
                position: "absolute",
                left: brick.x,
                top: y,
                width: "80px",
                height: "40px",
                backgroundColor: "transparent",
                border: `2px solid ${colors.cyan}`,
                opacity,
                boxShadow: `0 0 15px ${colors.cyan}50, inset 0 0 8px ${colors.cyan}30`,
                transform: "translate(-50%, -50%)",
              }}
            />
            {/* Burst when brick appears */}
            <ParticleBurst
              x={brick.x}
              y={brick.y}
              startFrame={brick.delay}
              count={8}
              duration={15}
            />
          </React.Fragment>
        );
      })}

      {/* Lots of particles */}
      <Particles
        count={30}
        intensity={energyLevel * 0.6}
        direction="up"
        startFrame={0}
      />

      {/* Figure in motion */}
      <Figure
        opacity={0.8}
        scale={0.75}
        glowIntensity="strong"
        variant="working"
        translateY={40}
      />

      {/* Text */}
      <TextReveal
        text="One brick."
        startFrame={5}
        style="impact"
        fontSize={64}
        color={colors.white}
        y="82%"
      />
    </AbsoluteFill>
  );
};
