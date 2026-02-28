'use client';

import { AttestButton } from './AttestButton';

interface AttestScoreButtonProps {
  username: string;
  overallScore: number;
  phases: {
    define: { score: number };
    check: { score: number };
    generate: { score: number };
    scale: { score: number };
  };
  archetype: string;
  variant?: 'primary' | 'compact';
}

export function AttestScoreButton({
  username,
  overallScore,
  phases,
  archetype,
  variant = 'primary',
}: AttestScoreButtonProps) {
  async function handleAttest() {
    const response = await fetch('/api/onchain/attest-score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        overallScore,
        phases,
        archetype,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to attest score');
    }

    const data = await response.json();
    return data.attestation;
  }

  return (
    <AttestButton
      label="Mint Score Onchain"
      sublabel="Anchor your Brand Score to Base via EAS"
      onAttest={handleAttest}
      variant={variant}
    />
  );
}

export default AttestScoreButton;
