// Onchain attestation and transaction types for BrandOS

export type AttestationType =
  | 'brand-dna'
  | 'content-check'
  | 'authenticity'
  | 'brand-score'
  | 'voice-fingerprint'
  | 'brand-health';

export type OnchainStatus =
  | 'idle'
  | 'preparing'
  | 'signing'
  | 'confirming'
  | 'confirmed'
  | 'failed';

// Supported chains — env var NEXT_PUBLIC_ONCHAIN_CHAIN selects the active one
export type OnchainChainKey =
  | 'avalanche'
  | 'avalanche-fuji'
  | 'base'
  | 'base-sepolia';

export interface AttestationRecord {
  uid: string;
  txHash: string;
  chain: OnchainChainKey;
  attestationType: AttestationType;
  schemaUid: string;
  attester: string;
  recipient: string;
  dataHash: string;
  timestamp: number;
  explorerUrl: string;
}

export interface BrandDNAAttestation {
  brandId: string;
  brandName: string;
  dnaHash: string;
  ownerAddress: string;
  version: number;
  timestamp: number;
}

export interface ContentAttestation {
  contentHash: string;
  brandDnaHash: string;
  brandAlignmentScore: number;
  authenticityScore: number | null;
  checkerAddress: string;
  timestamp: number;
}

export interface BrandScoreAttestation {
  username: string;
  overallScore: number;
  defineScore: number;
  checkScore: number;
  generateScore: number;
  scaleScore: number;
  archetype: string;
  timestamp: number;
}

export interface VoiceFingerprintAttestation {
  brandId: string;
  fingerprintHash: string;
  dimensionCount: number;
  sampleCount: number;
  confidence: number;
  ownerAddress: string;
  timestamp: number;
}

export interface BrandHealthAttestation {
  brandId: string;
  overallScore: number;
  completeness: number;
  consistency: number;
  voiceMatch: number;
  engagement: number;
  activity: number;
  periodStart: number;
  periodEnd: number;
  timestamp: number;
}

export interface MintResult {
  success: boolean;
  attestation?: AttestationRecord;
  error?: string;
}

export interface OnchainConfig {
  chainId: number;
  chainName: string;
  rpcUrl: string;
  easContractAddress: string;
  schemaRegistryAddress: string;
  explorerUrl: string;
  schemas: {
    brandDna: string;
    contentCheck: string;
    brandScore: string;
    voiceFingerprint: string;
    brandHealth: string;
  };
}
