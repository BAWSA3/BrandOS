import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { GlassCard } from "../components/GlassCard";
import { GridBackground } from "../components/GridBackground";
import { Particles } from "../components/Particles";
import { ScanLines } from "../components/ScanLines";
import { COLORS, FONTS } from "../styles";

export const InputScene: React.FC = () => {
  const frame = useCurrentFrame();

  // Handle text typing animation
  const handle = "@bawsaxbt";
  const typeDelay = 30;
  const charsVisible = Math.min(
    Math.floor(Math.max(0, frame - typeDelay) * 0.5),
    handle.length
  );
  const displayHandle = handle.slice(0, charsVisible);

  // Cursor blink
  const cursorVisible = (frame % 20) < 10 || charsVisible < handle.length;

  // Input field glow when typing
  const inputGlow = interpolate(
    frame,
    [typeDelay, typeDelay + 60],
    [0.3, 0.7],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Button pulse
  const buttonScale = charsVisible >= handle.length
    ? interpolate(Math.sin((frame / 15) * Math.PI * 2), [-1, 1], [0.98, 1.02])
    : 1;

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
      <GridBackground opacity={0.06} perspective={true} />

      {/* Particles */}
      <Particles count={20} seed="input" />

      <GlassCard
        width={550}
        padding={40}
        animateIn={true}
        startFrame={0}
        glowIntensity={inputGlow}
      >
        {/* Label with tech styling */}
        <div
          style={{
            fontFamily: FONTS.mono,
            fontSize: 14,
            color: COLORS.primary,
            marginBottom: 20,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            textShadow: `0 0 10px ${COLORS.accentGlow}`,
          }}
        >
          {"<"} Enter your X handle {"/>"}
        </div>

        {/* Input field */}
        <div
          style={{
            width: "100%",
            padding: "24px 28px",
            backgroundColor: "rgba(0, 71, 255, 0.05)",
            borderRadius: 12,
            border: `1px solid rgba(0, 71, 255, ${inputGlow * 0.5})`,
            display: "flex",
            alignItems: "center",
            boxShadow: `
              inset 0 0 20px rgba(0, 71, 255, 0.1),
              0 0 30px rgba(0, 71, 255, ${inputGlow * 0.3})
            `,
          }}
        >
          <span
            style={{
              fontFamily: FONTS.mono,
              fontSize: 28,
              color: COLORS.text,
              letterSpacing: "0.02em",
              textShadow: `0 0 10px ${COLORS.accentGlow}`,
            }}
          >
            {displayHandle}
          </span>
          {cursorVisible && (
            <span
              style={{
                display: "inline-block",
                width: 3,
                height: 32,
                backgroundColor: COLORS.primary,
                marginLeft: 2,
                boxShadow: `0 0 10px ${COLORS.primary}`,
              }}
            />
          )}
        </div>

        {/* Analyze button */}
        {charsVisible >= handle.length && (
          <div
            style={{
              marginTop: 28,
              padding: "16px 36px",
              background: `linear-gradient(135deg, ${COLORS.primary} 0%, #0066ff 100%)`,
              borderRadius: 8,
              fontFamily: FONTS.heading,
              fontSize: 16,
              fontWeight: 600,
              color: COLORS.text,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              transform: `scale(${buttonScale})`,
              boxShadow: `
                0 0 30px ${COLORS.accentGlow},
                0 0 60px rgba(0, 71, 255, 0.3)
              `,
              opacity: interpolate(
                frame - typeDelay - 50,
                [0, 15],
                [0, 1],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
              ),
            }}
          >
            Analyze Brand →
          </div>
        )}
      </GlassCard>

      {/* Scan lines */}
      <ScanLines opacity={0.02} />
    </AbsoluteFill>
  );
};
