import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { colors } from "../utils/colors";
import { easeOutBack } from "../utils/easing";

interface BrandRevealProps {
  startFrame?: number;
}

export const BrandReveal: React.FC<BrandRevealProps> = ({ startFrame = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const relativeFrame = frame - startFrame;

  if (relativeFrame < 0) return null;

  const words = ["BRICK", "BY", "BRICK"];

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.dark,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "8px",
        }}
      >
        {words.map((word, index) => {
          const wordDelay = index * 8;
          const wordFrame = relativeFrame - wordDelay;

          const scaleProgress = spring({
            frame: wordFrame,
            fps,
            config: {
              damping: 15,
              stiffness: 80,
              mass: 0.8,
            },
          });

          const scale = interpolate(scaleProgress, [0, 1], [1.3, 1]);
          const opacity = interpolate(wordFrame, [0, 10], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });

          const translateY = interpolate(scaleProgress, [0, 1], [20, 0]);

          // Different font sizes for visual hierarchy
          const fontSize = word === "BY" ? 60 : 90;
          const fontWeight = word === "BY" ? 700 : 900;
          const letterSpacing = word === "BY" ? "0.3em" : "0.05em";

          return (
            <div
              key={index}
              style={{
                opacity,
                transform: `scale(${scale}) translateY(${translateY}px)`,
              }}
            >
              <span
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: `${fontSize}px`,
                  fontWeight,
                  color: colors.white,
                  letterSpacing,
                  textTransform: "uppercase",
                  display: "block",
                  textAlign: "center",
                }}
              >
                {word}
              </span>
            </div>
          );
        })}
      </div>

      {/* Subtle glow behind text */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "600px",
          height: "400px",
          background: colors.gradients.cyanGlow,
          filter: "blur(80px)",
          opacity: interpolate(relativeFrame, [20, 50], [0, 0.15], {
            extrapolateRight: "clamp",
          }),
          zIndex: -1,
        }}
      />
    </div>
  );
};

interface TaglineProps {
  text: string;
  startFrame?: number;
  y?: string;
}

export const Tagline: React.FC<TaglineProps> = ({
  text,
  startFrame = 0,
  y = "65%",
}) => {
  const frame = useCurrentFrame();
  const relativeFrame = frame - startFrame;

  if (relativeFrame < 0) return null;

  const opacity = interpolate(relativeFrame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        width: "100%",
        top: y,
        left: 0,
        textAlign: "center",
        opacity,
      }}
    >
      <p
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: "24px",
          fontWeight: 400,
          color: colors.whiteSubtle,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
        }}
      >
        {text}
      </p>
    </div>
  );
};
