import React from "react";
import { interpolate, useCurrentFrame, spring, useVideoConfig } from "remotion";
import { easeOutQuart, easeOutBack } from "../utils/easing";
import { colors } from "../utils/colors";

interface BrandLogoProps {
  startFrame?: number;
  showTagline?: boolean;
}

/**
 * BrandOS logo reveal with cinematic animation
 * "Brand" in bold italic + "OS" in monospace
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({
  startFrame = 0,
  showTagline = true,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const relativeFrame = frame - startFrame;

  if (relativeFrame < 0) return null;

  // === LOGO ANIMATION ===
  const logoScale = spring({
    frame: relativeFrame,
    fps,
    config: {
      damping: 14,
      stiffness: 120,
      mass: 0.6,
    },
  });

  const logoOpacity = interpolate(
    relativeFrame,
    [0, 10],
    [0, 1],
    { extrapolateRight: "clamp" }
  );

  // === "OS" SHIMMER ===
  const shimmerPosition = interpolate(
    relativeFrame,
    [15, 45],
    [-100, 200],
    { extrapolateRight: "clamp" }
  );

  // === TAGLINE ===
  const taglineOpacity = interpolate(
    relativeFrame,
    [25, 40],
    [0, 1],
    { extrapolateRight: "clamp" }
  );

  const taglineY = interpolate(
    relativeFrame,
    [25, 40],
    [20, 0],
    { extrapolateRight: "clamp", easing: easeOutQuart }
  );

  // === CTA ===
  const ctaOpacity = interpolate(
    relativeFrame,
    [50, 65],
    [0, 1],
    { extrapolateRight: "clamp" }
  );

  // === GLOW ===
  const glowIntensity = interpolate(
    relativeFrame,
    [0, 20, 60],
    [0, 50, 30],
    { extrapolateRight: "clamp" }
  );

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Logo */}
      <div
        style={{
          opacity: logoOpacity,
          transform: `scale(${logoScale})`,
          display: "flex",
          alignItems: "baseline",
          filter: `drop-shadow(0 0 ${glowIntensity}px ${colors.primary})`,
        }}
      >
        {/* "Brand" - italic bold */}
        <span
          style={{
            fontFamily: "'Helvetica Neue', 'Inter', sans-serif",
            fontSize: 96,
            fontWeight: 700,
            fontStyle: "italic",
            color: colors.white,
            letterSpacing: "-0.02em",
          }}
        >
          Brand
        </span>

        {/* "OS" - monospace with shimmer */}
        <span
          style={{
            fontFamily: "'JetBrains Mono', 'VCR OSD Mono', monospace",
            fontSize: 96,
            fontWeight: 400,
            color: "rgba(255, 255, 255, 0.5)",
            letterSpacing: "0.02em",
            position: "relative",
            overflow: "hidden",
          }}
        >
          OS
          {/* Shimmer overlay */}
          <span
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)`,
              transform: `translateX(${shimmerPosition}%)`,
              pointerEvents: "none",
            }}
          />
        </span>
      </div>

      {/* Tagline */}
      {showTagline && (
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 28,
            fontWeight: 500,
            color: colors.gold,
            margin: 0,
            marginTop: 32,
            opacity: taglineOpacity,
            transform: `translateY(${taglineY}px)`,
            letterSpacing: "0.05em",
          }}
        >
          Find yours.
        </p>
      )}

      {/* CTA */}
      <div
        style={{
          position: "absolute",
          bottom: "15%",
          opacity: ctaOpacity,
        }}
      >
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 18,
            fontWeight: 500,
            color: "rgba(255, 255, 255, 0.6)",
            letterSpacing: "0.1em",
          }}
        >
          mybrandos.app
        </span>
      </div>
    </div>
  );
};
