import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import prisma from '@/lib/db';
import { hashContent, hashBrandDNA } from '@/lib/onchain/hash';
import { createAttestation } from '@/lib/onchain/eas';
import { ContentAttestation } from '@/lib/onchain/types';

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
 * POST /api/onchain/attest-content
 *
 * Creates an onchain attestation for brand-checked content.
 * Records: content hash, brand DNA hash, alignment score, authenticity score.
 *
 * Body: {
 *   content: string,
 *   brandId: string,
 *   brandAlignmentScore: number,
 *   authenticityScore?: number
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { content, brandId, brandAlignmentScore, authenticityScore } = body;

    if (!content || !brandId || brandAlignmentScore === undefined) {
      return NextResponse.json(
        { error: 'content, brandId, and brandAlignmentScore are required' },
        { status: 400 }
      );
    }

    if (brandAlignmentScore < 70) {
      return NextResponse.json(
        { error: 'Content must score at least 70 to be attested onchain' },
        { status: 400 }
      );
    }

    const brand = await prisma.brand.findFirst({
      where: { id: brandId, userId: user.id },
    });

    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    const contentHash = await hashContent(content);
    const brandDnaHash = await hashBrandDNA({
      name: brand.name,
      colors: JSON.parse(brand.colors),
      tone: JSON.parse(brand.tone),
      keywords: JSON.parse(brand.keywords),
      doPatterns: JSON.parse(brand.doPatterns),
      dontPatterns: JSON.parse(brand.dontPatterns),
      voiceSamples: JSON.parse(brand.voiceSamples),
    });

    // Prevent duplicate attestation for the same content+brand combination
    const existing = await prisma.onchainAttestation.findFirst({
      where: {
        attestationType: 'content-check',
        dataHash: contentHash,
        brandId,
      },
    });

    if (existing) {
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

    const attestationData: ContentAttestation = {
      contentHash,
      brandDnaHash,
      brandAlignmentScore: Math.round(brandAlignmentScore),
      authenticityScore: authenticityScore ? Math.round(authenticityScore) : null,
      checkerAddress: user.walletAddress || '0x0000000000000000000000000000000000000000',
      timestamp: Math.floor(Date.now() / 1000),
    };

    const result = await createAttestation(
      'content-check',
      attestationData,
      user.walletAddress || undefined
    );

    if (!result.success || !result.attestation) {
      return NextResponse.json(
        { error: result.error || 'Attestation failed' },
        { status: 500 }
      );
    }

    const record = await prisma.onchainAttestation.create({
      data: {
        uid: result.attestation.uid,
        txHash: result.attestation.txHash,
        chain: result.attestation.chain,
        attestationType: 'content-check',
        schemaUid: result.attestation.schemaUid,
        attester: result.attestation.attester,
        recipient: result.attestation.recipient,
        dataHash: contentHash,
        metadata: JSON.stringify({
          brandName: brand.name,
          brandAlignmentScore: Math.round(brandAlignmentScore),
          authenticityScore: authenticityScore ? Math.round(authenticityScore) : null,
          contentPreview: content.slice(0, 100),
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
        scores: {
          brandAlignment: Math.round(brandAlignmentScore),
          authenticity: authenticityScore ? Math.round(authenticityScore) : null,
        },
        createdAt: record.createdAt,
      },
    });
  } catch (error) {
    console.error('[Attest Content] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create content attestation' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/onchain/attest-content?brandId=xxx
 *
 * Returns all content attestations for a brand.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get('brandId');

    if (!brandId) {
      return NextResponse.json({ error: 'brandId is required' }, { status: 400 });
    }

    const attestations = await prisma.onchainAttestation.findMany({
      where: { brandId, attestationType: 'content-check' },
      orderBy: { createdAt: 'desc' },
      take: 50,
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
    console.error('[Attest Content] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch content attestations' },
      { status: 500 }
    );
  }
}
