import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { colors } from "../utils/colors";

interface GlowEffectProps {
  intensity?: number; // 0 to 1
  size?: number; // Size multiplier
  pulse?: boolean;
  pulseSpeed?: number;
  color?: string;
  x?: string;
  y?: string;
}

export const GlowEffect: React.FC<GlowEffectProps> = ({
  intensity = 0.5,
  size = 1,
  pulse = false,
  pulseSpeed = 0.03,
  color = colors.cyan,
  x = "50%",
  y = "50%",
}) => {
  const frame = useCurrentFrame();

  const pulseIntensity = pulse
    ? interpolate(Math.sin(frame * pulseSpeed), [-1, 1], [0.7, 1])
    : 1;

  const finalIntensity = intensity * pulseIntensity;

  return (
    <div
      style={{
        position: "absolute",
        top: y,
        left: x,
        transform: "translate(-50%, -50%)",
        width: `${400 * size}px`,
        height: `${400 * size}px`,
        background: `radial-gradient(ellipse at center, ${color}${Math.round(finalIntensity * 60).toString(16).padStart(2, '0')} 0%, transparent 70%)`,
        filter: `blur(${30 * size}px)`,
        pointerEvents: "none",
      }}
    />
  );
};

interface AuraEffectProps {
  opacity?: number;
  scale?: number;
  rings?: number;
}

export const AuraEffect: React.FC<AuraEffectProps> = ({
  opacity = 0.5,
  scale = 1,
  rings = 3,
}) => {
  const frame = useCurrentFrame();

  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      }}
    >
      {Array.from({ length: rings }).map((_, i) => {
        const ringScale = interpolate(
          Math.sin(frame * 0.02 + i * 0.5),
          [-1, 1],
          [0.95, 1.05]
        );
        const ringOpacity = opacity * (1 - i * 0.2);

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: `translate(-50%, -50%) scale(${scale * ringScale * (1 + i * 0.3)})`,
              width: "300px",
              height: "400px",
              borderRadius: "50%",
              border: `2px solid ${colors.cyan}`,
              opacity: ringOpacity,
              filter: "blur(2px)",
            }}
          />
        );
      })}
    </div>
  );
};

interface LightTrailProps {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  progress: number; // 0 to 1
  width?: number;
}

export const LightTrail: React.FC<LightTrailProps> = ({
  startX,
  startY,
  endX,
  endY,
  progress,
  width = 3,
}) => {
  const trailLength = Math.sqrt(
    Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2)
  );
  const angle = Math.atan2(endY - startY, endX - startX) * (180 / Math.PI);

  return (
    <div
      style={{
        position: "absolute",
        left: startX,
        top: startY,
        width: `${trailLength * progress}px`,
        height: `${width}px`,
        background: `linear-gradient(90deg, transparent 0%, ${colors.cyan} 30%, ${colors.cyanLight} 100%)`,
        transform: `rotate(${angle}deg)`,
        transformOrigin: "left center",
        filter: "blur(1px)",
        boxShadow: `0 0 10px ${colors.cyan}, 0 0 20px ${colors.cyan}`,
      }}
    />
  );
};
