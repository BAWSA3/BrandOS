'use client';

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';

interface CurtainRiseProps {
  onComplete: () => void;
  theme: string;
}

export default function CurtainRise({
  onComplete,
  theme,
}: CurtainRiseProps) {
  const [stage, setStage] = useState<'ready' | 'rising' | 'complete'>('ready');

  useEffect(() => {
    // Start rising after a brief moment
    const riseTimer = setTimeout(() => setStage('rising'), 300);
    const completeTimer = setTimeout(onComplete, 1500);

    return () => {
      clearTimeout(riseTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Light rays behind curtain */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: stage === 'rising' ? 0.6 : 0 }}
        transition={{ duration: 0.8 }}
        style={{
          position: 'absolute',
          inset: 0,
          background: `
            radial-gradient(ellipse at 50% 100%, rgba(255,255,255,0.3) 0%, transparent 50%),
            radial-gradient(ellipse at 30% 80%, rgba(0,71,255,0.2) 0%, transparent 40%),
            radial-gradient(ellipse at 70% 80%, rgba(16,185,129,0.2) 0%, transparent 40%)
          `,
          zIndex: 5,
        }}
      />

      {/* Dashboard preview (blurred initially) */}
      <motion.div
        initial={{ filter: 'blur(20px)', opacity: 0.5 }}
        animate={{
          filter: stage === 'rising' ? 'blur(0px)' : 'blur(20px)',
          opacity: stage === 'rising' ? 1 : 0.5,
        }}
        transition={{ duration: 1 }}
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1,
        }}
      >
        {/* Placeholder dashboard grid preview */}
        <div
          style={{
            width: '80%',
            maxWidth: '800px',
            aspectRatio: '16/9',
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gridTemplateRows: 'repeat(2, 1fr)',
            gap: '16px',
            padding: '24px',
          }}
        >
          {/* Hero card */}
          <div
            style={{
              gridColumn: 'span 2',
              gridRow: 'span 2',
              background: 'linear-gradient(135deg, #0047FF 0%, #0033CC 100%)',
              borderRadius: '16px',
              opacity: 0.8,
            }}
          />
          {/* Identity card */}
          <div
            style={{
              gridColumn: 'span 2',
              background: 'rgba(255,255,255,0.9)',
              borderRadius: '16px',
            }}
          />
          {/* Tone card */}
          <div
            style={{
              background: '#1a1a1a',
              borderRadius: '16px',
            }}
          />
          {/* Archetype card */}
          <div
            style={{
              background: 'linear-gradient(135deg, #E8C49A 0%, #D4A574 100%)',
              borderRadius: '16px',
            }}
          />
        </div>
      </motion.div>

      {/* The Curtain */}
      <motion.div
        initial={{ y: 0, skewY: 0 }}
        animate={{
          y: stage === 'rising' ? '-110%' : 0,
          skewY: stage === 'rising' ? -3 : 0,
        }}
        transition={{
          duration: 1,
          ease: [0.4, 0, 0.2, 1],
        }}
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 50%, #0f0f0f 100%)`,
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          transformOrigin: 'top center',
        }}
      >
        {/* Curtain texture overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `
              repeating-linear-gradient(
                90deg,
                transparent,
                transparent 2px,
                rgba(255,255,255,0.02) 2px,
                rgba(255,255,255,0.02) 4px
              )
            `,
            pointerEvents: 'none',
          }}
        />

        {/* Content on curtain */}
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: stage === 'rising' ? 0 : 1 }}
          transition={{ duration: 0.3 }}
          style={{ textAlign: 'center' }}
        >
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>
            🧬
          </div>
          <div
            style={{
              fontFamily: "'VCR OSD Mono', monospace",
              fontSize: '12px',
              letterSpacing: '0.2em',
              color: 'rgba(255,255,255,0.5)',
            }}
          >
            REVEALING YOUR DASHBOARD
          </div>
        </motion.div>

        {/* Bottom shadow */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '100px',
            background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)',
            pointerEvents: 'none',
          }}
        />
      </motion.div>

      {/* Bottom glow line as curtain rises */}
      <motion.div
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{
          scaleX: stage === 'rising' ? 1 : 0,
          opacity: stage === 'rising' ? 1 : 0,
        }}
        transition={{ duration: 0.8, delay: 0.2 }}
        style={{
          position: 'absolute',
          bottom: '30%',
          left: '10%',
          right: '10%',
          height: '2px',
          background: 'linear-gradient(90deg, transparent, #0047FF, #10B981, transparent)',
          boxShadow: '0 0 20px rgba(0,71,255,0.5)',
          zIndex: 15,
        }}
      />
    </div>
  );
}
