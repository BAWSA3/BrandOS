import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig, spring } from "remotion";
import { COLORS, SPRING_CONFIG } from "../styles";

interface GlassCardProps {
  children: React.ReactNode;
  width?: number;
  height?: number;
  padding?: number;
  animateIn?: boolean;
  startFrame?: number;
  glowIntensity?: number;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  width = 500,
  height,
  padding = 32,
  animateIn = true,
  startFrame = 0,
  glowIntensity = 0.4,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const adjustedFrame = frame - startFrame;

  const progress = animateIn
    ? spring({
        frame: adjustedFrame,
        fps,
        config: SPRING_CONFIG.smooth,
      })
    : 1;

  const translateY = interpolate(progress, [0, 1], [40, 0]);
  const opacity = interpolate(progress, [0, 1], [0, 1]);

  return (
    <div
      style={{
        width,
        height,
        padding,
        background: COLORS.glass,
        backdropFilter: "blur(20px)",
        borderRadius: 24,
        border: `1px solid ${COLORS.glassBorder}`,
        boxShadow: `
          0 0 40px rgba(0, 71, 255, ${glowIntensity}),
          0 0 80px rgba(0, 71, 255, ${glowIntensity * 0.5}),
          inset 0 1px 0 rgba(255, 255, 255, 0.1)
        `,
        transform: `translateY(${translateY}px)`,
        opacity,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {children}
    </div>
  );
};
