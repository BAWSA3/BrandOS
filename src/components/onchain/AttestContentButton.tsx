'use client';

import { AttestButton } from './AttestButton';

interface AttestContentButtonProps {
  content: string;
  brandId: string;
  brandAlignmentScore: number;
  authenticityScore?: number | null;
  variant?: 'primary' | 'compact';
}

export function AttestContentButton({
  content,
  brandId,
  brandAlignmentScore,
  authenticityScore,
  variant = 'compact',
}: AttestContentButtonProps) {
  const meetsThreshold = brandAlignmentScore >= 70;

  async function handleAttest() {
    const response = await fetch('/api/onchain/attest-content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content,
        brandId,
        brandAlignmentScore,
        authenticityScore: authenticityScore ?? undefined,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to attest content');
    }

    const data = await response.json();
    return data.attestation;
  }

  return (
    <AttestButton
      label="Attest Onchain"
      sublabel={
        meetsThreshold
          ? 'Prove this content was brand-verified'
          : `Score must be 70+ to attest (currently ${brandAlignmentScore})`
      }
      onAttest={handleAttest}
      disabled={!meetsThreshold}
      variant={variant}
    />
  );
}

export default AttestContentButton;
