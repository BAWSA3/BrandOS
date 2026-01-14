'use client';

import { ReactNode, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useRevealContext } from './RevealContainer';

type AnimationType = 'fade-up' | 'fade-scale' | 'slide-left' | 'slide-right' | 'fade';

interface RevealItemProps {
  children: ReactNode;
  animation?: AnimationType;
  className?: string;
  style?: React.CSSProperties;
  // Injected by RevealContainer
  itemIndex?: number;
  totalItems?: number;
}

// Animation configurations
const animations: Record<AnimationType, {
  hidden: { opacity: number; y?: number; x?: number; scale?: number };
  visible: { opacity: number; y?: number; x?: number; scale?: number };
}> = {
  'fade-up': {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1 },
  },
  'fade-scale': {
    hidden: { opacity: 0, scale: 0.85 },
    visible: { opacity: 1, scale: 1 },
  },
  'slide-left': {
    hidden: { opacity: 0, x: -40 },
    visible: { opacity: 1, x: 0 },
  },
  'slide-right': {
    hidden: { opacity: 0, x: 40 },
    visible: { opacity: 1, x: 0 },
  },
  'fade': {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
};

export default function RevealItem({
  children,
  animation = 'fade-up',
  className = '',
  style,
  itemIndex = 0,
  totalItems = 1,
}: RevealItemProps) {
  const { getItemRevealProgress } = useRevealContext();

  // Get this item's reveal progress (0-1)
  const revealProgress = getItemRevealProgress(itemIndex, totalItems);

  // Interpolate between hidden and visible states
  const animConfig = animations[animation];

  const currentStyle = useMemo(() => {
    const lerp = (start: number, end: number, t: number) => start + (end - start) * t;
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
    const easedProgress = easeOutCubic(revealProgress);

    const result: React.CSSProperties = {
      opacity: lerp(animConfig.hidden.opacity, animConfig.visible.opacity, easedProgress),
    };

    if (animConfig.hidden.y !== undefined) {
      result.transform = `translateY(${lerp(animConfig.hidden.y, animConfig.visible.y || 0, easedProgress)}px)`;
    }
    if (animConfig.hidden.x !== undefined) {
      result.transform = `translateX(${lerp(animConfig.hidden.x, animConfig.visible.x || 0, easedProgress)}px)`;
    }
    if (animConfig.hidden.scale !== undefined) {
      const scale = lerp(animConfig.hidden.scale, animConfig.visible.scale || 1, easedProgress);
      result.transform = result.transform
        ? `${result.transform} scale(${scale})`
        : `scale(${scale})`;
    }

    return result;
  }, [revealProgress, animConfig]);

  return (
    <motion.div
      className={className}
      style={{
        ...style,
        ...currentStyle,
        willChange: 'transform, opacity',
      }}
    >
      {children}
    </motion.div>
  );
}

// Convenience wrapper for direct use without RevealContainer
// (uses viewport-based reveal instead of scroll progress)
export function ViewportRevealItem({
  children,
  animation = 'fade-up',
  className = '',
  style,
  delay = 0,
}: {
  children: ReactNode;
  animation?: AnimationType;
  className?: string;
  style?: React.CSSProperties;
  delay?: number;
}) {
  const animConfig = animations[animation];

  return (
    <motion.div
      className={className}
      style={style}
      initial={animConfig.hidden}
      whileInView={animConfig.visible}
      viewport={{ once: true, amount: 0.3 }}
      transition={{
        duration: 0.5,
        delay,
        ease: [0.25, 0.1, 0.25, 1],
      }}
    >
      {children}
    </motion.div>
  );
}
