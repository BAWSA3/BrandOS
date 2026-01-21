import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { COLORS } from "../styles";

interface GridBackgroundProps {
  cellSize?: number;
  opacity?: number;
  animated?: boolean;
  perspective?: boolean;
}

export const GridBackground: React.FC<GridBackgroundProps> = ({
  cellSize = 60,
  opacity = 0.15,
  animated = true,
  perspective = true,
}) => {
  const frame = useCurrentFrame();

  // Animate grid movement
  const offsetY = animated ? (frame % cellSize) : 0;
  const pulse = interpolate(
    Math.sin((frame / 60) * Math.PI * 2),
    [-1, 1],
    [0.8, 1.2]
  );

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        opacity: opacity * pulse,
      }}
    >
      {/* Perspective grid */}
      <div
        style={{
          position: "absolute",
          inset: perspective ? "-50%" : 0,
          transform: perspective
            ? "perspective(500px) rotateX(60deg) translateY(-20%)"
            : undefined,
          transformOrigin: "center center",
        }}
      >
        {/* Horizontal lines */}
        <svg
          width="100%"
          height="100%"
          style={{
            position: "absolute",
            transform: `translateY(${offsetY}px)`,
          }}
        >
          <defs>
            <pattern
              id="grid"
              width={cellSize}
              height={cellSize}
              patternUnits="userSpaceOnUse"
            >
              <path
                d={`M ${cellSize} 0 L 0 0 0 ${cellSize}`}
                fill="none"
                stroke={COLORS.primary}
                strokeWidth="1"
              />
            </pattern>
            <linearGradient id="gridFade" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="white" stopOpacity="0" />
              <stop offset="30%" stopColor="white" stopOpacity="1" />
              <stop offset="70%" stopColor="white" stopOpacity="1" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </linearGradient>
            <mask id="gridMask">
              <rect width="100%" height="100%" fill="url(#gridFade)" />
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="url(#grid)"
            mask="url(#gridMask)"
          />
        </svg>
      </div>

      {/* Horizon glow */}
      {perspective && (
        <div
          style={{
            position: "absolute",
            bottom: "30%",
            left: 0,
            right: 0,
            height: 200,
            background: `linear-gradient(to top, ${COLORS.accentGlow}, transparent)`,
            filter: "blur(30px)",
          }}
        />
      )}
    </div>
  );
};
