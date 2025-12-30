'use client';

import { motion } from 'motion/react';

interface JourneyProgressProps {
  currentPhase: number;
  totalPhases: number;
  phaseProgress: number;
  theme: string;
}

const phaseNames = ['DEFINE', 'CHECK', 'GENERATE', 'SCALE'];

export default function JourneyProgress({ 
  currentPhase, 
  totalPhases, 
  phaseProgress, 
  theme 
}: JourneyProgressProps) {
  const overallProgress = ((currentPhase - 1) + phaseProgress) / totalPhases;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        position: 'fixed',
        top: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
      }}
    >
      {/* Phase indicator pills */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          padding: '8px 16px',
          background: theme === 'dark' ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: '40px',
          border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
        }}
      >
        {phaseNames.map((name, index) => {
          const phaseNumber = index + 1;
          const isActive = currentPhase === phaseNumber;
          const isCompleted = currentPhase > phaseNumber;
          
          return (
            <motion.div
              key={name}
              animate={{
                scale: isActive ? 1.05 : 1,
                opacity: isActive || isCompleted ? 1 : 0.4,
              }}
              transition={{ duration: 0.3 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '20px',
                background: isActive 
                  ? 'rgba(0, 71, 255, 0.15)' 
                  : isCompleted 
                    ? 'rgba(16, 185, 129, 0.15)' 
                    : 'transparent',
                border: isActive 
                  ? '1px solid rgba(0, 71, 255, 0.3)' 
                  : isCompleted
                    ? '1px solid rgba(16, 185, 129, 0.3)'
                    : '1px solid transparent',
                transition: 'all 0.3s ease',
              }}
            >
              {/* Phase number or checkmark */}
              <span
                style={{
                  fontFamily: "'VCR OSD Mono', monospace",
                  fontSize: '10px',
                  fontWeight: 500,
                  color: isActive 
                    ? '#0047FF' 
                    : isCompleted 
                      ? '#10B981' 
                      : theme === 'dark' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
                  width: '16px',
                  height: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  background: isActive 
                    ? 'rgba(0, 71, 255, 0.2)' 
                    : isCompleted 
                      ? 'rgba(16, 185, 129, 0.2)' 
                      : theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                }}
              >
                {isCompleted ? '✓' : phaseNumber}
              </span>

              {/* Phase name - only show on active */}
              <motion.span
                animate={{
                  width: isActive ? 'auto' : 0,
                  opacity: isActive ? 1 : 0,
                }}
                transition={{ duration: 0.3 }}
                style={{
                  fontFamily: "'VCR OSD Mono', monospace",
                  fontSize: '10px',
                  letterSpacing: '0.1em',
                  color: '#0047FF',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                }}
              >
                {name}
              </motion.span>
            </motion.div>
          );
        })}
      </div>

      {/* Overall progress bar */}
      <div
        style={{
          width: '200px',
          height: '3px',
          background: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          borderRadius: '2px',
          overflow: 'hidden',
        }}
      >
        <motion.div
          animate={{ width: `${overallProgress * 100}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          style={{
            height: '100%',
            background: 'linear-gradient(90deg, #0047FF 0%, #10B981 100%)',
            borderRadius: '2px',
            boxShadow: '0 0 10px rgba(0, 71, 255, 0.5)',
          }}
        />
      </div>

      {/* Progress percentage */}
      <span
        style={{
          fontFamily: "'VCR OSD Mono', monospace",
          fontSize: '10px',
          letterSpacing: '0.1em',
          color: theme === 'dark' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
        }}
      >
        {Math.round(overallProgress * 100)}% ANALYZED
      </span>
    </motion.div>
  );
}







