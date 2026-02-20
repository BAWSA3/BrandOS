'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import AsciiSky from './AsciiSky';

interface AsciiSkyLoadingScreenProps {
  onComplete: () => void;
  brandName?: string;
  minDisplayTime?: number;
}

export default function AsciiSkyLoadingScreen({
  onComplete,
  brandName,
  minDisplayTime = 2500,
}: AsciiSkyLoadingScreenProps) {
  const [show, setShow] = useState(true);
  const startRef = useRef(Date.now());
  const completedRef = useRef(false);

  // Wait for minimum display time then start exit
  useEffect(() => {
    const elapsed = Date.now() - startRef.current;
    const remaining = Math.max(0, minDisplayTime - elapsed);

    const timer = setTimeout(() => {
      setShow(false);
    }, remaining);

    return () => clearTimeout(timer);
  }, [minDisplayTime]);

  // Call onComplete after exit animation finishes
  const handleExitComplete = () => {
    if (!completedRef.current) {
      completedRef.current = true;
      onComplete();
    }
  };

  return (
    <AnimatePresence onExitComplete={handleExitComplete}>
      {show && (
        <motion.div
          key="ascii-sky-loading"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          className="fixed inset-0 z-[100] flex items-center justify-center"
          style={{ background: '#0d1b2a' }}
        >
          {/* ASCII Sky Background */}
          <div className="absolute inset-0">
            <AsciiSky
              cloudCount={8}
              showHills={true}
              skyColorTop="#1a5fb4"
              skyColorBottom="#87CEEB"
              cloudColor="#ffffff"
              hillColor="#4a9e3f"
              hillColorFar="#2d6b28"
              fontSize="14px"
            />
          </div>

          {/* Centered welcome content */}
          <div className="relative z-10 text-center pointer-events-none">
            {/* Welcome text */}
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' }}
              className="text-3xl sm:text-4xl font-bold tracking-tight mb-3"
              style={{
                fontFamily: "'VCR OSD Mono', 'Press Start 2P', monospace",
                color: '#ffffff',
                textShadow: '0 2px 12px rgba(0,0,0,0.5), 0 0 40px rgba(26,95,180,0.4)',
              }}
            >
              {brandName ? `Welcome, ${brandName}` : 'Welcome to BrandOS'}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              className="text-sm tracking-widest uppercase"
              style={{
                fontFamily: "'VCR OSD Mono', monospace",
                color: '#ffffff',
                textShadow: '0 1px 6px rgba(0,0,0,0.4)',
              }}
            >
              Preparing your dashboard
            </motion.p>

            {/* Pulsing dots loading indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.0, duration: 0.4 }}
              className="mt-6 flex items-center justify-center gap-2"
            >
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: 'easeInOut',
                  }}
                  style={{
                    fontFamily: "'VCR OSD Mono', monospace",
                    fontSize: '18px',
                    color: '#ffffff',
                    textShadow: '0 0 8px rgba(255,255,255,0.5)',
                  }}
                >
                  .
                </motion.span>
              ))}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
