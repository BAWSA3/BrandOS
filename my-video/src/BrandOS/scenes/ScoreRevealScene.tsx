import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  spring,
} from "remotion";
import { GlassCard } from "../components/GlassCard";
import { ScoreCounter } from "../components/ScoreCounter";
import { GridBackground } from "../components/GridBackground";
import { Particles } from "../components/Particles";
import { ScanLines } from "../components/ScanLines";
import { COLORS, FONTS, SPRING_CONFIG } from "../styles";

interface StatItemProps {
  label: string;
  value: string;
  delay: number;
  color?: string;
}

const StatItem: React.FC<StatItemProps> = ({ label, value, delay, color = COLORS.primary }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - delay,
    fps,
    config: SPRING_CONFIG.smooth,
  });

  const opacity = interpolate(progress, [0, 1], [0, 1]);
  const translateX = interpolate(progress, [0, 1], [30, 0]);

  // Animated bar width
  const barWidth = interpolate(progress, [0, 1], [0, parseFloat(value)]);

  return (
    <div
      style={{
        padding: "14px 0",
        opacity,
        transform: `translateX(${translateX}px)`,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <span
          style={{
            fontFamily: FONTS.mono,
            fontSize: 13,
            color: COLORS.textMuted,
            textTransform: "uppercase",
            letterSpacing: "0.15em",
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontFamily: FONTS.mono,
            fontSize: 16,
            color: COLORS.text,
            fontWeight: 600,
            textShadow: `0 0 10px ${color}`,
          }}
        >
          {value}
        </span>
      </div>
      {/* Progress bar */}
      <div
        style={{
          width: "100%",
          height: 4,
          backgroundColor: "rgba(255, 255, 255, 0.1)",
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${barWidth}%`,
            height: "100%",
            background: `linear-gradient(90deg, ${color}, ${color}88)`,
            borderRadius: 2,
            boxShadow: `0 0 10px ${color}`,
          }}
        />
      </div>
    </div>
  );
};

export const ScoreRevealScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Archetype reveal
  const archetypeProgress = spring({
    frame: frame - 50,
    fps,
    config: SPRING_CONFIG.smooth,
  });

  const archetypeOpacity = interpolate(archetypeProgress, [0, 1], [0, 1]);
  const archetypeScale = interpolate(archetypeProgress, [0, 1], [0.9, 1]);

  // Score glow pulse
  const scorePulse = interpolate(
    Math.sin((frame / 20) * Math.PI * 2),
    [-1, 1],
    [0.6, 1]
  );

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
      <GridBackground opacity={0.06} perspective={false} />

      {/* Particles */}
      <Particles count={30} seed="score" speed={0.8} />

      {/* Radial burst effect on reveal */}
      <div
        style={{
          position: "absolute",
          width: 800,
          height: 800,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${COLORS.accentGlowBright} 0%, transparent 40%)`,
          opacity: interpolate(frame, [15, 60], [0.8, 0.2], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          filter: "blur(60px)",
        }}
      />

      <GlassCard
        width={500}
        padding={44}
        animateIn={true}
        startFrame={0}
        glowIntensity={0.6}
      >
        {/* Handle */}
        <div
          style={{
            fontFamily: FONTS.mono,
            fontSize: 18,
            color: COLORS.textMuted,
            marginBottom: 12,
            letterSpacing: "0.05em",
          }}
        >
          @bawsaxbt
        </div>

        {/* Brand Score Label */}
        <div
          style={{
            marginBottom: 4,
            fontFamily: FONTS.mono,
            fontSize: 12,
            color: COLORS.primary,
            textTransform: "uppercase",
            letterSpacing: "0.2em",
            textShadow: `0 0 10px ${COLORS.accentGlow}`,
          }}
        >
          {"<"} Brand Score {"/>"}
        </div>

        {/* Score with glow */}
        <div style={{ filter: `drop-shadow(0 0 ${scorePulse * 30}px ${COLORS.primary})` }}>
          <ScoreCounter targetScore={87} startFrame={15} fontSize={110} />
        </div>

        {/* Archetype */}
        <div
          style={{
            marginTop: 12,
            marginBottom: 28,
            opacity: archetypeOpacity,
            transform: `scale(${archetypeScale})`,
          }}
        >
          <div
            style={{
              fontFamily: FONTS.mono,
              fontSize: 11,
              color: COLORS.textMuted,
              textTransform: "uppercase",
              letterSpacing: "0.2em",
              marginBottom: 8,
            }}
          >
            Archetype Detected
          </div>
          <div
            style={{
              fontFamily: FONTS.heading,
              fontSize: 34,
              fontWeight: 700,
              background: `linear-gradient(135deg, ${COLORS.text} 0%, ${COLORS.primary} 100%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              letterSpacing: "-0.02em",
            }}
          >
            "The Prophet"
          </div>
        </div>

        {/* Stats with progress bars */}
        <div style={{ width: "100%" }}>
          <StatItem label="Authenticity" value="92%" delay={60} color="#00ffff" />
          <StatItem label="Consistency" value="84%" delay={70} color={COLORS.primary} />
          <StatItem label="Engagement" value="88%" delay={80} color="#00ffff" />
        </div>
      </GlassCard>

      {/* Scan lines */}
      <ScanLines opacity={0.02} />
    </AbsoluteFill>
  );
};
