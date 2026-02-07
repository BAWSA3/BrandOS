import React from "react";
import { interpolate, useCurrentFrame, spring, useVideoConfig } from "remotion";
import { easeOutBack, easeOutQuart } from "../utils/easing";

interface ImpactTextProps {
  text: string;
  startFrame?: number;
  fontSize?: number;
  color?: string;
  glowColor?: string;
  y?: string;
  letterSpacing?: string;
  fontWeight?: number;
  delay?: number;
}

/**
 * Cinematic impact text reveal with scale and glow
 */
export const ImpactText: React.FC<ImpactTextProps> = ({
  text,
  startFrame = 0,
  fontSize = 72,
  color = "#FFFFFF",
  glowColor,
  y = "50%",
  letterSpacing = "-0.02em",
  fontWeight = 800,
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const relativeFrame = frame - startFrame - delay;

  if (relativeFrame < 0) return null;

  // Scale: starts big, settles to 1
  const scale = interpolate(
    relativeFrame,
    [0, 12],
    [1.3, 1],
    {
      extrapolateRight: "clamp",
      easing: easeOutBack,
    }
  );

  // Opacity fade in
  const opacity = interpolate(
    relativeFrame,
    [0, 8],
    [0, 1],
    { extrapolateRight: "clamp" }
  );

  // Glow intensity
  const glowIntensity = interpolate(
    relativeFrame,
    [0, 15, 30],
    [50, 30, 20],
    { extrapolateRight: "clamp" }
  );

  const textShadow = glowColor
    ? `0 0 ${glowIntensity}px ${glowColor}, 0 0 ${glowIntensity * 2}px ${glowColor}`
    : "none";

  return (
    <div
      style={{
        position: "absolute",
        width: "100%",
        top: y,
        left: 0,
        transform: "translateY(-50%)",
        textAlign: "center",
        padding: "0 60px",
      }}
    >
      <span
        style={{
          display: "inline-block",
          fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
          fontSize,
          fontWeight,
          color,
          letterSpacing,
          opacity,
          transform: `scale(${scale})`,
          textShadow,
          lineHeight: 1.1,
        }}
      >
        {text}
      </span>
    </div>
  );
};
