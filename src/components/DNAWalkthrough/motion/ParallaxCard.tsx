'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef, ReactNode } from 'react';

interface ParallaxCardProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  depth?: number;
  direction?: 'up' | 'down';
  rotateOnScroll?: boolean;
}

export function ParallaxCard({
  children,
  className,
  style,
  depth = 0.5,
  direction = 'up',
  rotateOnScroll = false,
}: ParallaxCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  // Check for reduced motion preference
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Calculate movement based on depth
  const movement = prefersReducedMotion ? 0 : 50 * depth;
  const yRange = direction === 'up' ? [movement, -movement] : [-movement, movement];

  const y = useTransform(scrollYProgress, [0, 1], yRange);
  const rotate = useTransform(scrollYProgress, [0, 0.5, 1], [-2, 0, 2]);

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
        rotate: rotateOnScroll ? rotate : 0,
      }}
    >
      {children}
    </motion.div>
  );
}
