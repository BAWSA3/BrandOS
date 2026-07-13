'use client';

import { useState } from 'react';
import BrandSetupWizard from '@/components/dashboard/BrandSetupWizard';

export default function WizardPreview() {
  const [done, setDone] = useState(false);

  return (
    <div className="min-h-screen p-6 flex items-center justify-center">
      <div className="max-w-2xl w-full">
        {done ? (
          <p className="text-sm font-mono" style={{ color: 'var(--text-secondary)' }}>
            wizard finished — reload to run it again
          </p>
        ) : (
          <BrandSetupWizard onComplete={() => setDone(true)} onSkip={() => setDone(true)} />
        )}
      </div>
    </div>
  );
}
