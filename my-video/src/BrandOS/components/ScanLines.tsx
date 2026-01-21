import React from "react";
import { useCurrentFrame } from "remotion";

interface ScanLinesProps {
  opacity?: number;
  speed?: number;
  lineHeight?: number;
}

export const ScanLines: React.FC<ScanLinesProps> = ({
  opacity = 0.08,
  speed = 2,
  lineHeight = 2,
}) => {
  const frame = useCurrentFrame();

  // Moving scan line
  const scanPosition = (frame * speed) % 100;

  return (
    <>
      {/* Static scan lines */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent ${lineHeight}px,
            rgba(0, 0, 0, ${opacity}) ${lineHeight}px,
            rgba(0, 0, 0, ${opacity}) ${lineHeight * 2}px
          )`,
          pointerEvents: "none",
        }}
      />

      {/* Moving highlight scan line */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(
            to bottom,
            transparent ${scanPosition - 5}%,
            rgba(0, 71, 255, 0.1) ${scanPosition}%,
            transparent ${scanPosition + 5}%
          )`,
          pointerEvents: "none",
        }}
      />
    </>
  );
};
