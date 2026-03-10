'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';

type RevealDirection = 'up' | 'down' | 'left' | 'right' | 'fade' | 'scale';

interface ScrollRevealProps {
  children: React.ReactNode;
  direction?: RevealDirection;
  delay?: number;
  duration?: number;
  distance?: number;
  className?: string;
  style?: React.CSSProperties;
  once?: boolean;
}

export default function ScrollReveal({
  children,
  direction = 'up',
  delay = 0,
  duration = 0.6,
  distance = 40,
  className = '',
  style = {},
  once = true,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  // Transform values based on scroll
  const progress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
  });

  const getInitialTransform = () => {
    switch (direction) {
      case 'up':
        return { y: distance, x: 0, scale: 1 };
      case 'down':
        return { y: -distance, x: 0, scale: 1 };
      case 'left':
        return { y: 0, x: distance, scale: 1 };
      case 'right':
        return { y: 0, x: -distance, scale: 1 };
      case 'scale':
        return { y: 0, x: 0, scale: 0.9 };
      case 'fade':
      default:
        return { y: 0, x: 0, scale: 1 };
    }
  };

  const initial = getInitialTransform();

  return (
    <motion.div
      ref={ref}
      className={className}
      style={style}
      initial={{ opacity: 0, ...initial }}
      whileInView={{ opacity: 1, y: 0, x: 0, scale: 1 }}
      viewport={{ once, amount: 0.3 }}
      transition={{
        duration,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
    >
      {children}
    </motion.div>
  );
}

// Stagger container for multiple children
interface ScrollStaggerProps {
  children: React.ReactNode;
  staggerDelay?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function ScrollStagger({
  children,
  staggerDelay = 0.1,
  className = '',
  style = {},
}: ScrollStaggerProps) {
  return (
    <motion.div
      className={className}
      style={style}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

export function ScrollStaggerItem({
  children,
  className = '',
  style = {},
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <motion.div
      className={className}
      style={style}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </motion.div>
  );
}

// Parallax element that moves based on scroll
interface ParallaxElementProps {
  children: React.ReactNode;
  speed?: number; // -1 to 1, negative = opposite direction
  className?: string;
  style?: React.CSSProperties;
}

export function ParallaxElement({
  children,
  speed = 0.5,
  className = '',
  style = {},
}: ParallaxElementProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const y = useTransform(scrollYProgress, [0, 1], [100 * speed, -100 * speed]);
  const smoothY = useSpring(y, { stiffness: 100, damping: 30 });

  return (
    <motion.div ref={ref} className={className} style={{ ...style, y: smoothY }}>
      {children}
    </motion.div>
  );
}
