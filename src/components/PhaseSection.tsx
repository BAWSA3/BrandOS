'use client';

import { forwardRef } from 'react';

interface PhaseSectionProps {
  phase: {
    id: string;
    number: number;
    title: string;
    subtitle: string;
    description: string;
    analyzing: string[];
  };
  profileData: Record<string, string>;
  profileImage?: string;
  isActive: boolean;
  progress: number;
  theme: string;
}

const PhaseSection = forwardRef<HTMLDivElement, PhaseSectionProps>(
  ({ phase, profileData, profileImage, isActive, progress, theme }, ref) => {
    return (
      <div ref={ref} className="min-h-screen p-8">
        <h2 className="text-2xl font-bold">{phase.title}</h2>
        <p className="text-neutral-400">{phase.subtitle}</p>
        <p className="mt-4">{phase.description}</p>
      </div>
    );
  }
);

PhaseSection.displayName = 'PhaseSection';

export default PhaseSection;
