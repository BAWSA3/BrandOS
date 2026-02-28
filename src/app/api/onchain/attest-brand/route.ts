import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import prisma from '@/lib/db';
import { hashBrandDNA } from '@/lib/onchain/hash';
import { createAttestation } from '@/lib/onchain/eas';
import { BrandDNAAttestation } from '@/lib/onchain/types';

async function getAuthUser() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) return null;

  const cookieStore = await cookies();
  const accessToken = cookieStore.get('sb-access-token')?.value;
  if (!accessToken) return null;

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data: { user }, error } = await supabase.auth.getUser(accessToken);
  if (error || !user) return null;

  return prisma.user.findUnique({ where: { supabaseId: user.id } });
}

/**
 * POST /api/onchain/attest-brand
 *
 * Creates an onchain attestation for a Brand DNA, anchoring a SHA-256 hash
 * of the brand's identity data to the Base chain via EAS.
 *
 * Body: { brandId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { brandId } = await request.json();
    if (!brandId) {
      return NextResponse.json({ error: 'brandId is required' }, { status: 400 });
    }

    const brand = await prisma.brand.findFirst({
      where: { id: brandId, userId: user.id },
    });

    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    // Check for existing attestation
    const existing = await prisma.onchainAttestation.findFirst({
      where: { brandId, attestationType: 'brand-dna' },
      orderBy: { createdAt: 'desc' },
    });

    const brandData = {
      name: brand.name,
      colors: JSON.parse(brand.colors),
      tone: JSON.parse(brand.tone),
      keywords: JSON.parse(brand.keywords),
      doPatterns: JSON.parse(brand.doPatterns),
      dontPatterns: JSON.parse(brand.dontPatterns),
      voiceSamples: JSON.parse(brand.voiceSamples),
    };

    const dnaHash = await hashBrandDNA(brandData);

    // If the brand DNA hasn't changed since last attestation, return existing
    if (existing && existing.dataHash === dnaHash) {
      return NextResponse.json({
        attestation: {
          uid: existing.uid,
          txHash: existing.txHash,
          explorerUrl: existing.explorerUrl,
          dataHash: existing.dataHash,
          createdAt: existing.createdAt,
          alreadyExists: true,
        },
      });
    }

    // Count previous attestations for this brand (version tracking)
    const previousCount = await prisma.onchainAttestation.count({
      where: { brandId, attestationType: 'brand-dna' },
    });

    const attestationData: BrandDNAAttestation = {
      brandId: brand.id,
      brandName: brand.name,
      dnaHash,
      ownerAddress: user.walletAddress || '0x0000000000000000000000000000000000000000',
      version: previousCount + 1,
      timestamp: Math.floor(Date.now() / 1000),
    };

    const result = await createAttestation(
      'brand-dna',
      attestationData,
      user.walletAddress || undefined
    );

    if (!result.success || !result.attestation) {
      return NextResponse.json(
        { error: result.error || 'Attestation failed' },
        { status: 500 }
      );
    }

    // Persist to database
    const record = await prisma.onchainAttestation.create({
      data: {
        uid: result.attestation.uid,
        txHash: result.attestation.txHash,
        chain: result.attestation.chain,
        attestationType: 'brand-dna',
        schemaUid: result.attestation.schemaUid,
        attester: result.attestation.attester,
        recipient: result.attestation.recipient,
        dataHash: dnaHash,
        metadata: JSON.stringify({
          brandName: brand.name,
          version: previousCount + 1,
        }),
        explorerUrl: result.attestation.explorerUrl,
        brandId: brand.id,
        userId: user.id,
      },
    });

    return NextResponse.json({
      attestation: {
        uid: record.uid,
        txHash: record.txHash,
        explorerUrl: record.explorerUrl,
        dataHash: record.dataHash,
        version: previousCount + 1,
        createdAt: record.createdAt,
      },
    });
  } catch (error) {
    console.error('[Attest Brand DNA] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create attestation' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/onchain/attest-brand?brandId=xxx
 *
 * Returns all attestations for a brand, ordered newest first.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get('brandId');

    if (!brandId) {
      return NextResponse.json({ error: 'brandId is required' }, { status: 400 });
    }

    const attestations = await prisma.onchainAttestation.findMany({
      where: { brandId, attestationType: 'brand-dna' },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      attestations: attestations.map((a) => ({
        uid: a.uid,
        txHash: a.txHash,
        chain: a.chain,
        dataHash: a.dataHash,
        explorerUrl: a.explorerUrl,
        metadata: a.metadata ? JSON.parse(a.metadata) : null,
        createdAt: a.createdAt,
      })),
    });
  } catch (error) {
    console.error('[Attest Brand DNA] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attestations' },
      { status: 500 }
    );
  }
}
