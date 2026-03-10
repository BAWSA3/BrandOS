'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';

interface ScrollProgressProps {
  containerRef?: React.RefObject<HTMLElement>;
  position?: 'top' | 'bottom' | 'left' | 'right';
  color?: string;
  height?: number;
  showPercentage?: boolean;
}

export default function ScrollProgress({
  containerRef,
  position = 'top',
  color = '#0047FF',
  height = 3,
  showPercentage = false,
}: ScrollProgressProps) {
  const { scrollYProgress } = useScroll({
    container: containerRef,
  });

  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  const percentage = useTransform(scrollYProgress, [0, 1], [0, 100]);

  const isHorizontal = position === 'top' || position === 'bottom';

  const positionStyles: React.CSSProperties = {
    top: position === 'top' ? 0 : undefined,
    bottom: position === 'bottom' ? 0 : undefined,
    left: position === 'left' ? 0 : isHorizontal ? 0 : undefined,
    right: position === 'right' ? 0 : isHorizontal ? undefined : undefined,
  };

  return (
    <>
      <motion.div
        style={{
          position: 'fixed',
          ...positionStyles,
          width: isHorizontal ? '100%' : height,
          height: isHorizontal ? height : '100%',
          background: `${color}15`,
          zIndex: 100,
        }}
      >
        <motion.div
          style={{
            width: isHorizontal ? '100%' : '100%',
            height: '100%',
            background: `linear-gradient(90deg, ${color}, ${color}CC)`,
            transformOrigin: isHorizontal ? 'left' : 'top',
            scaleX: isHorizontal ? scaleX : 1,
            scaleY: isHorizontal ? 1 : scaleX,
          }}
        />
      </motion.div>

      {showPercentage && (
        <motion.div
          style={{
            position: 'fixed',
            top: position === 'top' ? height + 8 : undefined,
            bottom: position === 'bottom' ? height + 8 : undefined,
            right: 16,
            fontFamily: "'VCR OSD Mono', monospace",
            fontSize: '10px',
            letterSpacing: '0.1em',
            color: color,
            zIndex: 100,
          }}
        >
          <motion.span>{Math.round(percentage.get())}%</motion.span>
        </motion.div>
      )}
    </>
  );
}

// Section progress indicator
interface SectionProgressProps {
  sections: string[];
  activeIndex: number;
  onSectionClick?: (index: number) => void;
}

export function SectionProgress({
  sections,
  activeIndex,
  onSectionClick,
}: SectionProgressProps) {
  return (
    <div
      style={{
        position: 'fixed',
        right: 24,
        top: '50%',
        transform: 'translateY(-50%)',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        zIndex: 100,
      }}
    >
      {sections.map((section, i) => {
        const isActive = i === activeIndex;
        const isCompleted = i < activeIndex;

        return (
          <motion.button
            key={section}
            onClick={() => onSectionClick?.(i)}
            data-interactive="true"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              border: 'none',
              background: isActive
                ? '#0047FF'
                : isCompleted
                  ? 'rgba(16, 185, 129, 0.8)'
                  : 'rgba(0, 0, 0, 0.1)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            <span
              style={{
                fontFamily: "'VCR OSD Mono', monospace",
                fontSize: '10px',
                color: isActive || isCompleted ? '#fff' : 'rgba(0, 0, 0, 0.4)',
              }}
            >
              {isCompleted ? '✓' : i + 1}
            </span>

            {/* Tooltip */}
            <motion.span
              initial={{ opacity: 0, x: 10 }}
              whileHover={{ opacity: 1, x: 0 }}
              style={{
                position: 'absolute',
                right: 40,
                whiteSpace: 'nowrap',
                fontFamily: "'VCR OSD Mono', monospace",
                fontSize: '9px',
                letterSpacing: '0.08em',
                color: 'rgba(0, 0, 0, 0.6)',
                background: 'rgba(255, 255, 255, 0.95)',
                padding: '4px 8px',
                borderRadius: 3,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              }}
            >
              {section}
            </motion.span>

            {/* Connection line */}
            {i < sections.length - 1 && (
              <div
                style={{
                  position: 'absolute',
                  top: 32,
                  left: '50%',
                  width: 1,
                  height: 12,
                  background:
                    i < activeIndex ? 'rgba(16, 185, 129, 0.5)' : 'rgba(0, 0, 0, 0.1)',
                  transform: 'translateX(-50%)',
                }}
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
