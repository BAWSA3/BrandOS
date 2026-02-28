# Deploying EAS to Avalanche Fuji Testnet

EAS (Ethereum Attestation Service) contracts are not pre-deployed on Avalanche, but since Avalanche C-Chain is fully EVM-compatible, the official contracts deploy without modification.

## Prerequisites

- Node.js 18+
- A funded wallet on Fuji testnet (get free AVAX from [Avalanche Faucet](https://faucet.avax.network/))
- Git

## Step 1: Clone the EAS contracts repo

```bash
git clone https://github.com/ethereum-attestation-service/eas-contracts.git
cd eas-contracts
npm install
```

## Step 2: Configure Hardhat for Avalanche Fuji

Add the Fuji network to `hardhat.config.ts`:

```typescript
networks: {
  fuji: {
    url: 'https://api.avax-test.network/ext/bc/C/rpc',
    chainId: 43113,
    accounts: [process.env.DEPLOYER_PRIVATE_KEY],
  },
}
```

## Step 3: Deploy contracts

```bash
# Deploy SchemaRegistry first
npx hardhat run scripts/deploy-schema-registry.ts --network fuji

# Deploy EAS, passing the SchemaRegistry address
npx hardhat run scripts/deploy-eas.ts --network fuji
```

Record both contract addresses from the deployment output.

## Step 4: Register BrandOS schemas

After EAS is deployed, register the five BrandOS attestation schemas. Use the EAS SDK or call the SchemaRegistry contract directly:

```typescript
import { SchemaRegistry } from '@ethereum-attestation-service/eas-sdk';

const SCHEMAS = [
  { name: 'BrandDNA',          schema: 'bytes32 dnaHash, string brandName, uint256 version, uint256 timestamp' },
  { name: 'ContentCheck',      schema: 'bytes32 contentHash, bytes32 brandDnaHash, uint256 alignmentScore, uint256 authenticityScore, uint256 timestamp' },
  { name: 'BrandScore',        schema: 'uint256 overallScore, uint256 defineScore, uint256 checkScore, uint256 generateScore, uint256 scaleScore, uint256 timestamp, string username, string archetype' },
  { name: 'VoiceFingerprint',  schema: 'bytes32 fingerprintHash, uint256 dimensionCount, uint256 sampleCount, uint256 confidence, uint256 timestamp' },
  { name: 'BrandHealth',       schema: 'uint256 overallScore, uint256 completeness, uint256 consistency, uint256 voiceMatch, uint256 engagement, uint256 activity, uint256 periodStart, uint256 periodEnd, uint256 timestamp' },
];

const registry = new SchemaRegistry(SCHEMA_REGISTRY_ADDRESS);
registry.connect(signer);

for (const s of SCHEMAS) {
  const tx = await registry.register({ schema: s.schema, revocable: false });
  const uid = await tx.wait();
  console.log(`${s.name}: ${uid}`);
}
```

## Step 5: Update BrandOS config

Take the deployed addresses and schema UIDs and update `src/lib/onchain/config.ts`:

1. Set `AVALANCHE_FUJI.easContractAddress` to the deployed EAS address
2. Set `AVALANCHE_FUJI.schemaRegistryAddress` to the deployed SchemaRegistry address
3. Replace the placeholder `AVAX_SCHEMA_UIDS` with the real schema UIDs from step 4

## Step 6: Fund the platform wallet

```bash
# Generate a platform wallet if you don't have one
node -e "console.log('0x' + require('crypto').randomBytes(32).toString('hex'))"
```

Add the private key to `.env.local` as `ONCHAIN_PLATFORM_PRIVATE_KEY` and fund it with Fuji AVAX from the [faucet](https://faucet.avax.network/).

## Step 7: Set the chain env var

In `.env.local`:

```
NEXT_PUBLIC_ONCHAIN_CHAIN=avalanche-fuji
```

## Mainnet deployment

For Avalanche mainnet, follow the same steps but use:
- RPC: `https://api.avax.network/ext/bc/C/rpc`
- Chain ID: `43114`
- Explorer: `https://snowtrace.io`
- Set `NEXT_PUBLIC_ONCHAIN_CHAIN=avalanche`
