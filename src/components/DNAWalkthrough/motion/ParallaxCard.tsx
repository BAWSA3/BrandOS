'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef, ReactNode, useState, useEffect } from 'react';

interface ParallaxCardProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  depth?: number;
  direction?: 'up' | 'down';
  rotateOnScroll?: boolean;
  // Enhanced parallax options
  scale?: [number, number];      // [start, end] scale values
  xMovement?: number;            // Horizontal parallax pixels
  fadeIn?: boolean;              // Fade in as element enters viewport
  opacityRange?: [number, number]; // Custom opacity range [start, end]
}

export function ParallaxCard({
  children,
  className,
  style,
  depth = 0.5,
  direction = 'up',
  rotateOnScroll = false,
  scale,
  xMovement,
  fadeIn = false,
  opacityRange,
}: ParallaxCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Check for reduced motion preference on mount
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  // Calculate Y movement based on depth
  const movement = prefersReducedMotion ? 0 : 50 * depth;
  const yRange = direction === 'up' ? [movement, -movement] : [-movement, movement];

  // Transform values
  const y = useTransform(scrollYProgress, [0, 1], yRange);
  const rotate = useTransform(scrollYProgress, [0, 0.5, 1], [-2, 0, 2]);

  // Scale transform
  const scaleValue = useTransform(
    scrollYProgress,
    [0, 0.5, 1],
    scale ? [scale[0], (scale[0] + scale[1]) / 2, scale[1]] : [1, 1, 1]
  );

  // X movement transform
  const xMove = prefersReducedMotion ? 0 : (xMovement || 0);
  const x = useTransform(scrollYProgress, [0, 1], [xMove, -xMove]);

  // Opacity transform (for fade in or custom range)
  const opacity = useTransform(
    scrollYProgress,
    [0, 0.2, 0.8, 1],
    fadeIn
      ? [0, 1, 1, 0.8]
      : opacityRange
        ? [opacityRange[0], 1, 1, opacityRange[1]]
        : [1, 1, 1, 1]
  );

  if (prefersReducedMotion) {
    return (
      <div ref={ref} className={className} style={style}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{
        ...style,
        y,
        x: xMovement ? x : undefined,
        rotate: rotateOnScroll ? rotate : 0,
        scale: scale ? scaleValue : undefined,
        opacity: (fadeIn || opacityRange) ? opacity : undefined,
        willChange: 'transform, opacity',
      }}
    >
      {children}
    </motion.div>
  );
}
