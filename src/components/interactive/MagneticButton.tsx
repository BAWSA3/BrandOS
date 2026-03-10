'use client';

import { useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface MagneticButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
  magnetStrength?: number;
  disabled?: boolean;
}

export default function MagneticButton({
  children,
  onClick,
  className = '',
  style = {},
  magnetStrength = 0.3,
  disabled = false,
}: MagneticButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || !buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const deltaX = (e.clientX - centerX) * magnetStrength;
    const deltaY = (e.clientY - centerY) * magnetStrength;

    setPosition({ x: deltaX, y: deltaY });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
    setIsHovered(false);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  return (
    <motion.button
      ref={buttonRef}
      className={className}
      onClick={onClick}
      disabled={disabled}
      data-interactive="true"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
      animate={{
        x: position.x,
        y: position.y,
        scale: isHovered ? 1.02 : 1,
      }}
      transition={{
        type: 'spring',
        stiffness: 350,
        damping: 15,
      }}
      style={{
        ...style,
        position: 'relative',
      }}
    >
      {/* Glow effect on hover */}
      <motion.div
        animate={{
          opacity: isHovered ? 1 : 0,
          scale: isHovered ? 1 : 0.8,
        }}
        transition={{ duration: 0.2 }}
        style={{
          position: 'absolute',
          inset: -2,
          borderRadius: 'inherit',
          background: 'linear-gradient(135deg, rgba(0, 71, 255, 0.2), rgba(16, 185, 129, 0.2))',
          filter: 'blur(8px)',
          zIndex: -1,
        }}
      />
      {children}
    </motion.button>
  );
}
