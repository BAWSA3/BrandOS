'use client';

import { AttestButton } from './AttestButton';

interface AttestBrandButtonProps {
  brandId: string;
  variant?: 'primary' | 'compact';
}

export function AttestBrandButton({ brandId, variant = 'primary' }: AttestBrandButtonProps) {
  async function handleAttest() {
    const response = await fetch('/api/onchain/attest-brand', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brandId }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to attest brand');
    }

    const data = await response.json();
    return data.attestation;
  }

  return (
    <AttestButton
      label="Mint Brand DNA Onchain"
      sublabel="Create a provable record of your brand identity on Base"
      onAttest={handleAttest}
      variant={variant}
    />
  );
}

export default AttestBrandButton;
