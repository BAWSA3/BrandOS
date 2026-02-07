import React from "react";
import { interpolate, useCurrentFrame } from "remotion";

interface GlowOrbProps {
  color: string;
  size?: number;
  x?: string;
  y?: string;
  pulseSpeed?: number;
  opacity?: number;
  blur?: number;
}

/**
 * Animated ambient glow orb for cinematic atmosphere
 */
export const GlowOrb: React.FC<GlowOrbProps> = ({
  color,
  size = 400,
  x = "50%",
  y = "50%",
  pulseSpeed = 0.03,
  opacity = 0.4,
  blur = 100,
}) => {
  const frame = useCurrentFrame();

  const pulseOpacity = interpolate(
    Math.sin(frame * pulseSpeed),
    [-1, 1],
    [opacity * 0.6, opacity]
  );

  const pulseScale = interpolate(
    Math.sin(frame * pulseSpeed * 0.7),
    [-1, 1],
    [0.95, 1.05]
  );

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: size,
        height: size,
        transform: `translate(-50%, -50%) scale(${pulseScale})`,
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        filter: `blur(${blur}px)`,
        opacity: pulseOpacity,
        pointerEvents: "none",
      }}
    />
  );
};
