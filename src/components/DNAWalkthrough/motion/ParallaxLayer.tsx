'use client';

export interface ParallaxLayerConfig {
  id: string;
  position: {
    top?: string;
    left?: string;
    right?: string;
    bottom?: string;
  };
  size: string;
  color: string;
  opacity?: number;
  depth?: number;
  blur?: number;
  shape?: 'circle' | 'square' | 'blob' | 'ring';
  direction?: 'up' | 'down' | 'left' | 'right';
}

interface ParallaxLayerProps extends ParallaxLayerConfig {
  containerRef?: React.RefObject<HTMLElement | null>;
}

// Static decorative layer - no scroll or cursor effects
export function ParallaxLayer({
  position,
  size,
  color,
  opacity = 0.15,
  blur = 40,
  shape = 'circle',
}: ParallaxLayerProps) {
  // Shape styles
  const getShapeStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      width: size,
      height: size,
      background: shape === 'ring'
        ? 'transparent'
        : `radial-gradient(circle, ${color} 0%, transparent 70%)`,
      filter: `blur(${blur}px)`,
    };

    switch (shape) {
      case 'circle':
        return { ...base, borderRadius: '50%' };
      case 'square':
        return { ...base, borderRadius: '20%' };
      case 'blob':
        return {
          ...base,
          borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%',
        };
      case 'ring':
        return {
          ...base,
          borderRadius: '50%',
          border: `2px solid ${color}`,
          background: 'transparent',
          opacity: opacity * 0.5,
        };
      default:
        return base;
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        ...position,
        ...getShapeStyle(),
        opacity,
        pointerEvents: 'none',
      }}
    />
  );
}

// Preset configurations for common decorative elements
export const parallaxPresets = {
  // Large ambient orb
  ambientOrb: (color: string, position: ParallaxLayerConfig['position']): ParallaxLayerConfig => ({
    id: `ambient-${Math.random().toString(36).slice(2, 9)}`,
    position,
    size: '300px',
    color,
    opacity: 0.12,
    depth: 0.15,
    blur: 60,
    shape: 'circle',
    direction: 'up',
  }),

  // Medium floating blob
  floatingBlob: (color: string, position: ParallaxLayerConfig['position']): ParallaxLayerConfig => ({
    id: `blob-${Math.random().toString(36).slice(2, 9)}`,
    position,
    size: '150px',
    color,
    opacity: 0.2,
    depth: 0.35,
    blur: 40,
    shape: 'blob',
    direction: 'up',
  }),

  // Small accent dot
  accentDot: (color: string, position: ParallaxLayerConfig['position']): ParallaxLayerConfig => ({
    id: `dot-${Math.random().toString(36).slice(2, 9)}`,
    position,
    size: '80px',
    color,
    opacity: 0.25,
    depth: 0.5,
    blur: 20,
    shape: 'circle',
    direction: 'down',
  }),

  // Decorative ring
  ring: (color: string, position: ParallaxLayerConfig['position']): ParallaxLayerConfig => ({
    id: `ring-${Math.random().toString(36).slice(2, 9)}`,
    position,
    size: '200px',
    color,
    opacity: 0.15,
    depth: 0.25,
    blur: 0,
    shape: 'ring',
    direction: 'up',
  }),
};
