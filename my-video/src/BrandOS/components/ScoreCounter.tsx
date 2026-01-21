import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig, spring } from "remotion";
import { COLORS, FONTS } from "../styles";

interface ScoreCounterProps {
  targetScore: number;
  startFrame?: number;
  duration?: number;
  fontSize?: number;
}

export const ScoreCounter: React.FC<ScoreCounterProps> = ({
  targetScore,
  startFrame = 0,
  duration = 45,
  fontSize = 120,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const adjustedFrame = frame - startFrame;

  // Use spring for more natural counting
  const progress = spring({
    frame: adjustedFrame,
    fps,
    config: { damping: 50 },
    durationInFrames: duration,
  });

  const currentScore = Math.round(interpolate(progress, [0, 1], [0, targetScore]));

  // Glow pulse based on score reveal
  const glowIntensity = interpolate(progress, [0.8, 1], [0.4, 0.8], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        fontFamily: FONTS.mono,
        fontSize,
        fontWeight: 700,
        color: COLORS.primary,
        textShadow: `
          0 0 20px rgba(0, 71, 255, ${glowIntensity}),
          0 0 40px rgba(0, 71, 255, ${glowIntensity * 0.6}),
          0 0 60px rgba(0, 71, 255, ${glowIntensity * 0.3})
        `,
        letterSpacing: "0.05em",
      }}
    >
      {currentScore}
    </div>
  );
};
