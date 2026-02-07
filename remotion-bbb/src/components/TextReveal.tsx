import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { colors } from "../utils/colors";
import { easeOutQuart } from "../utils/easing";

interface TextRevealProps {
  text: string;
  startFrame?: number;
  style?: "typewriter" | "fade" | "wordByWord" | "impact";
  fontSize?: number;
  color?: string;
  textAlign?: "left" | "center" | "right";
  y?: string;
}

export const TextReveal: React.FC<TextRevealProps> = ({
  text,
  startFrame = 0,
  style = "wordByWord",
  fontSize = 48,
  color = colors.white,
  textAlign = "center",
  y = "70%",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const relativeFrame = frame - startFrame;

  if (relativeFrame < 0) return null;

  const words = text.split(" ");

  const renderTypewriter = () => {
    const charsPerFrame = 0.8;
    const visibleChars = Math.floor(relativeFrame * charsPerFrame);
    const displayText = text.slice(0, visibleChars);

    return (
      <span style={{ opacity: 1 }}>
        {displayText}
        {visibleChars < text.length && (
          <span
            style={{
              opacity: Math.sin(frame * 0.3) > 0 ? 1 : 0,
              color: colors.cyan,
            }}
          >
            |
          </span>
        )}
      </span>
    );
  };

  const renderFade = () => {
    const opacity = interpolate(relativeFrame, [0, 20], [0, 1], {
      extrapolateRight: "clamp",
    });

    return <span style={{ opacity }}>{text}</span>;
  };

  const renderWordByWord = () => {
    return (
      <span>
        {words.map((word, index) => {
          const wordDelay = index * 8;
          const wordProgress = spring({
            frame: relativeFrame - wordDelay,
            fps,
            config: {
              damping: 20,
              stiffness: 100,
              mass: 0.5,
            },
          });

          const opacity = interpolate(wordProgress, [0, 1], [0, 1]);
          const translateY = interpolate(wordProgress, [0, 1], [20, 0]);

          return (
            <span
              key={index}
              style={{
                display: "inline-block",
                opacity,
                transform: `translateY(${translateY}px)`,
                marginRight: "0.3em",
              }}
            >
              {word}
            </span>
          );
        })}
      </span>
    );
  };

  const renderImpact = () => {
    const scale = interpolate(
      relativeFrame,
      [0, 8, 15],
      [1.5, 0.95, 1],
      {
        extrapolateRight: "clamp",
        easing: easeOutQuart,
      }
    );

    const opacity = interpolate(relativeFrame, [0, 5], [0, 1], {
      extrapolateRight: "clamp",
    });

    return (
      <span
        style={{
          display: "inline-block",
          opacity,
          transform: `scale(${scale})`,
        }}
      >
        {text}
      </span>
    );
  };

  const renderContent = () => {
    switch (style) {
      case "typewriter":
        return renderTypewriter();
      case "fade":
        return renderFade();
      case "impact":
        return renderImpact();
      default:
        return renderWordByWord();
    }
  };

  return (
    <div
      style={{
        position: "absolute",
        width: "100%",
        top: y,
        left: 0,
        textAlign,
        padding: "0 100px",
      }}
    >
      <p
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: `${fontSize}px`,
          fontWeight: 500,
          color,
          letterSpacing: "-0.02em",
          lineHeight: 1.2,
          textShadow: `0 0 30px rgba(0, 212, 255, 0.3)`,
        }}
      >
        {renderContent()}
      </p>
    </div>
  );
};
