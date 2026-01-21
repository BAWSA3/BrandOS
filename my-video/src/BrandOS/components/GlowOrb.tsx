import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { COLORS } from "../styles";

interface GlowOrbProps {
  size?: number;
  x?: number;
  y?: number;
  pulseSpeed?: number;
  opacity?: number;
}

export const GlowOrb: React.FC<GlowOrbProps> = ({
  size = 400,
  x = 50,
  y = 50,
  pulseSpeed = 60,
  opacity = 0.3,
}) => {
  const frame = useCurrentFrame();

  // Pulse effect
  const pulse = interpolate(
    Math.sin((frame / pulseSpeed) * Math.PI * 2),
    [-1, 1],
    [0.8, 1.2]
  );

  // Subtle movement
  const offsetX = Math.sin((frame / 90) * Math.PI * 2) * 20;
  const offsetY = Math.cos((frame / 120) * Math.PI * 2) * 20;

  return (
    <div
      style={{
        position: "absolute",
        left: `${x}%`,
        top: `${y}%`,
        transform: `translate(-50%, -50%) translate(${offsetX}px, ${offsetY}px)`,
        width: size * pulse,
        height: size * pulse,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${COLORS.accentGlow} 0%, transparent 70%)`,
        opacity,
        filter: "blur(40px)",
        pointerEvents: "none",
      }}
    />
  );
};
