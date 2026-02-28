import { OnchainChainKey, OnchainConfig } from './types';

// EAS schema UIDs — registered once per schema registry per chain.
// Placeholder UIDs follow EAS format (bytes32 hex).
// Replace with real UIDs after registering schemas on each chain.
const BASE_SCHEMA_UIDS = {
  brandDna:     '0x' + '0'.repeat(62) + '01',
  contentCheck: '0x' + '0'.repeat(62) + '02',
  brandScore:   '0x' + '0'.repeat(62) + '03',
  voiceFingerprint: '0x' + '0'.repeat(62) + '04',
  brandHealth:  '0x' + '0'.repeat(62) + '05',
} as const;

// Avalanche schemas are registered separately — fill in after deployment
const AVAX_SCHEMA_UIDS = {
  brandDna:     '0x' + '0'.repeat(62) + '01',
  contentCheck: '0x' + '0'.repeat(62) + '02',
  brandScore:   '0x' + '0'.repeat(62) + '03',
  voiceFingerprint: '0x' + '0'.repeat(62) + '04',
  brandHealth:  '0x' + '0'.repeat(62) + '05',
} as const;

// ── Chain configurations ──────────────────────────────────────────────

export const BASE_MAINNET: OnchainConfig = {
  chainId: 8453,
  chainName: 'Base',
  rpcUrl: 'https://mainnet.base.org',
  easContractAddress: '0x4200000000000000000000000000000000000021',
  schemaRegistryAddress: '0x4200000000000000000000000000000000000020',
  explorerUrl: 'https://base.easscan.org',
  schemas: BASE_SCHEMA_UIDS,
};

export const BASE_SEPOLIA: OnchainConfig = {
  chainId: 84532,
  chainName: 'Base Sepolia',
  rpcUrl: 'https://sepolia.base.org',
  easContractAddress: '0x4200000000000000000000000000000000000021',
  schemaRegistryAddress: '0x4200000000000000000000000000000000000020',
  explorerUrl: 'https://base-sepolia.easscan.org',
  schemas: BASE_SCHEMA_UIDS,
};

export const AVALANCHE_MAINNET: OnchainConfig = {
  chainId: 43114,
  chainName: 'Avalanche C-Chain',
  rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
  // EAS addresses after deploying to Avalanche — fill in post-deployment
  easContractAddress: '0x0000000000000000000000000000000000000000',
  schemaRegistryAddress: '0x0000000000000000000000000000000000000000',
  explorerUrl: 'https://snowtrace.io',
  schemas: AVAX_SCHEMA_UIDS,
};

export const AVALANCHE_FUJI: OnchainConfig = {
  chainId: 43113,
  chainName: 'Avalanche Fuji',
  rpcUrl: 'https://api.avax-test.network/ext/bc/C/rpc',
  // EAS addresses after deploying to Fuji — fill in post-deployment
  easContractAddress: '0x0000000000000000000000000000000000000000',
  schemaRegistryAddress: '0x0000000000000000000000000000000000000000',
  explorerUrl: 'https://testnet.snowtrace.io',
  schemas: AVAX_SCHEMA_UIDS,
};

// ── Lookup maps ───────────────────────────────────────────────────────

const CHAIN_CONFIGS: Record<OnchainChainKey, OnchainConfig> = {
  'base': BASE_MAINNET,
  'base-sepolia': BASE_SEPOLIA,
  'avalanche': AVALANCHE_MAINNET,
  'avalanche-fuji': AVALANCHE_FUJI,
};

const CHAIN_ID_TO_KEY: Record<number, OnchainChainKey> = {
  8453: 'base',
  84532: 'base-sepolia',
  43114: 'avalanche',
  43113: 'avalanche-fuji',
};

// ── Public helpers ────────────────────────────────────────────────────

/**
 * Resolve chain name from numeric chain ID.
 * Shared by eas.ts and relay/route.ts to avoid hardcoded ternaries.
 */
export function chainNameFromId(chainId: number): OnchainChainKey {
  const key = CHAIN_ID_TO_KEY[chainId];
  if (!key) throw new Error(`Unsupported chain ID: ${chainId}`);
  return key;
}

/**
 * Returns the OnchainConfig for the currently active chain,
 * read from the NEXT_PUBLIC_ONCHAIN_CHAIN env var.
 * Defaults to 'avalanche-fuji' for hackathon development.
 */
export function getOnchainConfig(): OnchainConfig {
  const chainKey = (process.env.NEXT_PUBLIC_ONCHAIN_CHAIN || 'avalanche-fuji') as OnchainChainKey;
  const config = CHAIN_CONFIGS[chainKey];
  if (!config) {
    throw new Error(
      `Invalid NEXT_PUBLIC_ONCHAIN_CHAIN="${chainKey}". ` +
      `Valid values: ${Object.keys(CHAIN_CONFIGS).join(', ')}`
    );
  }
  return config;
}

export function getExplorerAttestationUrl(uid: string): string {
  const config = getOnchainConfig();
  // EAS scan-style URLs for Base; raw tx/address URLs for Avalanche
  if (config.chainId === 43114 || config.chainId === 43113) {
    return `${config.explorerUrl}/tx/${uid}`;
  }
  return `${config.explorerUrl}/attestation/view/${uid}`;
}

export function getExplorerTxUrl(txHash: string): string {
  const config = getOnchainConfig();
  if (config.chainId === 43114 || config.chainId === 43113) {
    return `${config.explorerUrl}/tx/${txHash}`;
  }
  const baseExplorer = config.chainId === 8453
    ? 'https://basescan.org'
    : 'https://sepolia.basescan.org';
  return `${baseExplorer}/tx/${txHash}`;
}
