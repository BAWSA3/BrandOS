'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';

export type CursorMode = 'default' | 'scanning' | 'analyzing' | 'interactive' | 'hidden';

interface CustomCursorProps {
  mode?: CursorMode;
}

const MODE_STYLES: Record<CursorMode, { size: number; color: string; label?: string }> = {
  default: { size: 12, color: 'rgba(0, 71, 255, 0.8)' },
  scanning: { size: 40, color: 'rgba(0, 71, 255, 0.15)', label: 'SCAN' },
  analyzing: { size: 32, color: 'rgba(16, 185, 129, 0.2)', label: 'ANALYZE' },
  interactive: { size: 48, color: 'rgba(0, 71, 255, 0.1)', label: 'CLICK' },
  hidden: { size: 0, color: 'transparent' },
};

export default function CustomCursor({ mode = 'default' }: CustomCursorProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isPointer, setIsPointer] = useState(false);
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  // Smooth spring animation for cursor movement
  const springConfig = { damping: 25, stiffness: 400 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  // Trail dots
  const trailCount = 5;
  const trailRefs = useRef<{ x: number; y: number }[]>(
    Array(trailCount).fill({ x: -100, y: -100 })
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      setIsVisible(true);

      // Update trail
      trailRefs.current = [
        { x: e.clientX, y: e.clientY },
        ...trailRefs.current.slice(0, trailCount - 1),
      ];

      // Check if hovering over interactive element
      const target = e.target as HTMLElement;
      const isInteractive =
        target.tagName === 'BUTTON' ||
        target.tagName === 'A' ||
        target.closest('button') ||
        target.closest('a') ||
        target.dataset.interactive === 'true';
      setIsPointer(!!isInteractive);
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    const handleMouseEnter = () => {
      setIsVisible(true);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, [cursorX, cursorY]);

  const currentStyle = MODE_STYLES[mode];
  const actualSize = isPointer ? currentStyle.size * 1.5 : currentStyle.size;

  if (mode === 'hidden') return null;

  return (
    <>
      {/* Hide default cursor globally */}
      <style jsx global>{`
        * {
          cursor: none !important;
        }
      `}</style>

      {/* Trail dots */}
      {trailRefs.current.map((pos, i) => (
        <motion.div
          key={i}
          style={{
            position: 'fixed',
            left: 0,
            top: 0,
            x: cursorXSpring,
            y: cursorYSpring,
            pointerEvents: 'none',
            zIndex: 9998,
          }}
          animate={{
            opacity: isVisible ? (1 - i * 0.2) * 0.3 : 0,
            scale: 1 - i * 0.15,
          }}
          transition={{ delay: i * 0.02 }}
        >
          <div
            style={{
              width: 4,
              height: 4,
              borderRadius: '50%',
              background: currentStyle.color,
              transform: 'translate(-50%, -50%)',
            }}
          />
        </motion.div>
      ))}

      {/* Main cursor */}
      <motion.div
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          x: cursorXSpring,
          y: cursorYSpring,
          pointerEvents: 'none',
          zIndex: 9999,
        }}
        animate={{
          opacity: isVisible ? 1 : 0,
        }}
      >
        {/* Outer ring */}
        <motion.div
          animate={{
            width: actualSize,
            height: actualSize,
            borderColor: currentStyle.color,
          }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          style={{
            borderRadius: '50%',
            border: `1px solid ${currentStyle.color}`,
            background: isPointer ? currentStyle.color : 'transparent',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Label */}
          {currentStyle.label && !isPointer && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                fontFamily: "'VCR OSD Mono', monospace",
                fontSize: '6px',
                letterSpacing: '0.1em',
                color: '#0047FF',
                whiteSpace: 'nowrap',
              }}
            >
              {currentStyle.label}
            </motion.span>
          )}
        </motion.div>

        {/* Center dot */}
        <motion.div
          animate={{
            scale: isPointer ? 0 : 1,
            opacity: isPointer ? 0 : 1,
          }}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 4,
            height: 4,
            borderRadius: '50%',
            background: '#0047FF',
            transform: 'translate(-50%, -50%)',
          }}
        />
      </motion.div>

      {/* Scanning line effect */}
      {mode === 'scanning' && (
        <motion.div
          style={{
            position: 'fixed',
            left: 0,
            top: 0,
            x: cursorXSpring,
            y: cursorYSpring,
            pointerEvents: 'none',
            zIndex: 9997,
          }}
          animate={{ opacity: isVisible ? 1 : 0 }}
        >
          <motion.div
            animate={{
              height: [0, 60, 0],
              opacity: [0, 0.5, 0],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{
              width: 1,
              background: 'linear-gradient(to bottom, transparent, #0047FF, transparent)',
              transform: 'translate(-50%, -30px)',
            }}
          />
        </motion.div>
      )}
    </>
  );
}
