'use client';

import { motion, useScroll, useSpring } from 'framer-motion';

interface WalkthroughProgressProps {
  sections: string[];
  activeIndex: number;
  onSectionClick: (index: number) => void;
}

export default function WalkthroughProgress({
  sections,
  activeIndex,
  onSectionClick,
}: WalkthroughProgressProps) {
  // Smooth scroll-linked progress
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <>
      {/* Desktop - Top scroll progress bar */}
      <motion.div
        className="hidden md:block fixed top-0 left-0 right-0 h-1 z-50 origin-left"
        style={{
          background: 'linear-gradient(90deg, #D4A574, #E8C49A)',
          scaleX,
        }}
      />

      {/* Desktop - Right side dots */}
      <div className="hidden md:flex fixed right-6 top-1/2 -translate-y-1/2 z-50 flex-col items-center gap-3">
        {sections.map((name, index) => (
          <button
            key={name}
            onClick={() => onSectionClick(index)}
            className="group relative flex items-center"
          >
            {/* Tooltip */}
            <span
              className="absolute right-full mr-3 px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity"
              style={{
                fontFamily: "'VCR OSD Mono', monospace",
                fontSize: '10px',
                letterSpacing: '0.05em',
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(8px)',
              }}
            >
              {name}
            </span>

            {/* Dot */}
            <motion.div
              animate={{
                scale: activeIndex === index ? 1.2 : 1,
                backgroundColor:
                  activeIndex === index
                    ? '#D4A574'
                    : index < activeIndex
                    ? 'rgba(212, 165, 116, 0.5)'
                    : 'rgba(255, 255, 255, 0.2)',
              }}
              transition={{ duration: 0.2 }}
              className="w-2.5 h-2.5 rounded-full cursor-pointer"
              style={{
                boxShadow: activeIndex === index ? '0 0 12px rgba(212, 165, 116, 0.6)' : 'none',
              }}
            />

            {/* Connecting line */}
            {index < sections.length - 1 && (
              <div
                className="absolute top-full left-1/2 -translate-x-1/2 w-px h-3"
                style={{
                  background:
                    index < activeIndex
                      ? 'rgba(212, 165, 116, 0.4)'
                      : 'rgba(255, 255, 255, 0.1)',
                }}
              />
            )}
          </button>
        ))}

        {/* Current section label */}
        <div
          className="mt-4 px-2 py-1 rounded"
          style={{
            fontFamily: "'VCR OSD Mono', monospace",
            fontSize: '9px',
            letterSpacing: '0.1em',
            color: '#D4A574',
            background: 'rgba(212, 165, 116, 0.1)',
          }}
        >
          {activeIndex + 1}/{sections.length}
        </div>
      </div>

      {/* Mobile - Bottom progress bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-4 py-3 bg-[#050505]/90 backdrop-blur-lg border-t border-white/10">
        <div className="flex items-center justify-between mb-2">
          <span
            style={{
              fontFamily: "'VCR OSD Mono', monospace",
              fontSize: '10px',
              letterSpacing: '0.1em',
              color: 'rgba(255, 255, 255, 0.5)',
            }}
          >
            {sections[activeIndex]}
          </span>
          <span
            style={{
              fontFamily: "'VCR OSD Mono', monospace",
              fontSize: '10px',
              letterSpacing: '0.1em',
              color: '#D4A574',
            }}
          >
            {activeIndex + 1}/{sections.length}
          </span>
        </div>

        {/* Progress bar - scroll-linked */}
        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full origin-left"
            style={{
              background: 'linear-gradient(90deg, #D4A574, #E8C49A)',
              scaleX,
            }}
          />
        </div>

        {/* Section dots */}
        <div className="flex justify-between mt-2">
          {sections.map((_, index) => (
            <button
              key={index}
              onClick={() => onSectionClick(index)}
              className="p-1"
            >
              <div
                className="w-1.5 h-1.5 rounded-full transition-colors"
                style={{
                  backgroundColor:
                    activeIndex === index
                      ? '#D4A574'
                      : index < activeIndex
                      ? 'rgba(212, 165, 116, 0.5)'
                      : 'rgba(255, 255, 255, 0.2)',
                }}
              />
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
