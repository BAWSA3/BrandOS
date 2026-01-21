import React from "react";
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  useCurrentFrame,
} from "remotion";
import { z } from "zod";
import { HookScene } from "./scenes/HookScene";
import { ProblemScene } from "./scenes/ProblemScene";
import { LogoScene } from "./scenes/LogoScene";
import { InputScene } from "./scenes/InputScene";
import { ProcessingScene } from "./scenes/ProcessingScene";
import { ScoreRevealScene } from "./scenes/ScoreRevealScene";
import { CTAScene } from "./scenes/CTAScene";
import { COLORS, SCENE_TIMING } from "./styles";

// Schema for the composition props
export const brandOSPromoSchema = z.object({
  handle: z.string().default("@bawsaxbt"),
  brandScore: z.number().min(0).max(100).default(87),
  archetype: z.string().default("The Prophet"),
});

type BrandOSPromoProps = z.infer<typeof brandOSPromoSchema>;

// Fade transition component
const FadeTransition: React.FC<{
  children: React.ReactNode;
  fadeInDuration?: number;
  fadeOutDuration?: number;
  sceneLength: number;
}> = ({ children, fadeInDuration = 10, fadeOutDuration = 10, sceneLength }) => {
  const frame = useCurrentFrame();

  // Handle fade in
  const fadeInOpacity = fadeInDuration > 0
    ? interpolate(frame, [0, fadeInDuration], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 1;

  // Handle fade out
  const fadeOutOpacity = fadeOutDuration > 0
    ? interpolate(frame, [sceneLength - fadeOutDuration, sceneLength], [1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 1;

  const opacity = Math.min(fadeInOpacity, fadeOutOpacity);

  return (
    <AbsoluteFill style={{ opacity }}>
      {children}
    </AbsoluteFill>
  );
};

export const BrandOSPromo: React.FC<BrandOSPromoProps> = () => {
  const { hook, problem, logo, input, processing, scoreReveal, cta } = SCENE_TIMING;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.background }}>
      {/* Scene 1: Hook - "Your brand has a score." (0-3s) */}
      <Sequence from={hook.start} durationInFrames={hook.end - hook.start}>
        <FadeTransition sceneLength={hook.end - hook.start} fadeInDuration={0}>
          <HookScene />
        </FadeTransition>
      </Sequence>

      {/* Scene 2: Problem - Chaotic icons (3-7s) */}
      <Sequence from={problem.start} durationInFrames={problem.end - problem.start}>
        <FadeTransition sceneLength={problem.end - problem.start}>
          <ProblemScene />
        </FadeTransition>
      </Sequence>

      {/* Scene 3: Logo Reveal (7-10s) */}
      <Sequence from={logo.start} durationInFrames={logo.end - logo.start}>
        <FadeTransition sceneLength={logo.end - logo.start}>
          <LogoScene />
        </FadeTransition>
      </Sequence>

      {/* Scene 4: Input Demo (10-14s) */}
      <Sequence from={input.start} durationInFrames={input.end - input.start}>
        <FadeTransition sceneLength={input.end - input.start}>
          <InputScene />
        </FadeTransition>
      </Sequence>

      {/* Scene 5: Processing (14-16s) */}
      <Sequence from={processing.start} durationInFrames={processing.end - processing.start}>
        <FadeTransition sceneLength={processing.end - processing.start}>
          <ProcessingScene />
        </FadeTransition>
      </Sequence>

      {/* Scene 6: Score Reveal (16-21s) */}
      <Sequence from={scoreReveal.start} durationInFrames={scoreReveal.end - scoreReveal.start}>
        <FadeTransition sceneLength={scoreReveal.end - scoreReveal.start}>
          <ScoreRevealScene />
        </FadeTransition>
      </Sequence>

      {/* Scene 7: CTA (21-27s) */}
      <Sequence from={cta.start} durationInFrames={cta.end - cta.start}>
        <FadeTransition sceneLength={cta.end - cta.start} fadeOutDuration={15}>
          <CTAScene />
        </FadeTransition>
      </Sequence>
    </AbsoluteFill>
  );
};
