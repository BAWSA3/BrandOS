'use client';

import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import WalkthroughProgress from '@/components/DNAWalkthrough/WalkthroughProgress';
import CodeParallaxBackground from '@/components/backgrounds/CodeParallaxBackground';
import TheMathSection from './sections/TheMathSection';
import WhatsWorkingSection from './sections/WhatsWorkingSection';
import BottleneckSection from './sections/BottleneckSection';
import LeversSection from './sections/LeversSection';
import ExecutionSection from './sections/ExecutionSection';
import type { GrowthPlanData } from './types';

const SECTION_NAMES = [
  'THE MATH',
  'WHAT\'S WORKING',
  'THE BOTTLENECK',
  'GROWTH LEVERS',
  'EXECUTION PLAN',
];

interface GrowthPlanWalkthroughProps {
  plan: GrowthPlanData;
  onComplete: () => void;
}

export default function GrowthPlanWalkthrough({ plan, onComplete }: GrowthPlanWalkthroughProps) {
  const [currentSection, setCurrentSection] = useState(0);

  function advance() {
    if (currentSection < SECTION_NAMES.length - 1) {
      setCurrentSection(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      onComplete();
    }
  }

  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: '#ffffff' }}>
      <CodeParallaxBackground />

      <WalkthroughProgress
        sections={SECTION_NAMES}
        activeIndex={currentSection}
        onSectionClick={(i) => {
          if (i <= currentSection) setCurrentSection(i);
        }}
      />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <AnimatePresence mode="wait">
          {currentSection === 0 && (
            <TheMathSection key="math" plan={plan} onComplete={advance} />
          )}
          {currentSection === 1 && (
            <WhatsWorkingSection key="working" plan={plan} onComplete={advance} />
          )}
          {currentSection === 2 && (
            <BottleneckSection key="bottleneck" plan={plan} onComplete={advance} />
          )}
          {currentSection === 3 && (
            <LeversSection key="levers" plan={plan} onComplete={advance} />
          )}
          {currentSection === 4 && (
            <ExecutionSection key="execution" plan={plan} onComplete={advance} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
