import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { BrandOSLogo } from "../components/BrandOSLogo";
import { GridBackground } from "../components/GridBackground";
import { Particles } from "../components/Particles";
import { ScanLines } from "../components/ScanLines";
import { COLORS } from "../styles";

export const LogoScene: React.FC = () => {
  const frame = useCurrentFrame();

  // Background glow intensifies
  const glowIntensity = interpolate(frame, [0, 40], [0.1, 0.6], {
    extrapolateRight: "clamp",
  });

  // Ring expansion
  const ringScale = interpolate(frame, [20, 60], [0, 2], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const ringOpacity = interpolate(frame, [20, 60], [0.6, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.background,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Grid background */}
      <GridBackground opacity={0.08} perspective={false} />

      {/* Particles */}
      <Particles count={40} seed="logo" speed={1.5} />

      {/* Expanding ring effect */}
      <div
        style={{
          position: "absolute",
          width: 300,
          height: 300,
          borderRadius: "50%",
          border: `2px solid ${COLORS.primary}`,
          transform: `scale(${ringScale})`,
          opacity: ringOpacity,
        }}
      />

      {/* Central glow behind logo */}
      <div
        style={{
          position: "absolute",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${COLORS.accentGlowBright} 0%, transparent 50%)`,
          opacity: glowIntensity,
          filter: "blur(40px)",
        }}
      />

      {/* Outer glow ring */}
      <div
        style={{
          position: "absolute",
          width: 600,
          height: 600,
          borderRadius: "50%",
          border: `1px solid ${COLORS.primary}`,
          opacity: glowIntensity * 0.3,
          boxShadow: `
            inset 0 0 60px ${COLORS.accentGlow},
            0 0 60px ${COLORS.accentGlow}
          `,
        }}
      />

      {/* Main logo */}
      <BrandOSLogo scale={1.8} showShimmer={true} animateIn={true} startFrame={10} />

      {/* Scan lines */}
      <ScanLines opacity={0.02} />
    </AbsoluteFill>
  );
};
