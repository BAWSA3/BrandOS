'use client';

import { motion, Variants } from 'framer-motion';
import { ReactNode } from 'react';

type StaggerDirection = 'up' | 'down' | 'left' | 'right' | 'scale';

interface StaggerItemProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  direction?: StaggerDirection;
  variants?: Variants;
}

const directionVariants: Record<StaggerDirection, Variants> = {
  up: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  },
  down: {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0 },
  },
  left: {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  },
  right: {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
  },
  scale: {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1 },
  },
};

export function StaggerItem({
  children,
  className,
  style,
  direction = 'up',
  variants,
}: StaggerItemProps) {
  // Check for reduced motion preference
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const itemVariants: Variants = variants || {
    hidden: prefersReducedMotion
      ? { opacity: 0 }
      : directionVariants[direction].hidden,
    visible: {
      opacity: 1,
      y: 0,
      x: 0,
      scale: 1,
      transition: prefersReducedMotion
        ? { duration: 0.2 }
        : {
            type: 'spring',
            damping: 20,
            stiffness: 100,
          },
    },
  };

  return (
    <motion.div className={className} style={style} variants={itemVariants}>
      {children}
    </motion.div>
  );
}
