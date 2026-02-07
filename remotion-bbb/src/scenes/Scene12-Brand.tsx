import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { BrandReveal } from "../components";
import { colors } from "../utils/colors";

/**
 * Scene 12: Brand Reveal - "BRICK BY BRICK"
 * Duration: 90 frames (0:25 - 0:28)
 * Visual: Clean dark frame. "BRICK BY BRICK" animates in - bold, stacked, white on dark
 * Animation: Letters scale/reveal in sequence, satisfying final position
 * Audio: Single resonant tone/impact
 */
export const Scene12Brand: React.FC = () => {
  const frame = useCurrentFrame();

  // Cut to black first
  const blackOpacity = interpolate(frame, [0, 8], [1, 0], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: colors.dark }}>
      {/* Brand reveal component handles the animation */}
      <BrandReveal startFrame={10} />

      {/* Initial flash/cut effect */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: colors.dark,
          opacity: blackOpacity,
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
