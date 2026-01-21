import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig, spring, staticFile } from "remotion";
import { SPRING_CONFIG } from "../styles";

interface BrandOSLogoProps {
  scale?: number;
  showShimmer?: boolean;
  animateIn?: boolean;
  startFrame?: number;
}

export const BrandOSLogo: React.FC<BrandOSLogoProps> = ({
  scale = 1,
  showShimmer = true,
  animateIn = true,
  startFrame = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const adjustedFrame = frame - startFrame;

  // Scale animation
  const scaleProgress = animateIn
    ? spring({
        frame: adjustedFrame,
        fps,
        config: SPRING_CONFIG.bouncy,
      })
    : 1;

  const animatedScale = interpolate(scaleProgress, [0, 1], [0.5, 1]) * scale;

  // Shimmer animation
  const shimmerPosition = interpolate(
    (adjustedFrame % 120) / 120,
    [0, 1],
    [-100, 200]
  );

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transform: `scale(${animatedScale})`,
        opacity: animateIn ? scaleProgress : 1,
        position: "relative",
      }}
    >
      <img
        src={staticFile("brandos-logo.png")}
        alt="BrandOS"
        style={{
          height: 80,
          objectFit: "contain",
        }}
      />
      {showShimmer && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `linear-gradient(
              90deg,
              transparent 0%,
              rgba(255, 255, 255, 0.2) 50%,
              transparent 100%
            )`,
            transform: `translateX(${shimmerPosition}%)`,
            pointerEvents: "none",
          }}
        />
      )}
    </div>
  );
};
