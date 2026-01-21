import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { GridBackground } from "../components/GridBackground";
import { Particles } from "../components/Particles";
import { ScanLines } from "../components/ScanLines";
import { COLORS, FONTS } from "../styles";

export const HookScene: React.FC = () => {
  const frame = useCurrentFrame();

  // Text reveal animation
  const textOpacity = interpolate(frame, [10, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const textScale = interpolate(frame, [10, 35], [0.9, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Glow pulse for emphasis
  const glowPulse = interpolate(
    Math.sin((frame / 20) * Math.PI * 2),
    [-1, 1],
    [0.4, 0.8]
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.background,
      }}
    >
      {/* Futuristic grid background */}
      <GridBackground opacity={0.1} perspective={true} />

      {/* Floating particles */}
      <Particles count={25} seed="hook" />

      {/* Main content */}
      <AbsoluteFill
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            textAlign: "center",
            opacity: textOpacity,
            transform: `scale(${textScale})`,
            fontFamily: FONTS.heading,
            fontSize: 56,
            fontWeight: 600,
            color: COLORS.text,
            letterSpacing: "-0.02em",
            textShadow: `
              0 0 40px rgba(0, 71, 255, ${glowPulse}),
              0 0 80px rgba(0, 71, 255, ${glowPulse * 0.5})
            `,
          }}
        >
          Your brand has a score.
        </div>
      </AbsoluteFill>

      {/* Scan lines overlay */}
      <ScanLines opacity={0.02} />
    </AbsoluteFill>
  );
};
