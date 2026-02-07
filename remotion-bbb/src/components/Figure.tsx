import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { colors, glowStyles } from "../utils/colors";

interface FigureProps {
  opacity?: number;
  scale?: number;
  glowIntensity?: "none" | "subtle" | "medium" | "strong" | "intense";
  blur?: number;
  translateY?: number;
  variant?: "standing" | "working" | "ascending" | "arrived";
}

export const Figure: React.FC<FigureProps> = ({
  opacity = 1,
  scale = 1,
  glowIntensity = "subtle",
  blur = 0,
  translateY = 0,
  variant = "standing",
}) => {
  const frame = useCurrentFrame();

  const getGlowStyle = () => {
    if (glowIntensity === "none") return "none";
    return glowStyles[glowIntensity];
  };

  // Different SVG paths for different figure states
  const getFigurePath = () => {
    switch (variant) {
      case "working":
        return (
          <>
            {/* Body in motion - leaning forward */}
            <ellipse cx="200" cy="120" rx="35" ry="40" fill="currentColor" />
            <path
              d="M200 160 L200 280 Q200 300 180 320 L160 380 M200 280 Q200 300 220 320 L240 380"
              stroke="currentColor"
              strokeWidth="20"
              strokeLinecap="round"
              fill="none"
            />
            {/* Arms in working position */}
            <path
              d="M200 180 Q160 200 140 240 M200 180 Q240 200 280 220"
              stroke="currentColor"
              strokeWidth="18"
              strokeLinecap="round"
              fill="none"
            />
          </>
        );
      case "ascending":
        return (
          <>
            {/* Body reaching upward */}
            <ellipse cx="200" cy="100" rx="35" ry="40" fill="currentColor" />
            <path
              d="M200 140 L200 260 Q200 280 190 300 L175 360 M200 260 Q200 280 210 300 L225 360"
              stroke="currentColor"
              strokeWidth="20"
              strokeLinecap="round"
              fill="none"
            />
            {/* Arms reaching up */}
            <path
              d="M200 160 Q170 140 150 80 M200 160 Q230 140 250 80"
              stroke="currentColor"
              strokeWidth="18"
              strokeLinecap="round"
              fill="none"
            />
          </>
        );
      case "arrived":
        return (
          <>
            {/* Body standing tall, confident */}
            <ellipse cx="200" cy="100" rx="38" ry="42" fill="currentColor" />
            <path
              d="M200 142 L200 280 Q200 300 185 330 L170 400 M200 280 Q200 300 215 330 L230 400"
              stroke="currentColor"
              strokeWidth="22"
              strokeLinecap="round"
              fill="none"
            />
            {/* Arms at sides, relaxed but present */}
            <path
              d="M200 165 Q165 180 145 240 M200 165 Q235 180 255 240"
              stroke="currentColor"
              strokeWidth="18"
              strokeLinecap="round"
              fill="none"
            />
          </>
        );
      default: // standing
        return (
          <>
            {/* Head */}
            <ellipse cx="200" cy="110" rx="35" ry="40" fill="currentColor" />
            {/* Body */}
            <path
              d="M200 150 L200 280 Q200 300 185 330 L170 400 M200 280 Q200 300 215 330 L230 400"
              stroke="currentColor"
              strokeWidth="20"
              strokeLinecap="round"
              fill="none"
            />
            {/* Arms hanging */}
            <path
              d="M200 170 Q160 190 150 260 M200 170 Q240 190 250 260"
              stroke="currentColor"
              strokeWidth="16"
              strokeLinecap="round"
              fill="none"
            />
          </>
        );
    }
  };

  // Subtle breathing animation
  const breatheScale = interpolate(
    Math.sin(frame * 0.05),
    [-1, 1],
    [0.98, 1.02]
  );

  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: `translate(-50%, -50%) scale(${scale * breatheScale}) translateY(${translateY}px)`,
        opacity,
        filter: blur > 0 ? `blur(${blur}px)` : undefined,
        transition: "filter 0.3s ease",
      }}
    >
      {/* Glow layer behind figure */}
      {glowIntensity !== "none" && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "300px",
            height: "500px",
            background: colors.gradients.cyanGlow,
            filter: "blur(40px)",
            opacity: glowIntensity === "intense" ? 0.8 : glowIntensity === "strong" ? 0.6 : glowIntensity === "medium" ? 0.4 : 0.2,
          }}
        />
      )}

      {/* Figure SVG */}
      <svg
        width="400"
        height="500"
        viewBox="0 0 400 500"
        style={{
          color: colors.cyan,
          filter: `drop-shadow(${getGlowStyle()})`,
        }}
      >
        {getFigurePath()}
      </svg>
    </div>
  );
};
