'use client';

import { useScroll, useTransform, MotionValue } from 'framer-motion';
import { RefObject } from 'react';

interface UseScrollProgressOptions {
  target?: RefObject<HTMLElement>;
  offset?: [string, string][];
}

interface ScrollProgressReturn {
  scrollYProgress: MotionValue<number>;
  scrollY: MotionValue<number>;
  opacity: MotionValue<number>;
  scale: MotionValue<number>;
  y: MotionValue<number>;
  parallaxY: MotionValue<number>;
}

export function useScrollProgress(
  options: UseScrollProgressOptions = {}
): ScrollProgressReturn {
  const { target, offset } = options;

  const scrollConfig: { target?: RefObject<HTMLElement>; offset?: [string, string][] } = {};
  if (target) scrollConfig.target = target;
  if (offset) scrollConfig.offset = offset;

  const { scrollYProgress, scrollY } = useScroll(
    Object.keys(scrollConfig).length > 0 ? scrollConfig : undefined
  );

  // Common transformations
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.95, 1, 0.95]);
  const y = useTransform(scrollYProgress, [0, 1], [50, -50]);
  const parallaxY = useTransform(scrollYProgress, [0, 1], [0, -100]);

  return {
    scrollYProgress,
    scrollY,
    opacity,
    scale,
    y,
    parallaxY,
  };
}
