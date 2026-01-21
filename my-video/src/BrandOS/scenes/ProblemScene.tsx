import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, random } from "remotion";
import { ScanLines } from "../components/ScanLines";
import { COLORS, FONTS } from "../styles";

const SOCIAL_ICONS = ["📱", "💬", "🐦", "📸", "💼", "🎵", "📧", "🔔", "💡", "🎯"];

interface FloatingIconProps {
  icon: string;
  index: number;
}

const FloatingIcon: React.FC<FloatingIconProps> = ({ icon, index }) => {
  const frame = useCurrentFrame();

  // Each icon has unique chaotic movement
  const seed = index * 1.7;
  const x = 50 + Math.sin((frame / 40 + seed) * Math.PI * 2) * 40;
  const y = 50 + Math.cos((frame / 55 + seed * 1.3) * Math.PI * 2) * 35;
  const rotation = Math.sin((frame / 30 + seed) * Math.PI * 2) * 30;
  const scale = 0.7 + Math.sin((frame / 25 + seed) * Math.PI * 2) * 0.3;

  // Glitchy opacity
  const glitchOpacity = random(`icon-${index}-${Math.floor(frame / 3)}`) > 0.3 ? 0.5 : 0.2;

  // Fade in
  const opacity = interpolate(frame, [0, 20], [0, glitchOpacity], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        left: `${x}%`,
        top: `${y}%`,
        transform: `translate(-50%, -50%) rotate(${rotation}deg) scale(${scale})`,
        fontSize: 40,
        opacity,
        filter: "blur(1px)",
        textShadow: `0 0 20px ${COLORS.accentGlow}`,
      }}
    >
      {icon}
    </div>
  );
};

export const ProblemScene: React.FC = () => {
  const frame = useCurrentFrame();

  // Text fade in
  const textOpacity = interpolate(frame, [30, 50], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Vignette intensity increases with chaos
  const vignetteIntensity = interpolate(frame, [0, 60], [0.5, 0.8], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.background,
      }}
    >
      {/* Chaotic floating icons */}
      {SOCIAL_ICONS.map((icon, i) => (
        <FloatingIcon key={i} icon={icon} index={i} />
      ))}

      {/* Heavy vignette for chaos effect */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at 50% 50%, transparent 20%, ${COLORS.background} ${vignetteIntensity * 100}%)`,
          pointerEvents: "none",
        }}
      />

      {/* Static noise overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.03,
          background: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Main text */}
      <AbsoluteFill
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: textOpacity,
        }}
      >
        <div
          style={{
            fontFamily: FONTS.heading,
            fontSize: 42,
            fontWeight: 500,
            color: COLORS.textMuted,
            letterSpacing: "-0.02em",
          }}
        >
          But most creators have no idea what it is.
        </div>
      </AbsoluteFill>

      {/* Scan lines for retro-futuristic feel */}
      <ScanLines opacity={0.02} speed={3} />
    </AbsoluteFill>
  );
};
