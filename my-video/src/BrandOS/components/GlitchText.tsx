import React from "react";
import { useCurrentFrame, random } from "remotion";
import { COLORS, FONTS } from "../styles";

interface GlitchTextProps {
  text: string;
  fontSize?: number;
  fontWeight?: number;
  glitchIntensity?: number;
  color?: string;
}

export const GlitchText: React.FC<GlitchTextProps> = ({
  text,
  fontSize = 48,
  fontWeight = 600,
  glitchIntensity = 0.3,
  color = COLORS.text,
}) => {
  const frame = useCurrentFrame();

  // Occasional glitch frames
  const isGlitching = random(`glitch-${Math.floor(frame / 4)}`) < glitchIntensity;
  const glitchOffset = isGlitching ? (random(`offset-${frame}`) - 0.5) * 10 : 0;
  const glitchSkew = isGlitching ? (random(`skew-${frame}`) - 0.5) * 5 : 0;

  return (
    <div
      style={{
        position: "relative",
        fontFamily: FONTS.heading,
        fontSize,
        fontWeight,
        color,
        letterSpacing: "-0.02em",
      }}
    >
      {/* Main text */}
      <span
        style={{
          transform: `translateX(${glitchOffset}px) skewX(${glitchSkew}deg)`,
          display: "inline-block",
        }}
      >
        {text}
      </span>

      {/* Chromatic aberration layers */}
      {isGlitching && (
        <>
          <span
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              color: "#ff0040",
              opacity: 0.7,
              transform: `translateX(${glitchOffset - 3}px)`,
              clipPath: "inset(0 0 50% 0)",
            }}
          >
            {text}
          </span>
          <span
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              color: "#00ffff",
              opacity: 0.7,
              transform: `translateX(${glitchOffset + 3}px)`,
              clipPath: "inset(50% 0 0 0)",
            }}
          >
            {text}
          </span>
        </>
      )}
    </div>
  );
};
