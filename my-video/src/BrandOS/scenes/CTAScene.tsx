import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  spring,
} from "remotion";
import { BrandOSLogo } from "../components/BrandOSLogo";
import { GridBackground } from "../components/GridBackground";
import { Particles } from "../components/Particles";
import { ScanLines } from "../components/ScanLines";
import { COLORS, FONTS, SPRING_CONFIG } from "../styles";

export const CTAScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Staggered text reveals
  const text1Progress = spring({
    frame: frame - 10,
    fps,
    config: SPRING_CONFIG.smooth,
  });

  const text2Progress = spring({
    frame: frame - 30,
    fps,
    config: SPRING_CONFIG.smooth,
  });

  // CTA button effects
  const buttonPulse = interpolate(
    Math.sin((frame / 20) * Math.PI * 2),
    [-1, 1],
    [0.97, 1.03]
  );

  const buttonGlow = interpolate(
    Math.sin((frame / 20) * Math.PI * 2),
    [-1, 1],
    [0.4, 0.8]
  );

  // Animated border gradient
  const gradientRotation = frame * 3;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.background,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 40,
      }}
    >
      {/* Grid background */}
      <GridBackground opacity={0.1} perspective={true} />

      {/* Particles */}
      <Particles count={40} seed="cta" speed={1.2} />

      {/* Central glow */}
      <div
        style={{
          position: "absolute",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${COLORS.accentGlowBright} 0%, transparent 50%)`,
          opacity: 0.3,
          filter: "blur(80px)",
        }}
      />

      {/* Logo */}
      <div
        style={{
          opacity: interpolate(text1Progress, [0, 1], [0, 1]),
          transform: `translateY(${interpolate(text1Progress, [0, 1], [30, 0])}px)`,
        }}
      >
        <BrandOSLogo scale={1.5} showShimmer={true} animateIn={false} />
      </div>

      {/* Main CTA text */}
      <div
        style={{
          fontFamily: FONTS.heading,
          fontSize: 48,
          fontWeight: 700,
          color: COLORS.text,
          textAlign: "center",
          letterSpacing: "-0.02em",
          opacity: interpolate(text1Progress, [0, 1], [0, 1]),
          transform: `translateY(${interpolate(text1Progress, [0, 1], [30, 0])}px)`,
          textShadow: `0 0 40px ${COLORS.accentGlow}`,
        }}
      >
        Discover your Brand DNA
      </div>

      {/* CTA Button with animated border */}
      <div
        style={{
          position: "relative",
          padding: 3,
          borderRadius: 14,
          background: `conic-gradient(from ${gradientRotation}deg, ${COLORS.primary}, #00ffff, ${COLORS.primary}, #00ffff)`,
          transform: `scale(${buttonPulse})`,
          opacity: interpolate(text2Progress, [0, 1], [0, 1]),
          boxShadow: `0 0 40px rgba(0, 71, 255, ${buttonGlow})`,
        }}
      >
        <div
          style={{
            padding: "22px 56px",
            background: COLORS.background,
            borderRadius: 11,
            fontFamily: FONTS.heading,
            fontSize: 24,
            fontWeight: 600,
            color: COLORS.text,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
          }}
        >
          Join the waitlist
        </div>
      </div>

      {/* Scan lines */}
      <ScanLines opacity={0.02} />
    </AbsoluteFill>
  );
};
