'use client';

interface ParallaxBackgroundProps {
  theme?: string;
}

// Static background - no scroll-linked parallax
// Ensures scrolling works normally on the entire page
export default function ParallaxBackground({ theme = 'dark' }: ParallaxBackgroundProps) {
  const isDark = theme === 'dark';

  const orbStyles = {
    position: 'absolute' as const,
    borderRadius: '50%',
    filter: 'blur(80px)',
    pointerEvents: 'none' as const,
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      {/* Large blue orb - top right */}
      <div
        style={{
          ...orbStyles,
          top: '5%',
          right: '10%',
          width: '500px',
          height: '500px',
          background: `radial-gradient(circle, ${isDark ? 'rgba(46, 106, 255, 0.12)' : 'rgba(46, 106, 255, 0.08)'} 0%, transparent 70%)`,
        }}
      />

      {/* Amber orb - bottom left */}
      <div
        style={{
          ...orbStyles,
          bottom: '20%',
          left: '5%',
          width: '400px',
          height: '400px',
          background: `radial-gradient(circle, ${isDark ? 'rgba(212, 165, 116, 0.1)' : 'rgba(212, 165, 116, 0.06)'} 0%, transparent 70%)`,
        }}
      />

      {/* Purple accent orb - center right */}
      <div
        style={{
          ...orbStyles,
          top: '40%',
          right: '20%',
          width: '300px',
          height: '300px',
          background: `radial-gradient(circle, ${isDark ? 'rgba(139, 92, 246, 0.08)' : 'rgba(139, 92, 246, 0.05)'} 0%, transparent 70%)`,
        }}
      />

      {/* Green accent orb - bottom center */}
      <div
        style={{
          ...orbStyles,
          bottom: '10%',
          left: '40%',
          width: '250px',
          height: '250px',
          background: `radial-gradient(circle, ${isDark ? 'rgba(16, 185, 129, 0.06)' : 'rgba(16, 185, 129, 0.04)'} 0%, transparent 70%)`,
        }}
      />

      {/* Film grain texture */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: isDark ? 0.03 : 0.02,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundSize: '150px 150px',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
