/**
 * Ethereum Attestation Service (EAS) integration for BrandOS.
 *
 * EAS attestations are lightweight onchain records — cheaper than NFTs,
 * perfect for provenance and reputation data. On Base, attestation cost
 * is typically < $0.01.
 *
 * This module handles ABI encoding and the JSON-RPC calls to create
 * attestations without pulling in heavyweight ethers/viem bundles on
 * the client. All signing happens server-side with a platform wallet.
 */

import { chainNameFromId, getOnchainConfig } from './config';
import {
  AttestationRecord,
  AttestationType,
  BrandDNAAttestation,
  BrandScoreAttestation,
  ContentAttestation,
  MintResult,
} from './types';

// ABI encoding helpers — minimal implementations to avoid a viem dependency.
// These produce the exact same output as Solidity's abi.encode().

function padHex(hex: string, bytes: number): string {
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex;
  return clean.padStart(bytes * 2, '0');
}

function encodeUint256(value: number | bigint): string {
  return padHex(BigInt(value).toString(16), 32);
}

function encodeAddress(addr: string): string {
  return padHex(addr, 32);
}

function encodeBytes32(hex: string): string {
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex;
  return clean.padEnd(64, '0');
}

function encodeString(str: string): string {
  const hex = Buffer.from(str, 'utf-8').toString('hex');
  const len = encodeUint256(str.length);
  const padded = hex.padEnd(Math.ceil(hex.length / 64) * 64, '0');
  return len + padded;
}

function encodeBrandDNAData(data: BrandDNAAttestation): string {
  // Schema: bytes32 dnaHash, string brandName, uint256 version, uint256 timestamp
  const dnaHash = encodeBytes32(data.dnaHash);
  const version = encodeUint256(data.version);
  const timestamp = encodeUint256(data.timestamp);

  // Dynamic data offset for the string (4 * 32 bytes for the static fields)
  const stringOffset = encodeUint256(4 * 32);
  const nameEncoded = encodeString(data.brandName);

  return '0x' + dnaHash + stringOffset + version + timestamp + nameEncoded;
}

function encodeContentCheckData(data: ContentAttestation): string {
  // Schema: bytes32 contentHash, bytes32 brandDnaHash, uint256 alignmentScore, uint256 authenticityScore, uint256 timestamp
  return (
    '0x' +
    encodeBytes32(data.contentHash) +
    encodeBytes32(data.brandDnaHash) +
    encodeUint256(data.brandAlignmentScore) +
    encodeUint256(data.authenticityScore ?? 0) +
    encodeUint256(data.timestamp)
  );
}

function encodeBrandScoreData(data: BrandScoreAttestation): string {
  // Schema: uint256 overallScore, uint256 defineScore, uint256 checkScore, uint256 generateScore, uint256 scaleScore, uint256 timestamp
  // Plus dynamic string fields for username and archetype
  const staticPart =
    encodeUint256(data.overallScore) +
    encodeUint256(data.defineScore) +
    encodeUint256(data.checkScore) +
    encodeUint256(data.generateScore) +
    encodeUint256(data.scaleScore) +
    encodeUint256(data.timestamp);

  // Offsets for dynamic strings
  const usernameOffset = encodeUint256(8 * 32);
  const archetypeOffset = encodeUint256(
    8 * 32 + 32 + Math.ceil(data.username.length / 32) * 32
  );
  const usernameEncoded = encodeString(data.username);
  const archetypeEncoded = encodeString(data.archetype);

  return (
    '0x' +
    staticPart +
    usernameOffset +
    archetypeOffset +
    usernameEncoded +
    archetypeEncoded
  );
}

export function encodeAttestationData(
  type: AttestationType,
  data: BrandDNAAttestation | ContentAttestation | BrandScoreAttestation
): string {
  switch (type) {
    case 'brand-dna':
      return encodeBrandDNAData(data as BrandDNAAttestation);
    case 'content-check':
    case 'authenticity':
      return encodeContentCheckData(data as ContentAttestation);
    case 'brand-score':
      return encodeBrandScoreData(data as BrandScoreAttestation);
    default:
      throw new Error(`Unsupported attestation type: ${type}`);
  }
}

/**
 * Creates an attestation via the BrandOS server-side wallet.
 * In production, this calls the EAS contract on Base via JSON-RPC.
 * For now, returns a simulated attestation for development.
 */
export async function createAttestation(
  type: AttestationType,
  data: BrandDNAAttestation | ContentAttestation | BrandScoreAttestation,
  recipient: string = '0x0000000000000000000000000000000000000000'
): Promise<MintResult> {
  const config = getOnchainConfig();
  const platformKey = process.env.ONCHAIN_PLATFORM_PRIVATE_KEY;

  if (!platformKey) {
    // Development mode — return a simulated attestation
    return simulateAttestation(type, data, recipient, config);
  }

  try {
    const encodedData = encodeAttestationData(type, data);
    const schemaUid = config.schemas[schemaKeyForType(type)];

    // In production, this would:
    // 1. Build the EAS attest() call with the encoded data
    // 2. Sign with the platform wallet private key
    // 3. Broadcast the transaction via JSON-RPC
    // 4. Wait for confirmation
    //
    // For now, we call our internal attestation relay endpoint
    // which handles the signing and broadcasting.
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/onchain/relay`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          schemaUid,
          recipient,
          data: encodedData,
          refUID: '0x' + '0'.repeat(64),
        }),
      }
    );

    if (!response.ok) {
      const err = await response.json();
      return { success: false, error: err.error || 'Attestation relay failed' };
    }

    const result = await response.json();
    return {
      success: true,
      attestation: result.attestation,
    };
  } catch (error) {
    console.error(`[EAS] Attestation failed for ${type}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

function schemaKeyForType(
  type: AttestationType
): keyof import('./types').OnchainConfig['schemas'] {
  switch (type) {
    case 'brand-dna':
      return 'brandDna';
    case 'content-check':
    case 'authenticity':
      return 'contentCheck';
    case 'brand-score':
      return 'brandScore';
    case 'voice-fingerprint':
      return 'voiceFingerprint';
    case 'brand-health':
      return 'brandHealth';
  }
}

/**
 * Development-mode simulation that returns a realistic attestation
 * record without hitting any chain.
 */
function simulateAttestation(
  type: AttestationType,
  _data: BrandDNAAttestation | ContentAttestation | BrandScoreAttestation,
  recipient: string,
  config: import('./types').OnchainConfig
): MintResult {
  const uid =
    '0x' +
    Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

  const txHash =
    '0x' +
    Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

  const attestation: AttestationRecord = {
    uid,
    txHash,
    chain: chainNameFromId(config.chainId),
    attestationType: type,
    schemaUid: config.schemas[schemaKeyForType(type)],
    attester: '0xBrandOSPlatformWallet',
    recipient,
    dataHash: uid,
    timestamp: Math.floor(Date.now() / 1000),
    explorerUrl: `${config.explorerUrl}/attestation/view/${uid}`,
  };

  return { success: true, attestation };
}
