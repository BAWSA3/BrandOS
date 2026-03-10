'use client';

import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface HoverHighlightProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  glowColor?: string;
  glowIntensity?: number;
  proximityRadius?: number;
}

export default function HoverHighlight({
  children,
  className = '',
  style = {},
  glowColor = 'rgba(0, 71, 255, 0.15)',
  glowIntensity = 1,
  proximityRadius = 150,
}: HoverHighlightProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isNear, setIsNear] = useState(false);
  const [proximity, setProximity] = useState(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!ref.current) return;

      const rect = ref.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const distance = Math.sqrt(
        Math.pow(e.clientX - centerX, 2) + Math.pow(e.clientY - centerY, 2)
      );

      const maxDistance = proximityRadius + Math.max(rect.width, rect.height) / 2;
      const normalizedProximity = Math.max(0, 1 - distance / maxDistance);

      setProximity(normalizedProximity);
      setIsNear(normalizedProximity > 0);

      // Position relative to element
      setMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [proximityRadius]);

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{
        ...style,
        position: 'relative',
        overflow: 'hidden',
      }}
      animate={{
        scale: 1 + proximity * 0.02,
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      {/* Glow effect following cursor */}
      {isNear && (
        <motion.div
          style={{
            position: 'absolute',
            left: mousePosition.x,
            top: mousePosition.y,
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            zIndex: 0,
          }}
          animate={{
            opacity: proximity * glowIntensity,
            scale: 0.5 + proximity * 0.5,
          }}
          transition={{ duration: 0.15 }}
        />
      )}

      {/* Border glow */}
      <motion.div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 'inherit',
          border: '1px solid transparent',
          pointerEvents: 'none',
        }}
        animate={{
          borderColor: isNear
            ? `rgba(0, 71, 255, ${proximity * 0.3})`
            : 'transparent',
          boxShadow: isNear
            ? `0 0 ${20 * proximity}px ${glowColor}`
            : 'none',
        }}
        transition={{ duration: 0.2 }}
      />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
    </motion.div>
  );
}

// Interactive card that responds to cursor proximity
interface InteractiveCardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export function InteractiveCard({
  children,
  className = '',
  style = {},
  onClick,
}: InteractiveCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const rotateXVal = ((e.clientY - centerY) / (rect.height / 2)) * -5;
    const rotateYVal = ((e.clientX - centerX) / (rect.width / 2)) * 5;

    setRotateX(rotateXVal);
    setRotateY(rotateYVal);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setIsHovered(false);
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      data-interactive="true"
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      animate={{
        rotateX,
        rotateY,
        scale: isHovered ? 1.02 : 1,
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      style={{
        ...style,
        transformStyle: 'preserve-3d',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      {children}
    </motion.div>
  );
}
